import { useState, useEffect } from 'react';
import { 
  ThemeProvider, 
  createTheme, 
  CssBaseline, 
  Box, 
  Container, 
  Paper,
  Typography,
} from '@mui/material';
import { 
  Settings as SettingsIcon,
  Mail as MailIcon,
} from '@mui/icons-material';
import EmailForm from './components/EmailForm';
import PrefixManager from './components/PrefixManager';
import axios from 'axios';
import { keyframes } from '@mui/system';
import { AuthDialog } from './components/AuthDialog';

// אנימציות
const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const rtlTheme = createTheme({
  direction: 'rtl',
  typography: {
    fontFamily: 'Rubik, Arial, sans-serif',
    h4: {
      fontWeight: 700
    }
  },
  palette: {
    primary: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2'
    },
    secondary: {
      main: '#f50057'
    },
    background: {
      default: '#f8faff',
      paper: '#ffffff'
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1920,
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0px 3px 15px rgba(0,0,0,0.1)',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 24px',
          fontSize: '1rem',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-1px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
          }
        }
      }
    }
  }
});

const domain = '0541234.com';  // הדומיין הקבוע

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);

  // בדיקת אימות בטעינה
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const timestamp = localStorage.getItem('auth-timestamp');
    
    if (token && timestamp) {
      const lastAuth = new Date(timestamp);
      const now = new Date();
      
      if (lastAuth.getDate() === now.getDate() && 
          lastAuth.getMonth() === now.getMonth() && 
          lastAuth.getFullYear() === now.getFullYear()) {
        setIsAuthenticated(true);
        axios.defaults.headers.common['x-auth-token'] = token;
      } else {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('auth-timestamp');
      }
    }
  }, []); // רק בטעינה ראשונית

  // טעינת אימיילים מורשים רק כשהמשתמש מאומת
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAllowedEmails = async () => {
        try {
          const response = await axios.get('http://localhost:3000/api/allowed-emails');
          setAllowedEmails(response.data);
        } catch (error) {
          console.error('Failed to fetch allowed emails:', error);
        }
      };

      fetchAllowedEmails();
    }
  }, [isAuthenticated]); // תלוי רק במצב האימות

  if (!isAuthenticated) {
    return <AuthDialog onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  const updateServerEmails = async (newEmails: string[]) => {
    try {
      console.log('Sending update to server:', newEmails);
      const response = await axios.post('http://localhost:3000/api/update-allowed-emails', {
        emails: newEmails
      });
      console.log('Server response:', response.data);
      
      if (response.data.success) {
        return true;
      } else {
        console.error('Failed to update emails on server');
        return false;
      }
    } catch (error) {
      console.error('Failed to update allowed emails:', error);
      return false;
    }
  };

  const handleAddPrefix = async (prefix: string) => {
    console.log('Adding prefix:', prefix);
    const newEmails = [...allowedEmails, prefix];
    const success = await updateServerEmails(newEmails);
    
    if (success) {
      setAllowedEmails(newEmails);
    }
  };

  const handleRemovePrefix = async (prefix: string) => {
    console.log('Removing prefix:', prefix);
    const newEmails = allowedEmails.filter(email => email !== prefix);
    const success = await updateServerEmails(newEmails);
    
    if (success) {
      setAllowedEmails(newEmails);
    }
  };

  return (
    <ThemeProvider theme={rtlTheme}>
      <CssBaseline />
      <Box sx={{ 
        minHeight: '100vh',
        minWidth: '100vw',
        background: 'linear-gradient(135deg, #f8faff 0%, #e3f2fd 100%)',
        position: 'relative',
        overflow: 'hidden',
        pt: { xs: 2, sm: 4, md: 6 },
        pb: { xs: 4, sm: 6, md: 8 },
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Background Decorations */}
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(33,150,243,0.03) 0%, transparent 70%)',
          pointerEvents: 'none'
        }} />

        <Container 
          maxWidth={false}
          sx={{ 
            position: 'relative',
            width: '100%',
            height: '100%',
            px: { xs: 2, sm: 3, md: 4, lg: 5 },
            flex: 1
          }}
        >
          {/* Header */}
          <Paper 
            elevation={0} 
            sx={{ 
              p: { xs: 3, sm: 4, md: 5 },
              mb: { xs: 3, sm: 4, md: 5 },
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              color: 'white',
              borderRadius: '24px',
              width: '100%',
              animation: `${fadeIn} 1s ease-out`,
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <Typography variant="h4" align="center" gutterBottom>
              מערכת שליחת מיילים
            </Typography>
            <Typography variant="subtitle1" align="center">
              ניהול ושליחת מיילים מדומיין {domain}
            </Typography>
          </Paper>

          {/* Main Content Grid */}
          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              lg: 'repeat(2, 1fr)',
            },
            gap: { xs: 3, sm: 4, md: 5 },
            width: '100%',
            height: '100%',
            '& > *': {
              minHeight: '500px',
              height: '100%'
            }
          }}>
            {/* Prefix Manager */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4,
                height: '100%',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <SettingsIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" color="primary">
                  ניהול קידומות מייל
                </Typography>
              </Box>
              <PrefixManager
                allowedEmails={allowedEmails}
                domain={domain}
                onPrefixAdd={handleAddPrefix}
                onPrefixRemove={handleRemovePrefix}
              />
            </Paper>

            {/* Email Form */}
            <Paper 
              elevation={3} 
              sx={{ 
                p: 4,
                height: '100%',
                borderRadius: '16px',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3 
              }}>
                <MailIcon color="primary" sx={{ fontSize: 28 }} />
                <Typography variant="h6" color="primary">
                  שליחת מייל חדש
                </Typography>
              </Box>
              <EmailForm
                allowedEmails={allowedEmails}
                domain={domain}
              />
            </Paper>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
