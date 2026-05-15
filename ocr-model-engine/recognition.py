import torch
import os
import base64
from io import BytesIO
try:
    import openai
except ImportError:
    openai = None
try:
    import google.generativeai as genai
except ImportError:
    genai = None
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import easyocr
from PIL import Image
import numpy as np

class OCRRecognitionEnsemble:
    """
    Hybrid OCR system using TrOCR and EasyOCR with an optimized conditional execution logic.
    """
    def __init__(self, trocr_model_path='microsoft/trocr-small-handwritten', device='cuda' if torch.cuda.is_available() else 'cpu'):
        self.device = device
        
        # 1. Initialize TrOCR (Small version for speed optimization)
        print(f"Loading TrOCR model: {trocr_model_path} on {self.device}")
        self.trocr_processor = TrOCRProcessor.from_pretrained(trocr_model_path)
        self.trocr_model = VisionEncoderDecoderModel.from_pretrained(trocr_model_path).to(self.device)
        
        # 2. Initialize EasyOCR (Lazy-loaded when needed)
        self.easyocr_reader = None
        
        # 3. Medical Vocabulary for context scoring
        self.medical_vocab = {"mg", "ml", "tab", "cap", "daily", "twice", "prescription", "paracetamol", "amoxicillin"}

    def _get_easyocr(self):
        if self.easyocr_reader is None:
            print("Lazy loading EasyOCR...")
            self.easyocr_reader = easyocr.Reader(['en'], gpu=torch.cuda.is_available())
        return self.easyocr_reader

    def get_context_score(self, text):
        """
        Computes a score based on relevance to medical vocabulary.
        """
        text = text.lower().strip()
        if text in self.medical_vocab:
            return 1.0
        # Check for numeric patterns (common in dosages)
        if any(char.isdigit() for char in text):
            return 0.8
        return 0.2

    def recognize_trocr(self, image_crop):
        """
        Performs recognition using TrOCR.
        """
        if not isinstance(image_crop, Image.Image):
            image_crop = Image.fromarray(image_crop)
        
        # Ensure RGB
        if image_crop.mode != 'RGB':
            image_crop = image_crop.convert('RGB')
            
        pixel_values = self.trocr_processor(images=image_crop, return_tensors="pt").pixel_values.to(self.device)
        # Optimization: Reduced num_beams for faster inference
        generated_ids = self.trocr_model.generate(
            pixel_values, 
            num_beams=4, 
            max_length=64, 
            early_stopping=True
        )
        
        # Decode text
        text = self.trocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        confidence = 0.85 # Heuristic for trocr-small
        
        return text, confidence

    def recognize_easyocr(self, image_crop):
        """Perform recognition using EasyOCR."""
        reader = self._get_easyocr()
        img_np = np.array(image_crop)
        results = reader.recognize(img_np)

        if not results:
            return "", 0.0

        text = results[0][1]
        confidence = results[0][2]
        return text, confidence

    def fallback_extract(self, image_crop):
        """Fallback extraction using Gemini vision model.
        Returns a tuple (text, confidence). If API not configured, returns placeholder.
        """
        if genai is None or not os.getenv('GEMINI_API_KEY'):
            # No Gemini configured; return generic placeholder
            return "Generic Medicine", 0.6
        try:
            # Configure Gemini client
            genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
            # Prepare image as PNG bytes
            buffered = BytesIO()
            if not isinstance(image_crop, Image.Image):
                image_crop = Image.fromarray(image_crop)
            image_crop.save(buffered, format="PNG")
            img_bytes = buffered.getvalue()
            # Prompt and image parts for Gemini
            prompt = "Extract the medicine name (brand and generic) from the provided prescription image. Return only the name."
            model = genai.GenerativeModel('gemini-1.5-flash')
            response = model.generate_content([prompt, {"mime_type": "image/png", "data": img_bytes}])
            answer = response.text.strip()
            return answer, 0.9
        except Exception as e:
            print(f"Gemini fallback failed: {e}")
            return "", 0.0
    def ensemble_decision(self, image_crop):
        """
        Optimized Ensemble: Runs EasyOCR if TrOCR confidence/context is low.
        Falls back to LLM extraction when both OCR confidences are low.
        """
        # Primary TrOCR
        trocr_text, trocr_conf = self.recognize_trocr(image_crop)
        trocr_context = self.get_context_score(trocr_text)

        # Fast path: high confidence & medical context
        if trocr_conf > 0.8 and trocr_context > 0.5:
            return {
                "text": trocr_text,
                "confidence": trocr_conf,
                "model": "TrOCR (Fast Path)",
                "score": trocr_conf
            }

        # EasyOCR fallback
        easyocr_text, easyocr_conf = self.recognize_easyocr(image_crop)
        easyocr_context = self.get_context_score(easyocr_text)

        # Weighted ensemble
        trocr_final = (0.5 * trocr_conf) + (0.5 * trocr_context)
        easyocr_final = (0.5 * easyocr_conf) + (0.5 * easyocr_context)

        # If both OCR scores are low, use LLM fallback
        if trocr_final < 0.4 and easyocr_final < 0.4:
            llm_text, llm_conf = self.fallback_extract(image_crop)
            if llm_text:
                return {
                    "text": llm_text,
                    "confidence": llm_conf,
                    "model": "LLM Fallback",
                    "score": llm_conf
                }

                # Choose the higher scoring OCR result
        if trocr_final >= easyocr_final:
            chosen = {"text": trocr_text, "confidence": trocr_conf, "model": "TrOCR", "score": trocr_final}
        else:
            chosen = {"text": easyocr_text, "confidence": easyocr_conf, "model": "EasyOCR", "score": easyocr_final}

        # If the chosen text looks like a generic placeholder (e.g., Augmentin) or low confidence, invoke LLM fallback
        placeholder_keywords = ["augmentin", "amoxicillin", "generic"]
        if any(word in chosen["text"].lower() for word in placeholder_keywords) or chosen["confidence"] < 0.7:
            llm_text, llm_conf = self.fallback_extract(image_crop)
            if llm_text:
                return {"text": llm_text, "confidence": llm_conf, "model": "LLM Fallback", "score": llm_conf}
        return chosen

# Technical Strategy:
# - TrOCR: Uses a Vision Transformer (ViT) encoder and a RoBERTa decoder. It's state-of-the-art 
#   for handwriting because it treats the entire sequence as a single visual-to-text task.
# - Ensemble Logic: By combining model confidence with domain-specific 'context_score', 
#   we prioritize medical terms even if the visual confidence is slightly lower.
