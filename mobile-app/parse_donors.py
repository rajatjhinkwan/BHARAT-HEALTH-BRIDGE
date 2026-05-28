import re
import json

donors = []
with open('c:/Users/rajat/Desktop/MAJOR PROJECT/mobile-app/donors.txt', 'r') as f:
    for line in f:
        line = line.strip()
        if not line: continue
        parts = re.split(r'\t+', line)
        if len(parts) >= 5 and re.match(r'^\d+\.', parts[0]):
            try:
                donor = {
                    'id': parts[0].replace('.', '').strip(),
                    'name': parts[1].strip(),
                    'phone': parts[2].strip(),
                    'district': parts[3].strip(),
                    'city': parts[4].strip(),
                    'bloodType': parts[5].split(',')[0].strip() if len(parts) > 5 else '',
                    'distanceKm': str(round(0.5 + float(parts[0].replace('.',''))*0.01, 1)), # fake distance
                    'verified': True
                }
                donors.append(donor)
            except Exception as e:
                pass

js_code = "export const BLOOD_DONORS = " + json.dumps(donors, indent=2) + ";\n"
with open('c:/Users/rajat/Desktop/MAJOR PROJECT/mobile-app/constants/bloodDonors.js', 'w') as f:
    f.write(js_code)

print(f"Parsed {len(donors)} donors.")
