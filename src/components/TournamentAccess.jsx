import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  Divider,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';

const TournamentAccess = ({ tournament, onAddAuthorizedEmail, onRemoveAuthorizedEmail }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newPhoneName, setNewPhoneName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const validatePhoneNumber = (phone) => {
    // Remove all non-digit characters
    const cleanPhone = phone.replace(/\D/g, '');
    
    // Check if it's a valid Vietnamese phone number
    if (cleanPhone.length === 10 && cleanPhone.startsWith('0')) {
      return '+84' + cleanPhone.substring(1);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('84')) {
      return '+' + cleanPhone;
    } else if (cleanPhone.length === 10 && cleanPhone.startsWith('84')) {
      return '+' + cleanPhone;
    }
    
    return null;
  };

  const handleAddEmail = async () => {
    if (!newEmail.trim() || !newName.trim()) {
      setError('Vui lòng nhập đầy đủ email và tên');
      return;
    }

    if (!newEmail.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      await onAddAuthorizedEmail(tournament.id, newEmail.trim().toLowerCase(), newName.trim());
      setNewEmail('');
      setNewName('');
      setError('');
      setSuccess('Đã thêm người dùng được ủy quyền thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleRemoveEmail = async (email) => {
    try {
      await onRemoveAuthorizedEmail(tournament.id, email);
      setError('');
      setSuccess('Đã xóa email được ủy quyền thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleAddPhone = async () => {
    if (!newPhone.trim() || !newPhoneName.trim()) {
      setError('Vui lòng nhập đầy đủ số điện thoại và tên');
      return;
    }

    const formattedPhone = validatePhoneNumber(newPhone);
    if (!formattedPhone) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0123456789)');
      return;
    }

    // Convert phone to email format for Firebase
    const phoneEmail = `${formattedPhone}@pickleball.local`;

    try {
      await onAddAuthorizedEmail(tournament.id, phoneEmail, newPhoneName.trim());
      setNewPhone('');
      setNewPhoneName('');
      setError('');
      setSuccess('Đã thêm người dùng với số điện thoại thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleAddReferee = async () => {
    if (!newRefereeEmail.trim() || !newRefereeName.trim()) {
      setError('Vui lòng nhập đầy đủ email và tên trọng tài');
      return;
    }

    if (!newRefereeEmail.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    try {
      await onAddReferee(tournament.id, newRefereeEmail.trim().toLowerCase(), newRefereeName.trim());
      setNewRefereeEmail('');
      setNewRefereeName('');
      setError('');
      setSuccess('Đã thêm trọng tài thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const handleRemoveReferee = async (email) => {
    try {
      await onRemoveReferee(tournament.id, email);
      setError('');
      setSuccess('Đã xóa trọng tài thành công!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    }
  };

  const formatDisplayName = (email, name) => {
    // Check if it's a phone number (ends with @pickleball.local)
    if (email.endsWith('@pickleball.local')) {
      const phoneNumber = email.replace('@pickleball.local', '');
      // Convert back to Vietnamese format
      if (phoneNumber.startsWith('+84')) {
        return `0${phoneNumber.substring(3)}`;
      }
      return phoneNumber;
    }
    return email;
  };

  const isPhoneNumber = (email) => {
    return email.endsWith('@pickleball.local');
  };

  const isOwner = tournament.ownerUid === tournament.currentUserUid;
  const isAuthorized = isOwner || tournament.authorizedEmails?.includes(tournament.currentUserEmail);

  if (!isOwner) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quản lý quyền truy cập
        </Typography>
        
        {isAuthorized ? (
          <Alert severity="success">
            Bạn có quyền truy cập vào giải đấu này. Chỉ chủ sở hữu mới có thể quản lý quyền truy cập.
          </Alert>
        ) : (
          <Alert severity="warning">
            Bạn không có quyền truy cập vào giải đấu này. Vui lòng liên hệ với chủ sở hữu ({tournament.ownerEmail}) để được ủy quyền.
          </Alert>
        )}
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Chủ sở hữu:
          </Typography>
          <Chip
            icon={<PersonIcon />}
            label={tournament.ownerEmail}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        Quản lý quyền truy cập
      </Typography>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Thêm người dùng với tên và email/số điện thoại để cho phép truy cập vào giải đấu này (nhập điểm, xem kết quả, phân công trọng tài).
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Tabs for Email and Phone */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab 
            label="Thêm bằng Email" 
            icon={<EmailIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Thêm bằng Số điện thoại" 
            icon={<PhoneIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Email Tab */}
      {activeTab === 0 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Tên người dùng"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nguyễn Văn A"
            size="small"
            sx={{ minWidth: 200 }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
          />
          <TextField
            label="Email được ủy quyền"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="example@gmail.com"
            size="small"
            sx={{ minWidth: 200 }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddEmail}
            disabled={!newEmail.trim() || !newName.trim()}
          >
            Thêm Email
          </Button>
        </Box>
      )}

      {/* Phone Tab */}
      {activeTab === 1 && (
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField
            label="Tên người dùng"
            value={newPhoneName}
            onChange={(e) => setNewPhoneName(e.target.value)}
            placeholder="Nguyễn Văn A"
            size="small"
            sx={{ minWidth: 200 }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPhone()}
          />
          <TextField
            label="Số điện thoại"
            value={newPhone}
            onChange={(e) => setNewPhone(e.target.value)}
            placeholder="0123456789"
            size="small"
            sx={{ minWidth: 200 }}
            onKeyPress={(e) => e.key === 'Enter' && handleAddPhone()}
          />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPhone}
            disabled={!newPhone.trim() || !newPhoneName.trim()}
          >
            Thêm Số điện thoại
          </Button>
        </Box>
      )}

      <Divider sx={{ my: 2 }} />

      {/* Owner */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Chủ sở hữu:
        </Typography>
        <Chip
          icon={<PersonIcon />}
          label={tournament.ownerEmail}
          color="primary"
          variant="outlined"
        />
      </Box>

      {/* Authorized users */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
          Người dùng được ủy quyền ({tournament.authorizedEmails?.length || 0}):
        </Typography>
        
        {(!tournament.authorizedEmails || tournament.authorizedEmails.length === 0) ? (
          <Typography variant="body2" color="text.secondary">
            Chưa có người dùng nào được ủy quyền
          </Typography>
        ) : (
          <List dense>
            {tournament.authorizedEmails.map((auth, index) => {
              const email = typeof auth === 'string' ? auth : auth.email;
              const name = typeof auth === 'string' ? auth : auth.name;
              const displayValue = formatDisplayName(email, name);
              const isPhone = isPhoneNumber(email);
              
              return (
                <ListItem key={index} sx={{ px: 0 }}>
                  <ListItemText
                    primary={name}
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {isPhone ? <PhoneIcon fontSize="small" /> : <EmailIcon fontSize="small" />}
                        {displayValue}
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveEmail(email)}
                      disabled={email === tournament.ownerEmail}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              );
            })}
          </List>
        )}
      </Box>

      <Typography variant="caption" color="text.secondary">
        * Người dùng với email hoặc số điện thoại được ủy quyền có thể truy cập vào giao diện nhập điểm và xem kết quả giải đấu.
      </Typography>
    </Paper>
  );
};

export default TournamentAccess;
