import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, gql } from '@apollo/client';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import {
  Mic as MicIcon,
  MicOff as MicOffIcon,
  Videocam as VideocamIcon,
  VideocamOff as VideocamOffIcon,
  ScreenShare as ScreenShareIcon,
  StopScreenShare as StopScreenShareIcon,
  CallEnd as CallEndIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Send as SendIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import VideoError from '../components/video/VideoError';
import VideoSettings from '../components/video/VideoSettings';
import { useWorkspace } from '../context/WorkspaceContext';
import Peer from 'simple-peer';

// GraphQL Queries and Mutations
const GET_MEETING_DETAILS = gql`
  query GetMeetingDetails($meetingId: ID!) {
    getMeetingDetails(meetingId: $meetingId) {
      _id
      title
      description
      workspaceId
      host {
        _id
        username
        profilePicture
      }
      participants {
        _id
        username
        profilePicture
      }
      startTime
      status
    }
  }
`;

const JOIN_MEETING = gql`
  mutation JoinMeeting($meetingId: ID!) {
    joinMeeting(meetingId: $meetingId) {
      _id
      status
    }
  }
`;

const END_MEETING = gql`
  mutation EndMeeting($meetingId: ID!) {
    endMeeting(meetingId: $meetingId) {
      _id
      status
    }
  }
`;

const VideoCall = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { activeMeeting, leaveMeeting } = useWorkspace();
  
  // State
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [error, setError] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [previewStream, setPreviewStream] = useState(null);
  
  // Refs
  const userVideo = useRef();
  const peersRef = useRef({});
  
  // Get meeting details
  const { loading, error: queryError, data } = useQuery(GET_MEETING_DETAILS, {
    variables: { meetingId: roomId },
    fetchPolicy: 'network-only',
  });
  
  // Join meeting mutation
  const [joinMeeting] = useMutation(JOIN_MEETING);
  
  // End meeting mutation
  const [endMeeting] = useMutation(END_MEETING);
  
  // Initialize call
  useEffect(() => {
    if (data?.getMeetingDetails && socket) {
      const initCall = async () => {
        try {
          // Join meeting
          await joinMeeting({
            variables: { meetingId: roomId },
          });
          
          // Get user media
          const stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          
          if (userVideo.current) {
            userVideo.current.srcObject = stream;
          }
          
          setLocalStream(stream);
          
          // Join room
          socket.emit('join-room', {
            roomId,
            userId: user._id,
          });
          
          // Listen for events
          socket.on('user-joined', handleUserJoined);
          socket.on('user-left', handleUserLeft);
          socket.on('receiving-signal', handleReceivingSignal);
          socket.on('receiving-returned-signal', handleReceivingReturnedSignal);
          socket.on('chat-message', handleChatMessage);
          socket.on('existing-peers', handleExistingPeers);
          
          // Clean up
          return () => {
            stream.getTracks().forEach(track => track.stop());
            
            Object.values(peersRef.current).forEach(({ peer }) => {
              if (peer) peer.destroy();
            });
            
            socket.off('user-joined');
            socket.off('user-left');
            socket.off('receiving-signal');
            socket.off('receiving-returned-signal');
            socket.off('chat-message');
            socket.off('existing-peers');
            
            socket.emit('leave-room', {
              roomId,
              userId: user._id,
            });
            
            leaveMeeting();
          };
        } catch (err) {
          console.error('Error initializing call:', err);
          setError(err);
        }
      };
      
      initCall();
    }
  }, [data, socket, roomId, user, joinMeeting]);
  
  // Handle existing peers in room
  const handleExistingPeers = ({ peers }) => {
    peers.forEach(peerId => {
      const peer = createPeer(peerId, user._id, localStream);
      peersRef.current[peerId] = {
        peer,
        userId: peerId,
      };
      
      setPeers(prev => ({
        ...prev,
        [peerId]: peer,
      }));
    });
  };
  
  // Handle new user joined
  const handleUserJoined = ({ userId }) => {
    const peer = createPeer(userId, user._id, localStream);
    peersRef.current[userId] = {
      peer,
      userId,
    };
    
    setPeers(prev => ({
      ...prev,
      [userId]: peer,
    }));
  };
  
  // Handle user left
  const handleUserLeft = ({ userId }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.destroy();
      delete peersRef.current[userId];
      
      setPeers(prev => {
        const peers = { ...prev };
        delete peers[userId];
        return peers;
      });
    }
  };
  
  // Handle receiving signal
  const handleReceivingSignal = ({ userId, signal }) => {
    const peer = addPeer(userId, signal, localStream);
    peersRef.current[userId] = {
      peer,
      userId,
    };
    
    setPeers(prev => ({
      ...prev,
      [userId]: peer,
    }));
  };
  
  // Handle receiving returned signal
  const handleReceivingReturnedSignal = ({ userId, signal }) => {
    if (peersRef.current[userId]) {
      peersRef.current[userId].peer.signal(signal);
    }
  };
  
  // Create peer
  const createPeer = (receiverId, senderId, stream) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
    });
    
    peer.on('signal', signal => {
      socket.emit('sending-signal', {
        receiverId,
        senderId,
        signal,
      });
    });
    
    return peer;
  };
  
  // Add peer
  const addPeer = (senderId, incomingSignal, stream) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
    });
    
    peer.on('signal', signal => {
      socket.emit('returning-signal', {
        receiverId: senderId,
        senderId: user._id,
        signal,
      });
    });
    
    peer.signal(incomingSignal);
    
    return peer;
  };

  // Apply device settings
  const handleApplySettings = async (settings) => {
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: settings.videoInput ? { deviceId: settings.videoInput } : true,
        audio: settings.audioInput ? { deviceId: settings.audioInput } : true,
      });
      
      // Replace tracks in all peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        if (peer) {
          newStream.getTracks().forEach(track => {
            const sender = peer._senders.find(s => s.track.kind === track.kind);
            if (sender) {
              sender.replaceTrack(track);
            }
          });
        }
      });
      
      // Update local video
      if (userVideo.current) {
        userVideo.current.srcObject = newStream;
      }
      
      // Stop old stream
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      setLocalStream(newStream);
      
    } catch (err) {
      console.error('Error applying device settings:', err);
      setError(err);
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Toggle screen sharing
  const toggleScreenSharing = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true
        });
        
        // Replace video track with screen track in all peer connections
        Object.values(peersRef.current).forEach(({ peer }) => {
          if (peer) {
            const sender = peer._senders.find(s => s.track.kind === 'video');
            if (sender) {
              sender.replaceTrack(screenStream.getVideoTracks()[0]);
            }
          }
        });
        
        // Update local video
        if (userVideo.current) {
          userVideo.current.srcObject = screenStream;
        }
        
        setScreenStream(screenStream);
        setIsScreenSharing(true);
        
        // Handle screen share ended by user
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenSharing();
        };
        
        // Notify others
        socket.emit('start-screen-share', {
          roomId,
          userId: user._id,
        });
      } catch (err) {
        console.error('Error sharing screen:', err);
        setError(err);
      }
    } else {
      stopScreenSharing();
    }
  };
  
  // Stop screen sharing
  const stopScreenSharing = () => {
    if (screenStream) {
      screenStream.getTracks().forEach(track => track.stop());
      
      // Restore video track in all peer connections
      Object.values(peersRef.current).forEach(({ peer }) => {
        if (peer) {
          const sender = peer._senders.find(s => s.track.kind === 'video');
          if (sender && localStream?.getVideoTracks()[0]) {
            sender.replaceTrack(localStream.getVideoTracks()[0]);
          }
        }
      });
      
      // Restore local video
      if (userVideo.current && localStream) {
        userVideo.current.srcObject = localStream;
      }
      
      setScreenStream(null);
      setIsScreenSharing(false);
      
      // Notify others
      socket.emit('stop-screen-share', {
        roomId,
        userId: user._id,
      });
    }
  };

  // End call
  const handleEndCall = async () => {
    try {
      // Clean up streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
      }
      
      // End meeting if host
      if (data?.getMeetingDetails?.host?._id === user?._id) {
        await endMeeting({
          variables: { meetingId: roomId },
        });
      }
      
      // Navigate back to workspace
      navigate(`/workspace/${data?.getMeetingDetails?.workspaceId}`);
    } catch (err) {
      console.error('Error ending call:', err);
    }
  };
  
  // Handle chat message
  const handleChatMessage = (data) => {
    setMessages(prevMessages => [...prevMessages, data]);
  };
  
  // Send chat message
  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    
    // Emit chat message event
    socket.emit('send-chat-message', {
      roomId,
      userId: user._id,
      username: user.username,
      message: messageInput,
      timestamp: new Date().toISOString(),
    });
    
    // Add message to local state
    setMessages(prevMessages => [
      ...prevMessages,
      {
        userId: user._id,
        username: user.username,
        message: messageInput,
        timestamp: new Date().toISOString(),
        isSelf: true,
      }
    ]);
    
    setMessageInput('');
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (queryError) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error">
          Error loading meeting: {queryError.message}
        </Typography>
        <Button
          variant="contained"
          onClick={() => navigate(-1)}
          sx={{ mt: 2 }}
        >
          Go Back
        </Button>
      </Box>
    );
  }
  
  const meeting = data?.getMeetingDetails;
  
  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#121212' }}>
      {/* Call Header */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: 'white',
        }}
      >
        <Typography variant="h6">{meeting?.title || 'Video Call'}</Typography>
        <Button
          variant="outlined"
          startIcon={<ChatIcon />}
          onClick={() => setChatOpen(true)}
          sx={{ color: 'white', borderColor: 'rgba(255, 255, 255, 0.5)' }}
        >
          Chat
        </Button>
      </Box>
      
      {/* Video Grid */}
      <Box sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
        <Grid container spacing={2}>
          {/* Local Video */}
          <Grid item xs={12} sm={6} md={4}>
            <Paper
              sx={{
                position: 'relative',
                paddingTop: '56.25%', // 16:9 aspect ratio
                backgroundColor: 'black',
                overflow: 'hidden',
              }}
            >
              <video
                ref={userVideo}
                autoPlay
                muted
                playsInline
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 8,
                  left: 8,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: 1,
                  fontSize: '0.75rem',
                }}
              >
                You {isMuted && '(Muted)'}
              </Box>
            </Paper>
          </Grid>
          
          {/* Peer videos would go here - simplified for this example */}
          {Object.keys(peers).length === 0 && (
            <Grid item xs={12} sm={6} md={4}>
              <Paper
                sx={{
                  position: 'relative',
                  paddingTop: '56.25%',
                  backgroundColor: '#333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  Waiting for others to join...
                </Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
      
      {/* Call Controls */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          justifyContent: 'center',
          gap: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
        }}
      >
        <IconButton
          onClick={toggleAudio}
          sx={{
            backgroundColor: isMuted ? 'error.main' : 'success.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isMuted ? 'error.dark' : 'success.dark',
            },
          }}
        >
          {isMuted ? <MicOffIcon /> : <MicIcon />}
        </IconButton>
        
        <IconButton
          onClick={toggleVideo}
          sx={{
            backgroundColor: isVideoOff ? 'error.main' : 'success.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isVideoOff ? 'error.dark' : 'success.dark',
            },
          }}
        >
          {isVideoOff ? <VideocamOffIcon /> : <VideocamIcon />}
        </IconButton>
        
        <IconButton
          onClick={toggleScreenSharing}
          sx={{
            backgroundColor: isScreenSharing ? 'warning.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: isScreenSharing ? 'warning.dark' : 'primary.dark',
            },
          }}
        >
          {isScreenSharing ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </IconButton>
        
        <IconButton
          onClick={handleEndCall}
          sx={{
            backgroundColor: 'error.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'error.dark',
            },
          }}
        >
          <CallEndIcon />
        </IconButton>

        <IconButton
          onClick={() => setSettingsOpen(true)}
          sx={{
            backgroundColor: 'primary.main',
            color: 'white',
            '&:hover': {
              backgroundColor: 'primary.dark',
            },
          }}
        >
          <SettingsIcon />
        </IconButton>
      </Box>
      
      {/* Chat Dialog */}
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '70vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        <DialogTitle>
          Chat
          <IconButton
            onClick={() => setChatOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            overflowY: 'auto',
          }}
        >
          {messages.length === 0 ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'text.secondary',
              }}
            >
              <Typography>No messages yet</Typography>
            </Box>
          ) : (
            messages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  mb: 2,
                  alignSelf: msg.isSelf ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {msg.isSelf ? 'You' : msg.username}
                </Typography>
                <Paper
                  sx={{
                    p: 1.5,
                    backgroundColor: msg.isSelf ? 'primary.main' : 'background.paper',
                    color: msg.isSelf ? 'primary.contrastText' : 'text.primary',
                  }}
                >
                  <Typography variant="body2">{msg.message}</Typography>
                </Paper>
              </Box>
            ))
          )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Box
            component="form"
            sx={{ display: 'flex', width: '100%' }}
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <TextField
              fullWidth
              size="small"
              placeholder="Type a message..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              sx={{ mr: 1 }}
            />
            <IconButton
              color="primary"
              type="submit"
              disabled={!messageInput.trim()}
            >
              <SendIcon />
            </IconButton>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Error Dialog */}
      <VideoError
        open={!!error}
        error={error}
        onClose={() => setError(null)}
        onRetry={() => {
          setError(null);
          window.location.reload();
        }}
      />
      
      {/* Settings Dialog */}
      <VideoSettings
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onApply={handleApplySettings}
        previewStream={previewStream}
        setPreviewStream={setPreviewStream}
      />
    </Box>
  );
};

export default VideoCall;