const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');  // Import the CORS middleware

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",  // Allow requests from this origin (React app)
    methods: ["GET", "POST"],  // Allow specific HTTP methods
    credentials: true
  }
});

// Use CORS
app.use(cors({
  origin: "http://localhost:3000",  // Allow requests from this origin
  methods: ["GET", "POST"],
  credentials: true
}));

app.get('/', (req, res) => {
  res.send('WebRTC Signaling Server Running');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('signal', (data) => {
    socket.broadcast.emit('signal', data);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});