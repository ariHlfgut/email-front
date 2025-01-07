import { Box, Button } from '@mui/material';
import { Settings as SettingsIcon, Mail as MailIcon } from '@mui/icons-material';

interface NavigationProps {
  currentPage: 'email' | 'prefixes';
  onPageChange: (page: 'email' | 'prefixes') => void;
}

export const Navigation = ({ currentPage, onPageChange }: NavigationProps) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      gap: 2,
      justifyContent: 'center',
      mb: 3,
      padding: '1px'

    }}>
      <Button
        variant={currentPage === 'email' ? 'contained' : 'outlined'}
        onClick={() => onPageChange('email')}
        startIcon={<MailIcon />}
      >
        שליחת מייל
      </Button>
      <Button
        variant={currentPage === 'prefixes' ? 'contained' : 'outlined'}
        onClick={() => onPageChange('prefixes')}
        startIcon={<SettingsIcon />}
      >
        ניהול כתובות
      </Button>
    </Box>
  );
}; 