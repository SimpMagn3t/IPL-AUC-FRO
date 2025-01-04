// import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <nav style={styles.navbar}>
      <h1 style={styles.logo}>IPL Auction</h1>
      <div style={styles.buttonsContainer}>
        <button style={styles.button} onClick={() => navigate('/create')}>
          Create Room
        </button>
        <button style={styles.button} onClick={() => navigate('/')}>
          Join Room
        </button>
        <button style={styles.button} onClick={() => navigate('/host')}>
          Join as Host
        </button>
      </div>
    </nav>
  );
};

// Inline styles for the Navbar
const styles = {
  navbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 20px',
    top: 0,
    backgroundColor: '#007BFF',
    color: 'white',
  },
  logo: {
    fontSize: '24px',
    fontWeight: 'bold',
  },
  buttonsContainer: {
    display: 'flex',
    gap: '10px',
  },
  button: {
    padding: '8px 16px',
    fontSize: '16px',
    borderRadius: '4px',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: '#0056b3',
    color: 'white',
    transition: 'background-color 0.3s',
  },
};

// Hover effect for the button
styles.button[':hover'] = {
  backgroundColor: '#004085',
};

export default Navbar;
