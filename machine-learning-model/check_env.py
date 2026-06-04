import sys

REQUIRED = [
    ("fastapi", "FastAPI"),
    ("cv2", "OpenCV"),
    ("torch", "PyTorch"),
    ("transformers", "Transformers"),
    ("easyocr", "EasyOCR"),
    ("thefuzz", "thefuzz"),
    ("pandas", "Pandas"),
]

def main():
    missing = []
    for module, label in REQUIRED:
        try:
            __import__(module)
            print(f"{label} installed")
        except ImportError:
            missing.append(label)

    if missing:
        print(f"Missing: {', '.join(missing)}")
        print("Run: pip install -r requirements.txt")
        sys.exit(1)

    print("Success: Genocr dependencies are available.")


if __name__ == "__main__":
    main()
