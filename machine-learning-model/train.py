import os
import torch
import pandas as pd
from transformers import TrOCRProcessor, VisionEncoderDecoderModel, Trainer, TrainingArguments, default_data_collator
from dataset import IAMDataset, parse_iam_words_txt
from sklearn.model_selection import train_test_split

def train_iam_model(root_dir, words_txt_path, output_dir="trained_model"):
    """
    Main training script for fine-tuning TrOCR on IAM Handwriting Dataset.
    """
    # Load and split dataset
    df = parse_iam_words_txt(words_txt_path)
    train_df, val_df = train_test_split(df, test_size=0.1)
    train_df.reset_index(drop=True, inplace=True)
    val_df.reset_index(drop=True, inplace=True)
    
    # Initialize processor and model
    model_name = "microsoft/trocr-base-handwritten"
    processor = TrOCRProcessor.from_pretrained(model_name)
    model = VisionEncoderDecoderModel.from_pretrained(model_name)
    
    # Configuration
    model.config.decoder_start_token_id = processor.tokenizer.cls_token_id
    model.config.pad_token_id = processor.tokenizer.pad_token_id
    model.config.vocab_size = model.config.decoder.vocab_size
    
    # beam search settings
    model.config.eos_token_id = processor.tokenizer.sep_token_id
    model.config.max_length = 64
    model.config.early_stopping = True
    model.config.no_repeat_ngram_size = 3
    model.config.length_penalty = 2.0
    model.config.num_beams = 4
    
    # Datasets
    train_dataset = IAMDataset(root_dir=root_dir, df=train_df, processor=processor)
    val_dataset = IAMDataset(root_dir=root_dir, df=val_df, processor=processor)
    
    # Training Arguments
    training_args = TrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        predict_with_generate=True,
        evaluation_strategy="steps",
        num_train_epochs=3,
        logging_steps=500,
        save_steps=1000,
        eval_steps=1000,
        warmup_steps=500,
        learning_rate=5e-5,
        fp16=torch.cuda.is_available(), # Use FP16 if GPU is available
        push_to_hub=False,
    )
    
    # Initialize Trainer
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        data_collator=default_data_collator,
        tokenizer=processor.feature_extractor,
    )
    
    # Start training
    trainer.train()
    
    # Save the fine-tuned model
    trainer.save_model(output_dir)
    processor.save_pretrained(output_dir)
    print(f"Model saved to {output_dir}")

if __name__ == "__main__":
    # Example usage:
    # train_iam_model(root_dir="path/to/iam", words_txt_path="path/to/iam/words.txt")
    pass
