import os
import base64
import requests
import json
import re
import tempfile
from datetime import datetime, date

from PIL import Image, ImageEnhance, ImageFilter


# ==========================
# CONFIG
# ==========================

OLLAMA_URL = "http://localhost:11434/api/generate"

OCR_MODEL = "glm-ocr"
EXTRACT_MODEL = "llava"


SUPPORTED_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".bmp",
    ".tiff",
    ".webp"
}



# ==========================
# IMAGE PREPROCESS
# ==========================

def preprocess_image(path, output):

    img = Image.open(path)

    img = img.convert("RGB")

    img = img.resize(
        (
            img.width * 2,
            img.height * 2
        )
    )


    img = ImageEnhance.Contrast(
        img
    ).enhance(1.5)


    img = img.filter(
        ImageFilter.SHARPEN
    )


    img.save(output)




# ==========================
# IMAGE TO BASE64
# ==========================

def load_image_base64(path):

    with open(path,"rb") as f:

        return base64.b64encode(
            f.read()
        ).decode("utf-8")




# ==========================
# OCR PROMPT
# ==========================

OCR_PROMPT = """

Extract all visible text from this medicine image.

Rules:

- Return ONLY text.
- No explanation.
- No markdown.
- Keep drug names exactly.
- Keep numbers.
- Keep dates.
- Keep dosage.
- Keep expiry information.

"""




# ==========================
# RUN GLM OCR
# ==========================

def run_ocr(image):

    payload = {

        "model": OCR_MODEL,

        "prompt": OCR_PROMPT,
        "images":[
            image
        ],

        "stream":False,

        "options":{

            "temperature":0,

            "top_k":1,

            "top_p":0.01,

            "num_predict":500

        }

    }


    response = requests.post(
        OLLAMA_URL,
        json=payload
    )


    if response.status_code != 200:
        return ""


    return response.json()["response"]




# ==========================
# CLEAN OCR
# ==========================

def clean_text(text):

    text = text.replace(
        "```",
        ""
    )


    lines=[]


    for line in text.splitlines():

        line=line.strip()

        if line:

            lines.append(line)


    return "\n".join(lines)




# ==========================
# MEDICINE EXTRACTION PROMPT
# ==========================

def create_extract_prompt(ocr):

    return f"""
Extract medicine data.

OCR:
{ocr}

Return ONLY this JSON object:

{{
"drug_name": null,
"strength": null,
"expiry_date": null
}}

Rules:
- No explanation.
- No markdown.
- No text before JSON.
- No text after JSON.

Mapping:
- Medicine name -> drug_name
- Dosage like 80mg -> strength
- UAV or EXP date -> expiry_date
- If only month/year is visible, use the first day of that month.

Date format:
YYYY-MM-01

Example:

Input:
AMOXICILLIN 500mg
EXP 15/08/2027

Output:
{{
"drug_name":"Amoxicillin",
"strength":"500mg",
"expiry_date":"2027-08-15"
}}

Now extract from the OCR.
"""


# ==========================
# EXTRACT JSON
# ==========================

def extract_medicine(ocr_text):


    prompt = create_extract_prompt(
        ocr_text
    )

    payload={

        "model": EXTRACT_MODEL,

        "prompt": prompt,

        "stream": False,

        "format": "json",

        "options": {

            "temperature": 0,

            "top_k": 1,

            "top_p": 0.01

        }

    }


    response=requests.post(
        OLLAMA_URL,
        json=payload
    )



    if response.status_code !=200:
        return {}


    result=response.json()["response"]
    



    result = re.sub(
        r"```json|```|markdown",
        "",
        result,
        flags=re.IGNORECASE
    ).strip()


    start = result.find("{")
    end = result.rfind("}")

    if start != -1 and end != -1:
        result = result[start:end+1]


    try:

        data = json.loads(result)

        expiry_date = normalize_expiry_date(data.get("expiry_date"))
        if expiry_date:
            data["expiry_date"] = expiry_date

        return data


    except json.JSONDecodeError as e:
        print("\nJSON ERROR:")
        print(e)
        print("\nReturned text:")
        print(result)
        return {}


def normalize_expiry_date(value):

    if not isinstance(value, str):
        return None

    value = value.strip()
    if not value:
        return None

    for pattern, formatter in (
        (r"^(\d{4})-(\d{2})-(\d{2})$", lambda m: f"{m.group(1)}-{m.group(2)}-{m.group(3)}"),
        (r"^(\d{4})-(\d{2})$", lambda m: f"{m.group(1)}-{m.group(2)}-01"),
        (r"^(\d{2})/(\d{4})$", lambda m: f"{m.group(2)}-{m.group(1)}-01"),
        (r"^(\d{4})/(\d{2})$", lambda m: f"{m.group(1)}-{m.group(2)}-01"),
        (r"^(\d{2})-(\d{4})$", lambda m: f"{m.group(2)}-{m.group(1)}-01"),
    ):
        match = re.match(pattern, value)
        if match:
            return formatter(match)

    return value


def determine_inventory_status(expiry_date):

    normalized = normalize_expiry_date(expiry_date)
    if not normalized:
        return "REJECTED (INVALID/NO DATE)"

    try:
        expiry = datetime.strptime(normalized, "%Y-%m-%d").date()
    except ValueError:
        return "REJECTED (INVALID/NO DATE)"

    today = date.today()
    if expiry >= today:
        return "APPROVED (IN STOCK)"
    return "REJECTED (EXPIRED)"





# ==========================
# MAIN FUNCTION
# ==========================

def analyze_medicine_image(path):


    if not os.path.exists(path):

        return {"error": f"Image not found: {path}"}



    ext=os.path.splitext(path)[1].lower()


    if ext not in SUPPORTED_EXTENSIONS:

        return {"error": f"Unsupported image type: {ext or 'unknown'}"}


    working_path = path
    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as handle:
            temp_path = handle.name

        preprocess_image(path, temp_path)
        working_path = temp_path
    except Exception:
        working_path = path


    image=load_image_base64(
        working_path
    )


    raw_text=run_ocr(
        image
    )



    ocr_text=clean_text(
        raw_text
    )


    medicine=extract_medicine(
        ocr_text
    )

    if temp_path and os.path.exists(temp_path):
        try:
            os.remove(temp_path)
        except OSError:
            pass

    if not medicine:
        return {"error": "Failed to extract medicine data"}

    medicine.setdefault("drug_name", "UNKNOWN")
    medicine.setdefault("strength", "N/A")
    medicine["expiry_date"] = normalize_expiry_date(medicine.get("expiry_date")) or "UNKNOWN"
    medicine["inventory_status"] = determine_inventory_status(medicine.get("expiry_date"))


    return medicine

    medicine.setdefault("drug_name", "UNKNOWN")
    medicine.setdefault("strength", "N/A")
    medicine["expiry_date"] = normalize_expiry_date(medicine.get("expiry_date")) or "UNKNOWN"
    medicine["inventory_status"] = determine_inventory_status(medicine.get("expiry_date"))


    return medicine
# ==========================
# TEST
# ==========================

if __name__ == "__main__":

    import sys

    if len(sys.argv) < 2:
        print(json.dumps({"error": "Usage: pharmacy.py <image_path>"}, ensure_ascii=False))
        sys.exit(1)

    image_path = sys.argv[1]

    result = analyze_medicine_image(image_path)

    if not result or result.get("error"):
        print(json.dumps(result or {"error": "Failed to analyze image"}, ensure_ascii=False))
        sys.exit(1)

    print("\nFINAL JSON:")
    print(
        json.dumps(
            result,
            indent=4,
            ensure_ascii=False
        )
    )