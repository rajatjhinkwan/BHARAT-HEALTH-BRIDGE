import argparse
import cv2
import os
from datetime import datetime

from ocr_pipeline.preprocessing import apply_preprocessing
from ocr_pipeline.detection import TextDetector
from ocr_pipeline.recognition import TextRecognizer
from ocr_pipeline.fusion import fuse_results
from ocr_pipeline.correction import MedicineCorrector
from ocr_pipeline.utils import visualize_results, save_json
from prescription_formatter import format_for_prescription_api


class OCRPipeline:
    """
    Genocr hybrid OCR pipeline (https://github.com/joshi1118/Genocr).
    """

    def __init__(self, db_path=None):
        print("Initializing Genocr OCR Pipeline...")

        base_dir = os.path.dirname(os.path.abspath(__file__))
        default_db = os.path.join(base_dir, "medicine_db.xlsx")

        if db_path:
            final_db_path = db_path
        else:
            if os.path.exists(default_db):
                final_db_path = default_db
                print(f"Using medicine DB: {final_db_path}")
            else:
                print("medicine_db.xlsx not found. Correction disabled.")
                final_db_path = None

        self.detector = TextDetector()
        self.recognizer = TextRecognizer()

        if final_db_path:
            self.corrector = MedicineCorrector(final_db_path)
        else:
            self.corrector = None

        print("Genocr pipeline ready.")

    def run(self, image_path, output_dir="output"):
        os.makedirs(output_dir, exist_ok=True)

        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not load image from {image_path}")

        print(f"\nProcessing image: {image_path}")

        processed = apply_preprocessing(image)
        detect_img = processed["binary"]
        recog_img = processed["enhanced"]

        print("Detecting text regions...")
        boxes = self.detector.detect_regions(detect_img)
        if not boxes:
            raise RuntimeError("Detection failed: No text regions found.")
        print(f"Detected {len(boxes)} regions.")

        print("Recognizing text...")
        raw_results = self.recognizer.recognize(recog_img, boxes)
        if not raw_results:
            raise RuntimeError("Recognition failed: No results generated.")

        print("Fusing results...")
        if self.corrector and hasattr(self.corrector, "medicine_list"):
            fused = fuse_results(raw_results, medicine_list=self.corrector.medicine_list)
        else:
            fused = fuse_results(raw_results, medicine_list=[])

        if self.corrector:
            print("Applying medicine database correction...")
            final_results = self.corrector.apply_correction(fused)
        else:
            final_results = fused

        print("Generating outputs...")
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        json_path = os.path.join(output_dir, f"results_{timestamp}.json")
        img_path = os.path.join(output_dir, f"annotated_{timestamp}.png")

        save_json(final_results, json_path)
        visualize_results(image, final_results, img_path)

        print("Pipeline complete.")
        print(f"JSON: {json_path}")
        print(f"Image: {img_path}")

        return final_results, img_path

    def process(self, image_path, output_dir="output"):
        """
        Run Genocr and return prescription-scanner API payload.
        """
        final_results, _ = self.run(image_path, output_dir=output_dir)
        return format_for_prescription_api(final_results)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Genocr Medical OCR Pipeline")
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--out", type=str, default="output", help="Output directory")
    parser.add_argument("--db", type=str, default=None, help="Optional custom medicine DB path")
    args = parser.parse_args()

    pipeline = OCRPipeline(db_path=args.db)
    results, annotated = pipeline.run(args.image, args.out)
    api_payload = format_for_prescription_api(results)
    print("\n--- API payload preview ---")
    for item in api_payload:
        print(item)
