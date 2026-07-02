const socketIo = require('socket.io');

function initSockets(server) {
  const io = socketIo(server, {
    cors: {
      origin: '*', // Configure properly in production
      methods: ['GET', 'POST', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('join-admin', () => {
      socket.join('admins');
      console.log(`Socket ${socket.id} joined room: admins`);
    });

    socket.on('join-student', (userId) => {
      socket.join(`student-${userId}`);
      console.log(`Socket ${socket.id} joined room: student-${userId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

module.exports = initSockets;
