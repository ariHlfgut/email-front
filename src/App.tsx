import { useState, useEffect } from 'react';
import {
  ThemeProvider,
  createTheme,
  CssBaseline,
  Box,
  Paper,
  Typography,
  alpha,
} from '@mui/material';
import {
  Mail as MailIcon,
} from '@mui/icons-material';
import EmailForm from './components/EmailForm';
import PrefixManager from './components/PrefixManager';
import axios from 'axios';
import { AuthDialog } from './components/AuthDialog';
import config from './config';
import { Navigation } from './components/Navigation';
import ContactButton from './components/ContactButton';

// אנימציות

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
      main: '#3f51b5',
      light: '#757de8',
      dark: '#002984'
    },
    secondary: {
      main: '#f50057'
    },
    background: {
      default: '#f5f5f5',
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

const domain = '0541234.com';
const API_URL = config.API_URL;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [allowedEmails, setAllowedEmails] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<'email' | 'prefixes'>('email');


  // בדיקת אימות בטעינה
  useEffect(() => {
    const token = localStorage.getItem('auth-token');
    const savedUsername = localStorage.getItem('user-name');

    if (token && savedUsername) {
      try {
        axios.defaults.headers.common['x-auth-token'] = token;
        setIsAuthenticated(true);
        setUsername(savedUsername);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user-name');
      }
    }
  }, []);

  // טעינת אימיילים מורשים רק כשהמשתמש מאומת
  useEffect(() => {
    if (isAuthenticated) {
      const fetchAllowedEmails = async () => {
        try {
          // וידוא שהטוקן מוגדר בהדרים
          const token = localStorage.getItem('auth-token');
          if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
          }

          const response = await axios.get(`${API_URL}/api/allowed-emails`);
          setAllowedEmails(response.data);
        } catch (error) {
          console.error('Failed to fetch allowed emails:', error);
        }
      };

      fetchAllowedEmails();
    }
  }, [isAuthenticated]); // תלוי רק במצב האימות

  if (!isAuthenticated) {
    return <AuthDialog onAuthenticated={(name) => {
      setIsAuthenticated(true);
      setUsername(name);
    }} />;
  }

  const updateServerEmails = async (newEmails: string[]) => {
    try {
      const response = await axios.post(`${API_URL}/api/update-allowed-emails`, {
        emails: newEmails
      });

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
    const newEmails = [...allowedEmails, prefix];
    const success = await updateServerEmails(newEmails);

    if (success) {
      setAllowedEmails(newEmails);
    }
  };

  const handleRemovePrefix = async (prefix: string) => {
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
        height: '100vh',
        width: '100vw',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e8eaf6 100%)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #002984 100%)',
            color: 'white',
            width: '95%',
            right: '2.5%',
            left: '2.5%',
            top: '1.5%',
            position: 'relative',
            mb: 5
          }}
        >

          <Box sx={{
            // maxWidth: '900px',
            margin: '0 auto',
            height: '4rem',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            width: '100%',
          }}>
                          <Box sx={{
              background: `linear-gradient(45deg, ${rtlTheme.palette.primary.dark} 30%, ${rtlTheme.palette.primary.main} 90%)`,
              color: 'white',
              px: 1.5,
              py: 0.5,
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: alpha(rtlTheme.palette.primary.light, 0.3),
              textTransform: 'uppercase',
              marginLeft: '10px',
            }}>
              <span style={{ fontSize: '0.8em', marginRight: '2px' }}>⭐</span>
              משתמש פרו
            </Box>
            
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '50px',

              gap: 3,
              flex: 1
            }}>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                <MailIcon sx={{ fontSize: 24 }} />
                
                <Typography
                  variant="h5"
                  sx={{
                    fontSize: 24,
                    fontWeight: 500
                  }}
                >
                  מערכת שליחת מיילים
                </Typography>
                <Typography sx={{ fontSize:17, fontWeight: 500,marginTop:0.5}}>
                  {domain}
                </Typography>
              </Box>

              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2
              }}>
                
                
                <Typography sx={{ fontSize: '1.2rem', fontWeight: 500 }}>
                  שלום {username}
                </Typography>
                
              </Box>
              
              
            </Box>

            
          </Box>
        </Paper>

        {/* Main Content */}
        <Box sx={{
          px: 2,
          pb: 2,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          maxWidth: '900px',
          mx: 'auto',
          width: '100%',
          height: 'calc(100vh - 150px)'
        }}>
          <Navigation
            currentPage={currentPage}
            onPageChange={setCurrentPage}
          />
          <Box sx={{
            flex: 1,
            overflow: 'auto',
            '& > *': {
              maxWidth: '800px',
              margin: '0 auto',
              minHeight: '50rem'
            }
          }}>
            {currentPage === 'email' ? (
              <EmailForm
                allowedEmails={allowedEmails}
                domain={domain}
              />
            ) : (
              <PrefixManager
                allowedEmails={allowedEmails}
                domain={domain}
                onPrefixAdd={handleAddPrefix}
                onPrefixRemove={handleRemovePrefix}
                setAllowedEmails={setAllowedEmails}
              />
            )}
          </Box>
        </Box>
      </Box>
      <ContactButton/>
    </ThemeProvider>
  );
}

export default App;
