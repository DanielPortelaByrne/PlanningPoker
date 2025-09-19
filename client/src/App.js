import React, { useState, useEffect } from "react";
import io from "socket.io-client";
import "./App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faShareAlt } from "@fortawesome/free-solid-svg-icons";
import { Helmet } from "react-helmet";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import oneImg from "./assets/images/one.png";
import twoImg from "./assets/images/two.png";
import threeImg from "./assets/images/three.png";
import fiveImg from "./assets/images/five.png";
import eightImg from "./assets/images/eight.png";
import thirteenImg from "./assets/images/thirteen.png";
import twentyoneImg from "./assets/images/twentyone.png";
import oneImgBlue from "./assets/images/one-blue.png";
import twoImgBlue from "./assets/images/two-blue.png";
import threeImgBlue from "./assets/images/three-blue.png";
import fiveImgBlue from "./assets/images/five-blue.png";
import eightImgBlue from "./assets/images/eight-blue.png";
import thirteenImgBlue from "./assets/images/thirteen-blue.png";
import twentyoneImgBlue from "./assets/images/twentyone-blue.png";
import blue from "./assets/images/blue.png";
import green from "./assets/images/green.png";
import orange from "./assets/images/orange.png";
import purple from "./assets/images/purple.png";
import KofiButton from "./components/KofiButton";
import Footer from "./components/Footer";
import orangeBackground from "./assets/images/orange.png";
import defaultCardBack from "./assets/images/card_back.png";
import defaultPlanningPokerLogo from "./assets/images/PLANNING POKER.png";

// Frutiger Aero theme images
import frutigerBackground from "./assets/frutigerAeroImages/background.png";
import frutigerCardBack from "./assets/frutigerAeroImages/card_back.png";
import frutigerPlanningPoker from "./assets/frutigerAeroImages/PLANNING POKER.png";
import background2 from "./assets/images/background2.png";

const socket = io(
  "https://planning-poker-pointing-9f9b8406bb5e.herokuapp.com/"
);
// const socket = io("http://localhost:4000");

const fibonacciSequence = [1, 2, 3, 5, 8, 13, 21];

function App() {
  const [sessionId, setSessionId] = useState("");
  const [userName, setUserName] = useState("");
  const [joined, setJoined] = useState(false);
  const [users, setUsers] = useState([]);
  const [estimates, setEstimates] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [isHost, setIsHost] = useState(false);
  const [flipCard, setFlipCard] = useState(false);
  const [flippedCards, setFlippedCards] = useState([]);
  const [spectateMode, setSpectateMode] = useState(false);
  const [dealAnimation, setDealAnimation] = useState(false);
  const [frutigerAero, setFrutigerAero] = useState(false);
  const [themeAnimation, setThemeAnimation] = useState(false);

  const cardImages = {
    1: { default: oneImg, selected: oneImgBlue },
    2: { default: twoImg, selected: twoImgBlue },
    3: { default: threeImg, selected: threeImgBlue },
    5: { default: fiveImg, selected: fiveImgBlue },
    8: { default: eightImg, selected: eightImgBlue },
    13: { default: thirteenImg, selected: thirteenImgBlue },
    21: { default: twentyoneImg, selected: twentyoneImgBlue },
  };

  // Theme-aware images (use imports, not require)
  const backgroundImage = frutigerAero
    ? frutigerBackground
    : background2;

  const cardBackImage = frutigerAero
    ? frutigerCardBack
    : defaultCardBack;

  const planningPokerLogo = frutigerAero
    ? frutigerPlanningPoker
    : defaultPlanningPokerLogo;

  useEffect(() => {
    setDealAnimation(true);

    const urlParams = new URLSearchParams(window.location.search);
    const sessionCodeFromUrl = urlParams.get("session");

    if (sessionCodeFromUrl) {
      setSessionId(sessionCodeFromUrl);
    }

    socket.on("receiveEstimate", (estimate) => {
      setEstimates((prev) => {
        const index = prev.findIndex(
          (est) => est.userName === estimate.userName
        );
        if (index > -1) {
          const newEstimates = [...prev];
          newEstimates[index] = estimate;
          return newEstimates;
        } else {
          return [...prev, estimate];
        }
      });
    });

    socket.on("updateUsers", (users) => {
      setUsers(users);
    });

    socket.on("revealCards", () => {
      setRevealed(true);
      setFlipCard(true);
      setFlippedCards(users.map((user, index) => index));
      setEstimates((prevEstimates) =>
        users.map((user) =>
          user.spectate
            ? { userName: user.name, estimate: "👁️" }
            : prevEstimates.find((est) => est.userName === user.name) || {}
        )
      );
    });

    socket.on("resetVote", () => {
      setEstimates([]);
      setSelectedCard(null);
      setRevealed(false);
      setFlipCard(false);
      setFlippedCards([]);
    });

    return () => socket.off();
  }, [users]);

  const resetToJoinScreen = () => {
    setSessionId("");
    setUserName("");
    setJoined(false);
    setUsers([]);
    setEstimates([]);
    setSelectedCard(null);
    setRevealed(false);
    setIsHost(false);
    setFlipCard(false);
    setFlippedCards([]);
    setSpectateMode(false);
  };

  // Add user event logging function
  const logUserEvent = (eventType, details = {}) => {
    socket.emit("userEventLog", {
      eventType,
      userName,
      sessionId,
      timestamp: new Date().toISOString(),
      details,
      location: window.location.href,
      userAgent: navigator.userAgent,
    });
  };

  const createSession = () => {
    if (!userName.trim()) {
      toast.error("Please enter your name to create a session.");
      return;
    }

    socket.emit("createSession", (sessionId) => {
      setSessionId(sessionId);
      setIsHost(true);
      joinSession(sessionId);
      logUserEvent("createSession");
    });
  };

  const joinSession = (sessionId) => {
    if (!userName.trim()) {
      toast.error("Please enter your name to join a session.");
      return;
    }
    if (!sessionId.trim()) {
      toast.error("Please enter a session ID to join a session.");
      return;
    }

    socket.emit("joinSession", { sessionId, userName }, (response) => {
      if (response.success) {
        setJoined(true);
        setEstimates(response.estimates || []);
        setRevealed(response.revealed || false);
        if (response.revealed) {
          setFlipCard(true);
          setFlippedCards(users.map((user, index) => index));
        }
        logUserEvent("joinSession");
      } else {
        toast.error(response.message);
      }
    });
  };

  const sendEstimate = (card) => {
    if (spectateMode) {
      toast.info("Switch off spectator mode to vote!");
      return;
    }
    setSelectedCard(card);
    socket.emit("sendEstimate", { sessionId, estimate: card, userName });
    logUserEvent("sendEstimate", { estimate: card });
  };

  const revealCards = () => {
    const numberOfUsers = users.filter((user) => !user.spectate).length;
    const numberOfEstimates = estimates.length;

    if (numberOfEstimates < numberOfUsers) {
      toast.warn("Wait for all participants to submit their estimates.");
      return;
    }

    socket.emit("revealCards", sessionId);
    logUserEvent("revealCards");
  };

  const resetVote = () => {
    socket.emit("resetVote", sessionId);
    logUserEvent("resetVote");
  };

  const handleButtonClick = () => {
    if (revealed) {
      resetVote();
    } else {
      revealCards();
    }
  };

  const toggleSpectateMode = () => {
    setSpectateMode((prevMode) => {
      const newMode = !prevMode;
      if (newMode) {
        setSelectedCard(null); // Deselect the card when spectate mode is turned on
      }
      socket.emit("toggleSpectateMode", {
        sessionId,
        userName,
        spectate: newMode,
      });
      logUserEvent("toggleSpectateMode", { spectate: newMode });
      return newMode;
    });
  };

  const calculateAverageEstimate = () => {
    const filteredEstimates = estimates.filter((est) => {
      const user = users.find((user) => user.name === est.userName);
      return user && !user.spectate;
    });

    if (filteredEstimates.length === 0) return 0;
    const sum = filteredEstimates.reduce(
      (total, est) => total + est.estimate,
      0
    );
    return sum / filteredEstimates.length;
  };

  const findClosestFibonacci = (num) => {
    return fibonacciSequence.reduce((prev, curr) =>
      Math.abs(curr - num) < Math.abs(prev - num) ? curr : prev
    );
  };

  const copySessionLink = () => {
    const sessionLink = `${window.location.origin}?session=${sessionId}`;
    navigator.clipboard.writeText(sessionLink).then(
      () => {
        toast.success("Session link copied to clipboard!");
      },
      (err) => {
        console.error("Failed to copy session link: ", err);
        toast.error("Failed to copy session link.");
      }
    );
  };

  const hasUserVoted = (userName) => {
    return estimates.some((est) => est.userName === userName);
  };

  // Animation handler for theme toggle
  const handleThemeToggle = () => {
    setFrutigerAero((prev) => !prev);
    if (!joined) {
      setDealAnimation(false);
      setTimeout(() => setDealAnimation(true), 10); // Restart animation
    }
  };

  return (
    <div
      className={`app-container${frutigerAero ? " frutiger-aero" : ""}`}
      style={{
        height: "100vh",
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        width: "100vw",
        overflow: "auto",
      }}
    >
    <Helmet>
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@200..700&display=swap"
          rel="stylesheet"
        />
      </Helmet>
      <ToastContainer
        position="top-center"
        autoClose={1200}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <KofiButton />
      <Footer />
      {/* Theme toggle banner */}
      <div className="theme-toggle-banner">
        <span>New! Frutiger Aero Theme</span>
        <label className="switch">
          <input
            type="checkbox"
            checked={frutigerAero}
            onChange={handleThemeToggle}
          />
          <span className="slider"></span>
        </label>
      </div>

      {!joined ? (
        <div className="session-container">
          <img
            src={planningPokerLogo}
            alt="Planning Poker tool logo for Agile teams"
            className="logo"
          />
          <input
            type="text"
            placeholder="YOUR NAME"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") joinSession(sessionId);
            }}
            className="session-container-input"
          />
          <div className="session-card-container">
            <div className={`session-card ${dealAnimation ? "deal-left" : ""}`}>
              <img
                src={cardBackImage}
                alt="Estimation Cards Card Background for Scrum Poker"
                className="card-image"
              />
              <h2 className="card-text">CREATE A SESSION</h2>
              <button className="button" onClick={createSession}>
                CREATE
              </button>
            </div>
            <div
              className={`session-card ${dealAnimation ? "deal-right" : ""}`}
            >
              <img
                src={cardBackImage}
                alt="Estimation Cards Card Background for Scrum Poker"
                className="card-image"
              />
              <h2 className="card-text">JOIN A SESSION</h2>
              <div className="input-container">
                <input
                  type="text"
                  placeholder="SESSION ID"
                  value={sessionId}
                  onChange={(e) => setSessionId(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") joinSession(sessionId);
                  }}
                  className="input"
                />
                <button
                  className="button"
                  onClick={() => joinSession(sessionId)}
                >
                  JOIN
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="table">
          <div className="logo-container">
            <img
              src={planningPokerLogo}
              alt="Planning Poker tool logo for Agile teams"
              className="logo"
              onClick={resetToJoinScreen}
            />
            <span className="logo-tooltip">Home</span>
          </div>

          {/* New User ID Card Container */}
          <div
            className="user-id-card"
            style={{ backgroundImage: `url(${frutigerAero ? frutigerBackground : orange})` }}
          >
            <p className="user-id-text">{userName}</p>
            <FontAwesomeIcon icon={faUser} className="user-icon" />
          </div>

          {/* Session Box */}
          <div className="session-details">
            <div className="session-info">
              <h2>SESSION ID: {sessionId}</h2>
              <button className="share-button" onClick={copySessionLink}>
                <FontAwesomeIcon icon={faShareAlt} /> Share
              </button>
            </div>
            {!revealed && (
              <div className="spectate-toggle">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={spectateMode}
                    onChange={toggleSpectateMode}
                  />
                  <span className="slider round"></span>
                </label>
                <h2>SPECTATE MODE {spectateMode ? "ON" : "OFF"}</h2>
              </div>
            )}
          </div>

          {/* Other Components */}
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
                  <div key={index} className="estimate-inner-card">
                    <img
                      src={frutigerAero ? frutigerCardBack : cardBackImage}
                      alt="Estimation Cards Card Background for Scrum Poker"
                      className="card-image"
                    />
                    <p>
                      {revealed
                        ? estimates.find((est) => est.userName === user.name)
                            ?.estimate || "?"
                        : user.spectate
                        ? "👁️"
                        : hasUserVoted(user.name)
                        ? "✔"
                        : "?"}
                    </p>
                  </div>
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
                  <img
                    src={
                      selectedCard === card
                        ? cardImages[card].selected
                        : cardImages[card].default
                    }
                    alt={`Estimation Cards Card for Scrum Poker for ${card}`}
                    className="card-image"
                  />
                  <p className="card-text">{card}</p>
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
