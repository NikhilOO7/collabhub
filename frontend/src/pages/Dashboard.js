import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Divider,
  Avatar,
  AvatarGroup,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  Chat as ChatIcon,
  Announcement as AnnouncementIcon,
  Task as TaskIcon,
  Event as EventIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import MainLayout from '../layouts/MainLayout';
import { useWorkspace } from '../context/WorkspaceContext';

// GraphQL Queries and Mutations
const GET_DASHBOARD_DATA = gql`
  query GetDashboardData {
    getUserWorkspaces {
      _id
      name
      description
      members {
        userId
        role
      }
    }
    getRecentActivities {
      _id
      type
      title
      content
      createdAt
      workspace {
        _id
        name
      }
      user {
        _id
        username
        profilePicture
      }
    }
    getUpcomingMeetings {
      _id
      title
      description
      startTime
      participants {
        _id
        username
        profilePicture
      }
    }
  }
`;

const CREATE_WORKSPACE = gql`
  mutation CreateWorkspace($input: WorkspaceInput!) {
    createWorkspace(input: $input) {
      _id
      name
      description
    }
  }
`;

const Dashboard = () => {
  const navigate = useNavigate();
  const { setActiveWorkspace } = useWorkspace();
  const [createWorkspaceOpen, setCreateWorkspaceOpen] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState({
    name: '',
    description: '',
  });

  // Query dashboard data
  const { data, loading, error, refetch } = useQuery(GET_DASHBOARD_DATA);

  // Create workspace mutation
  const [createWorkspaceMutation, { loading: createLoading }] = useMutation(
    CREATE_WORKSPACE,
    {
      onCompleted: () => {
        setCreateWorkspaceOpen(false);
        refetch();
      },
    }
  );

  // Handle workspace click
  const handleWorkspaceClick = (workspace) => {
    setActiveWorkspace(workspace);
    navigate(`/workspace/${workspace._id}`);
  };

  // Handle create workspace dialog
  const handleOpenCreateWorkspace = () => {
    setCreateWorkspaceOpen(true);
  };

  const handleCloseCreateWorkspace = () => {
    setCreateWorkspaceOpen(false);
  };

  const handleCreateWorkspaceChange = (e) => {
    setNewWorkspace({
      ...newWorkspace,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspace.name) return;

    try {
      await createWorkspaceMutation({
        variables: {
          input: {
            name: newWorkspace.name,
            description: newWorkspace.description,
          },
        },
      });

      // Reset form
      setNewWorkspace({
        name: '',
        description: '',
      });
    } catch (err) {
      console.error('Error creating workspace:', err);
    }
  };

  // Extract data for rendering
  const workspaces = data?.getUserWorkspaces || [];
  const recentActivities = data?.getRecentActivities || [];
  const upcomingMeetings = data?.getUpcomingMeetings || [];

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4">Dashboard</Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateWorkspace}
          >
            Create Workspace
          </Button>
        </Box>

        <Grid container spacing={3}>
          {/* Workspaces Section */}
          <Grid item xs={12}>
            <Typography variant="h5" sx={{ mb: 2 }}>
              Your Workspaces
            </Typography>
            <Grid container spacing={2}>
              {workspaces.map((workspace) => (
                <Grid item xs={12} sm={6} md={4} key={workspace._id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4,
                      },
                    }}
                    onClick={() => handleWorkspaceClick(workspace)}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" gutterBottom>
                        {workspace.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {workspace.description}
                      </Typography>
                      <Box sx={{ mt: 2 }}>
                        <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                          {workspace.members.slice(0, 4).map((member, index) => (
                            <Avatar key={index} alt="Team Member" src={`/avatars/${index + 1}.jpg`} />
                          ))}
                        </AvatarGroup>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button size="small" startIcon={<ChatIcon />}>
                        Chat
                      </Button>
                      <Button size="small" startIcon={<TaskIcon />}>
                        Tasks
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
              {workspaces.length === 0 && !loading && (
                <Grid item xs={12}>
                  <Paper sx={{ p: 3, textAlign: 'center' }}>
                    <Typography variant="body1" color="text.secondary">
                      You don't have any workspaces yet. Create your first workspace to get started!
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      sx={{ mt: 2 }}
                      onClick={handleOpenCreateWorkspace}
                    >
                      Create Workspace
                    </Button>
                  </Paper>
                </Grid>
              )}
            </Grid>
          </Grid>

          {/* Recent Activity */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Recent Activity
              </Typography>
              <List>
                {recentActivities.map((activity) => (
                  <React.Fragment key={activity._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar src={activity.user.profilePicture}>
                          {activity.type === 'chat' && <ChatIcon />}
                          {activity.type === 'task' && <TaskIcon />}
                          {activity.type === 'announcement' && <AnnouncementIcon />}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.title}
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {activity.user.username}
                            </Typography>
                            {` — ${activity.content}`}
                            <Typography variant="caption" display="block">
                              in {activity.workspace.name} - {new Date(activity.createdAt).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" />
                  </React.Fragment>
                ))}
                {recentActivities.length === 0 && !loading && (
                  <ListItem>
                    <ListItemText
                      primary="No recent activities"
                      secondary="Activities will appear here when you start collaborating."
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>

          {/* Upcoming Meetings */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Upcoming Meetings
              </Typography>
              <List>
                {upcomingMeetings.map((meeting) => (
                  <React.Fragment key={meeting._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemAvatar>
                        <Avatar>
                          <EventIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={meeting.title}
                        secondary={
                          <>
                            <Typography variant="body2" color="text.secondary">
                              {meeting.description}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" color="primary">
                                {new Date(meeting.startTime).toLocaleString()}
                              </Typography>
                              <AvatarGroup max={3} sx={{ mt: 1 }}>
                                {meeting.participants.map((participant, index) => (
                                  <Avatar
                                    key={index}
                                    alt={participant.username}
                                    src={participant.profilePicture}
                                  />
                                ))}
                              </AvatarGroup>
                            </Box>
                          </>
                        }
                      />
                      <Button variant="contained" size="small" sx={{ mt: 1 }}>
                        Join
                      </Button>
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
                {upcomingMeetings.length === 0 && !loading && (
                  <ListItem>
                    <ListItemText
                      primary="No upcoming meetings"
                      secondary="Schedule a meeting to collaborate with your team."
                    />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Create Workspace Dialog */}
      <Dialog
        open={createWorkspaceOpen}
        onClose={handleCloseCreateWorkspace}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Workspace</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            name="name"
            label="Workspace Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newWorkspace.name}
            onChange={handleCreateWorkspaceChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="description"
            name="description"
            label="Description"
            type="text"
            fullWidth
            variant="outlined"
            multiline
            rows={3}
            value={newWorkspace.description}
            onChange={handleCreateWorkspaceChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateWorkspace}>Cancel</Button>
          <Button
            onClick={handleCreateWorkspace}
            variant="contained"
            disabled={!newWorkspace.name || createLoading}
          >
            {createLoading ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};

export default Dashboard;