import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const user = (() => {
    try {
      const raw = localStorage.getItem('smartreview_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;