import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Box,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  ExitToApp as LogoutIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onDrawerToggle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState(null);
  
  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotificationsOpen = (event) => {
    setNotificationsAnchorEl(event.currentTarget);
  };
  
  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };
  
  const handleNavigate = (path) => {
    navigate(path);
    handleMenuClose();
  };
  
  const handleLogout = () => {
    handleMenuClose();
    navigate('/logout');
  };
  
  // Generate avatar color and initials
  const generateAvatarColor = (username) => {
    if (!username) return '#3f51b5';
    let hash = 0;
    for (let i = 0; i < username.length; i++) {
      hash = username.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };
  
  const getInitials = (username) => {
    if (!username) return '?';
    const parts = username.split(/[\s._-]/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <AppBar position="fixed" color="default" elevation={1} sx={{ zIndex: theme => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        {/* Menu Button (Mobile Only) */}
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={onDrawerToggle}
          sx={{ mr: 2, display: { sm: 'flex', md: 'none' } }}
        >
          <MenuIcon />
        </IconButton>
        
        {/* Logo */}
        <Typography
          component="div"
          variant="h6"
          sx={{
            background: 'linear-gradient(90deg, #3f51b5 0%, #f50057 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
          onClick={() => navigate('/')}
        >
          CollabHub
        </Typography>
        
        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Navigation for larger screens */}
        {!isMobile && (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Button 
              color="inherit" 
              startIcon={<DashboardIcon />}
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
          </Box>
        )}
        
        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            aria-label="show notifications"
            onClick={handleNotificationsOpen}
            size="large"
          >
            <NotificationsIcon />
          </IconButton>
        </Tooltip>
        
        {/* Profile Menu */}
        <Box sx={{ ml: 1 }}>
          <Tooltip title="Account settings">
            <IconButton
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 2 }}
              aria-controls={Boolean(anchorEl) ? 'account-menu' : undefined}
              aria-haspopup="true"
              aria-expanded={Boolean(anchorEl) ? 'true' : undefined}
            >
              {user?.profilePicture ? (
                <Avatar 
                  src={user.profilePicture} 
                  alt={user.username}
                  sx={{ width: 32, height: 32 }}
                />
              ) : (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    bgcolor: generateAvatarColor(user?.username) 
                  }}
                >
                  {getInitials(user?.username)}
                </Avatar>
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
      
      {/* Profile Menu Items */}
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 200,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
          },
        }}
      >
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Profile" />
        </MenuItem>
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleNavigate('/profile')}>
          <ListItemIcon>
            <HelpIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Help" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>
      
      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationsAnchorEl}
        id="notifications-menu"
        open={Boolean(notificationsAnchorEl)}
        onClose={handleNotificationsClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.1))',
            mt: 1.5,
            width: 320,
          },
        }}
      >
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight="bold">Notifications</Typography>
        </Box>
        {[
          { text: 'New message from Sarah', time: '5 min ago' },
          { text: 'David assigned you a task', time: '1 hour ago' },
          { text: 'Meeting starts in 10 minutes', time: '10 min ago' },
        ].map((notification, index) => (
          <MenuItem key={index} onClick={handleNotificationsClose}>
            <Box sx={{ width: '100%' }}>
              <Typography variant="body2">{notification.text}</Typography>
              <Typography variant="caption" color="text.secondary">{notification.time}</Typography>
            </Box>
          </MenuItem>
        ))}
        <Divider />
        <Box sx={{ p: 1, textAlign: 'center' }}>
          <Button color="primary" size="small">
            See all notifications
          </Button>
        </Box>
      </Menu>
    </AppBar>
  );
};

export default Header;