import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      localStorage.setItem('accessToken', data.accessToken);
      setMessage('Login success: ' + data.user.email);
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input className="border p-2 w-full" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
