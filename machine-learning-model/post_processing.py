import pandas as pd
import os
import Levenshtein as lev
import re

class MedicineCorrector:
    def __init__(self, db_path="medicine_db.xlsx"):
        self.medicine_names = []
        if os.path.exists(db_path):
            try:
                df = pd.read_excel(db_path)
                column_name = 'name' if 'name' in df.columns else df.columns[0]
                self.medicine_names = df[column_name].dropna().astype(str).str.lower().tolist()
                print(f"✓ Loaded {len(self.medicine_names)} medicine names from database.")
            except Exception as e:
                print(f"⚠ Error loading medicine database: {e}")
        else:
            print(f"⚠ Medicine database not found at {db_path}")

    def clean_time_and_math(self, text):
        """
        Regex-based cleaning for time, math numbers, and symbols.
        """
        if not text: return ""
        
        # 1. Standardize AM/PM (Fix common OCR duplicates like "PM PM")
        text = re.sub(r'(?i)\b(AM|PM)\s+\1\b', r'\1', text)
        text = re.sub(r'(?i)\b([0-1]?[0-9]|2[0-3])[:. ]?([0-5][0-9])?\s?(am|pm|rn|prn)\b', 
                      lambda m: f"{m.group(1)}:{m.group(2) if m.group(2) else '00'} {m.group(3).upper()}", text)
        
        # 2. Standardize math symbols
        text = text.replace('+', ' + ').replace('/', ' / ')
        text = re.sub(r'\s+', ' ', text).strip()
        
        # 3. Recognize arrows
        text = re.sub(r'(->|-->|=>|==>)', '→', text)
        
        # 4. Remove OCR noise like trailing dots after common words
        text = re.sub(r'\s+\.', '.', text)
        
        return text

    def ensemble_correct(self, ensemble_results, threshold=0.55):
        """
        Ensemble Selection Method:
        Picks the best result between TrOCR and EasyOCR based on medical DB confidence.
        """
        trocr_text = ensemble_results.get("trocr", "")
        easyocr_text = ensemble_results.get("easyocr", "")
        
        # Pre-clean
        trocr_clean = self.clean_time_and_math(trocr_text)
        easyocr_clean = self.clean_time_and_math(easyocr_text)
        
        def get_best_db_score(text):
            if not text: return None, 0
            # Split into tokens for multi-word regions
            tokens = text.split()
            total_score = 0
            corrected_tokens = []
            
            for token in tokens:
                token_low = token.strip(" .,-!@#$%^&*()_+=").lower()
                
                # Ignore units and numbers
                if re.match(r'^[0-9]+(\.[0-9]+)?(mg|ml|g|mcg|tab|cap)?$', token_low) or \
                   token_low in ['am', 'pm', 'x', '+', '/', '→']:
                    corrected_tokens.append(token)
                    continue
                
                if token_low in self.medicine_names:
                    corrected_tokens.append(token_low.capitalize())
                    total_score += 1.0
                    continue
                
                best_m = None
                max_r = 0
                for med in self.medicine_names:
                    r = lev.ratio(token_low, med)
                    if r > max_r:
                        max_r = r
                        best_m = med
                
                if max_r >= threshold:
                    corrected_tokens.append(best_m.capitalize())
                    total_score += max_r
                else:
                    corrected_tokens.append(token)
            
            avg_score = total_score / len(tokens) if tokens else 0
            return " ".join(corrected_tokens), avg_score

        trocr_res, trocr_score = get_best_db_score(trocr_clean)
        easy_res, easy_score = get_best_db_score(easyocr_clean)
        
        # Decision: 
        # Trust the one with the higher medicine DB score
        if easy_score > trocr_score + 0.15:
            return easy_res
        
        # TrOCR is generally better for handwriting grammar/context
        return trocr_res

    def correct(self, text):
        return self.clean_time_and_math(text)

def apply_medicine_post_processing(results, corrector):
    for item in results:
        if item.get("is_shape", False):
            continue
            
        ensemble_data = item["text"]
        if isinstance(ensemble_data, dict):
            item["text"] = corrector.ensemble_correct(ensemble_data)
        else:
            item["text"] = corrector.correct(item["text"])
            
    return results
