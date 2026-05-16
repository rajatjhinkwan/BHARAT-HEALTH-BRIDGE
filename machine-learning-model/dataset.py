import os
import torch
from torch.utils.data import Dataset
from PIL import Image

class IAMDataset(Dataset):
    def __init__(self, root_dir, df, processor, max_target_length=128):
        self.root_dir = root_dir
        self.df = df
        self.processor = processor
        self.max_target_length = max_target_length

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        # get file name and text
        file_name = self.df['file_name'][idx]
        text = self.df['text'][idx]
        
        # get image path (IAM structure is words/a01/a01-000/a01-000-00-00.png)
        parts = file_name.split('-')
        image_path = os.path.join(self.root_dir, 'words', parts[0], parts[0] + '-' + parts[1], file_name + '.png')
        
        # load image and convert to RGB
        try:
            image = Image.open(image_path).convert("RGB")
        except FileNotFoundError:
            # Handle missing files (common in IAM depending on how it's extracted)
            return self.__getitem__((idx + 1) % len(self))
            
        # process image
        pixel_values = self.processor(image, return_tensors="pt").pixel_values
        
        # process labels
        labels = self.processor.tokenizer(text, 
                                          padding="max_length", 
                                          max_length=self.max_target_length).input_ids
        
        # important: make sure that PAD tokens are ignored by the loss function
        labels = [label if label != self.processor.tokenizer.pad_token_id else -100 for label in labels]

        encoding = {"pixel_values": pixel_values.squeeze(), "labels": torch.tensor(labels)}
        return encoding

def parse_iam_words_txt(words_txt_path):
    """
    Parse the IAM words.txt file.
    """
    import pandas as pd
    data = []
    with open(words_txt_path, 'r') as f:
        for line in f:
            if not line.startswith('#'):
                parts = line.split()
                if parts[1] == 'ok': # only use 'ok' words
                    file_name = parts[0]
                    text = parts[-1]
                    data.append({'file_name': file_name, 'text': text})
    
    return pd.DataFrame(data)
