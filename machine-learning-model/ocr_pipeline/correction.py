import pandas as pd
import re
from thefuzz import process, fuzz
from Levenshtein import distance as levenshtein_distance


class MedicineCorrector:
    def __init__(self, db_path="medicine_db.xlsx"):
        print("Loading medicine database...")

        try:
            df = pd.read_excel(db_path)

            # -------------------------------
            # FLEXIBLE COLUMN DETECTION
            # -------------------------------
            possible_cols = ["Medicine Name", "name", "medicine"]
            col = None

            for c in possible_cols:
                if c in df.columns:
                    col = c
                    break

            if col is None:
                raise ValueError("No valid medicine column found")

            meds = df[col].dropna().astype(str)

            # -------------------------------
            # STORE FULL + CORE MAPS
            # -------------------------------
            self.norm_to_original = {}
            self.core_to_original = {}

            for m in meds:
                original = m.strip()
                norm = self._normalize(original)

                if not norm:
                    continue

                core = self._extract_core(norm)

                self.norm_to_original[norm] = original
                self.core_to_original[core] = original

            self.full_list = list(self.norm_to_original.keys())
            self.core_list = list(self.core_to_original.keys())
            self.medicine_list = list(self.norm_to_original.values())

            print(f"Loaded {len(self.full_list)} medicines")

        except Exception as e:
            print(f"Error loading medicine database: {e}")
            self.full_list = []
            self.core_list = []
            self.medicine_list = []
            self.norm_to_original = {}
            self.core_to_original = {}

    # -------------------------------
    # CLEAN OCR TEXT
    # -------------------------------
    def _clean_ocr_text(self, text):
        text = text.lower()

        # remove mixed tokens like xtc911
        text = re.sub(r'\b[a-z]*\d+[a-z]*\b', ' ', text)

        # remove small junk tokens (1–2 chars)
        text = re.sub(r'\b[a-z]{1,2}\b', ' ', text)

        # remove symbols
        text = re.sub(r'[^a-z\s]', ' ', text)

        # normalize spaces
        text = re.sub(r'\s+', ' ', text).strip()

        return text

    # -------------------------------
    # NORMALIZATION
    # -------------------------------
    def _normalize(self, text):
        text = text.lower().strip()
        text = re.sub(r'[^a-z\s]', '', text)
        text = re.sub(r'\s+', ' ', text)
        return text

    # -------------------------------
    # CORE TOKEN EXTRACTION
    # -------------------------------
    def _extract_core(self, text):
        tokens = text.split()

        tokens = [t for t in tokens if len(t) >= 4]

        if not tokens:
            return text

        tokens.sort(key=lambda x: (-len(x), x))
        return tokens[0]

    # -------------------------------
    # VALID CHECK
    # -------------------------------
    def _is_valid(self, text):
        if len(text) < 4:
            return False
        if any(c.isdigit() for c in text):
            return False
        return True

    # -------------------------------
    # MATCH (FULL + CORE)
    # -------------------------------
    def _match(self, text):
        core = self._extract_core(text)

        # FULL MATCH
        full_matches = process.extract(
            text,
            self.full_list,
            scorer=fuzz.partial_ratio,
            limit=2
        )

        # CORE MATCH
        core_matches = process.extract(
            core,
            self.core_list,
            scorer=fuzz.partial_ratio,
            limit=2
        )

        best_full = full_matches[0] if full_matches else (None, 0)
        best_core = core_matches[0] if core_matches else (None, 0)

        # choose better
        if best_core[1] > best_full[1]:
            best, score = best_core
            second = core_matches[1][1] if len(core_matches) > 1 else 0
            source = "core"
        else:
            best, score = best_full
            second = full_matches[1][1] if len(full_matches) > 1 else 0
            source = "full"

        return best, score, second, source

    # -------------------------------
    # MAIN CORRECTION (SAFE VERSION)
    # -------------------------------
    def correct(self, text, threshold=75):

        if not text:
            return text, False

        if not self.full_list:
            return text, False

        # REMOVE UNCERTAIN TAG
        text = text.replace("[UNCERTAIN:", "").replace("]", "")
        raw = text.strip()

        # CLEAN OCR
        cleaned = self._clean_ocr_text(raw)
        if not cleaned:
            return raw, False

        norm = self._normalize(cleaned)

        if not self._is_valid(norm):
            return raw, False

        best, score, second, source = self._match(norm)

        if not best:
            return raw, False

        # -------------------------------
        # STRICT AMBIGUITY CHECK
        # -------------------------------
        if second > 0 and (score - second) < 5:
            return raw, False

        # -------------------------------
        # LENGTH SIMILARITY CHECK
        # -------------------------------
        core = self._extract_core(norm)

        if abs(len(core) - len(best)) > 4:
            return raw, False

        # -------------------------------
        # EDIT DISTANCE CHECK
        # -------------------------------
        dist = levenshtein_distance(core, best)

        # -------------------------------
        # MAIN ACCEPTANCE
        # -------------------------------
        if score >= threshold and dist <= 3:
            if source == "core":
                return self.core_to_original.get(best, raw), True
            else:
                return self.norm_to_original.get(best, raw), True

        # -------------------------------
        # LIMITED FALLBACK (SAFE)
        # -------------------------------
        if score >= 78 and dist <= 2:
            return self.norm_to_original.get(best, raw), True

        return raw, False

    # -------------------------------
    # APPLY TO PIPELINE
    # -------------------------------
    def apply_correction(self, fused_results):
        for item in fused_results:
            text = item.get("text", "")

            corrected, flag = self.correct(text)

            item["text"] = corrected
            item["corrected"] = flag

        return fused_results