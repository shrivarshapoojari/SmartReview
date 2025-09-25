import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };
  const user = getCookie('user') ? JSON.parse(decodeURIComponent(getCookie('user'))) : null;
  return user ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;