import { useState, useEffect } from 'react'

function App() {
  const [installing, setInstalling] = useState(false)
  const [installResult, setInstallResult] = useState(null)

  const handleInstallApp = () => {
    setInstalling(true)
    // Redirect to GitHub App installation
    window.location.href = 'http://localhost:5000/install'
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (params.has('installed')) {
        const installed = params.get('installed') === '1'
        const repos = params.has('repos') ? Number(params.get('repos')) : 0
        const error = params.get('error') || null
        setInstallResult({ installed, repos, error })

        // remove the query params from the URL without reloading
        const url = new URL(window.location.href)
        url.search = ''
        window.history.replaceState({}, document.title, url.toString())
      }
    } catch (e) {
      // ignore
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        {installResult && (
          <div className={`mb-6 p-4 rounded-lg ${installResult.installed ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`} role="status">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div>
                {installResult.installed ? (
                  <div className="font-medium">SmartReview installed successfully for {installResult.repos} repository(ies).</div>
                ) : (
                  <div className="font-medium">Installation failed: {installResult.error || 'Unknown error'}</div>
                )}
                <div className="text-sm opacity-90">You can close this tab or continue using the app.</div>
              </div>
              <div>
                <button className="px-3 py-1 bg-white rounded-md shadow-sm" onClick={() => setInstallResult(null)}>Dismiss</button>
              </div>
            </div>
          </div>
        )}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Smart Code Review Agent
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get intelligent AI-powered code analysis on every pull request automatically
          </p>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 mb-8 text-white shadow-xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6">Automated AI Code Reviews</h2>
            <p className="text-xl mb-8 opacity-90">
              Get intelligent code analysis on every pull request automatically.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🔍</span>
                <span className="font-medium">Security Detection</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">🐛</span>
                <span className="font-medium">Bug Identification</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">⚡</span>
                <span className="font-medium">Performance Tips</span>
              </div>
              <div className="flex items-center justify-center space-x-3">
                <span className="text-2xl">📝</span>
                <span className="font-medium">Code Quality</span>
              </div>
            </div>
          </div>
        </div>

        {/* Install Section */}
        <div className="bg-white rounded-2xl p-8 mb-8 shadow-lg border border-gray-200">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Install SmartReview on Your Repositories
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              One-click installation sets up automatic code reviews for all your repos.
            </p>
            <button
              onClick={handleInstallApp}
              disabled={installing}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:cursor-not-allowed"
            >
              {installing ? (
                <span className="flex items-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting to GitHub...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-2">
                  <span className="text-xl">🚀</span>
                  <span>Install SmartReview</span>
                </span>
              )}
            </button>
            <p className="text-sm text-gray-500 mt-4 italic max-w-lg mx-auto">
              <strong>Note:</strong> You'll be redirected to GitHub to install the app.
              After installation, webhooks will be automatically configured for all selected repositories.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Install App</h4>
              <p className="text-gray-600">Click install and authorize on GitHub</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Select Repos</h4>
              <p className="text-gray-600">Choose which repositories to monitor</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Automatic Reviews</h4>
              <p className="text-gray-600">AI analyzes every PR automatically</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
