import cv2
import torch
import numpy as np
from PIL import Image
import easyocr
import re

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except:
    PADDLE_AVAILABLE = False

from transformers import TrOCRProcessor, VisionEncoderDecoderModel

# PARSeq
try:
    from ocr_pipeline.parseq_loader import PARSeqRecognizer
    PARSEQ_AVAILABLE = True
except Exception as e:
    print("PARSeq import error:", e)
    PARSEQ_AVAILABLE = False


class TextRecognizer:
    def __init__(self):
        print("Initializing TextRecognizer...")

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        # -------------------------------
        # TrOCR (PRIMARY)
        # -------------------------------
        try:
            self.processor = TrOCRProcessor.from_pretrained(
                "microsoft/trocr-base-handwritten"
            )
            self.model = VisionEncoderDecoderModel.from_pretrained(
                "microsoft/trocr-base-handwritten"
            ).to(self.device)

            self.model.eval()
            print("TrOCR loaded")

        except Exception as e:
            print("TrOCR failed:", e)
            self.model = None
            self.processor = None

        # -------------------------------
        # EasyOCR
        # -------------------------------
        try:
            self.easy = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
            print(f"EasyOCR loaded (GPU: {torch.cuda.is_available()})")
        except Exception as e:
            print("EasyOCR failed:", e)
            self.easy = None

        # -------------------------------
        # PaddleOCR
        # -------------------------------
        self.paddle = None
        if PADDLE_AVAILABLE:
            try:
                self.paddle = PaddleOCR(lang='en', device='gpu' if torch.cuda.is_available() else 'cpu')
                print(f"PaddleOCR loaded (GPU: {torch.cuda.is_available()})")
            except Exception as e:
                print("PaddleOCR failed:", e)

        # -------------------------------
        # PARSeq (FIXED DEBUG)
        # -------------------------------
        self.parseq = None

        if PARSEQ_AVAILABLE:
            try:
                self.parseq = PARSeqRecognizer(self.device)

                # CRITICAL CHECK
                if self.parseq and getattr(self.parseq, "model", None):
                    print("PARSeq ACTIVE")
                else:
                    print("PARSeq NOT ACTIVE")

            except Exception as e:
                print("PARSeq init failed:", e)
                self.parseq = None
        else:
            print("PARSeq NOT AVAILABLE")

        # -------------------------------
        # MODEL WEIGHTS
        # -------------------------------
        self.model_weights = {
            "trocr": 1.0,
            "parseq": 0.9,
            "easy": 0.6,
            "paddle": 0.5
        }

    # ===============================
    # MAIN PIPELINE (OPTIMIZED BATCHING)
    # ===============================
    def recognize(self, image, boxes, batch_size=8):
        results = []
        all_rois = []
        roi_metadata = []

        # 1. Collect all ROIs and variants
        for box_idx, box in enumerate(boxes):
            x1, y1, x2, y2 = map(int, box)
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(image.shape[1], x2), min(image.shape[0], y2)

            if x2 <= x1 or y2 <= y1:
                continue

            roi = image[y1:y2, x1:x2]
            if roi is None or roi.size == 0:
                continue

            variants = self._generate_variants(roi)
            for var_idx, var in enumerate(variants):
                all_rois.append(var)
                roi_metadata.append({
                    "box_idx": box_idx,
                    "var_idx": var_idx,
                    "bbox": [x1, y1, x2, y2]
                })

            results.append({
                "bbox": [x1, y1, x2, y2],
                "candidates": []
            })

        if not all_rois:
            return results

        # 2. Batch Inference
        num_rois = len(all_rois)
        
        # --- TrOCR Batch ---
        if self.model:
            print(f"TrOCR Batch Inference ({num_rois} images)...")
            for i in range(0, num_rois, batch_size):
                batch = all_rois[i:i+batch_size]
                batch_meta = roi_metadata[i:i+batch_size]
                
                try:
                    imgs = [Image.fromarray(b) for b in batch]
                    pixel_values = self.processor(images=imgs, return_tensors="pt").pixel_values.to(self.device)
                    
                    with torch.no_grad():
                        outputs = self.model.generate(pixel_values, max_new_tokens=24, num_beams=3)
                    
                    texts = self.processor.batch_decode(outputs, skip_special_tokens=True)
                    
                    for j, text in enumerate(texts):
                        text = self._clean_text(text)
                        if self._is_valid(text):
                            conf = min(0.95, 0.7 + len(text) * 0.02)
                            res_idx = batch_meta[j]["box_idx"]
                            results[res_idx]["candidates"].append(self._pack(text, conf, "trocr"))
                except Exception as e:
                    print(f"TrOCR batch error: {e}")

        # --- PARSeq Batch ---
        if self.parseq and getattr(self.parseq, "model", None):
            print(f"PARSeq Batch Inference ({num_rois} images)...")
            for i in range(0, num_rois, batch_size):
                batch = all_rois[i:i+batch_size]
                batch_meta = roi_metadata[i:i+batch_size]
                
                try:
                    batch_results = self.parseq.recognize(batch)
                    for j, (text, conf) in enumerate(batch_results):
                        text = self._clean_text(text)
                        if self._is_valid(text):
                            res_idx = batch_meta[j]["box_idx"]
                            results[res_idx]["candidates"].append(self._pack(text, conf, "parseq"))
                except Exception as e:
                    print(f"PARSeq batch error: {e}")

        # --- EasyOCR Batch (Emulated) ---
        if self.easy:
            print(f"EasyOCR Inference ({num_rois} images)...")
            for i, var in enumerate(all_rois):
                t, c = self._easy(var)
                t = self._clean_text(t)
                if self._is_valid(t):
                    res_idx = roi_metadata[i]["box_idx"]
                    results[res_idx]["candidates"].append(self._pack(t, c, "easy"))

        # --- PaddleOCR Batch ---
        if self.paddle:
            print(f"PaddleOCR Batch Inference ({num_rois} images)...")
            for i in range(0, num_rois, batch_size):
                batch = all_rois[i:i+batch_size]
                batch_meta = roi_metadata[i:i+batch_size]
                
                try:
                    # PaddleOCR.ocr(img, det=False) handles lists
                    batch_results = self.paddle.ocr(batch, det=False)
                    for j, res in enumerate(batch_results):
                        if res and res[0]:
                            text, conf = res[0][0], float(res[0][1])
                            text = self._clean_text(text)
                            if self._is_valid(text):
                                res_idx = batch_meta[j]["box_idx"]
                                results[res_idx]["candidates"].append(self._pack(text, conf, "paddle"))
                except Exception as e:
                    print(f"PaddleOCR batch error: {e}")

        # 3. Deduplicate candidates per box
        for res in results:
            seen = set()
            unique_candidates = []
            # Sort by confidence descending
            sorted_candidates = sorted(res["candidates"], key=lambda x: x["conf"], reverse=True)
            for cand in sorted_candidates:
                if cand["text"] not in seen:
                    seen.add(cand["text"])
                    unique_candidates.append(cand)
            res["candidates"] = unique_candidates

        return results

    # ===============================
    # PACK WITH WEIGHT
    # ===============================
    def _pack(self, text, conf, model):
        weight = self.model_weights.get(model, 0.5)
        return {
            "text": text,
            "conf": conf * weight,
            "model": model
        }

    # ===============================
    # VARIANTS
    # ===============================
    def _generate_variants(self, roi):
        gray = self._to_gray(roi)

        variants = []

        variants.append(self._enhance(gray))

        ad = cv2.adaptiveThreshold(
            gray, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY,
            11, 2
        )
        variants.append(cv2.cvtColor(ad, cv2.COLOR_GRAY2RGB))

        return variants

    def _to_gray(self, roi):
        if len(roi.shape) == 2:
            return roi
        return cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

    def _enhance(self, gray):
        if gray.shape[0] < 40:
            gray = cv2.resize(gray, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)

        clahe = cv2.createCLAHE(2.0, (8, 8))
        gray = clahe.apply(gray)

        return cv2.cvtColor(gray, cv2.COLOR_GRAY2RGB)

    # ===============================
    # CLEANING
    # ===============================
    def _clean_text(self, text):
        text = text.lower()
        text = re.sub(r'\b[a-z]*\d+[a-z]*\b', '', text)
        text = re.sub(r'[^a-z\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def _is_valid(self, text):
        return len(text) >= 3 and any(c.isalpha() for c in text)

    # ===============================
    # TrOCR
    # ===============================
    def _trocr(self, roi):
        try:
            img = Image.fromarray(roi)

            pixel_values = self.processor(
                images=img,
                return_tensors="pt"
            ).pixel_values.to(self.device)

            with torch.no_grad():
                outputs = self.model.generate(
                    pixel_values,
                    max_new_tokens=24,
                    num_beams=3
                )

            text = self.processor.batch_decode(outputs, skip_special_tokens=True)[0]
            conf = min(0.95, 0.7 + len(text) * 0.02)

            return [(text, conf)]

        except:
            return []

    # ===============================
    # EasyOCR
    # ===============================
    def _easy(self, roi):
        try:
            r = self.easy.readtext(roi, detail=1)
            if r:
                return r[0][1], float(r[0][2])
        except:
            pass
        return "", 0.0

    # ===============================
    # PaddleOCR
    # ===============================
    def _paddle(self, roi):
        try:
            r = self.paddle.ocr(roi, det=False)
            if r and r[0]:
                return r[0][0][0], float(r[0][0][1])
        except:
            pass
        return "", 0.0