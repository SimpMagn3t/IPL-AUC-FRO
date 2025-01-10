import axios from 'axios';
import React from 'react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom';

const JoinIssue = () => {
    const [roomCode, setRoomCode] = useState('');
        const [hostJoinCode, setHostJoinCode] = useState('');
        const [isHost, setIsHost] = useState(false);
        const [message, setMessage] = useState('');
        const [isJoining, setIsJoining] = useState(false);
        const handleRoomCodeChange = (e) => {
            setRoomCode(e.target.value);
        };
    
        // Handle the user input for host join code
        const handleHostJoinCodeChange = (e) => {
            setHostJoinCode(e.target.value);
        };
        const handleSubmit = async () => {
            if (!roomCode || !hostJoinCode) {
                alert('Please enter both room and host join codes!');
                return;
            }
            setMessage('Wait a second...');
    
            try {
                // Send a POST request to join the room as host
                const response = await axios.post(`${process.env.REACT_APP_API_URL}/joinissue`, { roomCode, joinCode:hostJoinCode, isHost });
    
                if (response.status === 200) {
                    // Successfully joined the room as host
                    setMessage(response.data.message);
    
                    // Redirect to the Host Auction Room page
                }
            } catch (error) {
                // Handle any errors (invalid room code or host join code, etc.)
                setIsJoining(false);
                setMessage(error.response?.data?.message);
            }
        };
        const handleCheckboxChange = (e) => setIsHost(e.target.checked);
    
        return (
            <div style={styles.container}>
              {!isJoining ? (
                <div style={styles.joinSection}>
                  <h2>Enter codes here</h2>
                  <input
                    type="text"
                    placeholder="Enter Room Code"
                    value={roomCode}
                    onChange={handleRoomCodeChange}
                    style={styles.input}
                  />
                  <input
                    type="text"
                    placeholder="Enter Join Code"
                    value={hostJoinCode}
                    onChange={handleHostJoinCodeChange}
                    style={styles.input}
                  />
        
                  {/* Checkbox to select if user is the host */}
                  <div style={styles.checkboxContainer}>
                    <label style={styles.checkboxLabel}>Are you the host?</label>
                    <input
                      type="checkbox"
                      checked={isHost}
                      onChange={handleCheckboxChange}
                      style={styles.checkbox}
                    />
                  </div>
        
                  <button onClick={handleSubmit} style={styles.button}>
                    Resolve issue
                  </button>
        
                  {/* Displaying the message returned from the backend */}
                  {message && <p>{message}</p>}
                </div>
              ) : (
                <div style={styles.roomSection}>
                  <h2>Joining...</h2>
                  <p>{message}</p>
                </div>
              )}
              <p style={{ color: 'black', fontSize: '18px' }}>check "Are you the host ?" button 
                only if the host is having error joining the room</p>
                <footer style={{ textAlign: 'center', padding: '20px', backgroundColor: '#f1f1f1', marginTop: '20px' }}>
  <p style={{ fontSize: '16px', color: '#333' }}>
    With ❤️ from an RCB fan
  </p>
</footer>

            </div>
          );
}
const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#f4f4f4',
        fontFamily: 'Arial, sans-serif',
        flexDirection: 'column',
    },
    joinSection: {
        textAlign: 'center',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '300px',
    },
    roomSection: {
        textAlign: 'center',
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        width: '300px',
    },
    input: {
        width: '80%',
        padding: '10px',
        margin: '10px 0',
        border: '1px solid #ccc',
        borderRadius: '5px',
    },
    button: {
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '5px',
        cursor: 'pointer',
        marginTop: '10px',
    },
};

export default JoinIssue