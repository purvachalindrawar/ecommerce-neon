import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function Me() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  async function fetchMe() {
    try {
      const token = localStorage.getItem('accessToken');
      const data = await apiFetch('/api/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(data.user);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">My Profile</h2>
      <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={fetchMe}>
        Load Profile
      </button>
      {user && <pre className="mt-4">{JSON.stringify(user, null, 2)}</pre>}
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
