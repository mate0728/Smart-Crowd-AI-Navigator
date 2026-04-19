from flask import Flask, render_template, request, redirect, url_for, session, flash
from flask_socketio import SocketIO
from routes.queue_routes import queue_bp
from routes.heatmap_routes import heatmap_bp
from services.alert_service import start_alerts
import config

app = Flask(__name__)
app.secret_key = config.Config.SECRET_KEY
socketio = SocketIO(app)

# Register routes
app.register_blueprint(queue_bp, url_prefix="/api")
app.register_blueprint(heatmap_bp, url_prefix="/api")

@app.route("/", methods=["GET", "POST"])
def index():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")
        
        # Hardcoded Admin Credentials for prototype
        if username == "admin" and password == "stadium2026":
            session["logged_in"] = True
            return redirect(url_for("overview"))
        else:
            flash("ACCESS DENIED: Invalid Security Credentials!")
            
    return render_template("login.html")

@app.route("/overview")
def overview():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    return render_template("overview.html", active_page='overview')

@app.route("/map")
def stadium_map():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    return render_template("map.html", active_page='map')

@app.route("/controls")
def controls():
    if not session.get("logged_in"):
        return redirect(url_for("index"))
    return render_template("controls.html", active_page='controls')

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for("index"))

# Start alert thread
start_alerts(socketio)

if __name__ == "__main__":
    socketio.run(app, debug=True, allow_unsafe_werkzeug=True)