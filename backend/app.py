from flask import Flask, request, jsonify, redirect
import hmac
import hashlib
import os
import jwt
import time
import requests
import json
import logging
from dotenv import load_dotenv
from code_review_agent import code_review_agent
import threading
import base64
from urllib.parse import quote_plus
from database import init_db, User
from code_review_agent import code_review_agent
import threading
import base64
from urllib.parse import quote_plus
from database import init_db, User

load_dotenv()

app = Flask(__name__)
JWT_SECRET = os.getenv("JWT_SECRET", "dev-jwt-secret")

# Initialize database
init_db(app)

# GitHub App configuration
GITHUB_APP_ID = os.getenv("GITHUB_APP_ID")
GITHUB_PRIVATE_KEY = os.getenv("GITHUB_PRIVATE_KEY")
GITHUB_WEBHOOK_SECRET = os.getenv("GITHUB_WEBHOOK_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
GITHUB_APP_NAME = os.getenv("GITHUB_APP_NAME", "smartreview")
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
 


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
            sender = data.get('sender', {})
            sender_id = sender.get('id')

            app.logger.info(f"Processing PR {pr_number} for repo {repo_name}, sender_id: {sender_id}")

            # Get installation token for this event
            installation_token = get_installation_token(installation_id)

            # Run analysis with installation token and user ID
            threading.Thread(target=run_analysis, args=(repo_name, pr_number, installation_token, sender_id)).start()

            return jsonify({'status': 'Analysis started'}), 200

    return jsonify({'status': 'Event ignored'}), 200

def run_analysis(repo_name, pr_number, installation_token, sender_id=None):
    try:
        print(f"Starting analysis for {repo_name}#{pr_number}, sender_id: {sender_id}")
        logging.info(f"Starting analysis for {repo_name}#{pr_number}, sender_id: {sender_id}")
        # Check if user has set up their API key
        if not sender_id:
            print(f"Error: No sender ID provided for analysis of {repo_name}#{pr_number}")
            logging.error(f"No sender ID provided for analysis of {repo_name}#{pr_number}")
            return
            
        user_api_key = User.get_decrypted_api_key(sender_id)
        if not user_api_key:
            print(f"Error: User {sender_id} has not set up their Groq API key. Skipping analysis for {repo_name}#{pr_number}")
            logging.error(f"User {sender_id} has not set up their Groq API key. Skipping analysis for {repo_name}#{pr_number}")
            return

        print(f"User {sender_id} has API key, proceeding with analysis")

        logging.info(f"User {sender_id} has API key, proceeding with analysis")

        # Temporarily set the token and API key for this analysis
        original_token = os.environ.get('GITHUB_TOKEN')
        original_groq_key = os.environ.get('GROQ_API_KEY')
        
        os.environ['GITHUB_TOKEN'] = installation_token
        os.environ['GROQ_API_KEY'] = user_api_key

        result = code_review_agent.invoke({
            "repo_name": repo_name,
            "pr_number": pr_number,
            "code_changes": [],
            "feedback": []
        })

        # Restore original environment variables
        if original_token:
            os.environ['GITHUB_TOKEN'] = original_token
        else:
            os.environ.pop('GITHUB_TOKEN', None)
            
        if original_groq_key:
            os.environ['GROQ_API_KEY'] = original_groq_key
        else:
            os.environ.pop('GROQ_API_KEY', None)

    except Exception as e:
        logging.error(f"Error during analysis of {repo_name}#{pr_number}: {str(e)}")

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
    client_id = GITHUB_CLIENT_ID  # Use GitHub App's client ID for OAuth to authorize app access
    if not client_id:
        return jsonify({'error': 'OAuth not configured'}), 500
    github_auth_url = f"https://github.com/login/oauth/authorize?client_id={client_id}&scope=user:email"
    return redirect(github_auth_url)

@app.route('/auth/callback')
def auth_callback():
    code = request.args.get('code')
    client_id = GITHUB_CLIENT_ID  
    client_secret = GITHUB_CLIENT_SECRET   
    if not code or not client_id or not client_secret:
        return redirect(f"{FRONTEND_URL}/?auth=0")
    # Exchange code for token
    token_response = requests.post('https://github.com/login/oauth/access_token', 
        headers={'Accept': 'application/json'},
        data={
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code
        })
    token_data = token_response.json()
    access_token = token_data.get('access_token')
    if not access_token:
        return redirect(f"{FRONTEND_URL}/?auth=0")
    # Get user profile
    user_response = requests.get('https://api.github.com/user', headers={'Authorization': f'token {access_token}'})
    profile = user_response.json()
    # Create JWT
    jwt_token = jwt.encode({'access_token': access_token, 'user': profile}, JWT_SECRET, algorithm='HS256')
    # Redirect to frontend with user info
    name = quote_plus(profile.get('name') or '')
    login = quote_plus(profile.get('login') or '')
    avatar = quote_plus(profile.get('avatar_url') or '')
    jwt_param = quote_plus(jwt_token)
    redirect_url = f"{FRONTEND_URL}/?auth=1&name={name}&login={login}&avatar={avatar}&jwt={jwt_param}"
    response = redirect(redirect_url)
    response.set_cookie('jwt', jwt_token, httponly=True, secure=True)  # secure=True for HTTPS production
    return response

@app.route('/auth/logout', methods=['POST'])
def auth_logout():
    response = jsonify({'ok': True})
    response.set_cookie('jwt', '', expires=0)
    return response

@app.route('/api/installations')
def get_installations():
    jwt_token = None
    
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        jwt_token = auth_header.split(' ')[1]
    else:
        # Fallback to cookie
        jwt_token = request.cookies.get('jwt')
    
    if not jwt_token:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        decoded = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        access_token = decoded['access_token']
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401
    # Get user's installations
    url = 'https://api.github.com/user/installations'
    headers = {'Authorization': f'token {access_token}', 'Accept': 'application/vnd.github.v3+json'}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        return jsonify({'error': 'Failed to fetch installations'}), 500
    data = response.json()
    installations = data['installations']
    # Filter to our app
    our_installations = [inst for inst in installations if inst['app_id'] == int(GITHUB_APP_ID)]
    # For each installation, get the repos
    result = []
    for inst in our_installations:
        installation_id = inst['id']
        try:
            token = get_installation_token(installation_id)
            repo_url = f"https://api.github.com/installation/repositories"
            repo_headers = {
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json'
            }
            repo_response = requests.get(repo_url, headers=repo_headers)
            if repo_response.status_code == 200:
                repos_data = repo_response.json()
                repos = repos_data['repositories']
                result.append({
                    'id': installation_id,
                    'account': inst['account'],
                    'repos': [{'name': repo['name'], 'full_name': repo['full_name']} for repo in repos]
                })
        except Exception as e:
            # Skip if can't get repos
            pass
    return jsonify({'installations': result})

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

@app.route('/api/user')
def get_user():
    jwt_token = None
    
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        jwt_token = auth_header.split(' ')[1]
    else:
        # Fallback to cookie
        jwt_token = request.cookies.get('jwt')
    
    if not jwt_token:
        return jsonify({'error': 'Not authenticated'}), 401
    try:
        decoded = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        user = decoded['user']
        return jsonify(user)
    except jwt.ExpiredSignatureError:
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'error': 'Invalid token'}), 401

@app.route('/api/setup-key', methods=['POST'])
def setup_api_key():
    """Set up user's Groq API key"""
    print("API endpoint /api/setup-key called")
    jwt_token = None
    
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        jwt_token = auth_header.split(' ')[1]
    else:
        # Fallback to cookie
        jwt_token = request.cookies.get('jwt')
    
    if not jwt_token:
        print("No JWT token found")
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        decoded = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        user = decoded['user']
        github_id = user['id']
        print(f"Authenticated user: {github_id}")
    except jwt.ExpiredSignatureError:
        print("JWT token expired")
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        print("Invalid JWT token")
        return jsonify({'error': 'Invalid token'}), 401
    
    # Get API key from request
    data = request.get_json()
    if not data or 'api_key' not in data:
        print("No API key in request data")
        return jsonify({'error': 'API key is required'}), 400
    
    groq_api_key = data['api_key'].strip()
    if not groq_api_key:
        print("API key is empty")
        return jsonify({'error': 'API key cannot be empty'}), 400
    
    # Save to database
    try:
        User.create_or_update(github_id, groq_api_key)
        print(f"API key saved successfully for user {github_id}")
        logging.info(f"API key saved successfully for user {github_id}")
        return jsonify({'message': 'API key saved successfully'}), 200
    except Exception as e:
        print(f"Failed to save API key: {e}")
        logging.error(f"Failed to save API key for user {github_id}: {e}")
        return jsonify({'error': 'Failed to save API key'}), 500

@app.route('/api/setup-key', methods=['DELETE'])
def delete_api_key():
    """Delete user's Groq API key"""
    print("API endpoint /api/setup-key DELETE called")
    jwt_token = None
    
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        jwt_token = auth_header.split(' ')[1]
    else:
        # Fallback to cookie
        jwt_token = request.cookies.get('jwt')
    
    if not jwt_token:
        print("No JWT token found")
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        decoded = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        user = decoded['user']
        github_id = user['id']
        print(f"Authenticated user: {github_id}")
    except jwt.ExpiredSignatureError:
        print("JWT token expired")
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        print("Invalid JWT token")
        return jsonify({'error': 'Invalid token'}), 401
    
    # Delete API key from database
    try:
        deleted = User.delete_api_key(github_id)
        if deleted:
            print(f"API key deleted successfully for user {github_id}")
            logging.info(f"API key deleted successfully for user {github_id}")
            return jsonify({'message': 'API key deleted successfully'}), 200
        else:
            print(f"No API key found to delete for user {github_id}")
            return jsonify({'message': 'No API key found to delete'}), 404
    except Exception as e:
        print(f"Failed to delete API key: {e}")
        logging.error(f"Failed to delete API key for user {github_id}: {e}")
        return jsonify({'error': 'Failed to delete API key'}), 500

@app.route('/api/setup-status', methods=['GET'])
def get_setup_status():
    """Check if user has set up their API key"""
    print("API endpoint /api/setup-status called")
    jwt_token = None
    
    # Check Authorization header first
    auth_header = request.headers.get('Authorization')
    if auth_header and auth_header.startswith('Bearer '):
        jwt_token = auth_header.split(' ')[1]
    else:
        # Fallback to cookie
        jwt_token = request.cookies.get('jwt')
    
    if not jwt_token:
        print("No JWT token found")
        return jsonify({'error': 'Not authenticated'}), 401
    
    try:
        decoded = jwt.decode(jwt_token, JWT_SECRET, algorithms=['HS256'])
        user = decoded['user']
        github_id = user['id']
        print(f"Authenticated user: {github_id}")
    except jwt.ExpiredSignatureError:
        print("JWT token expired")
        return jsonify({'error': 'Token expired'}), 401
    except jwt.InvalidTokenError:
        print("Invalid JWT token")
        return jsonify({'error': 'Invalid token'}), 401
    
    # Check if user has API key
    has_key = User.has_api_key(github_id)
    print(f"Returning has_api_key: {has_key}")
    return jsonify({'has_api_key': has_key}), 200

@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', 'https://smartreview.shrivarshapoojary.in')
    response.headers.add('Access-Control-Allow-Credentials', 'true')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)