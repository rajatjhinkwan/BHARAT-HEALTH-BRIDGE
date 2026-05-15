import cv2
import numpy as np
from PIL import Image

class ImagePreprocessor:
    """
    Advanced preprocessing pipeline for medical prescriptions to improve OCR accuracy.
    """
    def __init__(self, clip_limit=2.0, tile_grid_size=(8, 8), blur_kernel=3, block_size=11, c_value=2):
        self.clip_limit = clip_limit
        self.tile_grid_size = tile_grid_size
        self.blur_kernel = blur_kernel
        self.block_size = block_size
        self.c_value = c_value

    def apply_clahe(self, gray_image):
        """
        Improves local contrast and enhances text features in unevenly lit documents.
        """
        clahe = cv2.createCLAHE(clipLimit=self.clip_limit, tileGridSize=self.tile_grid_size)
        return clahe.apply(gray_image)

    def adaptive_threshold(self, image):
        """
        Binarizes the image while handling shadows and non-uniform lighting.
        """
        return cv2.adaptiveThreshold(
            image, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, 
            cv2.THRESH_BINARY, self.block_size, self.c_value
        )

    def deskew(self, image):
        """
        Detects and corrects document skew using Hough Transform for better line grouping.
        """
        coords = np.column_stack(np.where(image > 0))
        angle = cv2.minAreaRect(coords)[-1]
        
        # Adjust angle logic for 90-degree rotations
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
            
        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(image, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        
        # If the image is wider than it is tall, but the text seems to be vertical,
        # we might need to rotate it 90 degrees.
        # For simplicity, we'll stick to basic deskew for now.
        return rotated

    def upscale_if_small(self, image, min_height=128):
        """
        Upscales small text regions to meet the minimum resolution required by OCR models.
        """
        h, w = image.shape[:2]
        if h < min_height:
            scale_factor = min_height / h
            new_w = int(w * scale_factor)
            image = cv2.resize(image, (new_w, min_height), interpolation=cv2.INTER_CUBIC)
        return image

    def run_pipeline(self, image_path):
        """
        Executes the full preprocessing pipeline.
        """
        # 1. Load and Grayscale
        image = cv2.imread(image_path)
        if image is None:
            raise ValueError(f"Could not read image from {image_path}")
        
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. CLAHE for contrast enhancement
        enhanced = self.apply_clahe(gray)
        
        # 3. Median Blur for noise reduction (Increased kernel size)
        blurred = cv2.medianBlur(enhanced, 5)
        
        # 4. Adaptive Thresholding
        binary = self.adaptive_threshold(blurred)
        
        # 5. Deskew
        deskewed = self.deskew(binary)
        
        # 6. Final cleanup (Morphological opening and closing)
        kernel = np.ones((3,3), np.uint8)
        cleaned = cv2.morphologyEx(deskewed, cv2.MORPH_OPEN, kernel)
        cleaned = cv2.morphologyEx(cleaned, cv2.MORPH_CLOSE, kernel)
        
        return cleaned

# Technical Justification for each step:
# - Grayscale: Reduces complexity by removing color information irrelevant for text.
# - CLAHE: Essential for prescriptions often photographed in low light; balances brightness without blowing out details.
# - Median Blur: Effectively removes salt-and-pepper noise while preserving sharp text edges.
# - Adaptive Thresholding: Handles variable lighting conditions common in handheld photos of medical notes.
# - Deskew: Critical for line-based OCR engines (like TrOCR) which expect horizontal text for sequential processing.
# - INTER_CUBIC Upscaling: Prevents pixelation during enlargement, maintaining smooth character curves for better recognition.
