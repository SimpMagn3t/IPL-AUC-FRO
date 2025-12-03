import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';

const AuctionRoom = () => {
    const { roomCode, teamCode } = useParams();
    const { state } = useLocation();
    const { teamInfo } = state || {};
    const teamName = teamInfo.teamName;
    const [teamState, setTeamState] = useState(null);
    const [errorPrompt, setErrorPrompt] = useState(''); // State for error messages
    const [warning, setWarning] = useState('');
    const [isRTMAvailable, setIsRTMAvailable] = useState(false); // State for RTM availability
    const [finalBid, setFinalBid] = useState("");
    const [showFinalBidInput, setShowFinalBidInput] = useState(false);
    const rtmTimerRef = useRef(null); // Persistent timer reference
    const navigate = useNavigate();
    const [purse, setPurse] = useState();

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


    const defa = {
        currentAuctionItem: null,
        currentBid: 0,
        currBidder: null,
        currBidderName: null,
        validBid: false,
    };
    const [auctionState, setAuctionState] = useState(defa);
    const [errorMessage, setErrorMessage] = useState(null); // To handle errors
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const socketRef = useRef(null); // Ref to ensure a single socket instance

    const handleBeforeUnload = () => {
        if (socketRef.current) {
            console.log('Disconnecting socket on beforeunload...');
            socketRef.current.emit('resetJoinStatus', { roomCode, teamCode });
            socketRef.current.disconnect();
            socketRef.current = null; // Reset the socket instance
        }
    };
    useEffect(() => {
        const fetchTeamInfo = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_URL}/getTeamInfo`, {
                    params: { roomCode, teamCode, teamName }, // Replace 'YourTeamName' with a dynamic value if necessary
                });
                setTeamState(response.data);
                setPurse(response.data.purse);
            } catch (error) {
                console.error('Error fetching team info:', error);
                setErrorMessage('Failed to fetch team info. Please try again.');
            }
        };
        // fetchTeamInfo();
        fetchTeamInfo();
        if (!socketRef.current) {
            console.log('Creating socket connection...');
            socketRef.current = io(`${process.env.REACT_APP_API_URL}`);

            socketRef.current.on('connect', () => {

                // Emit joinRoom event after connection
                setTimeout(() => {
                    socketRef.current.emit('joinRoom', { roomCode, teamCode });
                }, 1000);
            });

            socketRef.current.on('connect_error', (error) => {
                console.error('Connection error:', error.message);
            });

            // Listener for the current auction state
            socketRef.current.on('currentAuctionState', (state) => {
                setAuctionState(state); // Update state with server's data
            });

            // Listen for new auction item updates
            socketRef.current.on('newItemForAuction', (playerDetails) => {
                setAuctionState({
                    currentAuctionItem: playerDetails,
                    currentBid: playerDetails.basePrice,
                    currBidderName: null,
                    currBidder: null,
                });
            });
            //recieve message
            socketRef.current.on('receiveMessage', (message) => {
                if (message.teamName != teamName) {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            });
            // Listen for updated bid information
            socketRef.current.on('auctionUpdate', (data) => {
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid: data.newBidAmount,
                    currBidder: data.newBidder,
                    currBidderName: data.newBidderName,
                    validBid: true,
                }));
            });
            socketRef.current.on('warnMsg', (warningMesssage) => {
                setWarning(warningMesssage); // Set the warning message
                setTimeout(() => {
                    setWarning(''); // Clear the warning after 3 seconds
                }, 3000);
            });
            socketRef.current.on('playerUnsold', (m) => {
                setAuctionState(defa);
                setWarning(m); // Set the warning message
                setTimeout(() => {
                    setWarning(''); // Clear the warning after 3 seconds
                }, 5000);
            });
            socketRef.current.on('playerSold', async (soldState) => {
                setAuctionState(defa);
                if (soldState.currBidder === teamCode) {
                    try {
                        const response = await axios.get(`${process.env.REACT_APP_API_URL}/getTeamInfo`, {
                            params: { roomCode, teamCode, teamName },
                        });
                        setTeamState(response.data); // Update the team state with fresh data from the server

                        setWarning(`Congratulations! ${soldState.name} added to your squad for ₹${soldState.currentBid} Lakhs .`); // Show a success message
                    } catch (error) {
                        console.error('Error fetching updated team info:', error);
                        setWarning('Failed to update your team. Please refresh manually.');
                    }
                } else {
                    setWarning(`Player sold to ${soldState.currBidderName}`); // Show a different message for other teams
                }
                // Clear the warning after a short delay
                setTimeout(() => {
                    setWarning('');
                }, 5000);
            });
            socketRef.current.on('newUser', ({ teamOnStatus, message }) => {
                console.log(message);
                setWarning(message);
                setTimeout(() => {
                    setWarning('');
                }, 5000);
                // Update the team status
                setTeams(teamOnStatus);
            });
            socketRef.current.on('rtmUpdate', async ({ soldState }) => {
                if (soldState.rtmTeam === teamCode) {
                    setWarning(`RTM opportunity for team: ${soldState.rtmTeamName} do you want to use  RTM for ${soldState.name} `); // Set the warning message
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
                    setIsRTMAvailable(true); // Show RTM buttons

                    // Clear any existing timer before starting a new one
                    if (rtmTimerRef.current) {
                        clearTimeout(rtmTimerRef.current);
                    }
                    // Start a 15-second timer
                    rtmTimerRef.current = setTimeout(() => {
                        socketRef.current.emit('rtmResponse', { useRtm: false, roomCode, soldState });
                        setIsRTMAvailable(false); // Hide RTM buttons
                        rtmTimerRef.current = null; // Reset the timer reference
                    }, 40000);

                    const handleRtmResponse = (response) => {
                        if (rtmTimerRef.current) {
                            clearTimeout(rtmTimerRef.current); // Clear the timer
                            rtmTimerRef.current = null; // Reset the timer reference
                            console.log('RTM timer cleared', rtmTimerRef.current);
                        }
                        soldState.useRtm = response; // Update soldState
                        socketRef.current.emit(
                            'rtmResponse',
                            { roomCode, soldState, useRtm: response },
                            (ack) => {
                                if (ack.success) {
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
                            rtmButton.onclick = () => handleRtmResponse(true);
                            skipButton.onclick = () => handleRtmResponse(false);
                        } else {
                            console.error('RTM buttons not found in the DOM.');
                        }
                    }, 1000); // 2-second delay before attaching event listeners
                } else {
                    setWarning(`RTM in progress. ${soldState.rtmTeamName} is choosing to use RTM or not.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
                }
            });

            socketRef.current.on('bidMatch', (soldState) => {

                if (soldState.soldState.currBidder === teamCode) {
                    setWarning(`${soldState.soldState.rtmTeamName} Matches your bid. Please input your final bid.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
                    setShowFinalBidInput(true); // Show the final bid input field

                    const handleFinalBidSubmit = () => {
                        const currentBid = soldState.soldState.currentBid;
                        console.log(`1purse`,purse);
                        // const teamPurseRemaining = await axios.get(`${process.env.REACT_APP_API_URL}/getTeamInfo`, {
                        //     params: { roomCode, teamCode, teamName },
                        // });
                        const teamPurseRemaining = purse;
                        const bidInput = document.getElementById('finalBidInput');
                        const bidValue = parseFloat(bidInput?.value || currentBid); // Get input value safely
                        console.log(bidValue);

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
                        socketRef.current.emit('finalBid', { finalBid: bidValue, roomCode, soldState });

                        // Reset UI
                        setShowFinalBidInput(false); // Hide the input field after submission
                        setFinalBid(""); // Clear the input field
                    };

                    // Add a delay to attach event listeners after DOM is updated
                    setTimeout(() => {
                        const bidInput = document.getElementById('finalBidInput'); // Input field for the bid
                        const submitButton = document.getElementById('submitFinalBid'); // Submit button

                        if (bidInput) {
                            bidInput.addEventListener('input', (e) => {
                                console.log(e.target.value);
                            });
                        } else {
                            console.error("Bid input field not found in the DOM.");
                        }

                        if (submitButton) {
                            submitButton.addEventListener('click', handleFinalBidSubmit);
                        } else {
                            console.error("Submit button not found in the DOM.");
                        }
                    }, 1000); // 1-second delay before attaching event listeners
                } else {
                    setWarning(`RTM in progress. ${soldState.soldState.currBidderName} is bidding it's final bid.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
                }
            });
            socketRef.current.on('finalBidMatch', async ({ soldState, finalBid }) => {
                setAuctionState((prevState) => ({
                    ...prevState,
                    currentBid: finalBid,
                }));
                auctionState.currentBid = finalBid;
                if (soldState.soldState.rtmTeam === teamCode) {
                    setIsRTMAvailable(true); // Make RTM buttons visible

                    // Start a 15-second timer
                    const timer = setTimeout(() => {
                        socketRef.current.emit('rtmResponse', { useRtm: false, roomCode, soldState });
                        setIsRTMAvailable(false); // Hide RTM buttons
                    }, 30000);

                    // Define handleRtmResponse inside rtmUpdate
                    const handleRtmResponse = (response) => {
                        clearTimeout(timer); // Clear the timer
                        socketRef.current.emit(
                            'finalBidResponse',
                            { roomCode, soldState, finalBidResponse: response },
                            (ack) => {
                                if (ack.success) {
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
                            rtmButton.onclick = () => handleRtmResponse(true);
                            skipButton.onclick = () => handleRtmResponse(false);
                        } else {
                            console.error('RTM buttons not found in the DOM.');
                        }
                    }, 1000); // 2-second delay before attaching event listeners

                } else {
                    setWarning(`RTM opportunity for team: ${soldState.soldState.rtmTeamName} ${soldState.soldState.currBidderName} made a final bid of ₹${finalBid} lakhs.`);
                    setTimeout(() => {
                        setWarning('');
                    }, 5000);
                }
            });
        }

     window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup
    return () => {
        console.log('Cleaning up socket connection...');
        if (socketRef.current) {
            socketRef.current.emit('resetJoinStatus', { roomCode, teamCode });
            socketRef.current.disconnect();
            socketRef.current = null; // Reset the socket instance
        }
        window.removeEventListener('beforeunload', handleBeforeUnload);
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
        if (socketRef.current && teamState.purse >= newBidAmount) {
            socketRef.current.emit('placeBid', {
                roomCode,
                bidAmount: newBidAmount,
                teamCode,
                newBidderName: teamName,
                currentAuctionItem: currentAuctionItem,
            });
        }
        else {
            showErrorPrompt('You do not have enough purse balance to place this bid.');
        }
    };
    const handleSendMessage = () => {
        if (inputMessage.trim()) {
            const messageData = {
                roomCode,
                teamName,
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

    const handleLogout = () => {
        if (socketRef?.current) {
            socketRef.current.emit('resetJoinStatus', { roomCode, teamCode }, () => {
                socketRef.current.disconnect();
                socketRef.current = null; // Reset the socket instance
            });
        }
        navigate('/');
    };
    const { currentAuctionItem, currentBid, validBid, currBidderName } = auctionState;

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div
                style={{
                    width: '300px',
                    minWidth: '300px',
                    flexShrink: 0,
                    transition: 'width 0.3s ease',
                    backgroundColor: '#ffffff', // White background for a clean look
                    boxShadow: '2px 0 8px rgba(0,0,0,0.2)', // Darker shadow for better contrast
                    padding: '15px',
                    maxHeight: 'calc(100vh - 20px)', // Adjust max height to fit within the screen height
                    overflowY: 'auto', // Add vertical scrolling if content overflows
                    margin: '10px 0',
                    borderRadius: '10px', // Rounded corners
                    border: '1px solid #ddd', // Border for structure
                }}
            >
                <h3 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>Squad</h3>
                <div>
                    <h4 style={{ color: '#2980b9', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Retentions:</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {teamState?.retentions.map((player, index) => (
                            <li
                                key={index}
                                style={{
                                    padding: '8px 10px',
                                    margin: '5px 0',
                                    backgroundColor: '#ecf9ff',
                                    borderRadius: '5px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    color: '#2c3e50',
                                    fontWeight: 'bold',
                                }}
                            >
                                {player.name}
                            </li>
                        ))}
                    </ul>
                </div>
                <div style={{ marginTop: '15px' }}>
                    <h4 style={{ color: '#27ae60', borderBottom: '1px solid #ddd', paddingBottom: '5px' }}>Bought Players:</h4>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {teamState?.boughtPlayers.map((player, index) => (
                            <li
                                key={index}
                                style={{
                                    padding: '8px 10px',
                                    margin: '5px 0',
                                    backgroundColor: '#eafde9',
                                    borderRadius: '5px',
                                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                    color: '#2c3e50',
                                }}
                            >
                                {player.name} - ₹{player.currentBid}L
                            </li>
                        ))}
                    </ul>
                </div>
            </div>


            {/* Main Content */}
            <div style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '800px' }}>
                    <div className='main' style={{ flex: 1, marginRight: '20px' }}>
                        <div
                            className='details'
                            style={{
                                backgroundColor: '#ffffff', // Clean white background
                                padding: '20px',
                                borderRadius: '10px', // Rounded corners for smoothness
                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)', // Subtle shadow for depth
                                border: '1px solid #ddd', // Light border for structure
                                maxWidth: '400px', // Limit the width for a compact appearance
                                margin: '20px auto', // Center the container horizontally
                            }}
                        >
                            <h3
                                style={{
                                    textAlign: 'center',
                                    color: '#34495e', // Dark grey for the heading
                                    marginBottom: '15px',
                                }}
                            >
                                Team Details
                            </h3>
                            <p
                                style={{
                                    marginBottom: '10px',
                                    color: '#2c3e50', // Text color for better readability
                                    fontSize: '16px',
                                }}
                            >
                                <strong style={{ color: '#2980b9' }}>Room Code:</strong> {roomCode}
                            </p>
                            <p
                                style={{
                                    marginBottom: '10px',
                                    color: '#2c3e50',
                                    fontSize: '16px',
                                }}
                            >
                                <strong style={{ color: '#27ae60' }}>Team:</strong> {teamState?.teamName}
                            </p>
                            <p
                                style={{
                                    marginBottom: '10px',
                                    color: '#2c3e50',
                                    fontSize: '16px',
                                }}
                            >
                                <strong style={{ color: '#f39c12' }}>Remaining Purse:</strong> ₹{teamState?.purse} lakhs
                            </p>
                            <p
                                style={{
                                    marginBottom: '0',
                                    color: '#2c3e50',
                                    fontSize: '16px',
                                }}
                            >
                                <strong style={{ color: '#e74c3c' }}>RTMs Available:</strong> {teamState?.rtmsRemaining}
                            </p>
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
                        {/* Team Status */}
                        <div
                            style={{
                                width: '200px',
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
                                        .filter((team) => team.name !== teamState?.teamName) // Exclude user's team
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
                                        .filter((team) => team.name !== teamState?.teamName) // Exclude user's team
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
                    <div className="center">
                        {currentAuctionItem ? (
                            <div
                                className="podium"
                                style={{
                                    marginTop: '130px',
                                    border: '2px solid #3498db', // Blue border for emphasis
                                    padding: '20px',
                                    borderRadius: '15px',
                                    width: '500px',
                                    backgroundColor: '#f9f9f9', // Light background
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
                                    textAlign: 'center', // Center-align all content
                                }}
                            >
                                <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Current Auction Item</h3>
                                <p style={{ fontWeight: 'bold', fontSize: '18px', marginBottom: '5px' }}>
                                    {currentAuctionItem.name}
                                </p>
                                <p style={{ color: '#555', marginBottom: '5px' }}>
                                    Specialism: <strong>{currentAuctionItem.specialism}</strong>
                                </p>
                                <p style={{ color: '#555', marginBottom: '15px' }}>
                                    Base Price: <strong>₹{currentAuctionItem.basePrice} lakhs</strong>
                                </p>
                                {validBid && (
                                    <div style={{ marginBottom: '15px' }}>
                                        <p style={{ color: '#27ae60', fontWeight: 'bold' }}>
                                            Current Bid: ₹{currentBid} lakhs
                                        </p>
                                        <p style={{ color: '#2c3e50' }}>
                                            Highest Bidder: <strong>{currBidderName}</strong>
                                        </p>
                                    </div>
                                )}
                                <button
                                    onClick={placeBid}
                                    style={{
                                        marginTop: '15px',
                                        backgroundColor: '#28a745', // Green background for the button
                                        color: 'white',
                                        padding: '10px 20px',
                                        border: 'none',
                                        borderRadius: '5px',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: 'bold',
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', // Subtle shadow for button
                                    }}
                                >
                                    Place Bid
                                </button>
                            </div>
                        ) : (
                            <div
                                className="podium"
                                style={{
                                    marginTop: '130px',
                                    border: '2px solid #e74c3c', // Red border for no item
                                    padding: '20px',
                                    borderRadius: '15px',
                                    width: '500px',
                                    backgroundColor: '#fbeee6', // Light red background
                                    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)', // Subtle shadow for depth
                                    textAlign: 'center', // Center-align all content
                                }}
                            >
                                <p style={{ marginTop: '20px', color: '#e74c3c', fontSize: '18px', fontWeight: 'bold' }}>
                                    No item currently up for auction.
                                </p>
                            </div>
                        )}

                        {/* RTM Section */}
                        <div className="rtm">
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
                        </div>
                    </div>
                </div>
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
        href="mailto:kumaranupam8007@gmail.com"
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
            {/* Right Column: Chat Feature */}
            <div className="chat">
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
                                        textAlign: msg.teamName === teamName ? 'right' : 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            display: 'inline-block',
                                            backgroundColor:
                                                msg.teamName === teamName ? '#A3E4D7' : '#F9E79F', // Green for own messages, yellow for others
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
                <button
                    onClick={handleLogout}
                    style={{
                        marginBottom: '0px',
                        backgroundColor: '#FF6B6B', // Soft red for the logout button
                        color: 'white',
                        padding: '10px 15px',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                    }}
                >
                    Log Out
                </button>
                {/* <p>For the best experience use a desktop or laptop browser at 75% zoom.</p> */}
            </div>
        </div>
    );

};

export default AuctionRoom;

