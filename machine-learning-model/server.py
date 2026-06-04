from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
import uuid
from main import OCRPipeline

app = FastAPI(title="Genocr Prescription Scanner")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None
is_loading = False


def get_pipeline():
    global pipeline, is_loading
    if pipeline is None:
        if not is_loading:
            is_loading = True
            print("--- Initializing Genocr OCR Pipeline (models may take a while) ---")
            try:
                pipeline = OCRPipeline()
                print("--- Genocr OCR Pipeline Ready ---")
            except Exception as e:
                is_loading = False
                print(f"Failed to initialize pipeline: {e}")
                raise e
    return pipeline


UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
async def warm_up_pipeline():
    try:
        get_pipeline()
    except Exception as e:
        print(f"Startup warm-up failed (will retry on first request): {e}")


@app.post("/ocr")
async def process_prescription(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")

    file_extension = os.path.splitext(file.filename)[1] or ".jpg"
    file_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{file_id}{file_extension}")
    saved = False

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        saved = True

        p = get_pipeline()
        if p is None:
            raise HTTPException(status_code=503, detail="OCR pipeline is still loading. Try again shortly.")

        print(f"Processing image with Genocr: {file_path}")
        result = p.process(file_path)

        return {
            "status": "success",
            "engine": "genocr",
            "data": result,
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in /ocr: {e}")
        raise HTTPException(status_code=500, detail=f"OCR processing failed: {e}")
    finally:
        if saved and os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                pass


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "engine": "genocr",
        "pipeline_ready": pipeline is not None,
        "is_loading": is_loading,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
