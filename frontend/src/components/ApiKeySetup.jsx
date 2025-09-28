import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ApiKeyForm from './ApiKeyForm';
import ApiKeySuccess from './ApiKeySuccess';
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

function ApiKeySetup({ user, onSetupComplete }) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [checking, setChecking] = useState(true);
  const [validationError, setValidationError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDeleteApiKey = async () => {
    setDeleting(true);
    setShowDeleteConfirm(false);

    try {
      const response = await axios.delete(
        `${import.meta.env.VITE_SERVER_URL}/api/setup-key`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('jwt')}`
          }
        }
      );

      toast.success('API key deleted successfully!');
      setHasApiKey(false);
      onSetupComplete && onSetupComplete();
    } catch (err) {
      if (err.response?.status === 404) {
        toast.error('No API key found to delete');
      } else {
        toast.error(err.response?.data?.error || 'Failed to delete API key');
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleUpdateKey = () => {
    setHasApiKey(false);
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
      <>
        <ApiKeySuccess
          onUpdateKey={handleUpdateKey}
          onDeleteKey={() => setShowDeleteConfirm(true)}
          deleting={deleting}
        />
        <DeleteConfirmationDialog
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={handleDeleteApiKey}
          deleting={deleting}
        />
      </>
    );
  }

  return (
    <>
      <ApiKeyForm
        apiKey={apiKey}
        setApiKey={setApiKey}
        validationError={validationError}
        setValidationError={setValidationError}
        saving={saving}
        setSaving={setSaving}
        onSetupComplete={onSetupComplete}
      />
      <DeleteConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteApiKey}
        deleting={deleting}
      />
    </>
  );
}

export default ApiKeySetup;