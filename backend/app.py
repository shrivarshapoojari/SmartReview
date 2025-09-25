from flask import Flask, request, jsonify, redirect, session
import hmac
import hashlib
import os
import jwt
import time
import requests
from dotenv import load_dotenv
from code_review_agent import code_review_agent
import threading
import base64
from urllib.parse import quote_plus

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-key")

# GitHub App configuration
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY = os.getenv("GITHUB_PRIVATE_KEY")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GITHUB_APP_NAME = os.getenv("GITHUB_APP_NAME", "smartreview")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
# Optional separate OAuth app credentials (to avoid clashing with GitHub App credentials)
GITHUB_OAUTH_CLIENT_ID = os.getenv("GITHUB_OAUTH_CLIENT_ID")
GITHUB_OAUTH_CLIENT_SECRET = os.getenv("GITHUB_OAUTH_CLIENT_SECRET")


def get_github_app_token():
    """Generate JWT for GitHub App authentication"""
    now = int(time.time())
    payload = {
        'iat': now,
        'exp': now + (10 * 60),  # 10 minutes
        'iss': GITHUB_APP_ID
    }

    # Load private key
    private_key = GITHUB_PRIVATE_KEY.replace('\\n', '\n')
    if '-----BEGIN' not in private_key:
        private_key = f"-----BEGIN RSA PRIVATE KEY-----\n{private_key}\n-----END RSA PRIVATE KEY-----"

    token = jwt.encode(payload, private_key, algorithm='RS256')
    return token

def get_installation_token(installation_id):
    """Get installation access token"""
    jwt_token = get_github_app_token()
    url = f"https://api.github.com/app/installations/{installation_id}/access_tokens"
    headers = {
        'Authorization': f'Bearer {jwt_token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    response = requests.post(url, headers=headers)
    return response.json()['token']

def create_webhook(repo_full_name, installation_token):
    """Create webhook for the repository"""
    url = f"https://api.github.com/repos/{repo_full_name}/hooks"
    headers = {
        'Authorization': f'token {installation_token}',
        'Accept': 'application/vnd.github.v3+json'
    }

    webhook_url = os.getenv("WEBHOOK_URL", "http://localhost:5000/webhook")

    data = {
        "name": "web",
        "active": True,
        "events": ["pull_request"],
        "config": {
            "url": webhook_url,
            "content_type": "json",
            "secret": GITHUB_WEBHOOK_SECRET
        }
    }

    response = requests.post(url, json=data, headers=headers)
    return response.status_code == 201

def verify_signature(payload, signature):
    if not GITHUB_WEBHOOK_SECRET:
        return True
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
            installation_id = data['installation']['id']

            # Get installation token for this event
            installation_token = get_installation_token(installation_id)

            # Run analysis with installation token
            threading.Thread(target=run_analysis, args=(repo_name, pr_number, installation_token)).start()

            return jsonify({'status': 'Analysis started'}), 200

    return jsonify({'status': 'Event ignored'}), 200

def run_analysis(repo_name, pr_number, installation_token):
    try:
        # Temporarily set the token for this analysis
        original_token = os.environ.get('GITHUB_TOKEN')
        os.environ['GITHUB_TOKEN'] = installation_token

        result = code_review_agent.invoke({
            "repo_name": repo_name,
            "pr_number": pr_number,
            "code_changes": [],
            "feedback": []
        })

        # Restore original token
        if original_token:
            os.environ['GITHUB_TOKEN'] = original_token
        else:
            del os.environ['GITHUB_TOKEN']

    except Exception as e:
        pass

@app.route('/install')
def install_app():
    """Redirect to GitHub App installation"""
    github_url = f"https://github.com/apps/{GITHUB_APP_NAME}/installations/new"
    # Tell GitHub to redirect back to our callback after installation
    callback = f"{BACKEND_URL}/github/callback"
    github_url = f"https://github.com/apps/{GITHUB_APP_NAME}/installations/new?redirect_url={quote_plus(callback)}"
    return redirect(github_url)


@app.route('/auth/login')
def auth_login():
    """Start GitHub OAuth login flow by redirecting to GitHub authorize URL"""
    # prefer separate OAuth app creds if provided to avoid colliding with GitHub App credentials
    oauth_client_id = GITHUB_OAUTH_CLIENT_ID or GITHUB_CLIENT_ID
    if not oauth_client_id:
        return jsonify({'error': 'GITHUB_OAUTH_CLIENT_ID or GITHUB_CLIENT_ID must be configured'}), 500

    redirect_uri = f"{BACKEND_URL}/auth/callback"
    state = quote_plus(redirect_uri)
    params = f"client_id={oauth_client_id}&redirect_uri={quote_plus(redirect_uri)}&scope=read:user user:email&state={state}"
    authorize_url = f"https://github.com/login/oauth/authorize?{params}"
    return redirect(authorize_url)


@app.route('/auth/callback')
def auth_callback():
    """Handle GitHub OAuth callback, exchange code for token, fetch profile, then redirect to frontend with basic user info"""
    code = request.args.get('code')
    if not code:
        return redirect(FRONTEND_URL + '/?auth=0&error=missing_code')

    token_url = 'https://github.com/login/oauth/access_token'
    oauth_client_id = GITHUB_OAUTH_CLIENT_ID or GITHUB_CLIENT_ID
    oauth_client_secret = GITHUB_OAUTH_CLIENT_SECRET or GITHUB_CLIENT_SECRET
    data = {
        'client_id': oauth_client_id,
        'client_secret': oauth_client_secret,
        'code': code
    }
    headers = {'Accept': 'application/json'}
    resp = requests.post(token_url, data=data, headers=headers)
    if resp.status_code != 200:
        return redirect(FRONTEND_URL + '/?auth=0&error=token_exchange_failed')

    token_json = resp.json()
    access_token = token_json.get('access_token')
    if not access_token:
        return redirect(FRONTEND_URL + '/?auth=0&error=no_access_token')

    # Fetch user profile
    user_resp = requests.get('https://api.github.com/user', headers={'Authorization': f'token {access_token}', 'Accept': 'application/vnd.github.v3+json'})
    if user_resp.status_code != 200:
        return redirect(FRONTEND_URL + '/?auth=0&error=failed_fetch_user')

    profile = user_resp.json()
    # build redirect with basic info (URL-encoded)
    name = quote_plus(profile.get('name') or '')
    login = quote_plus(profile.get('login') or '')
    avatar = quote_plus(profile.get('avatar_url') or '')
    redirect_url = f"{FRONTEND_URL}/?auth=1&name={name}&login={login}&avatar={avatar}"
    return redirect(redirect_url)


@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    # For this simple flow we don't maintain server-side sessions; frontend can clear local state
    return jsonify({'ok': True}), 200

@app.route('/github/callback')
def github_callback():
    """Handle GitHub App installation callback"""
    installation_id = request.args.get('installation_id')
    setup_action = request.args.get('setup_action')

    if setup_action == 'install' and installation_id:
        # Get installation token
        try:
            token = get_installation_token(installation_id)

            # Get list of repositories for this installation
            url = f"https://api.github.com/installation/repositories"
            headers = {
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json'
            }

            response = requests.get(url, headers=headers)
            repos = response.json()['repositories']

            # Create webhooks for all repos
            success_count = 0
            for repo in repos:
                if create_webhook(repo['full_name'], token):
                    success_count += 1

            # Redirect back to the frontend with success info
            redirect_url = f"{FRONTEND_URL}/?installed=1&repos={success_count}"
            return redirect(redirect_url)

        except Exception as e:
            # Redirect back to frontend with error message (URL-encoded)
            msg = quote_plus(str(e))
            redirect_url = f"{FRONTEND_URL}/?installed=0&error={msg}"
            return redirect(redirect_url)

    # If no specific install action, return user to the frontend
    return redirect(FRONTEND_URL)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'healthy'}), 200

@app.route('/link-repo', methods=['POST'])
def link_repo():
    # For GitHub App, linking is done through installation
    return jsonify({'message': 'Please install the GitHub App to link repositories automatically'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)