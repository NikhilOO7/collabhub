import { GlobalStyles as MuiGlobalStyles } from '@mui/material';

const GlobalStyles = () => {
  return (
    <MuiGlobalStyles
      styles={(theme) => ({
        // Cursor animation
        '@keyframes blink-caret': {
          'from, to': { borderColor: 'transparent' },
          '50%': { borderColor: theme.palette.primary.main },
        },
        
        // Smooth scrolling for entire page
        'html': {
          scrollBehavior: 'smooth',
        },
        
        // Better focus styles
        'a, button, [tabindex="0"]': {
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: '2px',
          },
        },
        
        // Custom scrollbar
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
        },
        '*::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        },
        
        // Better typography
        'body': {
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        
        // Make images responsive
        'img': {
          maxWidth: '100%',
          height: 'auto',
        },
        
        // Transitions for hover effects
        'a, button': {
          transition: 'all 0.2s ease-in-out',
        },
        
        // Card hover effects
        '.MuiCard-root': {
          transition: 'transform 0.3s, box-shadow 0.3s',
        },
      })}
    />
  );
};

export default GlobalStyles;