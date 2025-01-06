import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress
} from '@mui/material';
import axios from 'axios';

interface AuthDialogProps {
  onAuthenticated: () => void;
}

export const AuthDialog = ({ onAuthenticated }: AuthDialogProps) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('https://email-sender-ikqf.onrender.com/api/verify-code', { code });
      
      if (response.data.success) {
        localStorage.setItem('auth-token', response.data.token);
        localStorage.setItem('auth-timestamp', new Date().toISOString());
        onAuthenticated();
      }
    } catch (error) {
      setAttempts(prev => prev + 1);
      setError('קוד שגוי');
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
            אנא הכנס את קוד האימות כדי להמשיך
          </Typography>
          <TextField
            fullWidth
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="הכנס קוד"
            error={!!error}
            helperText={error}
            disabled={isLoading || attempts > 2}
            sx={{ mt: 2 }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={!code || isLoading || attempts > 2}
        >
          {isLoading ? <CircularProgress size={24} /> : 'אישור'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}; 