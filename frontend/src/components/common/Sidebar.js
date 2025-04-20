import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Divider,
  Toolbar,
  Typography,
  Button,
  Box,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Group as GroupIcon,
  Task as TaskIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
  Add as AddIcon,
  ExpandMore,
  ExpandLess,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useWorkspace } from '../../context/WorkspaceContext';

const drawerWidth = 240;

const Sidebar = ({ open, onClose, variant }) => {
  const navigate = useNavigate();
  const { workspaces, activeWorkspace, setActiveWorkspace } = useWorkspace();
  const [workspacesOpen, setWorkspacesOpen] = useState(true);

  const handleWorkspaceClick = () => {
    setWorkspacesOpen(!workspacesOpen);
  };

  const handleNavigate = (path) => {
    navigate(path);
    if (variant === 'temporary') {
      onClose();
    }
  };

  const handleWorkspaceSelect = (workspace) => {
    setActiveWorkspace(workspace);
    navigate(`/workspace/${workspace._id}`);
    if (variant === 'temporary') {
      onClose();
    }
  };

  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto' }}>
        <List>
          <ListItem button onClick={() => handleNavigate('/dashboard')}>
            <ListItemIcon>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={handleWorkspaceClick}>
            <ListItemIcon>
              <GroupIcon />
            </ListItemIcon>
            <ListItemText primary="Workspaces" />
            {workspacesOpen ? <ExpandLess /> : <ExpandMore />}
          </ListItem>
          <Collapse in={workspacesOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {workspaces.map((workspace) => (
                <ListItem
                  button
                  key={workspace._id}
                  sx={{ pl: 4 }}
                  onClick={() => handleWorkspaceSelect(workspace)}
                  selected={activeWorkspace?._id === workspace._id}
                >
                  <ListItemText primary={workspace.name} />
                </ListItem>
              ))}
              <ListItem button sx={{ pl: 4 }}>
                <ListItemIcon>
                  <AddIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Create New" />
              </ListItem>
            </List>
          </Collapse>
        </List>

        {activeWorkspace && (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">
                {activeWorkspace.name}
              </Typography>
            </Box>
            <List>
              <ListItem button onClick={() => handleNavigate(`/workspace/${activeWorkspace._id}/chat`)}>
                <ListItemIcon>
                  <ChatIcon />
                </ListItemIcon>
                <ListItemText primary="Chat" />
              </ListItem>
              <ListItem button onClick={() => handleNavigate(`/tasks/${activeWorkspace._id}`)}>
                <ListItemIcon>
                  <TaskIcon />
                </ListItemIcon>
                <ListItemText primary="Tasks" />
              </ListItem>
              <ListItem button onClick={() => handleNavigate(`/workspace/${activeWorkspace._id}/calls`)}>
                <ListItemIcon>
                  <VideoCallIcon />
                </ListItemIcon>
                <ListItemText primary="Video Calls" />
              </ListItem>
            </List>
          </>
        )}
      </Box>
    </Drawer>
  );
};

export default Sidebar;