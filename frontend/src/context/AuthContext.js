import React, { createContext, useState, useContext, useEffect } from 'react';
import { useMutation, useQuery, gql } from '@apollo/client';

// GraphQL queries and mutations
const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
      user {
        _id
        username
        email
        profilePicture
      }
    }
  }
`;

const GET_CURRENT_USER = gql`
  query GetCurrentUser {
    me {
      _id
      username
      email
      profilePicture
    }
  }
`;

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Login mutation
  const [loginMutation] = useMutation(LOGIN);

  // Get current user query
  const { data: userData, loading: userLoading } = useQuery(GET_CURRENT_USER, {
    skip: !token,
  });

  // Set token to localStorage and Apollo client headers
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }, [token]);

  // Update user when userData changes
  useEffect(() => {
    if (!userLoading && userData?.me) {
      setUser(userData.me);
    }
    setLoading(userLoading);
  }, [userData, userLoading]);

  // Login function
  const login = async (email, password) => {
    try {
      const { data } = await loginMutation({
        variables: { email, password },
      });
      setToken(data.login.token);
      setUser(data.login.user);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);