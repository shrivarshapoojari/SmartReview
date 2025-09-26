import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function Home() {
  const [installing, setInstalling] = useState(false);
  const [installResult, setInstallResult] = useState(null);
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/user`);
        setUser(response.data);
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);

      // installation result
      if (params.has('installed')) {
        const installed = params.get('installed') === '1';
        const repos = params.has('repos') ? Number(params.get('repos')) : 0;
        const error = params.get('error') || null;
        setInstallResult({ installed, repos, error });
      }

      // OAuth login result
      if (params.has('auth')) {
        const authOk = params.get('auth') === '1';
        if (authOk) {
          // Refetch user after login
          const fetchUser = async () => {
            try {
              const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/user`);
              setUser(response.data);
            } catch (err) {
              setUser(null);
            }
          };
          fetchUser();
        }
      }

      // remove the query params from the URL without reloading
      const url = new URL(window.location.href);
      url.search = '';
      window.history.replaceState({}, document.title, url.toString());
    } catch (e) {
      // ignore
    }
  }, []);

  const handleInstallApp = () => {
    // Require user to be signed in before installing the GitHub App
    if (!user) {
      // redirect to dedicated login page
      navigate('/login');
      return;
    }

    setInstalling(true);
    // Redirect to GitHub App installation
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/install`;
  };

  const signInWithGitHub = () => {
    // start OAuth flow
    window.location.href = `${import.meta.env.VITE_SERVER_URL}/auth/login`;
  };

  const signOut = async () => {
    try {
      await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/logout`, { method: 'POST' });
    } catch (e) {}
    setUser(null);
  };

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
        <div className="flex items-center justify-between mb-12">
          <div className="text-left">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">Smart Code Review Agent</h1>
            <p className="text-xl text-gray-600 max-w-2xl">Get intelligent AI-powered code analysis on every pull request automatically</p>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {user.avatar && <img src={user.avatar} alt="avatar" className="w-10 h-10 rounded-full" />}
                <div className="text-sm text-gray-700">
                  <div className="font-medium">{user.name || user.login}</div>
                  <div className="text-xs text-gray-500">{user.login}</div>
                </div>
                <a href="/dashboard" className="text-blue-600 hover:underline">Dashboard</a>
                <button onClick={signOut} className="ml-3 bg-red-50 text-red-700 px-3 py-1 rounded">Sign out</button>
              </div>
            ) : (
              <button onClick={signInWithGitHub} className="bg-black text-white px-4 py-2 rounded flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.69 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.52.11-3.17 0 0 .98-.31 3.2 1.19.93-.26 1.93-.39 2.92-.39.99 0 1.99.13 2.92.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.65.23 2.87.11 3.17.75.81 1.2 1.84 1.2 3.1 0 4.42-2.7 5.4-5.28 5.68.42.36.79 1.07.79 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.71 21.38 24 17.08 24 12 24 5.73 18.27.5 12 .5z"/></svg>
                <span>Sign in with GitHub</span>
              </button>
            )}
          </div>
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
  );
}

export default Home;