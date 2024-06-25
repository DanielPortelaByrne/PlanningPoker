// client/src/App.js
import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css"; // Import the CSS file for styling
// Import necessary FontAwesome components
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet";

const socket = io("https://salty-reaches-84979-54a9f5a024dc.herokuapp.com/");

const fibonacciSequence = [1, 2, 3, 5, 8, 13, 21];

function App() {
  const [sessionId, setSessionId] = useState("");
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [isHost, setIsHost] = useState(false); // State to track host status
  const [flipCard, setFlipCard] = useState(false); // State to control flip animation

  useEffect(() => {
    console.log("App component rendered");

    socket.on("receiveEstimate", (estimate) => {
      // console.log("receiveEstimate event received with estimate:", estimate);
      // console.log("revealed:", revealed);
      setEstimates((prev) => [...prev, estimate]);
    });

    socket.on("updateUsers", (users) => {
      // console.log("updateUsers event received with users:", users);
      setUsers(users);
    });

    socket.on("revealCards", () => {
      console.log("revealCards event received");
      setRevealed(true);
      setFlipCard(true); // Trigger flip animation when cards are revealed
    });

    socket.on("resetVote", () => {
      console.log("resetVote event received");
      setEstimates([]);
      setSelectedCard(null);
      setRevealed(false);
      setFlipCard(false); // Reset flip animation state
    });

    return () => socket.off();
  }, []);

  const createSession = () => {
    // console.log("createSession called");
    socket.emit("createSession", (sessionId) => {
      // console.log("Created session with ID:", sessionId);
      setSessionId(sessionId);
      setIsHost(true); // Set host status upon session creation
      joinSession(sessionId);
    });
  };

  const joinSession = (sessionId) => {
    // console.log("joinSession called with sessionId:", sessionId);
    socket.emit("joinSession", { sessionId, userName }, (response) => {
      if (response.success) {
        console.log("Joined session!");
        setJoined(true);
      } else {
        console.log("Failed to join session:", response.message);
        alert(response.message);
      }
    });
  };

  const sendEstimate = (card) => {
    // console.log("sendEstimate called with card:", card);
    setSelectedCard(card);
    socket.emit("sendEstimate", { sessionId, estimate: card, userName });
  };

  const revealCards = () => {
    console.log("revealCards called");
    socket.emit("revealCards", sessionId);
  };

  const resetVote = () => {
    console.log("resetVote called");
    socket.emit("resetVote", sessionId);
  };

  const handleButtonClick = () => {
    console.log("handleButtonClick called, revealed:", revealed);
    if (revealed) {
      resetVote();
    } else {
      revealCards();
    }
  };

  const calculateAverageEstimate = () => {
    if (estimates.length === 0) return 0;
    const sum = estimates.reduce((total, est) => total + est.estimate, 0);
    return sum / estimates.length;
  };

  const findClosestFibonacci = (num) => {
    return fibonacciSequence.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
  };

  useEffect(() => {
    console.log("Current revealed state:", revealed);
  }, [revealed]);

  return (
    <div className="App">
      <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      {!joined ? (
        <div className="session-container">
          <img
            src={require("./assets/images/PLANNING POKER.png")}
            alt="Logo"
            className="logo"
          />
          <input
            type="text"
            placeholder="YOUR NAME"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="input"
          />
          <div className="session-card-container">
            <div className="session-card">
              <h2>CREATE A NEW SESSION</h2>
              <button onClick={createSession} className="button">
                CREATE SESSION
              </button>
            </div>
            <div className="session-card">
              <h2>JOIN AN EXISTING SESSION</h2>
              <div className="input-container">
                <input
                  type="text"
                  placeholder="SESSION ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  className="input"
                />
                <button
                  onClick={() => joinSession(sessionId)}
                  className="button"
                >
                  JOIN SESSION
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table">
          <div className="logo-container">
            <img
              src={require("./assets/images/PLANNING POKER.png")}
              alt="Logo"
              className="logo"
            />
          </div>
          <div className="session-details">
            <div className="session-info">
              <h2>SESSION ID: {sessionId}</h2>
              <p className="user-name">
                <FontAwesomeIcon icon={faUser} style={{ marginRight: "5px" }} />{" "}
                {userName}
              </p>
            </div>
          </div>
          {revealed && (
            <div className="average-closest-container">
              <div className={`average-card ${flipCard ? "flip" : ""}`}>
                <p className="small-text">Average:</p>
                <p className="large-number">
                  {calculateAverageEstimate().toFixed(2)}
                </p>
              </div>
              <div className={`closest-card ${flipCard ? "flip" : ""}`}>
                <p className="small-text">Closest:</p>
                <p className="large-number">
                  {findClosestFibonacci(calculateAverageEstimate())}
                </p>
              </div>
            </div>
          )}
          <div className="cards-container">
            <div className="user-names">
              {users.map((user, index) => (
                <p key={index} className="capitalize">
                  {user.name}
                </p>
              ))}
            </div>
            <div className="estimates">
              {users.map((user, index) => (
                <div key={index} className="estimate-card">
                  {revealed ? (
                    <p>
                      {
                        estimates.find((est) => est.userName === user.name)
                          ?.estimate
                      }
                    </p>
                  ) : (
                    <p>?</p>
                  )}
                </div>
              ))}
            </div>
            <div className="card-deck">
              {fibonacciSequence.map((card) => (
                <div
                  key={card}
                  className={`card ${selectedCard === card ? "selected" : ""}`}
                  onClick={() => sendEstimate(card)}
                >
                  {card}
                </div>
              ))}
            </div>
          </div>
          {isHost && (
            <div className="button-container">
              <button
                onClick={handleButtonClick}
                className={`button ${revealed ? "reset" : "reveal"}`}
              >
                {revealed ? "RESET" : "REVEAL"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
