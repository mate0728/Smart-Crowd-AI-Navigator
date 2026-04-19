import threading
import time

def start_alerts(socketio):
    def send_alerts():
        while True:
            socketio.emit("alert", "⚠️ Gate 2 crowded! Use Gate 3")
            time.sleep(8)

    thread = threading.Thread(target=send_alerts)
    thread.daemon = True
    thread.start()
