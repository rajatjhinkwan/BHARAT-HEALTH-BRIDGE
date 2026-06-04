import cv2
import json
import numpy as np
import os


# -------------------------------
# SORTING (reading order)
# -------------------------------
def sort_results(results):
    """
    Sort regions top-to-bottom, left-to-right.
    """
    return sorted(results, key=lambda x: (x["bbox"][1], x["bbox"][0]))


# -------------------------------
# SAFE DRAW LABEL
# -------------------------------
def draw_label(img, text, x, y, font_scale=0.5):
    font = cv2.FONT_HERSHEY_SIMPLEX
    thickness = 1

    (w, h), _ = cv2.getTextSize(text, font, font_scale, thickness)

    y = max(y, h + 5)

    # background
    cv2.rectangle(img, (x, y - h - 5), (x + w + 4, y), (255, 255, 255), -1)

    # text
    cv2.putText(img, text, (x + 2, y - 3), font, font_scale, (0, 0, 0), thickness)


# -------------------------------
# DRAW BOXES ONLY
# -------------------------------
def draw_boxes(image, results):
    img = ensure_color(image).copy()

    for item in results:
        bbox = item.get("bbox", [])
        if len(bbox) != 4:
            continue

        x1, y1, x2, y2 = map(int, bbox)
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), 2)

    return img


# -------------------------------
# DRAW FULL ANNOTATION
# -------------------------------
def draw_annotations(image, results, show_conf=True):
    img = ensure_color(image).copy()

    results = sort_results(results)

    for item in results:
        bbox = item.get("bbox", [])
        text = item.get("text", "")
        conf = item.get("confidence", None)

        if len(bbox) != 4:
            continue

        x1, y1, x2, y2 = map(int, bbox)

        # draw box
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 0, 0), 2)

        # prepare label
        label = text

        if show_conf and conf is not None:
            label += f" ({conf:.2f})"

        if "[UNCERTAIN" in text:
            label = f"? {text}"

        # dynamic label position
        label_y = y1 - 5 if y1 > 20 else y2 + 15

        draw_label(img, label, x1, label_y)

    return img


# -------------------------------
# SAVE IMAGE
# -------------------------------
def save_image(image, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    cv2.imwrite(path, image)
    return path


# -------------------------------
# HIGH-LEVEL VISUALIZATION
# -------------------------------
def visualize_results(image, results, output_path="output/annotated.png"):
    annotated = draw_annotations(image, results)
    return save_image(annotated, output_path)


# -------------------------------
# JSON EXPORT
# -------------------------------
def save_json(results, output_path="output/results.json"):
    os.makedirs(os.path.dirname(output_path), exist_ok=True)

    clean = []

    for item in results:
        clean.append({
            "text": item.get("text", ""),
            "confidence": round(float(item.get("confidence", 0.0)), 3),
            "bbox": [int(x) for x in item.get("bbox", [])],
            "corrected": bool(item.get("corrected", False))
        })

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump({"regions": clean}, f, indent=2, ensure_ascii=False)

    return output_path


# -------------------------------
# IMAGE FORMAT SAFETY
# -------------------------------
def ensure_color(image):
    """
    Ensure image is BGR (3-channel).
    """
    if len(image.shape) == 2:
        return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
    return image


# -------------------------------
# DEBUG HELPER
# -------------------------------
def debug_print_results(results, limit=5):
    print("\n--- DEBUG RESULTS ---")
    for i, item in enumerate(results[:limit]):
        print(f"{i+1}. {item}")
    print("---------------------\n")