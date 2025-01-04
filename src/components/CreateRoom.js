import axios from 'axios';
import React, { useState } from 'react'

const CreateRoom = () => {
  const [teamdata, setTeamData] = useState();
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
  return (
    <>
    {
      teamdata ?
      <div>
        <div>Room created successfully</div>
        <p>copy the roomcode and teamcode and give it to the players in order to login!</p>
        <div>Room Code: {teamdata.roomCode}</div>
        <div>Host Join Code: {teamdata.host.hostJoinCode}</div>
        <div>Host Joined: {teamdata.host.isJoined ? "Yes" : "No"}</div>
        <div>
          <div>Teams:</div>
          {teamdata.teams.map((team, index) => (
            <div key={index} style={{ marginLeft: 20 ,padding: 10, border: '1px solid black', borderRadius: 5, marginTop: 5 }}>
              <div>Team Name: {team.teamName}</div>
              <div>Team Code: {team.teamCode}</div>
            </div>
          ))}
        </div>
      </div>
      :
      <div>
      <div>CreateRoom</div>
        <button onClick={handleCreate}>Create a New Auction room</button>
        <p>Already have room codes?</p>
        <button>Join room</button>
      </div>
    }
    
    </>
  )
}

export default CreateRoom