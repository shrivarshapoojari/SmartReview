import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

function ApiKeySetup({ user, onSetupComplete }) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (user) {
      checkApiKeyStatus();
    }
  }, [user]);

  const checkApiKeyStatus = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/setup-status`);
      setHasApiKey(response.data.has_api_key);
    } catch (err) {
      console.error('Failed to check API key status:', err);
    } finally {
      setChecking(false);
    }
  };

  const validateApiKey = (key) => {
    if (!key || !key.trim()) {
      return 'Please enter your Groq API key';
    }

    const trimmedKey = key.trim();

    // Check if it starts with "gsk_"
    if (!trimmedKey.startsWith('gsk_')) {
      return 'Invalid API key format. Groq API keys must start with "gsk_"';
    }

    // Check minimum length (Groq keys are typically 50+ characters)
    if (trimmedKey.length < 20) {
      return 'API key appears to be too short. Please check your key from Groq Console';
    }

    // Check maximum length (reasonable upper bound)
    if (trimmedKey.length > 200) {
      return 'API key appears to be too long. Please check your key from Groq Console';
    }

    // Check for valid characters (alphanumeric, underscores, hyphens)
    const validKeyPattern = /^gsk_[a-zA-Z0-9_-]+$/;
    if (!validKeyPattern.test(trimmedKey)) {
      return 'API key contains invalid characters. Only letters, numbers, underscores, and hyphens are allowed';
    }

    // Check if it looks like a real Groq key (basic pattern check)
    // Groq keys typically follow: gsk_ followed by a mix of letters, numbers, underscores, hyphens
    const groqKeyPattern = /^gsk_[a-zA-Z0-9_-]{40,}$/;
    if (!groqKeyPattern.test(trimmedKey)) {
      return 'API key format appears incorrect. Please verify you copied the complete key from Groq Console';
    }

    return null; // Valid
  };

  const handleApiKeyChange = (e) => {
    const value = e.target.value;
    setApiKey(value);
    
    // Real-time validation for immediate feedback
    if (value.trim()) {
      const validation = validateApiKey(value);
      setValidationError(validation);
    } else {
      setValidationError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const currentValidationError = validateApiKey(apiKey);
    if (currentValidationError) {
      toast.error(currentValidationError);
      return;
    }

    setSaving(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/setup-key`,
        { api_key: apiKey.trim() },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        }
      );

      toast.success('API key saved successfully!');
      setHasApiKey(true);
      setApiKey('');
      onSetupComplete && onSetupComplete();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save API key');
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <div className="bg-white rounded-3xl p-12 mb-12 shadow-2xl border border-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking setup status...</p>
        </div>
      </div>
    );
  }

  if (hasApiKey) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-3xl p-12 mb-12 shadow-xl">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-green-800 mb-4">
            Setup Complete!
          </h3>
          <p className="text-green-700 mb-6 text-lg">
            Your Groq API key is configured. You can now install SmartReview on your repositories.
          </p>
          <button
            onClick={() => setHasApiKey(false)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Update API Key
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 rounded-3xl p-12 mb-12 shadow-2xl border border-gray-100 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full -mr-16 -mt-16 opacity-50"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100 to-blue-100 rounded-full -ml-12 -mb-12 opacity-50"></div>

      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Configure Your API Key
          </h3>
          <p className="text-gray-600 mb-8 text-lg leading-relaxed">
            To use SmartReview, you need to provide your own Groq API key. This ensures you have full control over your AI usage and costs.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-left">
            <label htmlFor="apiKey" className="block text-sm font-semibold text-gray-700 mb-2">
              Groq API Key
            </label>
            <input
              type="password"
              id="apiKey"
              value={apiKey}
              onChange={handleApiKeyChange}
              placeholder="gsk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${
                validationError ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              required
            />
            {validationError && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {validationError}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-2">
              Get your API key from{' '}
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Groq Console
              </a>
            </p>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
          >
            {saving ? (
              <span className="flex items-center justify-center space-x-3">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              <span>Save API Key</span>
            )}
          </button>
        </form>

        <div className="mt-8 bg-white bg-opacity-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-left">
              <p className="text-sm text-gray-800 font-medium mb-1">Security & Privacy</p>
              <p className="text-sm text-gray-700">
                Your API key is encrypted and stored securely. It will only be used for code analysis on your repositories.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ApiKeySetup;