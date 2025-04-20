import React, { createContext, useContext, useState } from 'react';
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

export const WorkspaceProvider = ({ children }) => {
  const [activeWorkspace, setActiveWorkspace] = useState(null);
  const { data, loading, error, refetch } = useQuery(GET_USER_WORKSPACES);

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
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => useContext(WorkspaceContext);