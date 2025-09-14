const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database("./userlogs.db");

// Create logs table if it doesn't exist
db.run(`
  CREATE TABLE IF NOT EXISTS user_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    eventType TEXT,
    userName TEXT,
    sessionId TEXT,
    timestamp TEXT,
    details TEXT,
    location TEXT,
    userAgent TEXT
  )
`);

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let sessions = {};

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/build")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const generateSessionId = () => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let sessionId = "";
  for (let i = 0; i < 4; i++) {
    sessionId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sessionId;
};

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("createSession", (callback) => {
    const sessionId = generateSessionId();
    sessions[sessionId] = { users: [], estimates: [] };
    socket.join(sessionId);
    console.log(`Session created: ${sessionId}`);
    callback(sessionId);
  });

  socket.on("joinSession", ({ sessionId, userName }, callback) => {
    const session = sessions[sessionId];
    if (session) {
      if (!session.users.some((user) => user.name === userName)) {
        session.users.push({ id: socket.id, name: userName, spectate: false });
        socket.join(sessionId);
        console.log(`${userName} joined session ${sessionId}`);
        callback({
          success: true,
          estimates: session.estimates,
          revealed: session.revealed,
        });
        io.to(sessionId).emit("updateUsers", session.users);
      } else {
        callback({
          success: false,
          message: "Username already taken in this session.",
        });
      }
    } else {
      callback({ success: false, message: "Session not found." });
    }
  });

  socket.on("sendEstimate", ({ sessionId, estimate, userName }) => {
    const session = sessions[sessionId];
    if (session) {
      const existingEstimateIndex = session.estimates.findIndex(
        (est) => est.userName === userName
      );
      if (existingEstimateIndex > -1) {
        session.estimates[existingEstimateIndex] = { userName, estimate };
      } else {
        session.estimates.push({ userName, estimate });
      }
      console.log(
        `Estimate received from ${userName} in session ${sessionId}: ${estimate}`
      );
      io.to(sessionId).emit("receiveEstimate", { userName, estimate });
    }
  });

  socket.on("revealCards", (sessionId) => {
    console.log("revealCards event triggered");
    const session = sessions[sessionId];
    if (session) {
      session.revealed = true; // Store reveal status
      io.to(sessionId).emit("revealCards");
    }
  });

  socket.on("resetVote", (sessionId) => {
    console.log("resetVote event triggered");
    const session = sessions[sessionId];
    if (session) {
      session.estimates = [];
      session.revealed = false; // Reset reveal status
      io.to(sessionId).emit("resetVote");
    }
  });

  socket.on("toggleSpectateMode", ({ sessionId, userName, spectate }) => {
    const session = sessions[sessionId];
    if (session) {
      const user = session.users.find((user) => user.name === userName);
      if (user) {
        user.spectate = spectate;
        console.log(
          `${userName} in session ${sessionId} set spectate mode to ${spectate}`
        );
        io.to(sessionId).emit("updateUsers", session.users);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
    for (const sessionId in sessions) {
      const session = sessions[sessionId];
      session.users = session.users.filter((user) => user.id !== socket.id);
      if (session.users.length === 0) {
        delete sessions[sessionId];
        console.log(`Session ${sessionId} deleted due to no users`);
      } else {
        io.to(sessionId).emit("updateUsers", session.users);
      }
    }
  });

  socket.on("userEventLog", (logData) => {
    console.log("userEventLog handler triggered");

    if (!logData) {
      console.error("No logData received!");
      return;
    }

    // Log all fields for debugging
    console.log("Raw logData:", logData);
    console.log("eventType:", logData.eventType);
    console.log("userName:", logData.userName);
    console.log("sessionId:", logData.sessionId);
    console.log("timestamp:", logData.timestamp);
    console.log("details:", logData.details);
    console.log("location:", logData.location);
    console.log("userAgent:", logData.userAgent);

    db.run(
      `INSERT INTO user_logs (eventType, userName, sessionId, timestamp, details, location, userAgent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        logData.eventType,
        logData.userName,
        logData.sessionId,
        logData.timestamp,
        JSON.stringify(logData.details),
        logData.location,
        logData.userAgent,
      ],
      (err) => {
        if (err) {
          console.error("Failed to log user event to DB:", err);
          console.error("DB values:", [
            logData.eventType,
            logData.userName,
            logData.sessionId,
            logData.timestamp,
            JSON.stringify(logData.details),
            logData.location,
            logData.userAgent,
          ]);
        } else {
          console.log(
            "User event successfully logged to DB:",
            logData.eventType,
            logData.userName,
            logData.sessionId
          );
        }
      }
    );
  });
});

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
