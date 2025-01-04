import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const TeamSelection = () => {
  const [team, setTeam] = useState('');
  const navigate = useNavigate();

  const teams = ['RCB', 'CSK', 'MI', 'KKR', 'SRH', 'DC'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (team) {
      navigate('/auction', { state: { team } });
    }
  };

  return (
    <div>
      <h2>Select Your Team</h2>
      <form onSubmit={handleSubmit}>
        <select value={team} onChange={(e) => setTeam(e.target.value)}>
          <option value="">Choose Team</option>
          {teams.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button type="submit" disabled={!team}>Join Auction</button>
      </form>
    </div>
  );
};

export default TeamSelection;
