const bcrypt = require('bcryptjs');
const User = require('../../models/User');
const { isAuthenticated } = require('../../middleware/auth');

module.exports = {
  Query: {
    me: (_, __, { user }) => {
      isAuthenticated(user);
      
      return User.findById(user._id);
    },
    
    getUser: async (_, { id }, { user }) => {
      isAuthenticated(user);
      
      return User.findById(id);
    },
    
    searchUsers: async (_, { query }, { user }) => {
      isAuthenticated(user);
      
      return User.find({
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
        ],
      });
    },
  },
  
  Mutation: {
    registerUser: async (_, { input }) => {
      const { username, email, password } = input;
      
      // Check if user already exists
      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });
      
      if (existingUser) {
        throw new Error('User already exists');
      }
      
      // Create new user
      const user = new User({
        username,
        email,
        passwordHash: password,
      });
      
      await user.save();
      
      return user;
    },
    
    login: async (_, { email, password }) => {
      // Find user
      const user = await User.findOne({ email });
      
      if (!user) {
        throw new Error('Invalid credentials');
      }
      
      // Check password
      const isMatch = await user.comparePassword(password);
      
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }
      
      // Update status
      user.status = 'online';
      await user.save();
      
      // Generate token
      const token = user.generateToken();
      
      return {
        token,
        user,
      };
    },
    
    updateUserProfile: async (_, { profilePicture, status }, { user }) => {
      isAuthenticated(user);
      
      const userToUpdate = await User.findById(user._id);
      
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      
      if (profilePicture) {
        userToUpdate.profilePicture = profilePicture;
      }
      
      if (status) {
        userToUpdate.status = status;
      }
      
      await userToUpdate.save();
      
      return userToUpdate;
    },
    
    updateUserPassword: async (_, { currentPassword, newPassword }, { user }) => {
      isAuthenticated(user);
      
      const userToUpdate = await User.findById(user._id);
      
      if (!userToUpdate) {
        throw new Error('User not found');
      }
      
      // Check current password
      const isMatch = await userToUpdate.comparePassword(currentPassword);
      
      if (!isMatch) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      userToUpdate.passwordHash = newPassword;
      await userToUpdate.save();
      
      return true;
    },
  },
};