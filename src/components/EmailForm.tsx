import { useState, ChangeEvent, FormEvent } from 'react';
import { 
  TextField, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Paper,
  Typography,
  SelectChangeEvent,
  InputAdornment,
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Backdrop,
  Fade,
  alpha,
  useTheme
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import { keyframes } from '@mui/system';
import config from '../config';

interface FormData {
  from: string;
  to: string;
  subject: string;
  message: string;
  attachments: File[];
}

interface EmailFormProps {
  allowedEmails: string[];
  domain: string;
}

const HighlightedText = ({ text, highlight }: { text: string; highlight: string }) => {
  if (!highlight.trim()) {
    return <span>{text}</span>;
  }

  const parts = [];
  const lowerText = text.toLowerCase();
  const lowerHighlight = highlight.toLowerCase();
  let lastIndex = 0;

  let index = lowerText.indexOf(lowerHighlight);
  while (index !== -1) {
    if (index > lastIndex) {
      parts.push({
        text: text.slice(lastIndex, index),
        highlight: false
      });
    }

    parts.push({
      text: text.slice(index, index + highlight.length),
      highlight: true
    });

    lastIndex = index + highlight.length;
    index = lowerText.indexOf(lowerHighlight, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({
      text: text.slice(lastIndex),
      highlight: false
    });
  }

  return (
    <span>
      {parts.map((part, i) => 
        part.highlight ? (
          <Typography
            key={i}
            component="span"
            className="highlighted-text"
            sx={{
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              borderRadius: '2px',
              px: 0.5,
              mx: 0.2
            }}
          >
            {part.text}
          </Typography>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </span>
  );
};

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes
const MAX_FILES = 10;

// אנימציה לכפתור
const sendingAnimation = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(0.95); }
  100% { transform: scale(1); }
`;

const API_URL = config.API_URL;

const EmailForm = ({ allowedEmails, domain }: EmailFormProps) => {
  const theme = useTheme();
  const [formData, setFormData] = useState<FormData>({
    from: '',
    to: '',
    subject: '',
    message: '',
    attachments: []
  });
  
  const [searchSender, setSearchSender] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const filteredEmails = allowedEmails.filter(email => {
    const searchLower = searchSender.toLowerCase();
    const emailLower = email.toLowerCase();
    return emailLower.includes(searchLower);
  });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchSender(e.target.value);
  };

  const handleSenderSelect = (email: string) => {
    setFormData(prev => ({ ...prev, from: email }));
    setSearchSender('');
    setIsSearchOpen(false);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    // בדיקת מספר קבצים
    if (formData.attachments.length + files.length > MAX_FILES) {
      setSuccessMessage(`ניתן לצרף מקסימום ${MAX_FILES} קבצים`);
      setTimeout(() => setSuccessMessage(''), 2000);
      return;
    }

    // בדיקת גודל כל קובץ
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setSuccessMessage(`הקבצים הבאים גדולים מ-100MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      setTimeout(() => setSuccessMessage(''), 2000);
      return;
    }

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('from', `${formData.from}@${domain}`);
      formDataToSend.append('to', formData.to);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('message', formData.message);
      
      formData.attachments.forEach(file => {
        formDataToSend.append('files', file);
      });

      const response = await axios.post(`${API_URL}/api/send-email`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setSuccessMessage('המייל נשלח בהצלחה!');
        setTimeout(() => setSuccessMessage(''), 2000); // יעלם אחרי 2 שניות
        
        setFormData({
          from: '',
          to: '',
          subject: '',
          message: '',
          attachments: []
        });
      }
    } catch (error) {
      console.error('Error sending email:', error);
      setSuccessMessage('שגיאה בשליחת המייל');
      setTimeout(() => setSuccessMessage(''), 2000);
    } finally {
      setIsSending(false);
    }
  };

  const inputStyles = {
    '& .MuiOutlinedInput-root': {
      borderRadius: '12px',
      transition: 'all 0.2s ease-in-out',
      backgroundColor: alpha(theme.palette.background.paper, 0.8),
      backdropFilter: 'blur(8px)',
      '&:hover': {
        backgroundColor: alpha(theme.palette.background.paper, 0.95),
        boxShadow: `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
      },
      '&.Mui-focused': {
        backgroundColor: theme.palette.background.paper,
        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.3)}`
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.divider, 0.8),
      transition: 'all 0.2s ease-in-out'
    },
    '& .MuiInputLabel-root': {
      transition: 'all 0.2s ease-in-out',
      '&.Mui-focused': {
        color: theme.palette.primary.main
      }
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, position: 'relative' }}>
      <Typography variant="h6" gutterBottom align="center" color="primary">
        שליחת מייל חדש
      </Typography>
      {/* <Divider sx={{ mb: 3 }} /> */}

      <form onSubmit={handleSubmit}>
        <FormControl fullWidth sx={{ mb: 2, ...inputStyles }}>
          <InputLabel>שולח</InputLabel>
          <Select
            name="from"
            value={formData.from}
            onChange={handleChange}
            required
            onOpen={() => setIsSearchOpen(true)}
            onClose={() => {
              setIsSearchOpen(false);
              setSearchSender('');
            }}
            MenuProps={{
              PaperProps: {
                sx: {
                  maxHeight: 300,
                  borderRadius: '12px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                  mt: 1
                }
              }
            }}
          >
            {isSearchOpen && (
              <MenuItem sx={{ p: 0 }}>
                <TextField
                  size="small"
                  fullWidth
                  autoFocus
                  value={searchSender}
                  onChange={handleSearchChange}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="חפש שולח..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-notchedOutline': {
                      border: 'none'
                    }
                  }}
                />
              </MenuItem>
            )}
            {(isSearchOpen ? filteredEmails : allowedEmails).map(email => {
              const isMatch = searchSender && email.toLowerCase().includes(searchSender.toLowerCase());
              
              return (
                <MenuItem 
                  key={email} 
                  value={email}
                  onClick={() => handleSenderSelect(email)}
                  sx={{
                    bgcolor: isMatch ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    '&:hover': {
                      bgcolor: isMatch ? 'rgba(0, 0, 0, 0.08)' : undefined
                    }
                  }}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    '& .highlighted-text': {
                      backgroundColor: isMatch ? 'primary.main' : 'transparent',
                      color: isMatch ? 'primary.contrastText' : 'inherit',
                      borderRadius: '2px',
                      padding: '0 4px',
                      margin: '0 2px'
                    }
                  }}>
                    {isMatch ? (
                      <HighlightedText 
                        text={email}
                        highlight={searchSender}
                      />
                    ) : (
                      <span>{email}</span>
                    )}
                    <Typography component="span" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                      @{domain}
                    </Typography>
                  </Box>
                </MenuItem>
              );
            })}
            {isSearchOpen && filteredEmails.length === 0 && (
              <MenuItem disabled>
                לא נמצאו תוצאות
              </MenuItem>
            )}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="נמען"
          name="to"
          type="email"
          value={formData.to}
          onChange={handleChange}
          required
          sx={{ mb: 2, ...inputStyles }}
        />

        <TextField
          fullWidth
          label="נושא"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          required
          sx={{ mb: 2, ...inputStyles }}
        />

        <TextField
          fullWidth
          label="תוכן ההודעה"
          name="message"
          multiline
          rows={4}
          value={formData.message}
          onChange={handleChange}
          required
          sx={{ 
            mb: 3,
            ...inputStyles,
            '& .MuiOutlinedInput-root': {
              ...inputStyles['& .MuiOutlinedInput-root'],
              minHeight: '120px'
            }
          }}
        />

        <Box sx={{ mb: 3 }}>
          <input
            type="file"
            multiple
            id="file-upload"
            style={{ display: 'none' }}
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
          />
          <label htmlFor="file-upload">
            <Button
              component="span"
              variant="outlined"
              startIcon={<AttachFileIcon />}
              sx={{ 
                mb: 2,
                borderRadius: '12px',
                borderWidth: '1.5px',
                textTransform: 'none',
                fontSize: '1rem',
                py: 1,
                px: 3,
                '&:hover': {
                  borderWidth: '1.5px',
                  backgroundColor: alpha(theme.palette.primary.main, 0.04)
                }
              }}
            >
              צרף קבצים (עד 100MB לקובץ)
            </Button>
          </label>

          {formData.attachments.length > 0 && (
            <List dense>
              {formData.attachments.map((file, index) => (
                <ListItem 
                  key={index}
                  sx={{
                    bgcolor: file.size > MAX_FILE_SIZE ? 'error.light' : 'transparent',
                    borderRadius: 1
                  }}
                  secondaryAction={
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveFile(index)}
                      size="small"
                      color={file.size > MAX_FILE_SIZE ? 'error' : 'default'}
                    >
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={file.name}
                    secondary={
                      <Typography 
                        variant="body2" 
                        color={file.size > MAX_FILE_SIZE ? 'error' : 'text.secondary'}
                      >
                        {formatFileSize(file.size)}
                        {file.size > MAX_FILE_SIZE && ' - קובץ גדול מדי'}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}

          {formData.attachments.length > 0 && (
            <Typography 
              variant="caption" 
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              סה"כ: {formData.attachments.length} קבצים 
              ({formatFileSize(formData.attachments.reduce((acc, file) => acc + file.size, 0))})
            </Typography>
          )}
        </Box>

        <Button 
          type="submit" 
          variant="contained" 
          endIcon={isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          fullWidth
          size="large"
          disabled={isSending}
          sx={{
            animation: isSending ? `${sendingAnimation} 2s ease-in-out infinite` : 'none',
            transition: 'all 0.3s ease',
            position: 'relative',
            borderRadius: '12px',
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
            textTransform: 'none',
            boxShadow: 'none',
            '&:hover': {
              boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.2)}`,
              transform: 'translateY(-1px)'
            },
            '&:active': {
              transform: 'translateY(0)',
              boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.2)}`
            },
            '&:disabled': {
              bgcolor: 'primary.main',
              color: 'white',
              opacity: 0.8
            }
          }}
        >
          {isSending ? 'שולח...' : 'שלח מייל'}
        </Button>
      </form>

      {/* אנימציית טעינה מעל כל הטופס */}
      <Backdrop
        sx={{ 
          position: 'absolute',
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(255, 255, 255, 0.8)'
        }}
        open={isSending}
      >
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center',
          gap: 2 
        }}>
          <CircularProgress color="primary" size={60} />
          <Fade in={isSending}>
            <Typography variant="h6" color="primary">
              שולח את המייל...
            </Typography>
          </Fade>
        </Box>
      </Backdrop>

      {successMessage && (
        <Typography
          sx={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'background.paper',
            color: 'text.primary',
            py: 1,
            px: 3,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            zIndex: 1400
          }}
        >
          {successMessage}
        </Typography>
      )}
    </Paper>
  );
};

export default EmailForm; 