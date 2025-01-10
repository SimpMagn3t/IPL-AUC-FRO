import axios from 'axios';
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const [teamdata, setTeamData] = useState();
  const navigate = useNavigate();
const handleCreate = async () => {
    try {
      // Send a POST request to create a new room
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/createRoom`);
  
      if (response.status === 201) {
        // Successfully created the room
        console.log(response.data);
        setTeamData(response.data);
        // Redirect to the Auction Room page
      }
    } catch (error) {
      // Handle any errors (invalid room or team code, etc.)
      // setMessage(error.response?.data?.message || 'Error creating room');
      console.log("Error creating room");
    }; 
};
const copyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  alert(`Copied to clipboard: ${text}`);
};
return (
  <>
    {teamdata ? (
      <div
        style={{
          fontFamily: "Arial, sans-serif",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "600px",
          margin: "20px auto",
        }}
      >
        <h2 style={{ color: "#4CAF50", textAlign: "center" }}>
          Room Created Successfully
        </h2>
        <p
          style={{
            color: "#333",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "20px",
          }}
        >
          Copy the room code and team codes and share them with the players to
          log in!
        </p>

        <div
          style={{
            padding: "15px",
            backgroundColor: "#ffffff",
            border: "1px solid #ddd",
            borderRadius: "10px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "normal",
              alignItems: "center",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Room Code:</div>
            <div>{teamdata.roomCode}</div>

          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "normal",
              alignItems: "center",
              marginTop: "10px",
            }}
          >
            <div style={{ fontWeight: "bold" }}>Host Join Code:</div>
            <div>{teamdata.host.hostJoinCode}</div>
          </div>
          <button
              onClick={() => copyToClipboard(`roomCode:${teamdata.roomCode}
                Host Join Code:${teamdata.host.hostJoinCode}`)}
              style={{
                background: "#4CAF50",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Copy
            </button>
        </div>

        <h3 style={{ color: "#2196F3", textAlign: "center" }}>Teams:</h3>
        {teamdata.teams.map((team, index) => (
          <div
            key={index}
            style={{
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ddd",
              borderRadius: "10px",
              backgroundColor: "#e3f2fd",
            }}
          >
            <div style={{ marginBottom: "5px" }}>
              <strong>Team Name:</strong> {team.teamName}
            </div>
            <div style={{ marginBottom: "5px" }}>
              <strong>Team Code:</strong> {team.teamCode}
            </div>
            <button
              onClick={() => copyToClipboard(`Team Name:${team.teamName}
                Room Code:${teamdata.roomCode}
                Team Code:${team.teamCode}`)}
              style={{
                background: "#2196F3",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Copy Code
            </button>
          </div>
        ))}
      </div>
    ) : (
      <div
        style={{
          textAlign: "center",
          padding: "20px",
          backgroundColor: "#f5f5f5",
          borderRadius: "10px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          maxWidth: "500px",
          margin: "20px auto",
        }}
      >
        <h2 style={{ color: "#4CAF50" }}>Create Room</h2>
        <button
          onClick={handleCreate}
          style={{
            marginTop: "10px",
            background: "linear-gradient(90deg, #42a5f5, #1e88e5)",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Create a New Auction Room
        </button>
        <p style={{ color: "#777", marginTop: "20px" }}>
          Already have room codes?
        </p>
        <button
        onClick={() => navigate("/")}
          style={{
            background: "#ff9800",
            color: "#ffffff",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Join Room
        </button>
      </div>
    )}
  </>
);
}

export default CreateRoom