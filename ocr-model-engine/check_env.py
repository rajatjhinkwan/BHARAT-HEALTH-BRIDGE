
import sys
try:
    import fastapi
    print("FastAPI installed")
    import ultralytics
    print("Ultralytics installed")
    import torch
    print("Torch installed")
    print("Success: All major packages are available.")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
