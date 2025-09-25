from flask import Flask, request, jsonify
import hmac
import hashlib
import os
from dotenv import load_dotenv
from code_review_agent import code_review_agent
import threading

load_dotenv()

app = Flask(__name__)

GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")

def verify_signature(payload, signature):
    if not GITHUB_WEBHOOK_SECRET:
        return True  # For testing, skip verification if no secret
    expected_signature = hmac.new(GITHUB_WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    expected_signature = f"sha256={expected_signature}"
    return hmac.compare_digest(expected_signature, signature)

@app.route('/webhook', methods=['POST'])
def github_webhook():
    payload = request.get_data()
    signature = request.headers.get('X-Hub-Signature-256')

    if not verify_signature(payload, signature):
        return jsonify({'error': 'Invalid signature'}), 403

    event = request.headers.get('X-GitHub-Event')
    data = request.get_json()

    if event == 'pull_request':
        action = data.get('action')
        if action in ['opened', 'synchronize', 'reopened']:
            repo_name = data['repository']['full_name']
            pr_number = data['pull_request']['number']

            # Run the analysis in a separate thread to avoid blocking
            threading.Thread(target=run_analysis, args=(repo_name, pr_number)).start()

            return jsonify({'status': 'Analysis started'}), 200

    return jsonify({'status': 'Event ignored'}), 200

def run_analysis(repo_name, pr_number):
    try:
        result = code_review_agent.invoke({
            "repo_name": repo_name,
            "pr_number": pr_number,
            "code_changes": [],
            "feedback": []
        })
        print(f"Analysis completed for {repo_name} PR #{pr_number}")
    except Exception as e:
        print(f"Error analyzing {repo_name} PR #{pr_number}: {str(e)}")

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/link-repo', methods=['POST'])
def link_repo():
    # This endpoint could be used by the frontend to "link" a repo
    # In practice, the user needs to manually add the webhook URL to their GitHub repo settings
    data = request.get_json()
    repo_name = data.get('repo_name')
    if not repo_name:
        return jsonify({'error': 'repo_name required'}), 400

    # Here you could store linked repos in a database, but for now just return success
    return jsonify({'status': f'Repo {repo_name} linked. Remember to add webhook URL to GitHub repo settings.'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)