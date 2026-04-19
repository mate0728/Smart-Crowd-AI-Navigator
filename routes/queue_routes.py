from flask import Blueprint, jsonify
from models.queue_model import get_all_queues, init_db, seed_data

queue_bp = Blueprint("queue", __name__)

@queue_bp.route("/queues", methods=["GET"])
def queues():
    import random
    data = [
        {"name": "Main Entrance Gate", "wait_time": random.randint(2, 12)},
        {"name": "North Food Court", "wait_time": random.randint(5, 15)},
        {"name": "Restroom Zone B", "wait_time": random.randint(1, 8)},
        {"name": "Merchandise Stall", "wait_time": random.randint(4, 14)}
    ]
    return jsonify(data)
