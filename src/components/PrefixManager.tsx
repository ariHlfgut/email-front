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
  Divider,
  Box,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

interface PrefixManagerProps {
  allowedEmails: string[];
  domain: string;
  onPrefixAdd: (prefix: string) => void;
  onPrefixRemove: (prefix: string) => void;
}

const PrefixManager = ({ allowedEmails, domain, onPrefixAdd, onPrefixRemove }: PrefixManagerProps) => {
  const [newPrefix, setNewPrefix] = useState('');
  const [error, setError] = useState('');

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

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom align="center" color="primary">
        ניהול קידומות מייל
      </Typography>
      <Divider sx={{ mb: 3 }} />

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

      <Box 
        sx={{ 
          maxHeight: allowedEmails.length > 6 ? '270px' : 'auto',
          overflow: 'auto',
          transition: 'max-height 0.3s ease',
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
        }}
      >
        <List sx={{ 
          pr: allowedEmails.length > 6 ? 1 : 0,
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

      {allowedEmails.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          אין קידומות מייל מוגדרות
        </Alert>
      ) : (
        <Typography 
          variant="caption" 
          color="text.secondary"
          sx={{ 
            display: 'block', 
            mt: 2,
            textAlign: 'center'
          }}
        >
          סה"כ: {allowedEmails.length} קידומות
          {allowedEmails.length > 6 && ' (רשימה נגללת)'}
        </Typography>
      )}
    </Paper>
  );
};

export default PrefixManager; 