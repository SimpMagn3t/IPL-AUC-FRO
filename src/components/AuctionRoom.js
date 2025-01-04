import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useParams , useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';

const AuctionRoom = () => {
    const { roomCode, teamCode } = useParams();
    const { state } = useLocation();
    const { teamInfo } = state || {};
    const teamName=teamInfo.teamName;
    console.log( "team name is ",teamName, teamInfo.teamName);
    const [teamState, setTeamState] = useState(null);
    const [errorPrompt, setErrorPrompt] = useState(''); // State for error messages
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [warning, setWarning] = useState('');
    const [isRTMAvailable, setIsRTMAvailable] = useState(false); // State for RTM availability
    const [finalBid, setFinalBid] = useState("");
    const [showFinalBidInput, setShowFinalBidInput] = useState(false);
    const rtmTimerRef = useRef(null); // Persistent timer reference
      
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
        

    const defa={
        currentAuctionItem: null,
        currentBid: 0,
        currBidder: null,
        currBidderName: null,
        validBid: false,
    };
    const [auctionState, setAuctionState] = useState(defa);
    const [errorMessage, setErrorMessage] = useState(null); // To handle errors
    const socketRef = useRef(null); // Ref to ensure a single socket instance

    useEffect(() => {
      const fetchTeamInfo = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/getTeamInfo`, {
                params: { roomCode, teamCode, teamName }, // Replace 'YourTeamName' with a dynamic value if necessary
            });
            setTeamState(response.data);
            console.log('Team info fetched successfully:', teamState);
            console.log('Team info fetched successfully:', response.data);
        } catch (error) {
            console.error('Error fetching team info:', error);
            setErrorMessage('Failed to fetch team info. Please try again.');
        }
    };
    console.log('info',teamState);
    // fetchTeamInfo();
    fetchTeamInfo();
        if (!socketRef.current) {
            console.log('Creating socket connection...');
            socketRef.current = io(`${process.env.REACT_APP_API_URL}`);

            socketRef.current.on('connect', () => {
                console.log(`Connected to the server with socket ID: ${socketRef.current.id}`);
                
                // Emit joinRoom event after connection
                setTimeout(() => {
                    socketRef.current.emit('joinRoom', { roomCode, teamCode });
                    console.log(`Emitted joinRoom for roomCode: ${roomCode}, teamCode: ${teamCode}`);
                }, 1000);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error:', error.message);
            });

            // Listener for the current auction state
            socketRef.current.on('currentAuctionState', (state) => {
                console.log('Current auction state received:', state);
                setAuctionState(state); // Update state with server's data
            });

            // Listen for new auction item updates
            socketRef.current.on('newItemForAuction', (playerDetails) => {
                console.log('New item received for auction:', playerDetails);
                setAuctionState({
                    currentAuctionItem: playerDetails,
                    currentBid: playerDetails.basePrice,
                    currBidderName: null,
                    currBidder: null,
                });
            });

            // Listen for updated bid information
            socketRef.current.on('auctionUpdate', (data) => {
                console.log('Auction updated:', data);
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid: data.newBidAmount,
                    currBidder: data.newBidder,
                    currBidderName: data.newBidderName,
                    validBid: true,
                }));
            });
            socketRef.current.on('warnMsg', (warningMesssage) => {
                console.log(warningMesssage);
                setWarning(warningMesssage); // Set the warning message
                setTimeout(() => {
                    setWarning(''); // Clear the warning after 3 seconds
                }, 3000);
            });
            socketRef.current.on('playerUnsold', (m) => {
                setAuctionState(defa);
                console.log('Auction state set to defa',auctionState)
                console.log(m);
                setWarning(m); // Set the warning message
                setTimeout(() => {
                    setWarning(''); // Clear the warning after 3 seconds
                }, 5000);
            });
            socketRef.current.on('playerSold', async (soldState) => {
                console.log('Player sold event received:', soldState);
                setAuctionState(defa);
                if (soldState.currBidder === teamCode) {
                    try {
                        const response = await axios.get(`${process.env.REACT_APP_API_URL}/getTeamInfo`, {
                            params: { roomCode, teamCode, teamName },
                        });
                        setTeamState(response.data); // Update the team state with fresh data from the server
                        console.log('Updated team info:', response.data);
            
                        setWarning(`Congratulations! ${soldState.name} added to your squad for ₹${soldState.currentBid} Lakhs .`); // Show a success message
                    } catch (error) {
                        console.error('Error fetching updated team info:', error);
                        setWarning('Failed to update your team. Please refresh manually.');
                    }
                } else {
                    setWarning(`Player sold to . ${soldState.currBidderName}`); // Show a different message for other teams
                }
                console.log('Auction state set to defa',auctionState);
                // Clear the warning after a short delay
                setTimeout(() => {
                    setWarning('');
                }, 5000);
            });
            socketRef.current.on('newUser', ({teamOnStatus,message}) => {
                setWarning(message);
                
                // Update the team status
                setTeams(teamOnStatus);
              });
            socketRef.current.on('rtmUpdate', async ({ soldState }) => {
                if (soldState.rtmTeam === teamCode) {
                    console.log(`RTM opportunity for team: ${soldState.rtmTeamName}`);
                    setIsRTMAvailable(true); // Show RTM buttons
            
                    // Clear any existing timer before starting a new one
                    if (rtmTimerRef.current) {
                        clearTimeout(rtmTimerRef.current);
                    }
            
                    // Start a 15-second timer
                    rtmTimerRef.current = setTimeout(() => {
                        console.log(`No response from team ${soldState.rtmTeamName}. Sending default RTM: false.`);
                        socketRef.current.emit('rtmResponse', { useRtm: false, roomCode, soldState });
                        setIsRTMAvailable(false); // Hide RTM buttons
                        rtmTimerRef.current = null; // Reset the timer reference
                    }, 30000);
            
                    const handleRtmResponse = (response) => {
                        if (rtmTimerRef.current) {
                            clearTimeout(rtmTimerRef.current); // Clear the timer
                            rtmTimerRef.current = null; // Reset the timer reference
                            console.log("Timer cleared:", rtmTimerRef.current);

                        }
                        console.log(`RTM response received: ${response}. Sending to backend...`);
                        soldState.useRtm = response; // Update soldState
                        socketRef.current.emit(
                            'rtmResponse',
                            { roomCode, soldState, useRtm: response },
                            (ack) => {
                                if (ack.success) {
                                    console.log('RTM Response processed successfully');
                                } else {
                                    console.error('RTM Response failed:', ack.message);
                                }
                            }
                        );
                        setIsRTMAvailable(false); // Hide RTM buttons
                    };
            
                    // Attach event listeners to buttons
                    setTimeout(() => {
                        const rtmButton = document.getElementById('rtmButton');
                        const skipButton = document.getElementById('skipButton');
                        if (rtmButton && skipButton) {
                            console.log('Attaching event listeners to RTM buttons...');
                            rtmButton.onclick = () => handleRtmResponse(true);
                            skipButton.onclick = () => handleRtmResponse(false);
                        } else {
                            console.error('RTM buttons not found in the DOM.');
                        }
                    }, 1000); // 2-second delay before attaching event listeners
                } else {
                    console.log(`RTM in progress. ${soldState.rtmTeamName} is choosing to use RTM or not.`);
                }
            });
            
            socketRef.current.on('bidMatch', (soldState) => {
                console.log('bid match aaya hai');
                console.log('bid match', soldState.soldState.currBidder, teamCode);
            
                if (soldState.soldState.currBidder === teamCode) {
                    console.log("batao bid");
                    setWarning(`${soldState.soldState.rtmTeamName} Matches your bid. Please input your final bid.`); // Set the warning message
                    setShowFinalBidInput(true); // Show the final bid input field
            
                    const handleFinalBidSubmit = () => {
                        const currentBid = soldState.soldState.currentBid;
                        const teamPurseRemaining = teamState.purse; // Remaining purse for validation
                        console.log('tst',teamPurseRemaining)
                        const bidInput = document.getElementById('finalBidInput');
                        const bidValue = parseFloat(bidInput?.value || currentBid); // Get input value safely
            
                        // Validation checks
                        if (isNaN(bidValue)) {
                            alert("Please enter a valid number.");
                            return;
                        }
                        if (bidValue <= currentBid) {
                            alert(`Your bid must be greater than the current bid of ₹${currentBid} lakhs.`);
                            return;
                        }
                        if (bidValue <= 0) {
                            alert("Your bid must be a positive number.");
                            return;
                        }
                        if (bidValue > teamPurseRemaining) {
                            alert(`Your bid exceeds your team's remaining purse of ₹${teamPurseRemaining} lakhs.`);
                            return;
                        }
                        // Emit the final bid to the server
                        console.log("Submitting final bid to the server...");
                        socketRef.current.emit('finalBid', { finalBid: bidValue, roomCode,soldState });
            
                        // Reset UI
                        setShowFinalBidInput(false); // Hide the input field after submission
                        setFinalBid(""); // Clear the input field
                    };
            
                    // Add a delay to attach event listeners after DOM is updated
                    setTimeout(() => {
                        const bidInput = document.getElementById('finalBidInput'); // Input field for the bid
                        const submitButton = document.getElementById('submitFinalBid'); // Submit button
            
                        if (bidInput) {
                            console.log('Attaching input field event listener...');
                            bidInput.addEventListener('input', (e) => {
                                console.log('User is typing:', e.target.value); // Log input changes
                            });
                        } else {
                            console.error("Bid input field not found in the DOM.");
                        }
            
                        if (submitButton) {
                            console.log('Attaching submit button event listener...');
                            submitButton.addEventListener('click', handleFinalBidSubmit);
                        } else {
                            console.error("Submit button not found in the DOM.");
                        }
                    }, 1000); // 1-second delay before attaching event listeners
                } else {
                    console.log(`RTM in progress. ${soldState.soldState.currBidderName} is bidding.`);
                }
            });
            socketRef.current.on('finalBidMatch', async ({ soldState,finalBid}) => {
                console.log('final bid match aaya hai',soldState);
                auctionState.currentBid=finalBid;
                if (soldState.soldState.rtmTeam === teamCode) {
                    console.log(`RTM opportunity for team: ${soldState.soldState.rtmTeamName} ${soldState.soldState.currBidderName} made a final bid of ₹${finalBid} lakhs.`);
                    setIsRTMAvailable(true); // Make RTM buttons visible
            
                    // Start a 15-second timer
                    const timer = setTimeout(() => {
                        console.log(`No response from team ${soldState.rtmTeamName}. Sending default RTM: false.`);
                        socketRef.current.emit('rtmResponse', { useRtm: false, roomCode, soldState });
                        setIsRTMAvailable(false); // Hide RTM buttons
                    }, 30000);
            
                    // Define handleRtmResponse inside rtmUpdate
                    const handleRtmResponse = (response) => {
                        clearTimeout(timer); // Clear the timer
                        console.log(`RTM response received: ${response}. Sending to backend...`);
                        socketRef.current.emit(
                            'finalBidResponse',
                            { roomCode, soldState,finalBidResponse:response},
                            (ack) => {
                                if (ack.success) {
                                    console.log('RTM Response processed successfully');
                                } else {
                                    console.error('RTM Response failed:', ack.message);
                                }
                            }
                        );
                        setIsRTMAvailable(false); // Hide RTM buttons
                    };
            
                    // Attach event listeners to buttons with a 2-second delay
                    setTimeout(() => {
                        const rtmButton = document.getElementById('rtmButton');
                        const skipButton = document.getElementById('skipButton');
                        if (rtmButton && skipButton) {
                            console.log('Attaching event listeners to RTM buttons...');
                            rtmButton.onclick = () => handleRtmResponse(true);
                            skipButton.onclick = () => handleRtmResponse(false);
                        } else {
                            console.error('RTM buttons not found in the DOM.');
                        }
                    }, 1000); // 2-second delay before attaching event listeners
            
                } else {
                    console.log(`RTM in progress. ${soldState.soldState.rtmTeamName} is choosing to use RTM or not.`);
                }
            });
        }    

        return () => {
            if (socketRef.current) {
                console.log('Cleaning up socket connection...');
                socketRef.current.emit('resetJoinStatus', { roomCode, teamCode });
                socketRef.current.disconnect();
                socketRef.current = null; // Reset the socket instance
            }
        };
        
        
    }, [roomCode, teamCode]);
    const showErrorPrompt = (message) => {
      setErrorPrompt(message); // Set the error message
      setTimeout(() => setErrorPrompt(''), 1000); // Clear the message after 1 second
  };
    // Function to handle placing a bid
    const placeBid = () => {
        const { currentAuctionItem, currentBid, currBidder, validBid } = auctionState;

        if (!currentAuctionItem) {
            setErrorMessage('No item currently up for auction.');
            return;
        }
        if (validBid && currBidder === teamCode) {
          showErrorPrompt('You have already placed a bid.');
        return;
        }

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
        console.log('Placing bid:', teamState.purse, newBidAmount);
        if (socketRef.current&&teamState.purse>=newBidAmount) {
            socketRef.current.emit('placeBid', {
                roomCode,
                bidAmount: newBidAmount,
                teamCode,
                newBidderName:teamName,
                currentAuctionItem: currentAuctionItem,
            });
        }
        else{
          showErrorPrompt('You do not have enough purse balance to place this bid.');
        }
    };
    const toggleSidebar = () => {
        setIsSidebarOpen((prev) => !prev);
    };
    
    const { currentAuctionItem, currentBid, validBid ,currBidderName} = auctionState;

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <div
                style={{
                    width: isSidebarOpen ? '300px' : '0',
                    overflow: 'hidden',
                    transition: 'width 0.3s ease',
                    backgroundColor: '#f1f1f1',
                    boxShadow: '2px 0 5px rgba(0,0,0,0.1)',
                    padding: isSidebarOpen ? '10px' : '0',
                }}
            >
                <h3>Squad</h3>
                <ul>
                    <h4>Retentions:</h4>
                    {teamState?.retentions.map((player, index) => (
                        <li key={index}>{player.name}</li>
                    ))}
                </ul>
                <ul>
                    <h4>Bought Players:</h4>
                    {teamState?.boughtPlayers.map((player, index) => (
                        <li key={index}>{player.name}</li>
                    ))}
                </ul>
            </div>
    
            {/* Main Content */}
            <div style={{ flex: 1, padding: '20px' }}>
                {/* Toggle Sidebar */}
                <button
                    onClick={toggleSidebar}
                    style={{
                        marginBottom: '20px',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        padding: '10px 15px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                    }}
                >
                    {isSidebarOpen ? 'Close Squad' : 'Open Squad'}
                </button>
    
                {/* Auction Details */}
                <h2>Auction Room</h2>
                <p><strong>Room Code:</strong> {roomCode}</p>
                <p><strong>Team:</strong> {teamState?.teamName}</p>
                <p><strong>Remaining Purse:</strong> ₹{teamState?.purse} lakhs</p>
                <p><strong>RTMs Available:</strong> {teamState?.rtmsRemaining}</p>
    
                {currentAuctionItem ? (
                    <div style={{ marginTop: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
                        <h3>Current Auction Item</h3>
                        <p><strong>{currentAuctionItem.name}</strong></p>
                        <p>Specialism: {currentAuctionItem.specialism}</p>
                        <p>Base Price: ₹{currentAuctionItem.basePrice} lakhs</p>
                        {validBid && (
                            <div>
                                <p>Current Bid: ₹{currentBid} lakhs</p>
                                <p>Highest Bidder: {currBidderName}</p>
                            </div>
                        )}
                        <button
                            onClick={placeBid}
                            style={{
                                marginTop: '10px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                padding: '10px 15px',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer',
                            }}
                        >
                            Place Bid
                        </button>
                    </div>
                ) : (
                    <p style={{ marginTop: '20px' }}>No item currently up for auction.</p>
                )}
            </div>
    
            {/* RTM Section */}
            {isRTMAvailable && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        border: '1px solid red',
                        borderRadius: '5px',
                        backgroundColor: '#f8d7da',
                    }}
                >
                    <p style={{ color: 'red', fontWeight: 'bold' }}>
                        RTM Opportunity Available. Please respond within 15 seconds.
                    </p>
                    <button id="rtmButton" style={{ marginRight: '10px' }}>
                        Use RTM
                    </button>
                    <button id="skipButton">Skip</button>
                </div>
            )}
    
            {/* Final Bid Input */}
            {showFinalBidInput && (
                <div
                    style={{
                        marginTop: '20px',
                        padding: '15px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        backgroundColor: '#f1f1f1',
                    }}
                >
                    <label htmlFor="finalBidInput" style={{ marginRight: '10px' }}>
                        Enter your final bid:
                    </label>
                    <input
                        type="number"
                        id="finalBidInput"
                        min="0"
                        placeholder={`Greater than current bid`}
                        style={{
                            padding: '5px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            marginRight: '10px',
                        }}
                    />
                    <button
                        id="submitFinalBid"
                        style={{
                            backgroundColor: '#007BFF',
                            color: 'white',
                            padding: '5px 10px',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                        }}
                    >
                        Submit Final Bid
                    </button>
                </div>
            )}
    
            {/* Online/Offline Status */}
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
        </div>
    );
    
};

export default AuctionRoom;

