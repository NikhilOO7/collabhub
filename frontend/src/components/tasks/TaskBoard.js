import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Avatar,
  IconButton,
  Menu,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from '@mui/material';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import {
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  PriorityHigh as HighPriorityIcon,
  Flag as MediumPriorityIcon,
  LowPriority as LowPriorityIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, gql } from '@apollo/client';

// GraphQL Queries and Mutations
const GET_WORKSPACE_TASKS = gql`
  query GetWorkspaceTasks($workspaceId: ID!) {
    getWorkspaceTasks(workspaceId: $workspaceId) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
      createdBy {
        _id
        username
      }
    }
    getWorkspaceMembers(workspaceId: $workspaceId) {
      _id
      username
      profilePicture
    }
  }
`;

const CREATE_TASK = gql`
  mutation CreateTask($input: TaskInput!) {
    createTask(input: $input) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
    }
  }
`;

const UPDATE_TASK = gql`
  mutation UpdateTask($id: ID!, $input: TaskInput!) {
    updateTask(id: $id, input: $input) {
      _id
      title
      description
      status
      priority
      assignees {
        _id
        username
        profilePicture
      }
      dueDate
    }
  }
`;

const TaskBoard = ({ workspaceId }) => {
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [taskMenuAnchorEl, setTaskMenuAnchorEl] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'backlog',
    priority: 'medium',
    assignees: [],
    dueDate: null,
  });

  // Query tasks and members
  const { data, loading, error } = useQuery(GET_WORKSPACE_TASKS, {
    variables: {
      workspaceId,
    },
    fetchPolicy: 'network-only',
  });

  // Mutations
  const [createTaskMutation, { loading: createLoading }] = useMutation(CREATE_TASK, {
    refetchQueries: [{ query: GET_WORKSPACE_TASKS, variables: { workspaceId } }],
  });

  const [updateTaskMutation, { loading: updateLoading }] = useMutation(UPDATE_TASK, {
    refetchQueries: [{ query: GET_WORKSPACE_TASKS, variables: { workspaceId } }],
  });

  // Group tasks by status
  const getTasksByStatus = (status) => {
    if (!data?.getWorkspaceTasks) return [];
    return data.getWorkspaceTasks.filter((task) => task.status === status);
  };

  // Handle drag end
  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    // If no destination or same destination, do nothing
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) {
      return;
    }

    // Find the task
    const task = data.getWorkspaceTasks.find((t) => t._id === draggableId);

    // Update task status
    try {
      await updateTaskMutation({
        variables: {
          id: task._id,
          input: {
            ...task,
            status: destination.droppableId,
            assignees: task.assignees.map((a) => a._id),
          },
        },
      });
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Task dialog handlers
  const handleOpenTaskDialog = (task = null) => {
    if (task) {
      setSelectedTask(task);
      setNewTask({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        assignees: task.assignees.map((a) => a._id),
        dueDate: task.dueDate,
      });
    } else {
      setSelectedTask(null);
      setNewTask({
        title: '',
        description: '',
        status: 'backlog',
        priority: 'medium',
        assignees: [],
        dueDate: null,
      });
    }
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
  };

  // Task menu handlers
  const handleTaskMenuOpen = (event, task) => {
    event.stopPropagation();
    setSelectedTask(task);
    setTaskMenuAnchorEl(event.currentTarget);
  };

  const handleTaskMenuClose = () => {
    setTaskMenuAnchorEl(null);
  };

  // Form change handlers
  const handleTaskFormChange = (e) => {
    setNewTask({
      ...newTask,
      [e.target.name]: e.target.value,
    });
  };

  const handleAssigneeChange = (e) => {
    setNewTask({
      ...newTask,
      assignees: e.target.value,
    });
  };

  // Save task
  const handleSaveTask = async () => {
    if (!newTask.title) return;

    try {
      if (selectedTask) {
        // Update existing task
        await updateTaskMutation({
          variables: {
            id: selectedTask._id,
            input: {
              ...newTask,
              workspaceId,
            },
          },
        });
      } else {
        // Create new task
        await createTaskMutation({
          variables: {
            input: {
              ...newTask,
              workspaceId,
            },
          },
        });
      }

      handleCloseTaskDialog();
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  // Delete task
  const handleDeleteTask = async () => {
    // Implement delete task mutation
    handleTaskMenuClose();
    handleCloseTaskDialog();
  };

  // Get priority icon
  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <HighPriorityIcon color="error" />;
      case 'medium':
        return <MediumPriorityIcon color="warning" />;
      case 'low':
        return <LowPriorityIcon color="success" />;
      default:
        return <MediumPriorityIcon color="warning" />;
    }
  };

  // Get color for priority
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'warning';
    }
  };

  // Column titles
  const columns = [
    { id: 'backlog', title: 'Backlog' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'review', title: 'Review' },
    { id: 'done', title: 'Done' },
  ];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Task Board</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenTaskDialog()}
        >
          Add Task
        </Button>
      </Box>

      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {columns.map((column) => (
            <Grid item xs={12} sm={6} md={3} key={column.id}>
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: 'background.default',
                  height: '100%',
                  minHeight: 'calc(100vh - 200px)',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <Box
                  sx={{
                    p: 1,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1,
                  }}
                >
                  <Typography variant="h6">{column.title}</Typography>
                  <Chip
                    label={getTasksByStatus(column.id).length}
                    size="small"
                    color="primary"
                  />
                </Box>

                <Droppable droppableId={column.id}>
                  {(provided, snapshot) => (
                    <Box
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      sx={{
                        backgroundColor: snapshot.isDraggingOver
                          ? 'action.hover'
                          : 'background.default',
                        flexGrow: 1,
                        minHeight: 100,
                        p: 1,
                        borderRadius: 1,
                      }}
                    >
                      {getTasksByStatus(column.id).map((task, index) => (
                        <Draggable
                          key={task._id}
                          draggableId={task._id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Paper
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              elevation={snapshot.isDragging ? 6 : 1}
                              sx={{
                                p: 2,
                                mb: 1,
                                backgroundColor: 'background.paper',
                                '&:hover': {
                                  boxShadow: 3,
                                },
                                cursor: 'pointer',
                              }}
                              onClick={() => handleOpenTaskDialog(task)}
                            >
                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'flex-start',
                                  mb: 1,
                                }}
                              >
                                <Typography
                                  variant="subtitle1"
                                  component="div"
                                  sx={{
                                    fontWeight: 500,
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {getPriorityIcon(task.priority)}
                                  <span style={{ marginLeft: 8 }}>
                                    {task.title}
                                  </span>
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={(e) => handleTaskMenuOpen(e, task)}
                                >
                                  <MoreVertIcon fontSize="small" />
                                </IconButton>
                              </Box>

                              {task.description && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mb: 1,
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {task.description}
                                </Typography>
                              )}

                              <Box
                                sx={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  mt: 2,
                                }}
                              >
                                <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 24, height: 24 } }}>
                                  {task.assignees.map((assignee) => (
                                    <Avatar
                                      key={assignee._id}
                                      src={assignee.profilePicture}
                                      alt={assignee.username}
                                      sx={{ width: 24, height: 24 }}
                                    />
                                  ))}
                                </AvatarGroup>
                                
                                {task.dueDate && (
                                  <Chip
                                    label={new Date(task.dueDate).toLocaleDateString()}
                                    size="small"
                                    color={
                                      new Date(task.dueDate) < new Date()
                                        ? 'error'
                                        : 'default'
                                    }
                                    variant="outlined"
                                  />
                                )}
                              </Box>
                            </Paper>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </Box>
                  )}
                </Droppable>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      {/* Task Menu */}
      <Menu
        anchorEl={taskMenuAnchorEl}
        open={Boolean(taskMenuAnchorEl)}
        onClose={handleTaskMenuClose}
      >
        <MenuItem
          onClick={() => {
            handleTaskMenuClose();
            handleOpenTaskDialog(selectedTask);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem onClick={handleDeleteTask}>Delete</MenuItem>
      </Menu>

      {/* Task Dialog */}
      <Dialog
        open={taskDialogOpen}
        onClose={handleCloseTaskDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedTask ? 'Edit Task' : 'Create New Task'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={newTask.title}
                onChange={handleTaskFormChange}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={newTask.description}
                onChange={handleTaskFormChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={newTask.status}
                  onChange={handleTaskFormChange}
                  label="Status"
                >
                  <MenuItem value="backlog">Backlog</MenuItem>
                  <MenuItem value="in-progress">In Progress</MenuItem>
                  <MenuItem value="review">Review</MenuItem>
                  <MenuItem value="done">Done</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={newTask.priority}
                  onChange={handleTaskFormChange}
                  label="Priority"
                >
                  <MenuItem value="high">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <HighPriorityIcon color="error" sx={{ mr: 1 }} />
                      High
                    </Box>
                  </MenuItem>
                  <MenuItem value="medium">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <MediumPriorityIcon color="warning" sx={{ mr: 1 }} />
                      Medium
                    </Box>
                  </MenuItem>
                  <MenuItem value="low">
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <LowPriorityIcon color="success" sx={{ mr: 1 }} />
                      Low
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Assignees</InputLabel>
                <Select
                  multiple
                  name="assignees"
                  value={newTask.assignees}
                  onChange={handleAssigneeChange}
                  label="Assignees"
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((memberId) => {
                        const member = data.getWorkspaceMembers.find(
                          (m) => m._id === memberId
                        );
                        return (
                          <Chip
                            key={memberId}
                            avatar={
                              <Avatar
                                src={member?.profilePicture}
                                alt={member?.username}
                              />
                            }
                            label={member?.username}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {data?.getWorkspaceMembers?.map((member) => (
                    <MenuItem key={member._id} value={member._id}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={member.profilePicture}
                          alt={member.username}
                          sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        {member.username}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Due Date"
                name="dueDate"
                type="date"
                value={newTask.dueDate ? new Date(newTask.dueDate).toISOString().split('T')[0] : ''}
                onChange={handleTaskFormChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveTask}
            disabled={!newTask.title || createLoading || updateLoading}
          >
            {createLoading || updateLoading
              ? 'Saving...'
              : selectedTask
              ? 'Update'
              : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TaskBoard;