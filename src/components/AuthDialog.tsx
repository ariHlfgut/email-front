import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  InputAdornment
} from '@mui/material';
import axios from 'axios';
import config from '../config';

interface AuthDialogProps {
  onAuthenticated: (username: string) => void;
}

const API_URL = config.API_URL;
const BASE_PASSWORD = 'TUOTBHJUNV';

export const AuthDialog = ({ onAuthenticated }: AuthDialogProps) => {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API_URL}/api/verify-code`, 
        { 
          code: BASE_PASSWORD + phone,
          phone 
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        localStorage.setItem('auth-timestamp', new Date().toISOString());
        localStorage.setItem('user-name', response.data.user.username);
        axios.defaults.headers.common['x-auth-token'] = response.data.token;
        onAuthenticated(response.data.user.username);
      }
    } catch (error: any) {
      setAttempts(prev => prev + 1);
      setError(error.response?.data?.message || 'שגיאה בהתחברות');
      if (attempts >= 2) {
        setError('יותר מדי ניסיונות. נסה שוב מאוחר יותר');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={true} maxWidth="xs" fullWidth>
      <DialogTitle align="center">אימות כניסה</DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          <Typography gutterBottom>
            אנא הכנס את המספר הטלפון שלך ואת הקוד האישי
          </Typography>
          <TextField
            fullWidth
            label="מספר טלפון"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="הכנס מספר טלפון"
            error={!!error}
            disabled={isLoading || attempts > 2}
            sx={{ mt: 2 }}
            inputProps={{
              maxLength: 10,
              pattern: '[0-9]*'
            }}
          />
          <TextField
            fullWidth
            label="קוד אישי"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="הכנס קוד"
            error={!!error}
            helperText={error}
            disabled={isLoading || attempts > 2}
            sx={{ mt: 2 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography color="textSecondary">
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!phone || !code || isLoading || attempts > 2}
        >
          {isLoading ? <CircularProgress size={24} /> : 'אישור'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 