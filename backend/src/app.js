const express = require('express');
const cors = require('cors');
const http = require('http');
const initSockets = require('./sockets/queueSocket');

require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = initSockets(server);
app.set('io', io); // Make it accessible in routes

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/orders', require('./routes/order.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
