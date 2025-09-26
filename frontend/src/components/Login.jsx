import { useNavigate } from 'react-router-dom';

function Login() {
  const navigate = useNavigate();

  const signInWithGitHub = () => {
    // start OAuth flow
    window.location.href = `${process.env.SERVER_URL}/auth/login`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-4">Sign in with GitHub</h2>
        <p className="text-sm text-gray-600 mb-6">You need to sign in to install SmartReview into your repositories.</p>
        <button onClick={signInWithGitHub} className="bg-black text-white px-6 py-3 rounded mb-4 flex items-center justify-center mx-auto">Sign in with GitHub</button>
        <div>
          <button onClick={() => navigate('/')} className="text-sm text-gray-500">Back to home</button>
        </div>
      </div>
    </div>
  );
}

export default Login;