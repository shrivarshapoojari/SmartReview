# SmartReview - AI Code Review Agent

An intelligent GitHub App that automatically reviews pull requests using AI, providing security analysis, bug detection, performance suggestions, and code quality improvements.

## Features

- 🤖 AI-powered code analysis using LangGraph and Groq
- 🔒 Security vulnerability detection
- 🐛 Automated bug identification
- ⚡ Performance optimization suggestions
- 📝 Code quality improvements
- 🔄 Automatic PR analysis via webhooks
- 🚀 One-click GitHub App installation

## Architecture

- **Frontend**: React (Vite) - User interface for app installation
- **Backend**: Flask - Webhook handler and GitHub App integration
- **AI Engine**: LangGraph + LangChain + Groq - Code analysis pipeline
- **Deployment**: GitHub App for seamless integration

## Setup for Development

### Prerequisites
- Python 3.11+
- Node.js 20.19+ or 22.12+
- GitHub account

### 1. Clone and Setup
```bash
git clone <repository-url>
cd smart-review
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev  # Runs on http://localhost:5173
```

### 4. Environment Configuration
Create `backend/.env`:
```env
GROQ_API_KEY=your_groq_api_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----\nyour_private_key\n-----END RSA PRIVATE KEY-----
WEBHOOK_URL=http://localhost:5000/webhook
FLASK_SECRET_KEY=dev-secret-key
```

### 5. Register GitHub App

1. Go to [GitHub Settings → Developer settings → GitHub Apps](https://github.com/settings/apps)
2. Click "New GitHub App"
3. Fill in details:
   - **GitHub App name**: SmartReview
   - **Homepage URL**: `http://localhost:5000` (or your deployed URL)
   - **Webhook URL**: `http://localhost:5000/webhook`
   - **Webhook secret**: Same as `GITHUB_WEBHOOK_SECRET`
4. **Permissions**:
   - Repository permissions: Contents (Read), Pull requests (Read & Write)
   - Organization permissions: Members (Read)
5. **Events**: Pull request
6. Generate and download private key
7. Copy App ID and update `.env`

### 6. Run Backend
```bash
cd backend
venv\Scripts\activate
python app.py  # Runs on http://localhost:5000
```

## User Installation Flow

1. User visits the SmartReview website
2. Clicks "Install SmartReview" button
3. Redirected to GitHub App installation page
4. User selects repositories to install on
5. GitHub redirects back to SmartReview
6. Backend automatically creates webhooks for selected repos
7. Future PRs are automatically analyzed

## Deployment

### For Production
1. Deploy backend to a cloud service (Railway, Render, Heroku)
2. Update `WEBHOOK_URL` in `.env` to production URL
3. Update GitHub App webhook URL to production URL
4. Deploy frontend to Vercel/Netlify or serve from backend

### Environment Variables for Production
```env
WEBHOOK_URL=https://your-production-url.com/webhook
GITHUB_APP_ID=your_production_app_id
GITHUB_PRIVATE_KEY=your_production_private_key
```

## API Endpoints

- `GET /health` - Health check
- `POST /webhook` - GitHub webhook handler
- `GET /install` - Redirect to GitHub App installation
- `GET /github/callback` - Handle installation callback

## How It Works

1. **PR Created/Updated**: GitHub sends webhook to SmartReview
2. **Authentication**: Webhook signature verified
3. **Analysis**: LangGraph agent fetches PR files and analyzes code
4. **AI Review**: Groq LLM provides structured feedback
5. **Comment**: Professional review posted on PR

## Security

- Webhook signatures verified using HMAC-SHA256
- GitHub App authentication with JWT
- Installation-specific access tokens
- No persistent storage of sensitive data

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - see LICENSE file for details