import cv2
import torch
import numpy as np
import easyocr

try:
    from paddleocr import PaddleOCR
    PADDLE_AVAILABLE = True
except:
    PADDLE_AVAILABLE = False


class TextDetector:
    def __init__(self):
        print("Initializing TextDetector...")

        # EasyOCR fallback
        try:
            self.easy_ocr = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
            print(f"EasyOCR loaded (GPU: {torch.cuda.is_available()})")
        except Exception as e:
            print(f"EasyOCR failed: {e}")
            self.easy_ocr = None

    # -------------------------------
    # PREPROCESS FOR CONTOUR DETECTION
    # -------------------------------
    def preprocess(self, image):
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # contrast
        clahe = cv2.createCLAHE(2.0, (8, 8))
        gray = clahe.apply(gray)

        # binarize
        _, thresh = cv2.threshold(
            gray, 0, 255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        return thresh

    # -------------------------------
    # CONTOUR-BASED LINE DETECTION
    # -------------------------------
    def _detect_contours(self, image):
        thresh = self.preprocess(image)

        # connect letters horizontally
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 3))
        dilated = cv2.dilate(thresh, kernel, iterations=1)

        contours, _ = cv2.findContours(
            dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        boxes = []

        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)

            # filter noise
            if w < 40 or h < 15:
                continue

            # remove giant blocks (bad merge)
            if w > image.shape[1] * 0.9 and h > image.shape[0] * 0.5:
                continue

            boxes.append([x, y, x + w, y + h])

        return boxes

    # -------------------------------
    # EASYOCR FALLBACK
    # -------------------------------
    def _detect_easyocr(self, image):
        boxes = []

        if not self.easy_ocr:
            return boxes

        try:
            results = self.easy_ocr.readtext(image, detail=1)

            for item in results:
                bbox = item[0]

                xs = [int(p[0]) for p in bbox]
                ys = [int(p[1]) for p in bbox]

                boxes.append([
                    min(xs), min(ys),
                    max(xs), max(ys)
                ])

        except Exception as e:
            print("EasyOCR fallback error:", e)

        return boxes

    # -------------------------------
    # MERGE (SAFE, NOT AGGRESSIVE)
    # -------------------------------
    def _merge_lines(self, boxes, y_thresh=12):
        if not boxes:
            return []

        boxes = sorted(boxes, key=lambda b: (b[1], b[0]))
        merged = []
        current = boxes[0]

        for box in boxes[1:]:
            # only merge if same line height
            if abs(box[1] - current[1]) < y_thresh:
                current = [
                    min(current[0], box[0]),
                    min(current[1], box[1]),
                    max(current[2], box[2]),
                    max(current[3], box[3])
                ]
            else:
                merged.append(current)
                current = box

        merged.append(current)
        return merged

    # -------------------------------
    # REMOVE DUPLICATES (IOU)
    # -------------------------------
    def _nms(self, boxes, iou_thresh=0.3):
        if not boxes:
            return []

        boxes = np.array(boxes)

        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]

        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = areas.argsort()[::-1]

        keep = []

        while order.size > 0:
            i = order[0]
            keep.append(boxes[i].tolist())

            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])

            w = np.maximum(0, xx2 - xx1 + 1)
            h = np.maximum(0, yy2 - yy1 + 1)

            inter = w * h
            ovr = inter / (areas[i] + areas[order[1:]] - inter)

            inds = np.where(ovr <= iou_thresh)[0]
            order = order[inds + 1]

        return keep

    # -------------------------------
    # MAIN DETECTION PIPELINE
    # -------------------------------
    def detect_regions(self, image):
        print("Running advanced detection...")

        # 1. contour-based (primary)
        contour_boxes = self._detect_contours(image)

        # 2. fallback OCR detection
        ocr_boxes = self._detect_easyocr(image)

        # combine
        all_boxes = contour_boxes + ocr_boxes

        if not all_boxes:
            raise RuntimeError("No text detected")

        # 3. remove duplicates
        boxes = self._nms(all_boxes)

        # 4. merge lines safely
        boxes = self._merge_lines(boxes)

        print(f"Detected {len(boxes)} line regions")
        return boxes