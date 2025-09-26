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
          // Store JWT if provided
          if (params.has('jwt')) {
            const jwt = params.get('jwt');
            localStorage.setItem('jwt', jwt);
          }
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
    localStorage.removeItem('jwt');
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        {installResult && (
          <div className={`mb-8 p-6 rounded-xl shadow-lg border-l-4 ${installResult.installed ? 'bg-green-50 border-green-500 text-green-800' : 'bg-red-50 border-red-500 text-red-800'} transition-all duration-300`} role="status">
            <div className="flex items-center justify-between max-w-5xl mx-auto">
              <div className="flex items-start space-x-4">
                <div className={`p-2 rounded-full ${installResult.installed ? 'bg-green-100' : 'bg-red-100'}`}>
                  {installResult.installed ? (
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
                <div>
                  {installResult.installed ? (
                    <div className="font-semibold text-lg">SmartReview installed successfully for {installResult.repos} repository(ies).</div>
                  ) : (
                    <div className="font-semibold text-lg">Installation failed: {installResult.error || 'Unknown error'}</div>
                  )}
                  <div className="text-sm opacity-90 mt-1">You can close this tab or continue using the app.</div>
                </div>
              </div>
              <button className="px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 text-gray-700 hover:text-gray-900" onClick={() => setInstallResult(null)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between mb-16">
          <div className="text-left">
            <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-800 mb-6 leading-tight">
              Smart Code Review Agent
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
              Get intelligent AI-powered code analysis on every pull request automatically. Enhance your development workflow with cutting-edge AI technology.
            </p>
          </div>
          <div className="flex items-center gap-6">
            {user ? (
              <div className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-lg border border-gray-100">
                {user.avatar && <img src={user.avatar} alt="avatar" className="w-12 h-12 rounded-full ring-2 ring-blue-100" />}
                <div className="text-sm">
                  <div className="font-semibold text-gray-900">{user.name || user.login}</div>
                  <div className="text-xs text-gray-500">@{user.login}</div>
                </div>
                <a href="/dashboard" className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200">Dashboard</a>
                <button onClick={signOut} className="ml-4 bg-red-50 hover:bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:shadow-sm">
                  Sign out
                </button>
              </div>
            ) : (
              <button onClick={signInWithGitHub} className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-xl flex items-center gap-3 font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.38 7.86 10.9.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.35-1.3-1.71-1.3-1.71-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.76.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.69 0-1.26.45-2.29 1.2-3.1-.12-.3-.52-1.52.11-3.17 0 0 .98-.31 3.2 1.19.93-.26 1.93-.39 2.92-.39.99 0 1.99.13 2.92.39 2.22-1.5 3.2-1.19 3.2-1.19.63 1.65.23 2.87.11 3.17.75.81 1.2 1.84 1.2 3.1 0 4.42-2.7 5.4-5.28 5.68.42.36.79 1.07.79 2.15 0 1.55-.01 2.8-.01 3.18 0 .31.21.68.8.56C20.71 21.38 24 17.08 24 12 24 5.73 18.27.5 12 .5z"/></svg>
                <span>Sign in with GitHub</span>
              </button>
            )}
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-3xl p-12 mb-12 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-black bg-opacity-10"></div>
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Automated AI Code Reviews
              </h2>
              <p className="text-xl md:text-2xl mb-10 opacity-95 max-w-4xl mx-auto leading-relaxed">
                Get intelligent code analysis on every pull request automatically. Enhance your development workflow with cutting-edge AI technology.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                <div className="p-4 bg-white bg-opacity-20 rounded-full">
                  <span className="text-3xl">🔍</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Security Detection</h3>
                  <p className="text-sm opacity-90">Identify vulnerabilities and security issues</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                <div className="p-4 bg-white bg-opacity-20 rounded-full">
                  <span className="text-3xl">🐛</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Bug Identification</h3>
                  <p className="text-sm opacity-90">Catch bugs before they reach production</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                <div className="p-4 bg-white bg-opacity-20 rounded-full">
                  <span className="text-3xl">⚡</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Performance Tips</h3>
                  <p className="text-sm opacity-90">Optimize code for better performance</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white bg-opacity-10 rounded-2xl backdrop-blur-sm hover:bg-opacity-20 transition-all duration-300 transform hover:scale-105">
                <div className="p-4 bg-white bg-opacity-20 rounded-full">
                  <span className="text-3xl">📝</span>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">Code Quality</h3>
                  <p className="text-sm opacity-90">Improve code readability and maintainability</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Install Section */}
        <div className="bg-white rounded-3xl p-12 mb-12 shadow-2xl border border-gray-100 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full -ml-12 -mb-12 opacity-50"></div>
          <div className="relative z-10 text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full mb-6 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Install SmartReview on Your Repositories
              </h3>
              <p className="text-gray-600 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
                One-click installation sets up automatic code reviews for all your repos. Get started in minutes and never miss a code issue again.
              </p>
            </div>
            <button
              onClick={handleInstallApp}
              disabled={installing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-5 px-10 rounded-2xl text-xl transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed disabled:shadow-lg mb-6"
            >
              {installing ? (
                <span className="flex items-center space-x-3">
                  <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Redirecting to GitHub...</span>
                </span>
              ) : (
                <span className="flex items-center space-x-3">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Install SmartReview</span>
                </span>
              )}
            </button>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-2xl mx-auto">
              <div className="flex items-start space-x-3">
                <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-left">
                  <p className="text-sm text-blue-800 font-medium mb-1">Installation Process</p>
                  <p className="text-sm text-blue-700">
                    <strong>Note:</strong> You'll be redirected to GitHub to install the app. After installation, webhooks will be automatically configured for all selected repositories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl p-12 shadow-2xl border border-gray-100">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Get started with SmartReview in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl font-bold text-white">1</span>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-8 h-8 bg-blue-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">Install App</h4>
              <p className="text-gray-600 text-lg leading-relaxed">Click install and authorize SmartReview on GitHub with just one click</p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl font-bold text-white">2</span>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-8 h-8 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">Select Repositories</h4>
              <p className="text-gray-600 text-lg leading-relaxed">Choose which repositories you want SmartReview to monitor and analyze</p>
            </div>
            <div className="text-center group">
              <div className="relative mb-8">
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
                  <span className="text-3xl font-bold text-white">3</span>
                </div>
                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-8 h-8 bg-purple-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </div>
              <h4 className="text-2xl font-semibold text-gray-900 mb-4">Automatic Reviews</h4>
              <p className="text-gray-600 text-lg leading-relaxed">AI analyzes every pull request automatically and provides intelligent feedback</p>
            </div>
          </div>
          
          {/* Additional Features Section */}
          <div className="mt-20 pt-12 border-t border-gray-200">
            <h4 className="text-2xl font-bold text-gray-900 text-center mb-12">Why Choose SmartReview?</h4>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Zero Configuration</h5>
                <p className="text-sm text-gray-600">Works out of the box with no setup required</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Lightning Fast</h5>
                <p className="text-sm text-gray-600">Get reviews in seconds, not minutes</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Enterprise Security</h5>
                <p className="text-sm text-gray-600">Bank-level security for your code</p>
              </div>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 hover:shadow-lg transition-all duration-300">
                <div className="w-16 h-16 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                <h5 className="font-semibold text-gray-900 mb-2">Developer Friendly</h5>
                <p className="text-sm text-gray-600">Clear, actionable feedback you can trust</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;