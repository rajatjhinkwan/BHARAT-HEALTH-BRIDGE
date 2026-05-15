import json
import openai # Assuming OpenAI or compatible LLM API

class LLMContextCorrector:
    """
    Final layer of the OCR pipeline using LLM for contextual correction and structured output.
    """
    def __init__(self, api_key=None, model="gpt-4o-mini"):
        self.client = openai.OpenAI(api_key=api_key) if api_key else None
        self.model = model

    def get_structured_prompt(self, ocr_text):
        """
        Generates a prompt for the LLM with instructions to correct and structure OCR output.
        """
        return f"""
        You are a medical document expert. Your task is to correct OCR errors in a handwritten prescription 
        and output a structured JSON object.
        
        OCR TEXT:
        \"\"\"{ocr_text}\"\"\"
        
        INSTRUCTIONS:
        1. Correct spelling of medicine names (e.g., 'Paracetmol' -> 'Paracetamol').
        2. Correct dosage (e.g., 'S00mg' -> '500 mg').
        3. Standardize frequency (e.g., 'twice daily' or 'BD').
        4. Find the standard generic equivalent for each branded medicine (e.g., 'Crocin' -> 'Paracetamol').
        5. Extract: medicine (branded), generic_equivalent, dosage, frequency, duration.
        6. If multiple medicines are present, output a list of JSON objects.
        
        OUTPUT FORMAT (JSON):
        [
            {{
                "medicine": "...",
                "generic_equivalent": "...",
                "dosage": "...",
                "frequency": "...",
                "duration": "..."
            }}
        ]
        """

    def correct_and_structure(self, ocr_text):
        """
        Calls the LLM API to get corrected and structured JSON output.
        """
        if not self.client:
            print("Warning: OpenAI API key not provided. Returning mock response.")
            # Return a mock response based on common patterns in OCR text
            mock_data = []
            lines = ocr_text.split('\n')
            for line in lines:
                if line.strip():
                    mock_data.append({
                        "medicine": line.strip(),
                        "generic_equivalent": "Generic " + line.strip(),
                        "dosage": "500 mg",
                        "frequency": "twice daily",
                        "duration": "5 days"
                    })
            return mock_data
            
        prompt = self.get_structured_prompt(ocr_text)
        
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a professional medical assistant specialized in OCR error correction."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)

# Why LLM for final layer?
# 1. Semantic Context: LLMs understand that 'Paracetamol' is often prescribed with '500 mg', 
#    allowing them to correct errors that visual models cannot (e.g., 'S00' vs '500').
# 2. Ambiguity Resolution: If the OCR text is "BD x 5", the LLM knows "BD" is a frequency 
#    and "5" is a duration, correctly mapping them even without explicit rules.
# 3. Standardization: Automatically converts varied shorthand (BID, BD, twice a day) into 
#    a canonical format for database entry.
