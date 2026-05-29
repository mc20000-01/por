from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import os

app = Flask(__name__)
# CORS allows your browser (PenguinMod) to talk to this local server
CORS(app)

# The path to your local repository
REPO_PATH = "/home/sandisk/POR"

@app.route('/update_file', methods=['POST'])
def update_file():
    # Get the data sent from the PenguinMod block
    data = request.json
    file_path = data.get('path')
    content = data.get('content')
    commit_message = data.get('message', 'Automated update from PenguinMod')

    if not file_path or content is None:
        return jsonify({"error": "Missing path or content"}), 400

    full_path = os.path.join(REPO_PATH, file_path)

    try:
        # 1. Write the new data to the file
        with open(full_path, 'w') as f:
            f.write(content)
        print(f"Updated file: {full_path}")

        # 2. Run the Git commands to stage, commit, and push
        subprocess.run(['git', 'add', file_path], cwd=REPO_PATH, check=True)
        subprocess.run(['git', 'commit', '-m', commit_message], cwd=REPO_PATH, check=True)
        subprocess.run(['git', 'push'], cwd=REPO_PATH, check=True)
        print("Successfully pushed to GitHub.")

        return jsonify({"status": "success"})

    except subprocess.CalledProcessError as e:
        print(f"Git Error: {e}")
        return jsonify({"error": "Failed to push to Git"}), 500
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Runs the server on port 5000
    app.run(port=5000)
