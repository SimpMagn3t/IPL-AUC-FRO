import React, { useState } from 'react';
import axios from 'axios';

const ReportIssue = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    issue: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/api/report-issue', formData);
      if (response.status === 200) {
        setStatus('Issue reported successfully!');
        setFormData({ name: '', email: '', issue: '' });
      }
    } catch (error) {
      console.error('Error reporting the issue:', error);
      setStatus('Failed to report the issue. Please try again later.');
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px' }}>
      <h2>Report an Issue</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Issue:</label>
          <textarea
            name="issue"
            value={formData.issue}
            onChange={handleChange}
            required
          ></textarea>
        </div>
        <button type="submit">Submit</button>
      </form>
      {status && <p>{status}</p>}
    </div>
  );
};

export default ReportIssue;
