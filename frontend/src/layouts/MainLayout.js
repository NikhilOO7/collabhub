import React, { useState, useEffect } from 'react';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Header from '../components/common/Header';
import Sidebar from '../components/common/Sidebar';
import { WorkspaceProvider } from '../context/WorkspaceContext';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  // Update drawer state when screen size changes
  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  // Handle drawer toggle
  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <WorkspaceProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        
        {/* Header with App Bar */}
        <Header onDrawerToggle={handleDrawerToggle} />
        
        {/* Sidebar */}
        <Sidebar
          open={drawerOpen}
          onClose={handleDrawerToggle}
          variant={isMobile ? 'temporary' : 'permanent'}
        />
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            width: { md: `calc(100% - 240px)` },
            mt: '64px',
            height: 'calc(100vh - 64px)',
            overflow: 'auto',
          }}
        >
          {children}
        </Box>
      </Box>
    </WorkspaceProvider>
  );
};

export default MainLayout;