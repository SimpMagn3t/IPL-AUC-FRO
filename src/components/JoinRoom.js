import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // for redirecting after joining
import axios from 'axios';

const JoinRoom = () => {
    const [roomCode, setRoomCode] = useState('');
    const [teamCode, setTeamCode] = useState('');
    const [message, setMessage] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const navigate = useNavigate(); // Hook to navigate to different routes

    // Handle the user input for room code
    const handleRoomCodeChange = (e) => {
        setRoomCode(e.target.value);
    };

    // Handle the user input for team code
    const handleTeamCodeChange = (e) => {
        setTeamCode(e.target.value);
    };

    // Handle joining the room
    const handleJoinRoom = async () => {
        if (!roomCode || !teamCode) {
            alert('Please enter both room and team codes!');
            return;
        }
        setMessage('Joining the room...');

        try {
            // Send a POST request to join the room
            const response = await axios.post(`${process.env.REACT_APP_API_URL}/joinRoom`, { roomCode, teamCode });

            if (response.status === 200) {
                // Successfully joined the room
                console.log(response.data);
                // console.log(response.data.teamName);
                // Redirect to the Auction Room page
                navigate(`/auction/${roomCode}/${teamCode}`, {
                    state: {
                        // teamName: response.data.teamName,
                        teamInfo: response.data,
                    },
                });
            }
        } catch (error) {
            // Handle any errors (invalid room or team code, etc.)
            setIsJoining(false);
            setMessage(error.response?.data?.message || 'Error joining room');
        }
    };

    // Render the UI
    return (
        <div style={styles.container}>
            {!isJoining ? (
                <div style={styles.joinSection}>
                    <h2>Join an Auction Room</h2>
                    <input
                        type="text"
                        placeholder="Enter Room Code"
                        value={roomCode}
                        onChange={handleRoomCodeChange}
                        style={styles.input}
                    />
                    <input
                        type="text"
                        placeholder="Enter Team Code"
                        value={teamCode}
                        onChange={handleTeamCodeChange}
                        style={styles.input}
                    />
                    <button onClick={handleJoinRoom} style={styles.button}>
                        Join Room
                    </button>
                    {message && <p>{message}</p>}
                </div>
            ) : (
                <div style={styles.roomSection}>
                    <h2>Joining...</h2>
                    <p>{message}</p>
                </div>
            )}
             <p style={{ color: 'red', fontSize: '18px' }}>
        Error joining room?{' '}
        <Link
          to="/joinissue" // Redirects to the Join Issue page
          style={{
            color: '#ff9800',
            fontWeight: 'bold',
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Click here
        </Link>
      </p>
      <div
    style={{
        marginTop: "40px",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#1B2631",
        color: "white",
        borderRadius: "10px",
    }}
>
    <p style={{ margin: "0", fontSize: "14px" }}>
        Made with ❤️ by an RCB Fan
    </p>

    <a
        target="_blank" 
        rel="noopener noreferrer"
        href="/support"
        style={{
            color: "#5DADE2",
            textDecoration: "underline",
            display: "block",
            marginTop: "8px",
        }}
    >
        Help us keep this project running.
    </a>

    <a
        href="mailto:your-email@gmail.com"
        style={{
            color: "#F7DC6F",
            display: "block",
            marginTop: "5px",
        }}
    >
        Send me a message or feedback
    </a>
</div>

        </div>

    );
};

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

export default JoinRoom;
