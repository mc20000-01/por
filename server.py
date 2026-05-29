from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
CORS(app)

REPO_PATH = "/home/sandisk/POR"

@app.route('/save_file', methods=['POST'])
def save_file():
    data = request.json
    file_path = data.get('path')
    content = data.get('content')

    if not file_path or content is None:
        return jsonify({"error": "Missing path or content"}), 400

    full_path = os.path.join(REPO_PATH, file_path)

    try:
        # Create nested folders automatically if a subsystem uses a path like 'subsystem_a/data.json'
        os.makedirs(os.path.dirname(full_path), exist_ok=True)

        # Write the file locally without touching Git yet
        with open(full_path, 'w') as f:
            f.write(content)
        
        print(f"Saved locally: {file_path}")
        return jsonify({"status": "success", "message": f"Staged {file_path} locally"})

    except Exception as e:
        print(f"Error saving file: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/commit_and_push', methods=['POST'])
def commit_and_push():
    data = request.json
    commit_message = data.get('message', 'Batch update of subsystems from PenguinMod')

    try:
        # 1. Stage every new, modified, or deleted file in the repo folder
        subprocess.run(['git', 'add', '.'], cwd=REPO_PATH, check=True)

        # 2. Check if there are actual changes to prevent Git from throwing an error on empty commits
        status_check = subprocess.run(['git', 'status', '--porcelain'], cwd=REPO_PATH, capture_output=True, text=True)
        if not status_check.stdout.strip():
            print("Commit skipped: No changes detected.")
            return jsonify({"status": "success", "message": "No new changes found to commit."})

        # 3. Commit and push the entire batch at once
        subprocess.run(['git', 'commit', '-m', commit_message], cwd=REPO_PATH, check=True)
        subprocess.run(['git', 'push'], cwd=REPO_PATH, check=True)
        
        print("Batch sync successful!")
        return jsonify({"status": "success", "message": "All modified files committed and pushed successfully."})

    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e}")
        return jsonify({"error": "Git batch operation failed"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5000)
