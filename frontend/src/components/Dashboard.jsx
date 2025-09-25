import { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
  const [installations, setInstallations] = useState([]);
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem('smartreview_user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const fetchInstallations = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/installations');
        const data = response.data;
        if (data.error) {
          alert('Error: ' + data.error);
        } else {
          setInstallations(data.installations);
        }
      } catch (err) {
        console.error(err);
        alert('Failed to fetch installations');
      } finally {
        setLoading(false);
      }
    };

    fetchInstallations();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
        <p className="mb-4">Welcome, {user.name || user.login}!</p>
        <h2 className="text-xl font-semibold mb-4">Installed Apps</h2>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <ul className="space-y-2">
            {installations.map(inst => (
              <li key={inst.id} className="bg-white p-4 rounded shadow">
                <div className="font-medium">Installed on {inst.account.login}'s repositories</div>
                <div className="text-sm text-gray-600">Repository selection: {inst.repository_selection}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Dashboard;