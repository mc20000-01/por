from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import subprocess
import os
import base64

app = Flask(__name__)
CORS(app)

REPO_PATH = "/home/sandisk/POR"

def parse_content(content, data_type):
    """
    Decodes the data ONLY if the extension explicitly says it's a data_url.
    """
    if data_type == 'data_url' and isinstance(content, str) and ';base64,' in content:
        header, b64_data = content.split(';base64,', 1)
        return True, base64.b64decode(b64_data)
    # Treat everything else as raw text
    return False, content

@app.route('/POR_Extension.js', methods=['GET'])
def serve_extension():
    return send_from_directory(REPO_PATH, 'POR_Extension.js')

@app.route('/ping', methods=['GET'])
def ping():
    return jsonify({"status": "online"})

@app.route('/git_status', methods=['GET'])
def git_status():
    try:
        result = subprocess.run(['git', 'status', '--porcelain'], cwd=REPO_PATH, capture_output=True, text=True)
        changes = result.stdout.strip()
        if not changes:
            changes = "working tree clean"
        return jsonify({"status": "success", "output": changes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/check_diff', methods=['POST'])
def check_diff():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')
    data_type = data.get('type', 'text')

    if not file_path or content is None:
        return jsonify({"error": "Missing data"}), 400

    full_path = os.path.join(REPO_PATH, file_path)

    if not os.path.exists(full_path):
        return jsonify({"changed": True})

    try:
        is_binary, new_data = parse_content(content, data_type)
        
        if is_binary:
            with open(full_path, 'rb') as f:
                local_data = f.read()
            return jsonify({"changed": local_data != new_data})
        else:
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    local_data = f.read()
                return jsonify({"changed": local_data != new_data})
            except UnicodeDecodeError:
                # Safety: If we try to read a binary file as text, it's definitely different!
                return jsonify({"changed": True})
                
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/save_file', methods=['POST'])
def save_file():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')
    data_type = data.get('type', 'text') # Get explicit type from block
    
    full_path = os.path.join(REPO_PATH, file_path)

    try:
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        
        is_binary, file_data = parse_content(content, data_type)
        
        write_mode = 'wb' if is_binary else 'w'
        encoding = None if is_binary else 'utf-8'

        with open(full_path, write_mode, encoding=encoding) as f:
            f.write(file_data)
            
        return jsonify({"status": "success"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

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
