import React, { useState } from 'react';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  TextField,
  Button,
  Divider,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import MainLayout from '../layouts/MainLayout';
import { useAuth } from '../context/AuthContext';

// GraphQL Queries and Mutations
const GET_USER = gql`
  query GetUser {
    me {
      _id
      username
      email
      profilePicture
      status
      createdAt
    }
  }
`;

const UPDATE_PROFILE = gql`
  mutation UpdateUserProfile($profilePicture: String, $status: String) {
    updateUserProfile(profilePicture: $profilePicture, status: $status) {
      _id
      username
      profilePicture
      status
    }
  }
`;

const UPDATE_PASSWORD = gql`
  mutation UpdateUserPassword($currentPassword: String!, $newPassword: String!) {
    updateUserPassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

const UserProfile = () => {
  const { user } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    profilePicture: '',
    status: '',
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // Get user data
  const { loading, error, data } = useQuery(GET_USER);

  // Update profile mutation
  const [updateProfile, { loading: updateLoading }] = useMutation(UPDATE_PROFILE);

  // Update password mutation
  const [updatePassword, { loading: passwordLoading }] = useMutation(UPDATE_PASSWORD);

  // Set profile data when data changes
  React.useEffect(() => {
    if (data?.me) {
      setProfileData({
        profilePicture: data.me.profilePicture || '',
        status: data.me.status || '',
      });
    }
  }, [data]);

  // Handle profile change
  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle password change
  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle update profile
  const handleUpdateProfile = async () => {
    try {
      await updateProfile({
        variables: profileData,
      });

      setEditMode(false);
      setAlert({
        open: true,
        message: 'Profile updated successfully',
        severity: 'success',
      });
    } catch (err) {
      setAlert({
        open: true,
        message: `Error updating profile: ${err.message}`,
        severity: 'error',
      });
    }
  };

  // Handle update password
  const handleUpdatePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setAlert({
        open: true,
        message: 'Passwords do not match',
        severity: 'error',
      });
      return;
    }

    try {
      await updatePassword({
        variables: {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        },
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      setAlert({
        open: true,
        message: 'Password updated successfully',
        severity: 'success',
      });
    } catch (err) {
      setAlert({
        open: true,
        message: `Error updating password: ${err.message}`,
        severity: 'error',
      });
    }
  };

  // Handle close alert
  const handleCloseAlert = () => {
    setAlert({
      ...alert,
      open: false,
    });
  };

  if (loading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <Box sx={{ p: 3 }}>
          <Typography color="error">
            Error loading profile: {error.message}
          </Typography>
        </Box>
      </MainLayout>
    );
  }

  const userData = data?.me;

  return (
    <MainLayout>
      <Box sx={{ p: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your account information and settings
          </Typography>
        </Box>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar
              src={userData?.profilePicture}
              alt={userData?.username}
              sx={{ width: 80, height: 80, mr: 3 }}
            />
            <Box>
              <Typography variant="h5">{userData?.username}</Typography>
              <Typography variant="body1" color="text.secondary">
                {userData?.email}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Member since {new Date(userData?.createdAt).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ ml: 'auto' }}>
              <Button
                variant="outlined"
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? 'Cancel' : 'Edit Profile'}
              </Button>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {editMode ? (
            <Box component="form">
              <TextField
                fullWidth
                margin="normal"
                name="profilePicture"
                label="Profile Picture URL"
                value={profileData.profilePicture}
                onChange={handleProfileChange}
              />
              <TextField
                fullWidth
                margin="normal"
                name="status"
                label="Status"
                select
                SelectProps={{ native: true }}
                value={profileData.status}
                onChange={handleProfileChange}
              >
                <option value="online">Online</option>
                <option value="away">Away</option>
                <option value="offline">Offline</option>
              </TextField>
              <Button
                variant="contained"
                onClick={handleUpdateProfile}
                disabled={updateLoading}
                sx={{ mt: 2 }}
              >
                {updateLoading ? 'Updating...' : 'Update Profile'}
              </Button>
            </Box>
          ) : (
            <Box>
              <Typography variant="subtitle1">Status</Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {userData?.status || 'Not set'}
              </Typography>
            </Box>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Change Password
          </Typography>
          <Box component="form">
            <TextField
              fullWidth
              margin="normal"
              name="currentPassword"
              label="Current Password"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
            />
            <TextField
              fullWidth
              margin="normal"
              name="newPassword"
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
            />
            <TextField
              fullWidth
              margin="normal"
              name="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              error={
                passwordData.newPassword !== passwordData.confirmPassword &&
                passwordData.confirmPassword !== ''
              }
              helperText={
                passwordData.newPassword !== passwordData.confirmPassword &&
                passwordData.confirmPassword !== ''
                  ? 'Passwords do not match'
                  : ''
              }
            />
            <Button
              variant="contained"
              onClick={handleUpdatePassword}
              disabled={
                passwordLoading ||
                !passwordData.currentPassword ||
                !passwordData.newPassword ||
                !passwordData.confirmPassword ||
                passwordData.newPassword !== passwordData.confirmPassword
              }
              sx={{ mt: 2 }}
            >
              {passwordLoading ? 'Updating...' : 'Update Password'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <Snackbar
        open={alert.open}
        autoHideDuration={6000}
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseAlert} severity={alert.severity}>
          {alert.message}
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};

export default UserProfile;