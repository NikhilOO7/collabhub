const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Get user from token
const getUserFromToken = (token) => {
  if (!token || !token.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    );
    
    return decoded;
  } catch (err) {
    return null;
  }
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization');
  
  if (!token || !token.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
  
  try {
    // Verify token
    const decoded = jwt.verify(
      token.replace('Bearer ', ''),
      process.env.JWT_SECRET
    );
    
    // Add user to request
    req.user = decoded;
    
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Check if user is authenticated
const isAuthenticated = (user) => {
  if (!user) {
    throw new Error('Not authenticated');
  }
  return user;
};

module.exports = {
  getUserFromToken,
  authenticate,
  isAuthenticated,
};