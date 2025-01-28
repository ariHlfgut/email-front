import { useState, FormEvent } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

const ContactButton = () => {
  const theme = useTheme();
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleContactSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const response = await axios.post(`${API_URL}/api/contact`, {
        name: contactForm.name,
        email: contactForm.email,
        message: contactForm.message
      }, {
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': localStorage.getItem('auth-token')
        }
      });

      if (response.data.success) {
        setSuccessMessage('ההודעה נשלחה בהצלחה');
        setContactDialogOpen(false);
        setContactForm({ name: '', email: '', message: '' });
        setTimeout(() => setSuccessMessage(''), 2000);
      }
    } catch (error) {
      console.error('Error sending contact form:', error);
      if (axios.isAxiosError(error)) {
        setError(error.response?.data?.error || 'שגיאה בשליחת ההודעה');
      } else {
        setError('שגיאה בשליחת ההודעה');
      }
    } finally {
      setIsSending(false);
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: alpha(theme.palette.divider, 0.8)
      }
    },
  };

  return (
    <>
      <Button
        onClick={() => setContactDialogOpen(true)}
        startIcon={<ContactMailIcon />}
        sx={{
            top: '470px',
          color: 'text.secondary',
          '&:hover': {
            color: 'primary.main',
            backgroundColor: alpha(theme.palette.primary.main, 0.1)
          },
          borderRadius: 2,
          px: 3,
          gap: 1
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          MailFlow
        </Typography>
        <Typography variant="caption" sx={{ textAlign: 'center' }}>
          מערכת שליחת מיילים מתקדמת
        </Typography>
      </Button>

      <Dialog 
        open={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '500px',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          יצירת קשר
        </DialogTitle>
        <form onSubmit={handleContactSubmit}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="שם"
                value={contactForm.name}
                onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                required
                fullWidth
                sx={inputStyles}
              />
              <TextField
                label="אימייל"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                required
                fullWidth
                sx={inputStyles}
              />
              <TextField
                label="הודעה"
                multiline
                rows={4}
                value={contactForm.message}
                onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                required
                fullWidth
                sx={inputStyles}
              />
              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              {successMessage && (
                <Typography color="success.main" variant="body2">
                  {successMessage}
                </Typography>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
            <Button 
              onClick={() => setContactDialogOpen(false)}
              variant="outlined"
            >
              ביטול
            </Button>
            <Button 
              type="submit"
              variant="contained"
              disabled={isSending}
              sx={{ minWidth: '120px' }}
            >
              {isSending ? 'שולח...' : 'שלח'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default ContactButton; 