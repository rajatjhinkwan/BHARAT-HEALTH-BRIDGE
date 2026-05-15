import cv2
import numpy as np

def visualize_detections(image_path, output_path, detections):
    """
    Draws bounding boxes and digital text above detected handwriting regions.
    """
    image = cv2.imread(image_path)
    if image is None:
        print(f"Error: Could not read image {image_path}")
        return

    for det in detections:
        x, y, w, h = det['box']
        text = det['text']
        
        # 1. Draw Bounding Box (Green)
        cv2.rectangle(image, (x, y), (x + w, y + h), (0, 255, 0), 2)
        
        # 2. Draw Text Background (Small black rectangle)
        label_size, base_line = cv2.getTextSize(text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
        y_label = max(y, label_size[1] + 10)
        cv2.rectangle(image, (x, y_label - label_size[1] - 10), (x + label_size[0], y_label), (0, 0, 0), cv2.FILLED)
        
        # 3. Put White Digital Text
        cv2.putText(image, text, (x, y_label - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

    cv2.imwrite(output_path, image)
    print(f"Visualization saved to: {output_path}")

if __name__ == "__main__":
    # Simulated detections based on test2.jpeg analysis
    # Format: {'box': [x, y, w, h], 'text': 'digital text'}
    test2_detections = [
        {'box': [100, 20, 250, 45], 'text': 'Paracetamol'},
        {'box': [100, 75, 220, 45], 'text': 'Ibuprofen'},
        {'box': [100, 130, 260, 45], 'text': 'Amoxicillin'},
        {'box': [100, 185, 230, 45], 'text': 'Cetirizine'},
        {'box': [100, 240, 240, 45], 'text': 'Metformin'},
        {'box': [100, 295, 180, 45], 'text': 'Aspirin'},
        {'box': [100, 350, 280, 45], 'text': 'Azithromycin'},
        {'box': [100, 405, 250, 45], 'text': 'Omeprazole'},
        {'box': [100, 460, 220, 45], 'text': 'Losartan'},
        {'box': [100, 515, 260, 45], 'text': 'Salbutamol'},
        # Alphabet
        {'box': [70, 600, 650, 50], 'text': 'abcdefghijklmnopqrstuvwxyz'},
        # Symbols and Bottom text
        {'box': [50, 930, 150, 50], 'text': 'Circle/Arrow'},
        {'box': [250, 930, 300, 50], 'text': 'Mr. Ms. Mrs.'},
        {'box': [630, 880, 280, 150], 'text': 'Dr. Glomeet Gourmet Anus.'}
    ]

    visualize_detections('test2.jpeg', 'output/test2_detected.jpg', test2_detections)
