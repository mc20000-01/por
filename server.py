from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

REPO_PATH = "/home/sandisk/POR"

# --- NEW: Serve the Extension JS directly ---
@app.route('/POR_Extension.js', methods=['GET'])
def serve_extension():
    return send_from_directory(REPO_PATH, 'POR_Extension.js')

# --- NEW: QoL Server Status ---
@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "online"})

# --- NEW: QoL Git Status ---
@app.route('/git_status', methods=['GET'])
def git_status():
    try:
        # Returns a short list of changed files (e.g., " M data.json")
        result = subprocess.run(['git', 'status', '--porcelain'], cwd=REPO_PATH, capture_output=True, text=True)
        changes = result.stdout.strip()
        if not changes:
            changes = "working tree clean"
        return jsonify({"status": "success", "output": changes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- NEW: QoL Diff Checker ---
@app.route('/check_diff', methods=['POST'])
def check_diff():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')

    if not file_path or content is None:
        return jsonify({"error": "Missing data"}), 400

    full_path = os.path.join(REPO_PATH, file_path)

    # If the file doesn't exist yet, it definitely needs an update
    if not os.path.exists(full_path):
        return jsonify({"changed": True})

    try:
        with open(full_path, 'r') as f:
            local_content = f.read()
        
        # Compare local file to the incoming Scratch data
        return jsonify({"changed": local_content != content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UPDATED: Save File (Now acts as the backend for Smart Stage) ---
@app.route('/save_file', methods=['POST'])
def save_file():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')
    full_path = os.path.join(REPO_PATH, file_path)

    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, 'w') as f:
            f.write(content)
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- UNCHANGED: Commit & Push ---
@app.route('/commit_and_push', methods=['POST'])
def commit_and_push():
    data = request.json
    commit_message = data.get('message', 'Batch update of subsystems')

    try:
        subprocess.run(['git', 'add', '.'], cwd=REPO_PATH, check=True)
        status_check = subprocess.run(['git', 'status', '--porcelain'], cwd=REPO_PATH, capture_output=True, text=True)
        
        if not status_check.stdout.strip():
            return jsonify({"status": "success", "message": "No new changes found."})

        subprocess.run(['git', 'commit', '-m', commit_message], cwd=REPO_PATH, check=True)
        subprocess.run(['git', 'push'], cwd=REPO_PATH, check=True)
        return jsonify({"status": "success", "message": "Pushed to GitHub!"})
    except subprocess.CalledProcessError as e:
        return jsonify({"error": "Git error occurred"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
