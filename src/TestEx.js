import React, { useState } from "react";

const TestEx = () => {
    const [showWarning, setShowWarning] = useState(false);

    const triggerWarning = () => {
        setShowWarning(true);
        setTimeout(() => {
            setShowWarning(false);
        }, 4000); // Warning stays visible for 4 seconds
    };

    return (
        <div style={{ position: "relative", minHeight: "100vh", padding: "20px" }}>
            <button
                onClick={triggerWarning}
                style={{
                    backgroundColor: "#007BFF",
                    color: "white",
                    padding: "10px 20px",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer",
                }}
            >
                Trigger Warning
            </button>

            {/* Animated Warning */}
            {showWarning && (
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
                    This is a warning message!
                </div>
            )}

            {/* Styles for the animation */}
            <style>
                {`
                @keyframes popOut {
                    0% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(20px);
                    }
                    10% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0px);
                    }
                    90% {
                        opacity: 1;
                        transform: translateX(-50%) translateY(0px);
                    }
                    100% {
                        opacity: 0;
                        transform: translateX(-50%) translateY(0px);
                    }
                }
                `}
            </style>
        </div>
    );
};

export default TestEx;
