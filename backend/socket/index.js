const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Message = require('../models/Message');

// Socket.io setup
const setupSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Track active peers in rooms
  const rooms = new Map();

  // Socket middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user
      const user = await User.findById(decoded._id);
      
      if (!user) {
        return next(new Error('User not found'));
      }
      
      // Set user data on socket
      socket.user = {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
      };
      
      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  // Socket connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    
    // Update user status to online
    User.findByIdAndUpdate(
      socket.user._id,
      { status: 'online' },
      { new: true }
    ).exec();
    
    // Join user to their rooms
    joinUserRooms(socket);
    
    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      // Remove user from all rooms they were in
      rooms.forEach((peers, roomId) => {
        if (peers.has(socket.user._id)) {
          peers.delete(socket.user._id);
          
          // Notify others in the room
          socket.to(`room:${roomId}`).emit('user-left', {
            userId: socket.user._id,
            username: socket.user.username,
          });
          
          // Remove room if empty
          if (peers.size === 0) {
            rooms.delete(roomId);
          }
        }
      });

      // Update user status to offline
      await User.findByIdAndUpdate(
        socket.user._id,
        { status: 'offline' },
        { new: true }
      ).exec();
    });
    
    // Handle chat message
    socket.on('send-message', async (data) => {
      try {
        const { channelId, content, attachments = [], threadId = null } = data;
        
        // Create message
        const message = new Message({
          channelId,
          sender: socket.user._id,
          content,
          attachments,
          threadId,
          readBy: [socket.user._id],
        });
        
        await message.save();
        
        // Populate sender data
        await message.populate('sender');
        
        // Emit message to channel
        io.to(`channel:${channelId}`).emit('new-message', message);
        
        // If it's a thread message, also emit to thread
        if (threadId) {
          io.to(`thread:${threadId}`).emit('new-thread-message', message);
        }
      } catch (err) {
        console.error('Error sending message:', err);
      }
    });
    
    // Handle typing
    socket.on('typing', (data) => {
      const { channelId, isTyping } = data;
      
      socket.to(`channel:${channelId}`).emit('typing', {
        user: socket.user,
        channelId,
        isTyping,
      });
    });
    
    // Handle joining a channel
    socket.on('join-channel', (channelId) => {
      socket.join(`channel:${channelId}`);
    });
    
    // Handle leaving a channel
    socket.on('leave-channel', (channelId) => {
      socket.leave(`channel:${channelId}`);
    });
    
    // Handle joining a thread
    socket.on('join-thread', (threadId) => {
      socket.join(`thread:${threadId}`);
    });
    
    // Handle leaving a thread
    socket.on('leave-thread', (threadId) => {
      socket.leave(`thread:${threadId}`);
    });
    
    // Handle joining a room (for video)
    socket.on('join-room', async ({ roomId, userId }) => {
      socket.join(`room:${roomId}`);
      
      // Initialize room if doesn't exist
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      
      const room = rooms.get(roomId);
      room.add(userId);
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit('user-joined', {
        userId,
        username: socket.user.username,
        profilePicture: socket.user.profilePicture,
      });
      
      // Send list of existing peers to the joining user
      const peers = Array.from(room).filter(id => id !== userId);
      if (peers.length > 0) {
        socket.emit('existing-peers', {
          peers,
        });
      }
    });
    
    // Handle leaving a room
    socket.on('leave-room', ({ roomId, userId }) => {
      socket.leave(`room:${roomId}`);
      
      const room = rooms.get(roomId);
      if (room) {
        room.delete(userId);
        
        // Remove room if empty
        if (room.size === 0) {
          rooms.delete(roomId);
        }
      }
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit('user-left', {
        userId,
        username: socket.user.username,
      });
    });
    
    // Handle sending signal (WebRTC)
    socket.on('sending-signal', ({ receiverId, senderId, signal }) => {
      io.to(receiverId).emit('receiving-signal', {
        userId: senderId,
        signal,
        initiator: socket.user.username,
      });
    });
    
    // Handle returning signal (WebRTC)
    socket.on('returning-signal', ({ receiverId, senderId, signal }) => {
      io.to(receiverId).emit('receiving-returned-signal', {
        userId: senderId,
        signal,
        receiver: socket.user.username,
      });
    });

    // Handle screen sharing
    socket.on('start-screen-share', ({ roomId, userId }) => {
      socket.to(`room:${roomId}`).emit('user-screen-share', {
        userId,
        username: socket.user.username,
        isSharing: true,
      });
    });
    
    socket.on('stop-screen-share', ({ roomId, userId }) => {
      socket.to(`room:${roomId}`).emit('user-screen-share', {
        userId,
        username: socket.user.username,
        isSharing: false,
      });
    });

    // Handle chat message in meeting
    socket.on('send-chat-message', (data) => {
      const { roomId, userId, message, timestamp } = data;
      
      socket.to(`room:${roomId}`).emit('chat-message', {
        userId,
        username: socket.user.username,
        message,
        timestamp,
      });
    });
  });

  // Join user to their rooms
  const joinUserRooms = async (socket) => {
    // In a real app, you would query for channels the user is a member of
    // and join those rooms automatically
    try {
      // Example: Find all channels for the user
      /*
      const channels = await Channel.find({
        members: socket.user._id,
      });
      
      channels.forEach((channel) => {
        socket.join(`channel:${channel._id}`);
      });
      */
    } catch (err) {
      console.error('Error joining user rooms:', err);
    }
  };

  return io;
};

module.exports = setupSocket;