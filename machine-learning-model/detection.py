from ultralytics import YOLO
import numpy as np
import cv2

class PrescriptionDetector:
    """
    YOLO-based detection module for extracting word and line regions from medical prescriptions.
    """
    def __init__(self, model_path='yolov8n_medical.pt', conf_threshold=0.3, iou_threshold=0.5):
        import os
        if not os.path.exists(model_path):
            print(f"Warning: {model_path} not found. Falling back to generic yolov8n.pt")
            model_path = 'yolov8n.pt'
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold
        self.iou_threshold = iou_threshold

    def detect(self, image):
        """
        Runs YOLO detection and returns bounding boxes.
        """
        # Ensure image has 3 channels for YOLO
        if len(image.shape) == 2:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        elif image.shape[2] == 1:
            image = cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
            
        results = self.model.predict(
            source=image, 
            conf=self.conf_threshold, 
            iou=self.iou_threshold,
            imgsz=640 # Optimization: Reduced from 1024 for 2x speedup
        )
        
        boxes = []
        for result in results:
            for box in result.boxes:
                # Extract: [x1, y1, x2, y2, confidence, class_id]
                boxes.append(box.data[0].cpu().numpy())
        
        return np.array(boxes)

    def group_into_lines(self, boxes, h_threshold_ratio=0.5):
        """
        Groups detected word boxes into logical lines using an adaptive vertical threshold.
        """
        if len(boxes) == 0:
            return []

        # Sort boxes primarily by y-coordinate (top-to-bottom)
        boxes = boxes[boxes[:, 1].argsort()]
        
        lines = []
        if len(boxes) > 0:
            current_line = [boxes[0]]
            avg_height = np.mean(boxes[:, 3] - boxes[:, 1])
            v_threshold = avg_height * h_threshold_ratio

            for i in range(1, len(boxes)):
                prev_box = current_line[-1]
                curr_box = boxes[i]
                
                # If the vertical distance between the current box and the last box in the line 
                # is less than the threshold, they belong to the same line.
                if abs(curr_box[1] - prev_box[1]) < v_threshold:
                    current_line.append(curr_box)
                else:
                    # Sort the current line by x-coordinate (left-to-right)
                    current_line.sort(key=lambda x: x[0])
                    lines.append(current_line)
                    current_line = [curr_box]
            
            # Add the last line
            current_line.sort(key=lambda x: x[0])
            lines.append(current_line)
            
        return lines

    def refine_regions(self, image, boxes, padding=5):
        """
        Crops and pads detected regions for recognition.
        """
        crops = []
        h, w = image.shape[:2]
        
        for box in boxes:
            x1, y1, x2, y2 = map(int, box[:4])
            
            # Apply padding
            x1 = max(0, x1 - padding)
            y1 = max(0, y1 - padding)
            x2 = min(w, x2 + padding)
            y2 = min(h, y2 + padding)
            
            crop = image[y1:y2, x1:x2]
            crops.append(crop)
            
        return crops

# YOLO vs CRAFT:
# 1. Global Context: YOLO (v8/v11) uses a global receptive field, making it more robust 
#    to fragmented handwriting compared to CRAFT's local affinity-based heatmaps.
# 2. End-to-End: YOLO can be trained to detect both 'word' and 'line' classes simultaneously, 
#    providing better structural understanding of the prescription.
# 3. NMS: Standard Non-Maximum Suppression (NMS) in YOLO handles overlapping boxes 
#    more gracefully than CRAFT's post-processing.
