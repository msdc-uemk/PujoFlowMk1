from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import pandas as pd
import pickle
import os

# ==========================
# Flask App Setup
# ==========================
app = Flask(__name__, static_folder="../frontend", static_url_path="/")
CORS(app)

# ==========================
# Load Dataset
# ==========================
BASE_DIR = os.path.dirname(__file__)
csv_path = os.path.join(BASE_DIR, "pandal_crowd_11days.csv")
df = pd.read_csv(csv_path)

# ==========================
# Load Model + Encoders
# ==========================
with open(os.path.join(BASE_DIR, "model.pkl"), "rb") as f:
    model = pickle.load(f)

with open(os.path.join(BASE_DIR, "le_day.pkl"), "rb") as f:
    le_day = pickle.load(f)

with open(os.path.join(BASE_DIR, "le_pop.pkl"), "rb") as f:
    le_pop = pickle.load(f)

with open(os.path.join(BASE_DIR, "le_pandal.pkl"), "rb") as f:
    le_pandal = pickle.load(f)


# ==========================
# Serve Frontend
# ==========================
@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


# ==========================
# Recorded Data Endpoint
# ==========================
@app.route("/getDensity", methods=["GET"])
def get_density():
    """Return recorded visitors data for a pandal on a given day and hour."""
    pandal = request.args.get("pandal")
    day = request.args.get("day")
    hour = request.args.get("hour")

    try:
        hour = int(hour)
    except (ValueError, TypeError):
        return jsonify({"error": "Hour must be an integer (0-23)"}), 400

    row = df[(df["name"] == pandal) & (df["day"] == day) & (df["hour"] == hour)]
    if row.empty:
        return jsonify({"error": f"No data for {pandal} on {day} at {hour}:00"}), 404

    return jsonify(row.iloc[0].to_dict())


# ==========================
# AI Prediction Endpoint
# ==========================
@app.route("/predict", methods=["GET"])
def predict():
    """Predict the best visiting time for a given pandal on a given day."""
    try:
        pandal = request.args.get("pandal")
        day = request.args.get("day")
        popularity = request.args.get("popularity", "major")
        capacity = int(request.args.get("capacity", 5000))

        # 🔑 Encode categorical inputs
        pandal_enc = le_pandal.transform([pandal])[0]
        day_enc = le_day.transform([day])[0]
        pop_enc = le_pop.transform([popularity])[0]

        best_hour = None
        min_visitors = float("inf")

        # ✅ Only loop through practical visiting hours (e.g. 10 AM – 11 PM)
        for hour in range(10, 23):
            X = pd.DataFrame([{
                "pandal_encoded": pandal_enc,
                "day_encoded": day_enc,
                "hour": hour,
                "capacity_est": capacity,
                "popularity_encoded": pop_enc
            }])

            pred_visitors = int(model.predict(X)[0])

            if pred_visitors < min_visitors:
                min_visitors = pred_visitors
                best_hour = hour

        if best_hour is None:
            return jsonify({"error": "No prediction available"}), 500

        return jsonify({
            "pandal": pandal,
            "day": day,
            "best_time": f"{best_hour:02d}:00",
            "visitors": min_visitors
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================
# Run App
# ==========================
if __name__ == "__main__":
    app.run(debug=True, port=5000)
