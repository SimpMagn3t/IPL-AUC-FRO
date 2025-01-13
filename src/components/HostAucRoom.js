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
    const [soldList, setSoldList] = useState(null);
    const [unsoldList, setUnsoldList] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [warning, setWarning] = useState('');
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
            await fetchPlayers(soldList); // Fetch and filter players next
        };

        fetchData();
        if (!socketRef.current) {
            console.log('Creating socket connection for host...');
            socketRef.current = io(`${process.env.REACT_APP_API_URL}`);

            socketRef.current.on('connect', () => {

                // Emit joinRoom event for the host after a slight delay
                setTimeout(() => {
                    socketRef.current.emit('joinRoomAsHost', { roomCode });
                }, 1000);

            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error for host:', error.message);
            });
            socketRef.current.on('receiveMessage', (message) => {
                if (message.teamName != 'Host') {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            });
            socketRef.current.on('currentAuctionStateHost', (state) => {
                setAuctionState(state.currentAuctionItem); // Update state with server's data
                setValidBid(state.validBid);
                const { currBidderName, currentBid } = state;
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid,
                    currBidderName,
                }));
            });
            socketRef.current.on('playerSold', (soldState) => {
                setWarning(`Player sold to . ${soldState.currBidderName}`);
                setTimeout(() => {
                    setWarning('');
                }, 5000);
                setAuctionState(null);
                setValidBid(false);
                setWarnCount(0);
                setPlayers((prevPlayers) => prevPlayers.filter((player) => player._id !== soldState.id));
            });
            socketRef.current.on('playerUnsold', () => {
                setAuctionState(null);
                setValidBid(false);
                setWarnCount(0);
            });
            // Listen for updates from the server
            socketRef.current.on('newUser', ({ teamOnStatus, message }) => {
                // Update the team status
                setTeams(teamOnStatus);
            });
            socketRef.current.on('rtmUpdate', ({ soldState, message }) => {
                setWarning(`RTM in progress. ${soldState.rtmTeamName} is choosing to use RTM or not.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
            });
            socketRef.current.on('finalBidMatch', ({ soldState, finalBid }) => {
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid: finalBid,
                }));
                setWarning(`RTM opportunity for team: ${soldState.soldState.rtmTeamName} ${soldState.soldState.currBidderName} made a final bid of ₹${finalBid} lakhs.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
            });
            socketRef.current.on('error', (errorMessage) => {
                console.error('Error:', errorMessage);
            });
            socketRef.current.on('auctionUpdate', (data) => {
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

        }
        else {
            console.error('Socket connection not established.');
        }
    };
    const [warnCount, setWarnCount] = useState(0);
    const issueWarning = () => {
        let warningMesssage = '';
        if (warnCount < 3) {
            if (warnCount === 0) {
                const newBidAmount = bidInCalc(auctionState.currentBid);
                warningMesssage = `Any team for ₹${newBidAmount}`;
            }
            if (warnCount === 1) {
                warningMesssage = `No bids then?`;
            }
            if (warnCount === 2) {
                if (validBid) {
                    warningMesssage = ` we will the sell the player to ${auctionState.currBidderName},last warning everyone`;
                }
                else
                    warningMesssage = 'The player will remain usold then,last warning to everyone';
            }
            if (socketRef.current) {
                // Emit the new item to all participants in the room
                socketRef.current.emit('warnMsg', {
                    roomCode,
                    warningMesssage
                });
            }
            else {
                console.error('Socket connection not established.');
            }
            setWarnCount(warnCount + 1);
        }
        else if (warnCount === 3) {
            if (validBid) {
                socketRef.current.emit('playerSoldServ', {
                    roomCode,
                    soldState: auctionState
                });
            }
            else {
                socketRef.current.emit('playerUnsoldServ', {
                    roomCode
                });
                warningMesssage = 'The player will remain usold then';
            }
        }
    };
    const bidInCalc = (currentBid) => {
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
    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            const messageData = {
                roomCode,
                teamName: 'Host',
                message: inputMessage,
            };
            // Emit the message
            socketRef.current.emit('sendMessage', messageData);
            // Add the message locally
            setMessages((prevMessages) => [
                ...prevMessages,
                { ...messageData, timestamp: new Date().toISOString() },
            ]);

            // Clear the input
            setInputMessage('');
        }
    };
    const [searchTerm, setSearchTerm] = useState(''); // State for search input

    // Filtered players based on search term
    const filteredPlayers = players.filter((player) => {
        const fullName = `${player.FirstName} ${player.Surname}`.toLowerCase();
        return (
            fullName.includes(searchTerm.toLowerCase()) ||
            player.Specialism.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', margin: '20px', padding: '10px' }}>
            <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px' }}>Host Auction Room</h2>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {/* Left Column: Podium and Team Status */}
                <div style={{ flex: '1', marginRight: '20px' }}>
                    {/* Current Player on Podium */}
                    <div
                        style={{
                            padding: '20px',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                            backgroundColor: '#f9f9f9',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                            marginBottom: '20px',
                        }}
                    >
                        <h3 style={{ color: '#555', marginBottom: '10px' }}>Current Player on Podium</h3>
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
                                <p>
                                    <strong>Previous Team:</strong> {auctionState.preTeam}
                                </p>
                                {validBid ? (
                                    <div>
                                        <p>
                                            <strong>Current Bid:</strong> ₹{auctionState.currentBid} lakhs
                                        </p>
                                        <p>
                                            <strong>Highest Bidder:</strong> {auctionState.currBidderName}
                                        </p>
                                        <button
                                            onClick={() => issueWarning()}
                                            style={{
                                                padding: '10px 15px',
                                                backgroundColor: '#4CAF50',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Sell Player ({3 - warnCount})
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => issueWarning()}
                                        style={{
                                            padding: '10px 15px',
                                            backgroundColor: '#FF5722',
                                            color: '#fff',
                                            border: 'none',
                                            borderRadius: '41px',
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Remove Player ({3 - warnCount})
                                    </button>
                                )}
                            </div>
                        ) : (
                            <p style={{ color: 'gray' }}>No player on the podium.</p>
                        )}
                    </div>

                    {/* Team Status */}
                    <div
                        style={{
                            padding: '20px',
                            border: '1px solid #ccc',
                            borderRadius: '10px',
                            backgroundColor: '#f9f9f9',
                            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        }}
                    >
                        <h4 style={{ color: '#555', marginBottom: '10px' }}>Team Status</h4>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                gap: '20px',
                            }}
                        >
                            {/* Left Column */}
                            <ul style={{ listStyle: 'none', padding: '0', margin: '0', flex: 1 }}>
                                {teams
                                    .filter((team) => team.name !== 'host') // Exclude user's team
                                    .filter((_, index) => index % 2 === 0) // First column: even-indexed teams
                                    .map((team, index) => (
                                        <li
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '10px',
                                            }}
                                        >
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

                            {/* Right Column */}
                            <ul style={{ listStyle: 'none', padding: '0', margin: '0', flex: 1 }}>
                                {teams
                                    .filter((team) => team.name !== 'host') // Exclude user's team
                                    .filter((_, index) => index % 2 !== 0) // Second column: odd-indexed teams
                                    .map((team, index) => (
                                        <li
                                            key={index}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                marginBottom: '10px',
                                            }}
                                        >
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
                </div>

                {/* Center Column: Players List */}
                <div
                    style={{
                        flex: '2',
                        marginRight: '20px',
                        padding: '20px',
                        border: '1px solid #ccc',
                        borderRadius: '10px',
                        backgroundColor: '#fff',
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {loading ? (
                        <p>Loading players...</p>
                    ) : error ? (
                        <p style={{ color: 'red' }}>{error}</p>
                    ) : players.length > 0 ? (
                        <div>
                            <h3 style={{ marginBottom: '15px', color: '#333' }}>Players List</h3>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Search players by name or specialism..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    marginBottom: '15px',
                                    borderRadius: '5px',
                                    border: '1px solid #ccc',
                                }}
                            />
                            <ul
                                style={{
                                    listStyleType: 'none',
                                    padding: '0',
                                    maxHeight: '400px',
                                    overflowY: 'auto',
                                    border: '1px solid #eee',
                                    borderRadius: '5px',
                                    backgroundColor: '#fafafa',
                                }}
                            >
                                {filteredPlayers.map((player, index) => (
                                    <li
                                        key={index}
                                        style={{
                                            marginBottom: '10px',
                                            borderBottom: '1px solid #ddd',
                                            paddingBottom: '10px',
                                        }}
                                    >
                                        <button
                                            onClick={() => addToPod(player)}
                                            style={{
                                                width: '100%',
                                                padding: '10px 15px',
                                                textAlign: 'left',
                                                backgroundColor: '#f4f4f4',
                                                border: '1px solid #ccc',
                                                borderRadius: '5px',
                                                cursor: 'pointer',
                                                transition: 'background-color 0.3s',
                                            }}
                                            onMouseOver={(e) =>
                                                (e.target.style.backgroundColor = '#eaeaea')
                                            }
                                            onMouseOut={(e) =>
                                                (e.target.style.backgroundColor = '#f4f4f4')
                                            }
                                        >
                                            <strong>
                                                {player.SetNo} {player.Set} - {player.FirstName}{' '}
                                                {player.Surname}
                                            </strong>{' '}
                                            - {player.Specialism} - Base Price: ₹{player.BasePrice}{' '}
                                            lakhs
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>No players available for the auction.</p>
                    )}
                </div>
                {warning && (
                            <div
                                style={{
                                    position: "fixed",
                                    bottom: "200px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    backgroundColor: "#f8d7da",
                                    color: "#721c24",
                                    padding: "15px 30px",
                                    borderRadius: "5px",
                                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
                                    animation: "popOut 4s ease-out",
                                }}
                            >
                                {warning}
                            </div>
                        )}
                <div
                    style={{
                        flex: '1',
                        padding: '20px',
                        border: '1px solid #ccc',
                        borderRadius: '10px',
                        backgroundColor: '#F5F7FA', // Light background
                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                        display: 'flex',
                        flexDirection: 'column',
                        height: '500px',
                    }}
                >
                    <h4 style={{ marginBottom: '10px', color: '#2C3E50' }}>Chat</h4>
                    {/* Chat Messages */}
                    <div
                        style={{
                            flex: 1,
                            overflowY: 'auto',
                            marginBottom: '15px',
                            border: '1px solid #ddd',
                            borderRadius: '5px',
                            padding: '10px',
                            backgroundColor: '#FFFFFF', // White background for the chat area
                        }}
                    >
                        {messages.length > 0 ? (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    style={{
                                        marginBottom: '10px',
                                        textAlign: msg.teamName === 'Host' ? 'right' : 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            backgroundColor:
                                                msg.teamName === 'Host' ? '#A3E4D7' : '#F9E79F', // Green for own messages, yellow for others
                                            padding: '10px',
                                            borderRadius: '10px',
                                            maxWidth: '80%',
                                        }}
                                    >
                                        <p
                                            style={{
                                                margin: 0,
                                                fontWeight: 'bold',
                                                fontSize: '12px',
                                                color: '#34495E', // Dark grey for sender name
                                            }}
                                        >
                                            {msg.teamName}
                                        </p>
                                        <p style={{ margin: 0, color: '#2C3E50' }}>{msg.message}</p>
                                        <p
                                            style={{
                                                margin: 0,
                                                fontSize: '10px',
                                                color: 'gray',
                                                textAlign: 'right',
                                            }}
                                        >
                                            {new Date(msg.timestamp).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'gray' }}>No messages yet.</p>
                        )}
                    </div>
                    {/* Input and Send Button */}
                    <div style={{ display: 'flex' }}>
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Type a message"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                            style={{
                                flex: 1,
                                padding: '10px',
                                borderRadius: '5px',
                                border: '1px solid #BDC3C7',
                                marginRight: '10px',
                                backgroundColor: '#ECF0F1', // Light grey for input
                            }}
                        />
                        <button
                            onClick={handleSendMessage}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#5DADE2', // Vibrant blue for send button
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Send
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );


};

export default HostAucRoom;
