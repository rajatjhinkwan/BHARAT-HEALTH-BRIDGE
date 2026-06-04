import cv2
import numpy as np
from skimage.filters import threshold_sauvola


# -------------------------------
# MAIN PIPELINE
# -------------------------------
def apply_preprocessing(image):
    """
    Returns multiple processed variants:
    - gray (for TrOCR / deep models)
    - enhanced (contrast improved)
    - binary (for detection)
    """

    gray = to_grayscale(image)

    # Illumination correction (IMPORTANT)
    norm = normalize_illumination(gray)

    # Contrast enhancement
    enhanced = apply_clahe(norm)

    # Noise removal
    denoised = denoise(enhanced)

    # Deskew BEFORE thresholding
    deskewed, angle = deskew_image(denoised)

    # Adaptive threshold (Sauvola)
    binary = sauvola_binarize(deskewed)

    # Morphological refinement
    cleaned = morphological_cleanup(binary)

    return {
        "gray": gray,
        "enhanced": enhanced,
        "deskewed": deskewed,
        "binary": cleaned,
        "angle": angle
    }


# -------------------------------
# STEP 1: GRAYSCALE
# -------------------------------
def to_grayscale(image):
    if len(image.shape) == 3:
        return cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    return image


# -------------------------------
# STEP 2: ILLUMINATION NORMALIZATION
# -------------------------------
def normalize_illumination(gray):
    # Remove background shading using Gaussian blur subtraction
    blur = cv2.GaussianBlur(gray, (51, 51), 0)
    norm = cv2.divide(gray, blur, scale=255)
    return norm


# -------------------------------
# STEP 3: CLAHE
# -------------------------------
def apply_clahe(gray):
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    return clahe.apply(gray)


# -------------------------------
# STEP 4: DENOISING
# -------------------------------
def denoise(image):
    image = cv2.medianBlur(image, 3)
    image = cv2.bilateralFilter(image, 7, 50, 50)
    return image


# -------------------------------
# STEP 5: DESKEW (ROBUST)
# -------------------------------
def deskew_image(image):
    coords = np.column_stack(np.where(image > 0))

    if len(coords) < 10:
        return image, 0  # Not enough data

    angle = cv2.minAreaRect(coords)[-1]

    if angle < -45:
        angle = -(90 + angle)
    else:
        angle = -angle

    (h, w) = image.shape[:2]
    center = (w // 2, h // 2)

    M = cv2.getRotationMatrix2D(center, angle, 1.0)

    rotated = cv2.warpAffine(
        image,
        M,
        (w, h),
        flags=cv2.INTER_CUBIC,
        borderMode=cv2.BORDER_REPLICATE
    )

    return rotated, angle


# -------------------------------
# STEP 6: SAUVOLA BINARIZATION
# -------------------------------
def sauvola_binarize(image):
    thresh = threshold_sauvola(image, window_size=25)
    binary = (image > thresh).astype(np.uint8) * 255
    return binary


# -------------------------------
# STEP 7: MORPHOLOGICAL CLEANUP
# -------------------------------
def morphological_cleanup(binary):
    kernel = np.ones((2, 2), np.uint8)

    # Remove small noise
    opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)

    # Strengthen text strokes
    dilated = cv2.dilate(opened, kernel, iterations=1)

    return dilated


# -------------------------------
# OPTIONAL: DEBUG VISUALIZATION
# -------------------------------
def save_debug_images(processed_dict, prefix="debug"):
    for key, img in processed_dict.items():
        if key == "angle":
            continue
        cv2.imwrite(f"{prefix}_{key}.jpg", img)