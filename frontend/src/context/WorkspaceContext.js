import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, gql } from '@apollo/client';

const WorkspaceContext = createContext();

const GET_USER_WORKSPACES = gql`
  query GetUserWorkspaces {
    getUserWorkspaces {
      _id
      name
      description
      members {
        userId
        role
      }
    }
  }
`;

const GET_WORKSPACE_MEETINGS = gql`
  query GetWorkspaceMeetings($workspaceId: ID!) {
    getWorkspaceMeetings(workspaceId: $workspaceId) {
      _id
      title
      description
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
      endTime
      status
    }
  }
`;

export const WorkspaceProvider = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const [activeMeeting, setActiveMeeting] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [isInMeeting, setIsInMeeting] = useState(false);
  
  const { data, loading, error, refetch } = useQuery(GET_USER_WORKSPACES);
  const { data: meetingsData, loading: meetingsLoading, refetch: refetchMeetings } = useQuery(
    GET_WORKSPACE_MEETINGS,
    {
      variables: { workspaceId: activeWorkspace?._id },
      skip: !activeWorkspace?._id,
    }
  );

  useEffect(() => {
    if (meetingsData?.getWorkspaceMeetings) {
      setMeetings(meetingsData.getWorkspaceMeetings);
    }
  }, [meetingsData]);

  // Join meeting
  const joinMeeting = (meeting) => {
    setActiveMeeting(meeting);
    setIsInMeeting(true);
  };

  // Leave meeting
  const leaveMeeting = () => {
    setActiveMeeting(null);
    setIsInMeeting(false);
  };

  const workspaces = data?.getUserWorkspaces || [];

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        loading,
        error,
        refetchWorkspaces: refetch,
        activeWorkspace,
        setActiveWorkspace,
        meetings,
        meetingsLoading,
        refetchMeetings,
        activeMeeting,
        isInMeeting,
        joinMeeting,
        leaveMeeting,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);