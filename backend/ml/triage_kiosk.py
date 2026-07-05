

import time
import json
import sys
import subprocess
import threading
import logging
from datetime import datetime

import cv2
import pyttsx3
import speech_recognition as sr
import joblib
import requests
from flask import Flask, request, jsonify

# ---------------- Config ----------------
MODEL_PATH = "triage_rf_model_v2.pkl"
DASHBOARD_URL = "http://localhost:5000/api/result"
CAMERA_INDEX = 0
CONFIRM_FRAMES = 5
CONFIDENCE_THRESHOLD = 0.50

# HTTP settings for the ESP32 ultrasonic presence sensor.
# The ESP32 POSTs to this program's own little web server when it detects
# someone nearby. This machine's LAN IP (find with `ipconfig`) is what you
# put in the ESP32 sketch's SERVER_HOST constant.
HTTP_LISTEN_PORT = 5001
HTTP_PRESENCE_PATH = "/presence"
# Body values from the ESP32 that count as "someone detected"
HTTP_PRESENCE_VALUES = {"1", "true", "detected", "presence"}

# EXACT feature order the model was trained on.
# NOTE: verify this matches your notebook's `print(active_cols)` output exactly.
# If your model was trained with a different column order, predictions will be wrong.
SYMPTOM_ORDER = [
    "chills", "joint_pain", "muscle_wasting", "vomiting", "fatigue",
    "weight_loss", "patches_in_throat", "cough", "high_fever", "breathlessness",
    "sweating", "headache", "nausea", "loss_of_appetite", "diarrhoea",
    "mild_fever", "yellowing_of_eyes", "swelled_lymph_nodes", "malaise", "phlegm",
    "chest_pain", "dizziness", "extra_marital_contacts", "muscle_pain", "blood_in_sputum",
]

# French questions, in the same order as SYMPTOM_ORDER
QUESTIONS_FR = {
    "chills": "Avez-vous des frissons ?",
    "joint_pain": "Avez-vous des douleurs articulaires ?",
    "muscle_wasting": "Avez-vous remarqué une fonte musculaire, une perte de masse musculaire ?",
    "vomiting": "Avez-vous des vomissements ?",
    "fatigue": "Ressentez-vous une fatigue inhabituelle ?",
    "weight_loss": "Avez-vous perdu du poids récemment sans raison particulière ?",
    "patches_in_throat": "Avez-vous des plaques blanches dans la gorge ?",
    "cough": "Avez-vous de la toux ?",
    "high_fever": "Avez-vous une forte fièvre ?",
    "breathlessness": "Avez-vous des difficultés à respirer, un essoufflement ?",
    "sweating": "Avez-vous des sueurs excessives, surtout la nuit ?",
    "headache": "Avez-vous des maux de tête ?",
    "nausea": "Avez-vous des nausées ?",
    "loss_of_appetite": "Avez-vous perdu l'appétit ?",
    "diarrhoea": "Avez-vous de la diarrhée ?",
    "mild_fever": "Avez-vous une fièvre légère ?",
    "yellowing_of_eyes": "Avez-vous remarqué un jaunissement du blanc des yeux ?",
    "swelled_lymph_nodes": "Avez-vous des ganglions enflés, par exemple au cou ou aux aisselles ?",
    "malaise": "Ressentez-vous un malaise général, un inconfort global ?",
    "phlegm": "Avez-vous des glaires ou des crachats épais en toussant ?",
    "chest_pain": "Avez-vous des douleurs à la poitrine ?",
    "dizziness": "Avez-vous des vertiges ou des étourdissements ?",
    "extra_marital_contacts": "Avez-vous eu récemment des rapports sexuels non protégés avec plusieurs partenaires ?",
    "muscle_pain": "Avez-vous des douleurs musculaires ?",
    "blood_in_sputum": "Avez-vous remarqué du sang dans vos crachats ?",
}

DISEASE_MESSAGE_FR = {
    "AIDS": "Attention, vos réponses évoquent des symptômes pouvant être liés au VIH/SIDA.",
    "Tuberculosis": "Attention, vos réponses évoquent des symptômes pouvant être liés à la tuberculose.",
    "Malaria": "Attention, vos réponses évoquent des symptômes pouvant être liés au paludisme.",
    "safe": "Vos réponses ne correspondent à aucune maladie spécifique détectée par le système.",
}

DISCLAIMER_FR = (
    "Ceci n'est pas un diagnostic médical. "
    "Veuillez consulter un professionnel de santé pour confirmation."
)


# ---------------- Voice helpers ----------------
_TTS_SCRIPT = (
    "import sys, pyttsx3\n"
    "engine = pyttsx3.init()\n"
    "engine.setProperty('rate', 170)\n"
    "engine.say(sys.argv[1])\n"
    "engine.runAndWait()\n"
)


def speak(engine, text):
    """Run the TTS call in a brand-new OS process instead of a thread.
    Threading still shares the process's COM/run-loop state (which is what
    caused the hang on the previous attempt) - a separate process has none
    of that baggage, so it can't get stuck. engine is kept as a parameter
    for call-site compatibility but is no longer used directly."""
    print(f"[Assistant] {text}")
    try:
        subprocess.run(
            [sys.executable, "-c", _TTS_SCRIPT, text],
            timeout=20,
        )
    except subprocess.TimeoutExpired:
        print("[speak] TTS subprocess timed out, skipping this utterance.")
    time.sleep(0.3)


def listen_yes_no(recognizer, engine, question_fr, max_retries=2):
    """Ask a yes/no question by voice, return 1 (yes), 0 (no)."""
    speak(engine, question_fr)

    for attempt in range(max_retries + 1):
        mic = sr.Microphone()  # ← CREATE FRESH each time, not shared
        with mic as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.4)
            print("Listening...")
            try:
                audio = recognizer.listen(source, timeout=5, phrase_time_limit=4)
            except sr.WaitTimeoutError:
                if attempt < max_retries:
                    speak(engine, "Je n'ai rien entendu. Pouvez-vous répéter ?")
                    continue
                else:
                    speak(engine, "Je n'ai pas entendu de réponse, je note 'non' par défaut.")
                    return 0

        try:
            text = recognizer.recognize_google(audio, language="fr-FR").lower()
            print(f"[Patient] {text}")
        except sr.UnknownValueError:
            if attempt < max_retries:
                speak(engine, "Désolé, je n'ai pas compris. Pouvez-vous répéter ?")
                continue
            else:
                speak(engine, "Je n'ai pas compris, je note 'non' par défaut.")
                return 0
        except sr.RequestError:
            speak(engine, "Problème de connexion. Je note 'non' par défaut.")
            return 0

        if any(w in text for w in ["oui", "ouais", "yes"]):
            return 1
        if any(w in text for w in ["non", "no"]):
            return 0

        if attempt < max_retries:
            speak(engine, "Répondez simplement par oui ou par non, s'il vous plaît.")

    return 0


# ---------------- ESP32 presence gate (HTTP) ----------------
# Quiet down Flask's default per-request access logs (still fine to remove
# this if you want to see every request while debugging).
logging.getLogger("werkzeug").setLevel(logging.WARNING)

_presence_app = Flask(__name__)
_presence_event = threading.Event()


@_presence_app.route(HTTP_PRESENCE_PATH, methods=["POST"])
def _presence_endpoint():
    """Called by the ESP32 whenever it detects (or re-confirms) presence."""
    # Accept either a raw text body ("1") or JSON ({"status": "1"})
    raw = request.get_data(as_text=True).strip().lower()
    json_status = ""
    if request.is_json:
        data = request.get_json(silent=True) or {}
        json_status = str(data.get("status", "")).strip().lower()

    payload = json_status or raw
    print(f"[HTTP] Presence request received: '{payload}'")

    if payload in HTTP_PRESENCE_VALUES:
        _presence_event.set()
        return jsonify({"ok": True, "recognized": True}), 200

    return jsonify({"ok": True, "recognized": False}), 200


def _run_presence_server():
    # use_reloader=False is required when running Flask inside a thread
    _presence_app.run(host="0.0.0.0", port=HTTP_LISTEN_PORT,
                       threaded=True, use_reloader=False)


def wait_for_presence_signal():
    """Block FOREVER until the ESP32 POSTs a presence message over HTTP.
    Starts a small local web server and only returns once a real detection
    request has come in - no timeout, no giving up."""
    _presence_event.clear()

    server_thread = threading.Thread(target=_run_presence_server, daemon=True)
    server_thread.start()

    print(f"En attente d'une détection de présence (ESP32) sur le port {HTTP_LISTEN_PORT}"
          f" (chemin {HTTP_PRESENCE_PATH})...")
    _presence_event.wait()  # blocks indefinitely - no timeout, no giving up
    return True



def wait_for_face(engine):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
    cap = cv2.VideoCapture(CAMERA_INDEX)

    if not cap.isOpened():
        print("Could not open camera.")
        return False

    print("Camera started. Looking for a face...")
    consecutive_hits = 0

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))

        consecutive_hits = consecutive_hits + 1 if len(faces) > 0 else 0

        for (x, y, w, h) in faces:
            cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)
        cv2.putText(frame, f"Hits: {consecutive_hits}/{CONFIRM_FRAMES}", (10, 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imshow("MediSmart Hub - Detection", frame)

        if consecutive_hits >= CONFIRM_FRAMES:
            cap.release()
            cv2.destroyAllWindows()
            return True

        if cv2.waitKey(1) & 0xFF == ord('q'):
            cap.release()
            cv2.destroyAllWindows()
            return False


# ---------------- Model ----------------
def predict(model, answers_dict):
    x = [[answers_dict[s] for s in SYMPTOM_ORDER]]
    probas = model.predict_proba(x)[0]
    labels = model.classes_
    max_idx = probas.argmax()
    max_conf = probas[max_idx]
    prediction = labels[max_idx] if max_conf >= CONFIDENCE_THRESHOLD else "safe"
    confidence = {label: round(float(p), 4) for label, p in zip(labels, probas)}
    return prediction, confidence


def send_to_dashboard(prediction, confidence, answers_dict):
    symptoms_reported = [s for s, v in answers_dict.items() if v == 1]
    payload = {
        "timestamp": datetime.now().strftime("%H:%M:%S"),
        "prediction": prediction,
        "confidence": confidence,
        "symptoms_reported": symptoms_reported,
    }
    try:
        requests.post(DASHBOARD_URL, json=payload, timeout=3)
        print("[dashboard] Result sent successfully.")
    except requests.exceptions.RequestException as e:
        print(f"[dashboard] Could not reach dashboard server: {e}")


def send_progress(question_index, symptom, answer, question_fr):
    """Send live progress of each question/answer to the dashboard."""
    payload = {
        "questionIndex": question_index,
        "symptom": symptom,
        "answer": answer,
        "questionLabel": question_fr,
    }
    try:
        requests.post("http://localhost:5000/api/result/progress", json=payload, timeout=2)
    except requests.exceptions.RequestException:
        pass  # Dashboard not running is non-fatal


# ---------------- Main flow ----------------
def main():
    engine = pyttsx3.init()
    engine.setProperty("rate", 170)

    recognizer = sr.Recognizer()
    # ← REMOVE: mic = sr.Microphone() — no longer needed here

    model = joblib.load(MODEL_PATH)

    wait_for_presence_signal()
    print("Présence détectée, ouverture de la caméra...")

    face_ok = wait_for_face(engine)
    if not face_ok:
        print("No face confirmed, exiting.")
        return

    speak(engine, "Bonjour, je suis votre assistant de triage médical. "
                  "Je vais vous poser quelques questions simples. "
                  "Répondez par oui ou par non.")

    answers = {}
    for idx, symptom in enumerate(SYMPTOM_ORDER):
        answer = listen_yes_no(recognizer, engine, QUESTIONS_FR[symptom])
        answers[symptom] = answer
        # Send live progress to the web dashboard
        send_progress(idx, symptom, bool(answer), QUESTIONS_FR[symptom])

    speak(engine, "Merci, je vais analyser vos réponses.")
    time.sleep(0.5)

    prediction, confidence = predict(model, answers)
    result_text = DISEASE_MESSAGE_FR[prediction]
    speak(engine, result_text)
    speak(engine, DISCLAIMER_FR)

    print("\n--- Result ---")
    print("Prediction:", prediction)
    print("Confidence:", json.dumps(confidence, indent=2))

    send_to_dashboard(prediction, confidence, answers)


if __name__ == "__main__":
    main()
