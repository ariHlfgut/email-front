import { useState, ChangeEvent, FormEvent } from 'react';
import {
  TextField,
  Button,
  FormControl,
  Select,
  MenuItem,
  Paper,
  Typography,
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
  useTheme,
  ListItemIcon,
  SelectChangeEvent
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import axios from 'axios';
import { keyframes } from '@mui/system';
import config from '../config';

interface FormData {
  from: string;
  to: string;
  subject?: string;
  message: string;
  attachments: File[];
}

interface EmailFormProps {
  allowedEmails: string[];
  domain: string;
}

interface Recipient {
  email: string;
  name: string;
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

// הגדרת סוגי קבים מותרים
const ALLOWED_MIME_TYPES = [
  // קבצי מסמכ
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',

  // תמונות
  'image/jpeg',
  'image/png',
  'image/gif',

  // קבצי קול
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/mp3',
  'audio/mp4',
  'audio/webm',

  // קבצי וידאו
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB - מגבלה חדשה לקבצים גדולים
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
  const [error, setError] = useState('');
  const [recipientSuggestions, setRecipientSuggestions] = useState<Recipient[]>([]);
  const [isRecipientSearchOpen, setIsRecipientSearchOpen] = useState(false);
  const [editRecipientDialog, setEditRecipientDialog] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [newRecipientName, setNewRecipientName] = useState('');

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

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if ('type' in e.target && name === 'to') {
      searchRecipients(value);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // בדיקת מספר קבצים
    if (formData.attachments.length + files.length > MAX_FILES) {
      setError(`לא ניתן להעלות יותר מ-${MAX_FILES} קבצים`);
      return;
    }

    // בדיקת גודל מקסימלי לכל קובץ
    const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      setError(
        `הקבצים הבאים חורגים מהגודל המקסימלי (100MB):\n` +
        oversizedFiles.map(file =>
          `${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB)`
        ).join('\n')
      );
      return;
    }

    // בדיקת סוג הקובץ
    const invalidFiles = files.filter(file => !ALLOWED_MIME_TYPES.includes(file.type));
    if (invalidFiles.length > 0) {
      setError(
        `סוג הקובץ אינו נתמך:\n${invalidFiles.map(f => f.name).join('\n')}`
      );
      return;
    }

    setError(''); // ניקוי שגיאות אם הכל תקין
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

  const searchRecipients = async (query: string) => {
    if (query.length < 2) {
      setRecipientSuggestions([]);
      setIsRecipientSearchOpen(false);
      return;
    }

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/recipients/search`, {
        params: { query },
        headers: {
          'x-auth-token': token
        }
      });
      
      if (response.data.recipients) {
        setRecipientSuggestions(response.data.recipients);
        setIsRecipientSearchOpen(true);
      }
    } catch (error) {
      console.error('Error searching recipients:', error);
    }
  };

  const handleRecipientSelect = (email: string) => {
    setFormData(prev => ({ ...prev, to: email }));
    setIsRecipientSearchOpen(false);
  };

  const handleRecipientChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, to: value }));
    searchRecipients(value);
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSending(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('from', `${formData.from}@${domain}`);
      formDataToSend.append('to', formData.to);
      formDataToSend.append('subject', formData.subject || '');
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
      },
      '& fieldset': {
        borderWidth: '1px !important',
        '& legend': {
          marginRight: '-10px',
          textAlign: 'right',
          width: 'auto',
          height: '11px',
          '& span': {
            backgroundColor: theme.palette.background.paper
          }
        }
      }
    },
    '& .MuiOutlinedInput-notchedOutline': {
      borderColor: alpha(theme.palette.divider, 0.8),
      transition: 'all 0.2s ease-in-out'
    },
    '& .MuiInputLabel-root': {
      right: '14px',
      left: 'auto',
      transformOrigin: 'right',
      transition: 'all 0.2s ease-in-out',
      '&.Mui-focused': {
        color: theme.palette.primary.main
      },
      '&.MuiInputLabel-shrink': {
        transform: 'translate(0, -9px) scale(0.75)',
        right: '0px'
      }
    },
    '& .MuiInputBase-input': {
      textAlign: 'right',
      paddingLeft: '14px'
    },
    '& .MuiSelect-select': {
      paddingRight: '14px',
      textAlign: 'right',
      paddingLeft: '14px'
    }
  };

  const handleEditRecipient = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setNewRecipientName(recipient.name || '');
    setEditRecipientDialog(true);
  };

  const handleSaveRecipientName = async () => {
    if (!editingRecipient) return;

    try {
      const token = localStorage.getItem('auth-token');
      if (!token) return;

      await axios.post(`${API_URL}/api/recipients/update`, {
        email: editingRecipient.email,
        name: newRecipientName
      }, {
        headers: {
          'x-auth-token': token
        }
      });

      // עדכון הרשימה המקומית
      setRecipientSuggestions(prev => 
        prev.map(r => 
          r.email === editingRecipient.email 
            ? { ...r, name: newRecipientName }
            : r
        )
      );

      setEditRecipientDialog(false);
    } catch (error) {
      console.error('Error updating recipient:', error);
      setError('שגיאה בעדכון פרטי הנמען');
    }
  };

  return (
    <Paper elevation={3} sx={{
      p: 3,
      position: 'relative',
      Width: '700px',
      height: '54.59rem',
      margin: '0 auto',
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
            שליחת מייל חדש
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
            שלח הודעות מייל מותאמות אישית בקלות ובמהירות
          </Typography>
        </Box>
      </Box>

      <form onSubmit={handleSubmit} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2.5,
          flex: 1
        }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', }}>
            <FormControl fullWidth sx={{ mb: 2, ...inputStyles }}>
              <Typography sx={{ direction: 'rtl' }}>
                שולח
              </Typography>
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
                sx={{
                  '& .MuiSelect-select': {
                    paddingRight: '14px',
                    textAlign: 'right'
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
                        )
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

            <FormControl fullWidth sx={{ mb: 2, position: 'relative' }}>
              <TextField
                label="נמען"
                name="to"
                type="email"
                value={formData.to}
                onChange={handleRecipientChange}
                required
                sx={{
                  ...inputStyles,
                  '& .MuiInputLabel-root': {
                    right: '14px',
                    left: 'auto',
                    transformOrigin: 'right'
                  }
                }}
              />
              
              {isRecipientSearchOpen && recipientSuggestions.length > 0 && (
                <Paper 
                  sx={{ 
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    mt: 0.5,
                    maxHeight: 200,
                    overflow: 'auto',
                    zIndex: 1000,
                    boxShadow: 3
                  }}
                >
                  <List>
                    {recipientSuggestions.map((recipient, index) => (
                      <ListItem
                        key={index}
                        component="button"
                        onClick={() => handleRecipientSelect(recipient.email)}
                        sx={{ 
                          width: '100%',
                          textAlign: 'right',
                          direction: 'rtl',
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'action.hover'
                          },
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <ListItemText 
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <HighlightedText 
                                text={recipient.email} 
                                highlight={formData.to}
                              />
                              {recipient.name && (
                                <Typography 
                                  variant="body2" 
                                  color="text.secondary"
                                  sx={{ 
                                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                    px: 1,
                                    py: 0.5,
                                    borderRadius: 1
                                  }}
                                >
                                  <HighlightedText 
                                    text={recipient.name} 
                                    highlight={formData.to}
                                  />
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                        <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditRecipient(recipient);
                          }}
                          size="small"
                          sx={{ 
                            ml: 1,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.primary.main, 0.1)
                            }
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              )}
            </FormControl>

            <TextField
              fullWidth
              label="נושא"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              sx={{
                mb: 2,
                ...inputStyles,
                '& .MuiInputLabel-root': {
                  right: '22px',
                  left: 'auto',
                  transformOrigin: 'right'
                }
              }}
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
                  minHeight: '120px',
                  direction:'rtl'
                }
              }}
            />

            <Box sx={{ mb: 0.5 }}>
              <Button
                component="label"
                variant="outlined"
                startIcon={<AttachFileIcon />}
                sx={{ mt: 2 }}
              >
                <Typography  sx={{ direction: 'rtl' , fontWeight: 'bold'}}
                >
                  צרף קבצים (  קבצים שעולים על 7 MB ישלחו כקישורים ל Google Drive)
                </Typography>
                <input
                  type="file"
                  multiple
                  hidden
                  onChange={handleFileChange}
                  accept={ALLOWED_MIME_TYPES.join(',')}
                />
              </Button>

              {error && (
                <Typography
                  color="error"
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-line',
                    bgcolor: 'error.light',
                    color: 'error.contrastText',
                    p: 1,
                    borderRadius: 1,
                    fontSize: '0.875rem'
                  }}
                >
                  {error}
                </Typography>
              )}
            </Box>

            {formData.attachments.length > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  maxHeight: '78px',
                  overflow: 'auto',
                  mt: 1
                }}
              >
                <List dense >
                  {formData.attachments.map((file, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" onClick={() => handleRemoveFile(index)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemIcon>
                        <AttachFileIcon />
                      </ListItemIcon>
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Box sx={{
            mt: 'auto',
            pt: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            borderRadius: '0 0 16px 16px'
          }}>
            <Button
              type="submit"
              variant="contained"
              endIcon={successMessage ? <></> : isSending ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
              fullWidth
              size="large"
              disabled={isSending}
              sx={{
                animation: isSending ? `${sendingAnimation} 2s ease-in-out infinite` : 'none',
                transition: 'all 0.3s ease',
                position: 'relative',
                borderRadius: '12px',
                py: 1.8,
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
              {successMessage ? successMessage : isSending ? 'שולח...' : 'שלח מייל'}
            </Button>
          </Box>
        </Box>
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

      {/* דיאלוג עריכת שם נמען */}
      <Dialog 
        open={editRecipientDialog} 
        onClose={() => setEditRecipientDialog(false)}
        PaperProps={{
          sx: {
            width: '100%',
            maxWidth: '400px',
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          עריכת פרטי נמען
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {editingRecipient?.email}
            </Typography>
            <TextField
              fullWidth
              label="שם הנמען"
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': {
                  right: '14px',
                  left: 'auto',
                  transformOrigin: 'right'
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button 
            onClick={() => setEditRecipientDialog(false)}
            variant="outlined"
          >
            ביטול
          </Button>
          <Button 
            onClick={handleSaveRecipientName}
            variant="contained"
            sx={{ minWidth: '120px' }}
          >
            שמור
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EmailForm; 