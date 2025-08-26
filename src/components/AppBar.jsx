import React, { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  Button,
  Chip,
  Box
} from '@mui/material';
import { useAuth } from '../hooks/useAuth';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import AuthModal from './AuthModal';

const AppBar = () => {
  const { user, logout } = useAuth();
  const isOnline = useNetworkStatus();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const handleAuthClick = async () => {
    try {
      if (user) {
        await logout();
      } else {
        setAuthModalOpen(true);
      }
    } catch (error) {
      console.error('Auth error:', error);
    }
  };

  return (
    <MuiAppBar position="static" elevation={0}>
      <Toolbar sx={{ px: 2, py: 1 }}>
        <Typography 
          variant="h5" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 600,
            color: 'primary.main'
          }}
        >
          Giải đấu Pickleball
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {!isOnline && (
            <Chip 
              label="Ngoại tuyến" 
              color="warning" 
              size="small"
              variant="outlined"
              sx={{ 
                fontSize: '0.8rem',
                fontWeight: 600,
                borderWidth: 2
              }}
            />
          )}
          
          <Button 
            onClick={handleAuthClick}
            variant={user ? "outlined" : "contained"}
            color={user ? "error" : "primary"}
            sx={{
              minWidth: 120,
              fontWeight: 600,
              fontSize: '0.9rem',
              borderWidth: user ? 2 : 0,
              '&:hover': {
                borderWidth: user ? 2 : 0,
              }
            }}
          >
            {user ? 'Đăng xuất' : 'Đăng nhập'}
          </Button>
        </Box>
      </Toolbar>
      
      <AuthModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        title="Đăng nhập"
      />
    </MuiAppBar>
  );
};

export default AppBar;
