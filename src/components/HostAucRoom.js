import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';

const HostAucRoom = () => {
    const { roomCode } = useParams(); // Host only needs the room code
    const [players, setPlayers] = useState([]); // State to hold the player list
    const [loading, setLoading] = useState(true); // Loading state
    const [error, setError] = useState(null); // Error state
    const [auctionState, setAuctionState] = useState(null);
    const [validBid, setValidBid] = useState(false);
    const[soldList,setSoldList]=useState(null);
    const[unsoldList,setUnsoldList]=useState(null);
    // Ref to ensure a single socket instance
    const socketRef = useRef(null);
    const [teams, setTeams] = useState([
            { name: 'CSK', status: false },
            { name: 'DC', status: false },
            { name: 'GT', status: false },
            { name: 'KKR', status: false },
            { name: 'LSG', status: false },
            { name: 'MI', status: false },
            { name: 'PBKS', status: false },
            { name: 'RCB', status: false },
            { name: 'RR', status: false },
            { name: 'SRH', status: false },
            { name: 'host', status: false },
          ]);
    useEffect(() => {
        console.log('abhi to ye hai',auctionState);
        // Function to fetch players
        const fetchSold = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/getUnsold`, {
                    params: { roomCode }, // Replace 'YourTeamName' with a dynamic value if necessary
                });
                setSoldList(response.data.sold); // Handle case where `sold` might be undefined
                return response.data.sold || [];
            } catch (error) {
                setError('Failed to fetch sold/unsold players. Please try again later.');
                return []; // Return empty array in case of an error
            }
        };
    
        const fetchPlayers = async (soldList) => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/players`);
                let allPlayers = response.data || [];
                console.log(process.env.REACT_APP_API_URL);
                console.log('all players',allPlayers);
                allPlayers.sort((a, b) => a.SetNo - b.SetNo);
                const soldIds = new Set(soldList);
                const remainingPlayers = allPlayers.filter((player) => !soldIds.has(player._id));
    
                setPlayers(remainingPlayers); // Update players with filtered list
                setLoading(false); // Stop loading indicator
            } catch (error) {
                console.error('Error fetching players:', error);
                setError('Failed to fetch players. Please try again later.');
                setLoading(false);
            }
        };
    
        const fetchData = async () => {
            const soldList = await fetchSold(); // Fetch sold players first
            console.log("sold list fetched",soldList)
            await fetchPlayers(soldList); // Fetch and filter players next
        };
    
        fetchData();
        if (!socketRef.current) {
            console.log('Creating socket connection for host...');
            socketRef.current = io(`${process.env.REACT_APP_API_URL}`);

            socketRef.current.on('connect', () => {
                console.log(`Host connected with socket ID: ${socketRef.current.id}`);
                
                // Emit joinRoom event for the host after a slight delay
                setTimeout(() => {
                    socketRef.current.emit('joinRoomAsHost', { roomCode });
                }, 1000);
                console.log(socketRef.data);
                
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error for host:', error.message);
            });
            socketRef.current.on('currentAuctionStateHost', (state) => {
              console.log('Current auction state received:', state);
              setAuctionState(state.currentAuctionItem); // Update state with server's data
              console.log('aab gyaa aa gaya',auctionState);
              setValidBid(state.validBid);
              const{currBidderName,currentBid}=state;  
              setAuctionState((prevState) => ({
                ...prevState,
                currentBid,
                currBidderName,
            }));
          });
            // Listen for updates from the server
            socketRef.current.on('roomUpdate', (data) => {
                console.log('Room update received:', data);
            });

            socketRef.current.on('teamJoined', (teamInfo) => {
                console.log(`Team joined: ${teamInfo.teamName} (${teamInfo.teamCode})`);
            });
            socketRef.current.on('newUser', ({teamOnStatus,message}) => {
                console.log(message);
                // Update the team status
                setTeams(teamOnStatus);
              });
            socketRef.current.on('error', (errorMessage) => {
                console.error('Error:', errorMessage);
            });
            socketRef.current.on('auctionUpdate', (data) => {
                console.log('Auction updated:', data);
                setValidBid(true);
                setWarnCount(0);
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid: data.newBidAmount,
                    currBidder: data.newBidder,
                    currBidderName: data.newBidderName
                }));
            });
        }

        // Cleanup function
        return () => {
            if (socketRef.current) {
                console.log('Cleaning up host socket connection...');
                socketRef.current.emit('hostdisconnect', { roomCode });
                socketRef.current.disconnect();
                socketRef.current = null; // Reset the socket instance
            }
        };
    }, [roomCode]);
    const addToPod = (player) => {
        const playerDetails = {
            id: player._id,
            setNo: player.SetNo,
            set: player.Set,
            name: `${player.FirstName} ${player.Surname}`,
            specialism: player.Specialism,
            basePrice: player.BasePrice,
            preTeam: player.PreTeam,
            currentBid: player.BasePrice,
        };
        setValidBid(false);
        setAuctionState(playerDetails);
        if (socketRef.current) {
          // Emit the new item to all participants in the room
          socketRef.current.emit('newItem', {
              roomCode, 
              playerDetails,
          });
  
          console.log(`New item added to the podium: ${player.FirstName} ${player.Surname}`);
        } 
        else{
          console.error('Socket connection not established.');
        }
  };
  const [warnCount, setWarnCount] = useState(0);
  const issueWarning = () => {
    let warningMesssage='';
    if(warnCount<3){
    if(warnCount===0){
        const newBidAmount=bidInCalc(auctionState.currentBid);
        warningMesssage = `Any team for ₹${newBidAmount}`;
    }
    if(warnCount===1){
        warningMesssage = `No bids then?`;
    }
    if(warnCount===2){
        if(validBid){
            warningMesssage = ` we will the sell the player to ${auctionState.currBidderName},last warning everyone`;
        }
        else
            warningMesssage='The player will remain usold then,last warning to everyone';
    }
    if (socketRef.current) {
        // Emit the new item to all participants in the room
        socketRef.current.emit('warnMsg', {
            roomCode,
            warningMesssage
        });
        console.log(warningMesssage);
      } 
      else{
        console.error('Socket connection not established.');
      }
    setWarnCount(warnCount+1);
}   
    else if(warnCount===3){
        if(validBid){
            socketRef.current.emit('playerSoldServ', {
                roomCode,
                soldState:auctionState
            });
        }
        else
        {
            socketRef.current.emit('playerUnsoldServ', {
                roomCode
            });
            warningMesssage='The player will remain usold then';
        }
        setAuctionState(null);
        console.log(`auction state is`,auctionState)
        setValidBid(false);
        setWarnCount(0);
    }
};
  const bidInCalc=(currentBid)=>{
    let bidIncrement = 0;
        if (currentBid < 200) {
            bidIncrement = 10;
        } else if (currentBid >= 200 && currentBid < 500) {
            bidIncrement = 25;
        } else if (currentBid >= 500) {
            bidIncrement = 50;
        }

        if (!validBid) bidIncrement = 0;

    const newBidAmount = currentBid + bidIncrement;
    return newBidAmount;
  }
  
  return (
    <div>
        <h2>Host Auction Room</h2>
        <p>Room Code: {roomCode}</p>
        <p>You are managing this auction room as the host.</p>

        {/* Display the current player on the podium */}
        <div style={{ margin: '20px 0', padding: '10px', border: '1px solid black', borderRadius: '10px' }}>
            <h3>Current Player on Podium</h3>
            {auctionState ? (
                <div>
                    <p>
                        <strong>Name:</strong> {auctionState.name}
                    </p>
                    <p>
                        <strong>Specialism:</strong> {auctionState.specialism}
                    </p>
                    <p>
                        <strong>Base Price:</strong> ₹{auctionState.basePrice} lakhs
                    </p>
                    <p> pre team:{auctionState.preTeam}</p>
                    {validBid && <div><p>Current Bid: ₹{auctionState.currentBid} lakhs</p>
                    <p>Highest Bidder:{auctionState.currBidderName}</p>
                    <button onClick={()=>issueWarning()}>sell player ({3-warnCount})</button>
                    </div> }
                    {!validBid && <button onClick={()=>issueWarning()}>Remove player</button>}
                </div>
            ) : (
                <p style={{ color: 'gray' }}>No player on the podium.</p>
            )}
        </div>

        {loading ? (
            <p>Loading players...</p>
        ) : error ? (
            <p style={{ color: 'red' }}>{error}</p>
        ) : players.length > 0 ? (
            <div>
                <h3>Players List</h3>
                <ul>
                {players.map((player, index) => (
    <li key={index} style={{ marginBottom: '10px' }}>
        <div>
            <button onClick={() => addToPod(player)}>
                {player.SetNo} {player.Set} 
                <strong> {player.FirstName} {player.Surname}</strong> - {player.Specialism} - Base Price: ₹{player.BasePrice} lakhs
            </button>
        </div>
    </li>
))}

                </ul>
            </div>
        ) : (
            <p>No players available for the auction.</p>
        )}
        <div
                style={{
                    position: 'absolute',
                    right: '20px',
                    top: '20px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    backgroundColor: '#f1f1f1',
                }}
            >
                <h4>Team Status</h4>
                <ul style={{ listStyle: 'none', padding: '0', margin: '0' }}>
                    {teams.map((team, index) => (
                        <li key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '5px' }}>
                            <span
                                style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    backgroundColor: team.status ? 'green' : 'red',
                                    display: 'inline-block',
                                    marginRight: '10px',
                                }}
                            ></span>
                            {team.name}
                        </li>
                    ))}
                </ul>
            </div>
    </div>
);

};

export default HostAucRoom;
