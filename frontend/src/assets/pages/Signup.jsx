// this is the signp.js file for the signup page

import { useState } from 'react';
import axios from 'axios';
//import '../css/Signup.css'; // import the CSS file

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'employee',
  });

  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/api/auth/register`, formData);
      setMessage(res.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Error registering user');
    }
  };

  return (
    <div className="signup-container">
      <form className="signup-form" onSubmit={handleSubmit}>
        <h2>Create User Account</h2>

        <label>Name</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <label>Email</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <label>Password</label>
        <input
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label>Role</label>
        <select name="role" value={formData.role} onChange={handleChange}>
          <option value="employee">Employee</option>
          <option value="hr_manager">HR Manager</option>
          <option value="team_leader">Team Leader</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>

        <button type="submit">Sign Up</button>

        {message && <p className="message">{message}</p>}
      </form>
    </div>
  );
}
