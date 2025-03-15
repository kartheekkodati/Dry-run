const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const executeRoutes = require('./routes/executeRoutes');
const codeRoutes = require('./routes/codeRoutes');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Connect to MongoDB
connectDB()
  .then((conn) => {
    if (conn) {
      console.log('MongoDB connection established');
    } else {
      console.log('Running without MongoDB - code storage will not persist');
      setupInMemoryCodeStorage();
    }
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Running without MongoDB - code storage will not persist');
    setupInMemoryCodeStorage();
  });

// Setup in-memory code storage if MongoDB is not available
function setupInMemoryCodeStorage() {
  const codeStorage = [];
  let codeIdCounter = 1;

  // Mock code routes
  app.get('/api/code', (req, res) => {
    res.json(codeStorage);
  });

  app.get('/api/code/:id', (req, res) => {
    const code = codeStorage.find(c => c.id === parseInt(req.params.id));
    if (!code) {
      return res.status(404).json({ message: 'Code not found' });
    }
    res.json(code);
  });

  app.post('/api/code', (req, res) => {
    const { title, code, language } = req.body;
    
    if (!title || !code || !language) {
      return res.status(400).json({ message: 'Title, code, and language are required' });
    }
    
    const newCode = {
      id: codeIdCounter++,
      title,
      code,
      language,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    codeStorage.push(newCode);
    res.status(201).json(newCode);
  });
}

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', executeRoutes);
app.use('/api', codeRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('terminal-input', (data) => {
    // Process terminal input
    console.log('Terminal input:', data);
    
    // Echo back the input as output
    socket.emit('terminal-output', { output: `Received: ${data.input}` });
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// Get port from environment or use default
const PORT = parseInt(process.env.PORT || '8080', 10);

// Start server with port fallback mechanism
function startServer(port) {
  // Close the server if it's already listening
  if (server.listening) {
    server.close();
  }
  
  server.listen(port, () => {
    console.log(`Server running on port ${port}`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      // Make sure we don't exceed valid port range
      const newPort = Math.min(port + 1, 65535);
      console.log(`Port ${port} is busy, trying port ${newPort}`);
      startServer(newPort);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);

module.exports = { app, io };