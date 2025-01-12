import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  TextField, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Paper,
  Typography,
  Box,
  Alert,
  useTheme,
  CircularProgress,
  Backdrop
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { alpha } from '@mui/material/styles';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import * as XLSX from 'xlsx';
import axios from 'axios';
import config from '../config';

const API_URL = config.API_URL;

interface PrefixManagerProps {
  allowedEmails: string[];
  domain: string;
  onPrefixAdd: (prefix: string) => Promise<void>;
  onPrefixRemove: (prefix: string) => Promise<void>;
  setAllowedEmails: (emails: string[]) => void;
}

const PrefixManager = ({ 
  allowedEmails, 
  domain, 
  onPrefixAdd, 
  onPrefixRemove,
  setAllowedEmails 
}: PrefixManagerProps) => {
  const [newPrefix, setNewPrefix] = useState('');
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const theme = useTheme();

  const validatePrefix = (prefix: string): boolean => {
    // בדיקה שהקידומת מכילה רק אותיות באנגלית ומספרים
    const englishAndNumbersOnly = /^[a-zA-Z0-9]+$/;
    
    if (!englishAndNumbersOnly.test(prefix)) {
      setError('ניתן להשתמש רק באותיות באנגלית ומספרים');
      return false;
    }

    if (prefix.length < 2) {
      setError('הקידומת חייבת להכיל לפחות 2 תווים');
      return false;
    }

    if (prefix.length > 20) {
      setError('הקידומת לא יכולה להכיל יותר מ-20 תווים');
      return false;
    }

    if (allowedEmails.includes(prefix)) {
      setError('קידומת זו כבר קיימת');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validatePrefix(newPrefix)) {
      onPrefixAdd(newPrefix.toLowerCase()); // המרה לאותיות קטנות
      setNewPrefix('');
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // הסרת רווחים ותווים מיוחדים בזמן ההקלדה
    const sanitizedValue = value.replace(/[^a-zA-Z0-9]/g, '');
    setNewPrefix(sanitizedValue);
    
    if (value !== sanitizedValue) {
      setError('ניתן להשתמש רק באותיות באנגלית ומספרים');
    } else {
      setError('');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError('');

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        const rawData: unknown[] = jsonData.flat();
        const prefixes = rawData
          .filter((item): item is string => typeof item === 'string' && item.trim() !== '')
          .map(prefix => prefix.trim());

        try {
          const response = await axios.post(`${API_URL}/api/update-allowed-emails-bulk`, {
            prefixes
          });
          
          if (response.data.success) {
            setError('');
            setAllowedEmails(response.data.prefixes);
          }
        } catch (error: any) {
          setError(error.response?.data?.error || 'שגיאה בהעלאת הקידומות');
        }
      };
      
      reader.readAsArrayBuffer(file);
    } catch (error) {
      setError('שגיאה בקריאת הקובץ');
      console.error('Error reading Excel file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 3,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      borderRadius: '16px'
    }}>
      <Box sx={{ 
        mb: 5,
        mt: 2,
        pb: 3,
        borderBottom: '2px solid',
        borderColor: alpha(theme.palette.primary.main, 0.1),
        position: 'relative',
        '&::after': {
          content: '""',
          position: 'absolute',
          bottom: '-2px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '2px',
          background: theme.palette.primary.main,
          borderRadius: '2px'
        }
      }}>
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}>
          <Typography 
            variant="h5" 
            align="center" 
            color="primary"
            sx={{
              fontSize: '1.6rem',
              fontWeight: 700,
              letterSpacing: '0.5px',
              background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.primary.light} 90%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.05)',
              mb: 1
            }}
          >
            ניהול כתובות מייל
          </Typography>
          <Typography 
            variant="subtitle1" 
            align="center" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.95rem',
              maxWidth: '80%',
              opacity: 0.8
            }}
          >
            נהל את רשימת כתובות המייל המורשות במערכת
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <TextField
            fullWidth
            size="small"
            value={newPrefix}
            onChange={handleChange}
            placeholder="הוסף קידומת חדשה"
            error={Boolean(error)}
            helperText={error}
            InputProps={{
              endAdornment: <Typography>@{domain}</Typography>
            }}
          />
          <Button
            type="submit"
            variant="contained"
            disabled={Boolean(error) || !newPrefix}
            startIcon={<AddIcon />}
          >
            הוסף
          </Button>
        </Box>
      </form>

      <Box sx={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0
      }}>
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#888',
            borderRadius: '4px',
            '&:hover': {
              background: '#666',
            },
          },
        }}>
          <List sx={{ 
            pr: allowedEmails.length > 10 ? 1 : 0,
            position: 'relative'
          }}>
            {allowedEmails.map((prefix, index) => (
              <ListItem
                key={prefix}
                secondaryAction={
                  <IconButton 
                    edge="end" 
                    onClick={() => onPrefixRemove(prefix)}
                    size="small"
                    sx={{
                      opacity: 0,
                      transition: 'opacity 0.2s',
                      '.MuiListItem-root:hover &': {
                        opacity: 1
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{
                  bgcolor: 'background.paper',
                  borderRadius: 1,
                  mb: 1,
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  '&:hover': {
                    bgcolor: 'action.hover',
                    transform: 'translateX(-4px)',
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '70%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 2px 2px 0',
                    opacity: 0,
                    transition: 'opacity 0.2s'
                  },
                  '&:hover::before': {
                    opacity: 1
                  }
                }}
              >
                <ListItemText 
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          bgcolor: 'action.selected',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          minWidth: '24px',
                          textAlign: 'center'
                        }}
                      >
                        {index + 1}
                      </Typography>
                      <Typography sx={{ direction: 'ltr' }}>
                        {prefix}@{domain}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>

        <Box sx={{ 
          mt: 2,
          pt: 2,
          borderTop: '1px solid',
          borderColor: 'divider'
        }}>
          {allowedEmails.length === 0 ? (
            <Alert severity="info">
              אין  כתובות מייל מוגדרות
            </Alert>
          ) : (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ 
                display: 'block',
                textAlign: 'center'
              }}
            >
              סה"כ: {allowedEmails.length} קידומות
              {allowedEmails.length > 8 && ' (רשימה נגללת)'}
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          variant="outlined"
          startIcon={
            isUploading ? <CircularProgress size={20} /> : <UploadFileIcon />
          }
          component="label"
          disabled={isUploading}
        >
          {isUploading ? 'מעלה...' : 'העלאה מאקסל'}
          <input
            type="file"
            hidden
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </Button>
        <Typography variant="caption" color="textSecondary">
          (קובץ אקסל עם קידומות בעמודה הראשונה)
        </Typography>
      </Box>

      <Backdrop
        sx={{ 
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          position: 'absolute',
          borderRadius: '16px'
        }}
        open={isUploading}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}>
          <CircularProgress color="inherit" />
          <Typography>
            מעלה קידומות...
          </Typography>
        </Box>
      </Backdrop>

      {error && (
        <Typography color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}
    </Paper>
  );
};

export default PrefixManager; 