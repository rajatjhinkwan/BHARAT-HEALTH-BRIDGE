import torch
import numpy as np
from PIL import Image
from torchvision import transforms


class PARSeqRecognizer:
    def __init__(self, device="cpu"):
        self.device = device
        self.model = None

        try:
            # -------------------------------
            # LOAD FROM TORCH HUB (CORRECT)
            # -------------------------------
            self.model = torch.hub.load(
                'baudm/parseq',
                'parseq',
                pretrained=True,
                trust_repo=True,
            ).eval().to(device)

            # -------------------------------
            # TRANSFORM
            # -------------------------------
            self.transform = transforms.Compose([
                transforms.Resize((32, 128)),
                transforms.ToTensor(),
                transforms.Normalize(0.5, 0.5)
            ])

            print("PARSeq ACTIVE (torch hub)")

        except Exception as e:
            print("PARSeq load failed:", e)
            self.model = None

    # -------------------------------
    # SAFE IMAGE
    # -------------------------------
    def _prepare(self, roi):
        if roi is None or roi.size == 0:
            return None

        if len(roi.shape) == 2:
            roi = np.stack([roi] * 3, axis=-1)

        if roi.shape[-1] == 1:
            roi = np.repeat(roi, 3, axis=-1)

        return roi

    # -------------------------------
    # MAIN RECOGNITION (BATCHED)
    # -------------------------------
    def recognize(self, rois):
        """
        Supports both single ROI and list of ROIs.
        """
        if self.model is None:
            return []

        if not isinstance(rois, list):
            rois = [rois]

        try:
            batch_images = []
            for roi in rois:
                roi = self._prepare(roi)
                if roi is None:
                    continue
                img = Image.fromarray(roi).convert("RGB")
                batch_images.append(self.transform(img))

            if not batch_images:
                return []

            imgs = torch.stack(batch_images).to(self.device)

            with torch.no_grad():
                logits = self.model(imgs)

            probs = logits.softmax(-1)
            preds = self.model.tokenizer.decode(probs)

            results = []
            for i, pred in enumerate(preds):
                # Ensure text is a string
                text = str(pred) if not isinstance(pred, (list, tuple)) else str(pred[0])
                # Calculate mean confidence for the predicted sequence
                conf = float(probs[i].max(dim=-1).values.mean().item())
                results.append((text.strip(), conf))

            return results

        except Exception as e:
            print("PARSeq inference error:", e)
            return []