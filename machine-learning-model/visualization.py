import cv2
import numpy as np

def draw_results(image, results, output_path=None):
    """
    Draw bounding boxes and recognized text on the image.
    results: list of dictionaries {"text": str, "bbox": [x, y, w, h]}
    """
    annotated_image = image.copy()
    
    # Define colors (BGR format for OpenCV)
    bbox_color = (0, 255, 0)  # Green
    text_color = (0, 0, 0)    # Black
    
    for item in results:
        text = item["text"]
        x, y, w, h = item["bbox"]
        
        # Draw bounding box
        cv2.rectangle(annotated_image, (x, y), (x + w, y + h), bbox_color, 2)
        
        # Draw recognized text above the box
        # Font settings: clean sans-serif (simplex)
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 0.5
        thickness = 1
        
        # Get text size to position it
        (text_w, text_h), baseline = cv2.getTextSize(text, font, font_scale, thickness)
        
        # Draw background rectangle for text for better visibility (optional)
        # We'll use a semi-transparent white or green background for black text if needed,
        # but for now just black text directly as requested.
        # cv2.rectangle(annotated_image, (x, y - text_h - 10), (x + text_w, y), (255, 255, 255), -1)
        
        # Draw text in black
        cv2.putText(annotated_image, text, (x, y - 5), font, font_scale, text_color, thickness, cv2.LINE_AA)
        
    if output_path:
        cv2.imwrite(output_path, annotated_image)
        
    return annotated_image

def generate_json_output(results):
    """
    Format results into JSON structure.
    """
    return {"words": results}
