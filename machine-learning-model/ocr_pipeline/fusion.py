from thefuzz import fuzz, process
import re


# -------------------------------
# NORMALIZATION
# -------------------------------
def normalize(text):
    return text.lower().strip()


# -------------------------------
# MEDICAL VALIDITY FILTER
# -------------------------------
def is_medical_like(text):
    if not text:
        return False

    # remove obvious garbage
    if any(char.isdigit() for char in text):
        return False

    if len(text) < 3:
        return False

    # too many tiny tokens → junk
    tokens = text.split()
    if sum(len(t) <= 2 for t in tokens) > 1:
        return False

    return True


# -------------------------------
# CLUSTERING
# -------------------------------
def similarity(a, b):
    return fuzz.ratio(a, b)


def cluster_candidates(candidates, threshold=82):
    clusters = []

    for cand in candidates:
        text = normalize(cand["text"])
        placed = False

        for cluster in clusters:
            rep = cluster[0]["text"]

            if similarity(text, rep) >= threshold:
                cluster.append(cand)
                placed = True
                break

        if not placed:
            clusters.append([cand])

    return clusters


# -------------------------------
# CLUSTER SCORING
# -------------------------------
def score_cluster(cluster, medicine_list):
    texts = [c["text"] for c in cluster]

    # average OCR confidence
    avg_conf = sum(c["conf"] for c in cluster) / len(cluster)

    # agreement boost
    agreement = len(cluster)

    # dictionary similarity boost
    med_score = 0
    for t in texts:
        match = process.extractOne(t, medicine_list)
        if match:
            med_score = max(med_score, match[1] / 100)

    # 🔥 FINAL SCORE FORMULA
    score = (
        avg_conf * 0.5 +
        agreement * 0.15 +
        med_score * 0.7
    )

    return score, med_score


# -------------------------------
# BEST TEXT SELECTION
# -------------------------------
def select_best(cluster, medicine_list):
    best_candidate = max(cluster, key=lambda x: x["conf"])
    text = best_candidate["text"]

    # 🔥 FORCE DICTIONARY ALIGNMENT
    match = process.extractOne(text, medicine_list)

    if match and match[1] >= 75:
        return match[0], best_candidate["conf"]

    return text, best_candidate["conf"]


# -------------------------------
# MAIN FUSION FUNCTION
# -------------------------------
def fuse_results(recognition_results, medicine_list, conf_threshold=0.55):
    fused_results = []

    for item in recognition_results:
        candidates = item.get("candidates", [])
        bbox = item.get("bbox", None)

        # -------------------------------
        # FILTER VALID CANDIDATES
        # -------------------------------
        valid = []

        for c in candidates:
            text = normalize(c.get("text", ""))

            if not text:
                continue

            if not is_medical_like(text):
                continue

            valid.append({
                "text": text,
                "conf": c.get("conf", 0),
                "model": c.get("model", "")
            })

        # -------------------------------
        # NO VALID TEXT
        # -------------------------------
        if not valid:
            fused_results.append({
                "text": "[UNCERTAIN]",
                "confidence": 0.0,
                "bbox": bbox,
                "corrected": False
            })
            continue

        # -------------------------------
        # CLUSTER
        # -------------------------------
        clusters = cluster_candidates(valid)

        scored = []

        for cluster in clusters:
            score, med_score = score_cluster(cluster, medicine_list)
            scored.append((cluster, score, med_score))

        scored.sort(key=lambda x: x[1], reverse=True)

        best_cluster, best_score, best_med = scored[0]

        # -------------------------------
        # SECOND CLUSTER CHECK
        # -------------------------------
        if len(scored) > 1:
            second_score = scored[1][1]

            if abs(best_score - second_score) < 0.15:
                best_text = best_cluster[0]["text"]
                fused_results.append({
                    "text": f"[UNCERTAIN:{best_text}]",
                    "confidence": round(best_cluster[0]["conf"], 3),
                    "bbox": bbox,
                    "corrected": False
                })
                continue

        # -------------------------------
        # FINAL TEXT
        # -------------------------------
        best_text, best_conf = select_best(best_cluster, medicine_list)

        # -------------------------------
        # LOW CONFIDENCE FILTER
        # -------------------------------
        if best_conf < conf_threshold and best_med < 0.6:
            best_text = f"[UNCERTAIN:{best_text}]"

        fused_results.append({
            "text": best_text,
            "confidence": round(best_conf, 3),
            "bbox": bbox,
            "corrected": best_med > 0.7
        })

    return fused_results