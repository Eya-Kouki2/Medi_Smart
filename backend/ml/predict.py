import sys
import json
import joblib
import os

def main():
    try:
        model_path = os.path.join(os.path.dirname(__file__), 'triage_rf_model_v2.pkl')
        model = joblib.load(model_path)
        features = [int(x) for x in sys.argv[1].split(',')]
        prediction = model.predict([features])[0]
        print(json.dumps({"prediction": prediction}))
    except Exception as e:
        print(json.dumps({"error": str(e)}))

if __name__ == '__main__':
    main()
