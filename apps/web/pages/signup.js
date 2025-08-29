import { useState } from 'react';
import { apiFetch } from '../lib/api';

export default function Signup() {
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [message, setMessage] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const data = await apiFetch('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(form)
      });
      setMessage('Signup success: ' + data.user.email);
    } catch (err) {
      setMessage('Error: ' + err.message);
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Signup</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input className="border p-2 w-full" placeholder="Name"
          value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}/>
        <input className="border p-2 w-full" placeholder="Email" type="email"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}/>
        <input className="border p-2 w-full" placeholder="Password" type="password"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}/>
        <button className="bg-blue-600 text-white px-4 py-2 rounded">Sign Up</button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}
