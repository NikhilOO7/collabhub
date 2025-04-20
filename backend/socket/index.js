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
    socket.on('join-room', (data) => {
      const { roomId, userId } = data;
      
      socket.join(`room:${roomId}`);
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit('user-joined', {
        userId,
        username: socket.user.username,
      });
    });
    
    // Handle leaving a room
    socket.on('leave-room', (data) => {
      const { roomId, userId } = data;
      
      socket.leave(`room:${roomId}`);
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit('user-left', {
        userId,
        username: socket.user.username,
      });
    });
    
    // Handle sending signal (WebRTC)
    socket.on('sending-signal', (data) => {
      const { receiverId, senderId, signal } = data;
      
      io.to(receiverId).emit('receiving-signal', {
        userId: senderId,
        signal,
      });
    });
    
    // Handle returning signal (WebRTC)
    socket.on('returning-signal', (data) => {
      const { receiverId, senderId, signal } = data;
      
      io.to(receiverId).emit('receiving-returned-signal', {
        userId: senderId,
        signal,
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