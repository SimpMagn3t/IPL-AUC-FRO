import axios from 'axios';
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
  const [teamdata, setTeamData] = useState();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("Curating your auction room…");

  const navigate = useNavigate();

  const loadingMessages = [
    "Curating your auction room…",
    "Waking the servers…",
    "Almost there…",
    "Setting up your teams…",
    "Finalizing auction environment…"
  ];

  // 🔄 Rotate loading messages every 1.5 seconds
  useEffect(() => {
    if (!loading) return;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % loadingMessages.length;
      setLoadingText(loadingMessages[index]);
    }, 1500);

    return () => clearInterval(interval);
  }, [loading]);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/createRoom`);
  
      if (response.status === 201) {
        setTeamData(response.data);
      }
    } catch (error) {
      console.log("Error creating room");
    }
    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert(`Copied to clipboard: ${text}`);
  };

  return (
    <>
      {/* ⭐ FULL SCREEN LOADER */}
      {loading && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw",
          height: "100vh",
          background: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          color: "white",
          textAlign: "center"
        }}>
          <div 
            className="loader"
            style={{
              width: "60px",
              height: "60px",
              border: "6px solid white",
              borderTop: "6px solid transparent",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              marginBottom: "20px"
            }}
          ></div>

          <p style={{ fontSize: "20px", maxWidth: "300px" }}>{loadingText}</p>

          {/* Simple spinner keyframe */}
          <style>
            {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            `}
          </style>
        </div>
      )}

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
          <p style={{
            color: "#333",
            fontSize: "16px",
            textAlign: "center",
            marginBottom: "20px",
          }}>
            Copy the room code and team codes and share them with players!
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
            <div style={{ display: "flex", gap: "10px" }}>
              <strong>Room Code:</strong> {teamdata.roomCode}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <strong>Host Join Code:</strong> {teamdata.host.hostJoinCode}
            </div>

            <button
              onClick={() => copyToClipboard(
                `Room Code: ${teamdata.roomCode}\nHost Join Code: ${teamdata.host.hostJoinCode}`
              )}
              style={{
                background: "#4CAF50",
                color: "#ffffff",
                border: "none",
                borderRadius: "5px",
                padding: "5px 10px",
                cursor: "pointer",
                marginTop: "10px"
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
              <div><strong>Team Name:</strong> {team.teamName}</div>
              <div><strong>Team Code:</strong> {team.teamCode}</div>

              <button
                onClick={() =>
                  copyToClipboard(
                    `Team Name: ${team.teamName}\nRoom Code: ${teamdata.roomCode}\nTeam Code: ${team.teamCode}`
                  )
                }
                style={{
                  background: "#2196F3",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "5px",
                  padding: "5px 10px",
                  cursor: "pointer",
                  marginTop: "10px"
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
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            Create a New Auction Room
          </button>

          <p style={{ color: "#777", marginTop: "20px" }}>Already have room codes?</p>

          <button
            onClick={() => navigate("/")}
            style={{
              background: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "5px",
              padding: "10px 20px",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Join Room
          </button>

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
            <p style={{ margin: 0 }}>Made with ❤️ by an RCB Fan</p>

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
      )}
    </>
  );
};

export default CreateRoom;
