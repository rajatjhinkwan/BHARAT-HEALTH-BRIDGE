# Genocr Prescription Scanner

This service runs the [Genocr](https://github.com/joshi1118/Genocr) hybrid OCR pipeline for handwritten prescription scanning.

## Pipeline

1. **Preprocessing** (`ocr_pipeline/preprocessing.py`) — illumination normalization, CLAHE, denoise, deskew, Sauvola binarization
2. **Detection** (`ocr_pipeline/detection.py`) — contour-based line detection with EasyOCR fallback
3. **Recognition** (`ocr_pipeline/recognition.py`) — TrOCR, PARSeq, EasyOCR, PaddleOCR ensemble
4. **Fusion** (`ocr_pipeline/fusion.py`) — cluster and score candidates
5. **Correction** (`ocr_pipeline/correction.py`) — match against `medicine_db.xlsx`

## Run API (mobile app / prescription scanner)

```bash
cd machine-learning-model
pip install -r requirements.txt
python server.py
```

Health: `GET http://localhost:8000/health`  
Scan: `POST http://localhost:8000/ocr` (multipart field: `file`)

## CLI (single image)

```bash
python main.py --image test2.jpeg --out output
```

## Requirements

- Python 3.10+
- GPU recommended (CUDA) for TrOCR / EasyOCR / PaddleOCR
- First run downloads model weights (Hugging Face, torch hub)
