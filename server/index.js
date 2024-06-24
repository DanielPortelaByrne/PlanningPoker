// server/index.js
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const path = require("path"); // Add this line

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../client/build")));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const sessions = {};

io.on("connection", (socket) => {
  console.log("New client connected");

  socket.on("createSession", (callback) => {
    const sessionId = Math.random().toString(36).substring(2, 15);
    sessions[sessionId] = { users: [], estimates: [] }; // Store estimates in session
    callback(sessionId);
  });

  socket.on("joinSession", ({ sessionId, userName }, callback) => {
    if (sessions[sessionId]) {
      socket.join(sessionId);
      const user = { id: socket.id, name: userName };
      sessions[sessionId].users.push(user);
      io.to(sessionId).emit("updateUsers", sessions[sessionId].users);
      callback({ success: true });
    } else {
      callback({ success: false, message: "Session not found" });
    }
  });

  socket.on("sendEstimate", ({ sessionId, estimate, userName }) => {
    if (sessions[sessionId]) {
      sessions[sessionId].estimates.push({ userName, estimate });
      io.to(sessionId).emit("receiveEstimate", { userName, estimate }); // Send to all clients in the session
    }
  });

  socket.on("revealCards", (sessionId) => {
    console.log("Reveal cards server side");
    if (sessions[sessionId]) {
      io.to(sessionId).emit("revealCards");
    }
  });

  socket.on("resetVote", (sessionId) => {
    console.log("Reset vote server side");
    if (sessions[sessionId]) {
      sessions[sessionId].estimates = [];
      io.to(sessionId).emit("resetVote");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    for (const sessionId in sessions) {
      sessions[sessionId].users = sessions[sessionId].users.filter(
        (user) => user.id !== socket.id
      );
      io.to(sessionId).emit("updateUsers", sessions[sessionId].users);
    }
  });
});

// Serve React app for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/build", "index.html"));
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
