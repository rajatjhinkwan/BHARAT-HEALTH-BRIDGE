from preprocessing import ImagePreprocessor
from detection import PrescriptionDetector
from recognition import OCRRecognitionEnsemble
from postprocessing import MedicalPostProcessor
from llm_correction import LLMContextCorrector
import cv2
from PIL import Image

class OCRPipeline:
    """
    Integrates all modules into a single, cohesive OCR pipeline for medical documents.
    """
    def __init__(self, api_key=None):
        self.preprocessor = ImagePreprocessor()
        self.detector = PrescriptionDetector()
        self.recognition_ensemble = OCRRecognitionEnsemble()
        self.post_processor = MedicalPostProcessor()
        self.llm_corrector = LLMContextCorrector(api_key=api_key)

    def process(self, image_path):
        print(f"--- Processing: {image_path} ---")
        
        # 1. Preprocessing
        print("[1/5] Preprocessing image...")
        processed_img = self.preprocessor.run_pipeline(image_path)
        
        # 2. Text Detection
        print("[2/5] Detecting text regions...")
        # Since we don't have real weights, we assume YOLO returns some boxes
        # For demonstration, we'll use the detection logic directly
        boxes = self.detector.detect(processed_img)
        lines = self.detector.group_into_lines(boxes)
        
        # 3. Recognition (with ensemble)
        print("[3/5] Recognizing text (Ensemble logic)...")
        full_raw_text = []
        for line in lines:
            line_crops = self.detector.refine_regions(processed_img, line)
            line_text = []
            for crop in line_crops:
                # Convert cv2 crop to PIL for recognition
                pil_crop = Image.fromarray(crop)
                result = self.recognition_ensemble.ensemble_decision(pil_crop)
                line_text.append(result['text'])
            full_raw_text.append(" ".join(line_text))
            
        raw_ocr_output = "\n".join(full_raw_text)
        print(f"Raw OCR Output:\n{raw_ocr_output}\n")
        
        # 4. Intelligent Post-Processing
        print("[4/5] Applying medical post-processing...")
        refined_text = []
        for line in full_raw_text:
            refined_text.append(self.post_processor.process_line(line))
        
        refined_output = "\n".join(refined_text)
        print(f"Refined Output:\n{refined_output}\n")
        
        # 5. LLM Layer (Final context & structure)
        print("[5/5] LLM Contextual correction & structuring...")
        structured_output = self.llm_corrector.correct_and_structure(refined_output)
        
        return structured_output

if __name__ == "__main__":
    # Initialize pipeline
    # (Note: Using default mock logic for missing API key)
    pipeline = OCRPipeline()
    
    # Process test1.jpeg
    image_path = "test1.jpeg"
    try:
        result = pipeline.process(image_path)
        print("\n--- FINAL STRUCTURED OUTPUT ---")
        import json
        print(json.dumps(result, indent=4))
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
