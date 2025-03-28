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

// Import debug routes
const debugRoutes = require('./routes/debugRoutes');

// Routes
app.use('/api', executeRoutes);
app.use('/api', codeRoutes);
app.use('/api/debug', debugRoutes);

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('terminal-input', (data) => {
    // Process terminal input
    console.log('Terminal input:', data);
    
    // Echo back the input as output
    socket.emit('terminal-output', { output: `Received: ${data.input}` });
  });
  
  socket.on('debug-connect', (data) => {
    console.log('Debug client connected:', data.sessionId);
    
    // Store the socket ID with the session ID for real-time updates
    if (data.sessionId) {
      socket.debugSessionId = data.sessionId;
    }
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
const START_PORT = parseInt(process.env.PORT || '8080', 10);
const MAX_PORT = 65535;
const PORT_RANGE = 100; // Try up to 100 ports before giving up

// Improved server start function with port range checking
async function findAvailablePort(startPort) {
  for (let port = startPort; port < startPort + PORT_RANGE && port <= MAX_PORT; port++) {
    try {
      await new Promise((resolve, reject) => {
        const testServer = http.createServer();
        testServer.listen(port, () => {
          testServer.close(() => resolve(port));
        });
        testServer.on('error', reject);
      });
      return port; // Port is available
    } catch (err) {
      if (err.code !== 'EADDRINUSE') throw err;
      // Port is in use, continue to next port
    }
  }
  throw new Error(`No available ports found in range ${startPort}-${startPort + PORT_RANGE}`);
}

// Start server with improved port allocation
async function startServer() {
  try {
    const port = await findAvailablePort(START_PORT);
    server.listen(port, () => {
      console.log(`Server successfully started on port ${port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

startServer();

module.exports = { app, io };
