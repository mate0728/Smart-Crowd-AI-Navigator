from flask import Blueprint, jsonify
import random

heatmap_bp = Blueprint("heatmap", __name__)

@heatmap_bp.route("/heatmap", methods=["GET"])
def get_heatmap():
    zones = ["A", "B", "C", "D", "E", "F"]

    data = []
    for zone in zones:
        crowd_level = random.choice(["low", "medium", "high"])
        data.append({
            "zone": zone,
            "crowd": crowd_level
        })

    return jsonify(data)
