import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, CssBaseline } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import AppBar from '../components/common/AppBar';
import Sidebar from '../components/common/Sidebar';
import { WorkspaceProvider } from '../context/WorkspaceContext';

const MainLayout = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [drawerOpen, setDrawerOpen] = useState(!isMobile);

  useEffect(() => {
    setDrawerOpen(!isMobile);
  }, [isMobile]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <WorkspaceProvider>
      <Box sx={{ display: 'flex', height: '100vh' }}>
        <CssBaseline />
        <AppBar onDrawerToggle={handleDrawerToggle} />
        <Sidebar
          open={drawerOpen}
          onClose={handleDrawerToggle}
          variant={isMobile ? 'temporary' : 'permanent'}
        />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: 0,
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