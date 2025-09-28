import axios from 'axios';
import toast from 'react-hot-toast';

function ApiKeySuccess({ onUpdateKey, onDeleteKey, deleting }) {
  const handleDeleteApiKey = async () => {
    onDeleteKey();
  };

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
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={onUpdateKey}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200"
          >
            Update API Key
          </button>
          <button
            onClick={handleDeleteApiKey}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:cursor-not-allowed"
          >
            {deleting ? (
              <span className="flex items-center space-x-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Deleting...</span>
              </span>
            ) : (
              'Delete API Key'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApiKeySuccess;