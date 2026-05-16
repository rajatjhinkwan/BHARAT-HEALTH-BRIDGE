import re
from difflib import get_close_matches
import jellyfish  # For Soundex and Metaphone

class MedicalPostProcessor:
    """
    Intelligent post-processing for medical prescriptions including medicine matching,
    regex corrections, and contextual rules.
    """
    def __init__(self, medicine_db=None):
        # Mock database of medicines
        self.medicine_db = medicine_db if medicine_db else [
            "Paracetamol", "Amoxicillin", "Ibuprofen", "Metformin", "Atorvastatin",
            "Amlodipine", "Omeprazole", "Losartan", "Albuterol", "Gabapentin"
        ]
        self.medicine_db_phonetic = {jellyfish.metaphone(m): m for m in self.medicine_db}

    def match_medicine(self, text, threshold=0.8):
        """
        Matches recognized text against a medicine database using Levenshtein and Metaphone.
        """
        text = text.capitalize().strip()
        
        # 1. Exact Match
        if text in self.medicine_db:
            return text
            
        # 2. Levenshtein Matching
        matches = get_close_matches(text, self.medicine_db, n=1, cutoff=threshold)
        if matches:
            return matches[0]
            
        # 3. Phonetic Matching (Metaphone)
        text_metaphone = jellyfish.metaphone(text)
        if text_metaphone in self.medicine_db_phonetic:
            return self.medicine_db_phonetic[text_metaphone]
            
        return text

    def apply_regex_corrections(self, text):
        """
        Applies regex rules for common medical abbreviations and formats.
        """
        # Frequency mappings
        freq_map = {
            r'\bBD\b': 'twice daily',
            r'\bOD\b': 'once daily',
            r'\bTDS\b': 'thrice daily',
            r'\bQDS\b': 'four times daily',
            r'\bHS\b': 'at bedtime',
            r'\bPRN\b': 'as needed'
        }
        
        for pattern, replacement in freq_map.items():
            text = re.sub(pattern, replacement, text, flags=re.IGNORECASE)
            
        # Dosage patterns (e.g., "500mg" -> "500 mg")
        text = re.sub(r'(\d+)\s*(mg|ml|tab|cap|g)\b', r'\1 \2', text, flags=re.IGNORECASE)
        
        return text

    def contextual_rules(self, tokens):
        """
        Applies rules based on neighboring tokens.
        """
        refined_tokens = []
        for i, token in enumerate(tokens):
            # If word near "mg/ml" -> must be numeric (correcting common OCR errors like 'O' for '0')
            if i + 1 < len(tokens) and tokens[i+1].lower() in ["mg", "ml", "g"]:
                token = token.replace('O', '0').replace('o', '0').replace('I', '1').replace('l', '1')
                
            # If word follows "tab" or "cap" -> likely a medicine (handled by match_medicine)
            refined_tokens.append(token)
            
        return refined_tokens

    def process_line(self, raw_text):
        """
        Full post-processing pipeline for a single line of OCR text.
        """
        # 1. Regex corrections
        text = self.apply_regex_corrections(raw_text)
        
        # 2. Tokenize and apply contextual rules
        tokens = text.split()
        tokens = self.contextual_rules(tokens)
        
        # 3. Medicine matching for potential medicine tokens
        # (Assuming the first word or words near 'tab/cap' are medicines)
        processed_tokens = []
        for token in tokens:
            if len(token) > 3: # Only match longer words as medicines
                processed_tokens.append(self.match_medicine(token))
            else:
                processed_tokens.append(token)
                
        return " ".join(processed_tokens)

# Technical Justification:
# - Metaphone: Superior to Soundex for English as it handles complex consonant clusters better.
# - Regex: Fixes systematic OCR errors in units and frequencies which are highly predictable.
# - Contextual Rules: Leverages domain knowledge (e.g., units always follow numbers) to correct 
#   ambiguous characters (O vs 0).
