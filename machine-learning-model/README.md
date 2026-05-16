# End-to-End Handwritten Text Recognition (HTR) for Medical Prescriptions

This project is a high-accuracy deep learning system designed to detect, segment, and recognize handwritten text from medical prescriptions, specifically optimized for medical terminology and structural elements.

## 🚀 How the System Works (Core Pipeline)

The system operates through a multi-stage pipeline that combines computer vision and state-of-the-art transformer models.

### 1. Preprocessing Pipeline (`preprocessing.py`)
To handle real-world variations (noise, shadows, skew), the following steps are applied:
- **Grayscale & CLAHE**: Enhances contrast for better feature extraction.
- **Median Filtering**: Reduces background noise while preserving edge detail.
- **Adaptive Thresholding**: Binarizes the image to separate ink from paper.
- **Deskewing**: Automatically detects and corrects the rotation of the page.
- **Image Upscaling**: Small or blurry text regions are upscaled using `INTER_CUBIC` interpolation to improve OCR engine input quality.

### 2. Multi-Level Detection (`detection.py`)
- **Word-Level Detection**: Uses **EasyOCR's CRAFT (Character Region Awareness for Text)** implementation to identify individual word-level bounding boxes.
- **Shape Detection**: Utilizes OpenCV contour analysis to detect geometric shapes (Circles, Rectangles, Squares, Triangles) often used in prescriptions.
- **Reading Order Sorting**: Boxes are automatically sorted from top-to-bottom and left-to-right to maintain the logical flow of the prescription.

### 3. Ensemble Recognition Method (`recognition.py`)
To maximize accuracy, the system uses an **Ensemble Fusion** method:
- **TrOCR-Large (Primary)**: A transformer-based model (`microsoft/trocr-large-handwritten`) that understands handwriting context and cursive flows.
- **EasyOCR (Secondary)**: A CNN+RNN based model that is highly robust at recognizing literal characters, symbols, and mathematical numbers.
- **GPU Acceleration**: Supports CUDA and FP16 mixed precision for fast inference.

### 4. Intelligent Post-Processing (`post_processing.py`)
- **Medicine Database Match**: OCR results are matched against a database of **10,000+ medicine names** (`medicine_db.xlsx`) using Levenshtein distance similarity.
- **Time & Math Standardization**: Specialized regex modules clean up time formats (AM/PM) and math symbols (+, /, →).
- **Ensemble Decision Logic**: The system compares results from both TrOCR and EasyOCR, picking the one with the highest "Medical Confidence Score."

### 5. Visualization & Output (`visualization.py`)
- **Annotated Image**: Generates a final image with **Green Bounding Boxes** for text and **Blue Bounding Boxes** for shapes.
- **Black Text Overlay**: Recognized digital text is rendered in black above each detected region for maximum contrast.
- **JSON Data**: Exports all coordinates and recognized text into a structured JSON file for further data processing.

## 🎯 Accuracy-Boosting Parameters & Variables

The system's high accuracy is achieved through fine-tuned parameters across different modules. Below are the key variables that influence performance:

### 1. Preprocessing Parameters (`preprocessing.py`)
- **`clipLimit=2.0`**: Used in CLAHE to prevent over-amplification of noise in dark regions while enhancing local contrast.
- **`min_height=64`**: The threshold for `upscale_small_text`. Any text crop smaller than this is upscaled using **Cubic Interpolation** to provide clearer character boundaries for the AI models.
- **`delta=1` & `limit=5`**: Sensitivity parameters for deskewing, allowing the system to detect and correct tilts as small as 1 degree.

### 2. Detection & Segmentation (`detection.py`)
- **`threshold=20`**: In `sort_bounding_boxes`, this defines the maximum vertical pixel distance to group words into the same horizontal line (Reading Order).
- **`0.04 * peri`**: The epsilon value for `approxPolyDP`, controlling how strictly contours are classified into geometric shapes like rectangles or circles.
- **`area < 100`**: A noise filter that prevents small artifacts from being misidentified as medical symbols or shapes.

### 3. AI Recognition Parameters (`recognition.py`)
- **`num_beams=8`**: Uses an expanded beam search during character generation. This allows the transformer to explore more character sequences, significantly improving the recognition of rare symbols and complex cursive.
- **`no_repeat_ngram_size=0`**: Disabled to ensure that repetitive medical notations (like `...` or `---`) are not accidentally skipped or suppressed.
- **`max_length=64`**: The sequence limit for word-level crops, ensuring long chemical names or compound instructions are fully captured.

### 4. Post-Processing & Ensemble Logic (`post_processing.py`)
- **`threshold=0.55`**: The minimum Levenshtein similarity score required to accept a correction from the **Medicine Database**. This prevents the system from forcing a medicine name onto a non-medical word (like a patient's name).
- **`easy_score > trocr_score + 0.15`**: The decision boundary for the ensemble. If the literal CNN model (EasyOCR) is significantly more confident about a medical term than the context model (TrOCR), the system prioritizes the literal match.
- **Regex `(?i)\b(AM|PM)\s+\1\b`**: A specific cleaning rule to resolve common OCR double-detection errors in time notations.

## 🛠️ File Structure
- `main.py`: The central integration script.
- `preprocessing.py`: Image enhancement and deskewing logic.
- `detection.py`: CRAFT text detection and OpenCV shape analysis.
- `recognition.py`: TrOCR-Large and EasyOCR ensemble recognition.
- `post_processing.py`: Medicine DB matching and regex cleaning.
- `visualization.py`: Image annotation and JSON export.
- `medicine_db.xlsx`: The dictionary used for spell correction.

## 📥 Getting Started
1. Install dependencies: `pip install -r requirements.txt`
2. Place your image in the project root (e.g., `test1.jpeg`).
3. Run the system: `python main.py`
4. Check the `output/` folder for results.
