import { useState } from 'react'
import './App.css'

function App() {
  const [installing, setInstalling] = useState(false)

  const handleInstallApp = () => {
    setInstalling(true)
    // Redirect to GitHub App installation
    window.location.href = 'http://localhost:5000/install'
  }

  return (
    <div className="app">
      <h1>Smart Code Review Agent</h1>
      <div className="hero-section">
        <h2>Automated AI Code Reviews</h2>
        <p>Get intelligent code analysis on every pull request automatically.</p>
        <ul>
          <li>🔍 Security vulnerability detection</li>
          <li>🐛 Bug identification</li>
          <li>⚡ Performance optimization suggestions</li>
          <li>📝 Code quality improvements</li>
        </ul>
      </div>

      <div className="install-section">
        <h3>Install SmartReview on Your Repositories</h3>
        <p>One-click installation sets up automatic code reviews for all your repos.</p>
        <button onClick={handleInstallApp} disabled={installing} className="install-btn">
          {installing ? 'Redirecting to GitHub...' : '🚀 Install SmartReview'}
        </button>
        <p className="note">
          <strong>Note:</strong> You'll be redirected to GitHub to install the app.
          After installation, webhooks will be automatically configured for all selected repositories.
        </p>
      </div>

      <div className="features">
        <h3>How It Works</h3>
        <div className="feature-grid">
          <div className="feature">
            <h4>1. Install App</h4>
            <p>Click install and authorize on GitHub</p>
          </div>
          <div className="feature">
            <h4>2. Select Repos</h4>
            <p>Choose which repositories to monitor</p>
          </div>
          <div className="feature">
            <h4>3. Automatic Reviews</h4>
            <p>AI analyzes every PR automatically</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
