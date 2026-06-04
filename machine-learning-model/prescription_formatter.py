import re


def _clean_line(text):
    if not text:
        return ""
    text = text.replace("[UNCERTAIN:", "").replace("]", "").strip()
    if text in ("[UNCERTAIN]", ""):
        return ""
    return text


def _parse_dosage_frequency(text):
    dosage = None
    frequency = None
    duration = None

    mg = re.search(r"(\d+)\s*mg", text, re.I)
    if mg:
        dosage = f"{mg.group(1)} mg"

    for pattern, label in [
        (r"\b(tds|tid|thrice|three times)\b", "TDS"),
        (r"\b(bd|bid|twice)\b", "BD"),
        (r"\b(od|once daily)\b", "OD"),
        (r"\b(sos|prn)\b", "PRN"),
    ]:
        if re.search(pattern, text, re.I):
            frequency = label
            break

    days = re.search(r"(\d+)\s*(days?|d)\b", text, re.I)
    if days:
        duration = f"{days.group(1)} days"

    return dosage, frequency, duration


def format_for_prescription_api(genocr_results):
    """
    Convert Genocr fused/corrected region output into the mobile app API shape.
    """
    medicines = []

    for item in genocr_results or []:
        text = _clean_line(item.get("text", ""))
        if not text:
            continue

        dosage, frequency, duration = _parse_dosage_frequency(text.lower())

        medicines.append({
            "medicine": text,
            "generic_equivalent": text,
            "dosage": dosage or "As prescribed",
            "frequency": frequency or "As directed",
            "duration": duration or "As directed",
            "confidence": item.get("confidence", 0.0),
            "corrected": bool(item.get("corrected", False)),
        })

    if not medicines:
        return [{
            "medicine": "Could not read prescription",
            "generic_equivalent": "Please retry with a clearer photo",
            "dosage": "—",
            "frequency": "—",
            "duration": "—",
        }]

    return medicines
