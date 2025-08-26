import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  IconButton,
  Link
} from '@mui/material';
import {
  Close as CloseIcon,
  Phone as PhoneIcon,
  Lock as LockIcon,
  Person as PersonIcon,
  Google as GoogleIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const AuthModal = ({ open, onClose, title = "Đăng nhập" }) => {
  const { signInWithGoogle, signUpWithPhone, signInWithPhone, resetPassword } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [resetMode, setResetMode] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!open) {
      setActiveTab(0);
      setIsSignUp(false);
      setPhoneNumber('');
      setPassword('');
      setConfirmPassword('');
      setDisplayName('');
      setShowPassword(false);
      setShowConfirmPassword(false);
      setLoading(false);
      setError('');
      setSuccessMessage('');
      setResetMode(false);
    }
  }, [open]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');
    try {
      await signInWithGoogle();
      onClose();
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Lỗi đăng nhập bằng Google. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    return null;
  };

  const handlePhoneAuth = async () => {
    if (!phoneNumber || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0123456789)');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp');
        return;
      }
      if (!displayName.trim()) {
        setError('Vui lòng nhập tên hiển thị');
        return;
      }
    }

    setLoading(true);
    setError('');
    
    try {
      if (isSignUp) {
        await signUpWithPhone(formattedPhone, password, displayName.trim());
        setSuccessMessage('Tạo tài khoản thành công!');
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        await signInWithPhone(formattedPhone, password);
        setSuccessMessage('Đăng nhập thành công!');
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (error) {
      console.error('Phone auth error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('Tài khoản không tồn tại. Vui lòng kiểm tra lại số điện thoại hoặc đăng ký tài khoản mới.');
      } else if (error.code === 'auth/wrong-password') {
        setError('Mật khẩu không đúng. Vui lòng thử lại.');
      } else if (error.code === 'auth/email-already-in-use') {
        setError('Số điện thoại này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng số khác.');
      } else if (error.code === 'auth/weak-password') {
        setError('Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Số điện thoại không hợp lệ.');
      } else {
        setError('Lỗi xác thực. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!phoneNumber) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }

    const formattedPhone = validatePhoneNumber(phoneNumber);
    if (!formattedPhone) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập số điện thoại Việt Nam (VD: 0123456789)');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await resetPassword(formattedPhone);
      setSuccessMessage('Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư của bạn.');
      setTimeout(() => {
        setResetMode(false);
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.code === 'auth/user-not-found') {
        setError('Không tìm thấy tài khoản với số điện thoại này.');
      } else {
        setError('Lỗi gửi email đặt lại mật khẩu. Vui lòng thử lại.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    setSuccessMessage('');
  };

  const handleResetMode = () => {
    setResetMode(true);
    setError('');
    setSuccessMessage('');
  };

  const handleBackToLogin = () => {
    setResetMode(false);
    setError('');
    setSuccessMessage('');
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight="bold">
            {resetMode ? 'Đặt lại mật khẩu' : title}
          </Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {!resetMode && (
          <Tabs 
            value={activeTab} 
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{ 
              mb: 3,
              '& .MuiTab-root': {
                minWidth: 'auto',
                flex: 1,
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                padding: '8px 12px'
              },
              '& .MuiTabs-indicator': {
                height: 3
              }
            }}
            variant="fullWidth"
          >
            <Tab 
              label="Google" 
              icon={<GoogleIcon />}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginRight: 1
                }
              }}
            />
            <Tab 
              label="Điện thoại" 
              icon={<PhoneIcon />}
              iconPosition="start"
              sx={{
                '& .MuiTab-iconWrapper': {
                  marginRight: 1
                }
              }}
            />
          </Tabs>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {activeTab === 0 && !resetMode && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Đăng nhập nhanh bằng tài khoản Google
            </Typography>
            
            <Button
              variant="contained"
              size="large"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleSignIn}
              disabled={loading}
              sx={{ 
                px: 4, 
                py: 1.5,
                backgroundColor: '#4285f4',
                '&:hover': {
                  backgroundColor: '#357ae8'
                }
              }}
            >
              {loading ? <CircularProgress size={20} color="inherit" /> : 'Đăng nhập bằng Google'}
            </Button>
          </Box>
        )}

        {(activeTab === 1 || resetMode) && (
          <Box sx={{ py: 2 }}>
            {resetMode ? (
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Nhập số điện thoại để nhận email đặt lại mật khẩu
                </Typography>
                
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0123456789"
                  type="tel"
                  sx={{ mb: 2 }}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleResetPassword}
                  disabled={loading || !phoneNumber}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Gửi email đặt lại mật khẩu'}
                </Button>
                
                <Button
                  fullWidth
                  variant="text"
                  onClick={handleBackToLogin}
                  disabled={loading}
                >
                  Quay lại đăng nhập
                </Button>
              </Box>
            ) : (
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  {isSignUp ? 'Tạo tài khoản mới với số điện thoại' : 'Đăng nhập bằng số điện thoại và mật khẩu'}
                </Typography>
                
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Tên hiển thị"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Nhập tên của bạn"
                    sx={{ mb: 2 }}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    }}
                  />
                )}
                
                <TextField
                  fullWidth
                  label="Số điện thoại"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0123456789"
                  type="tel"
                  sx={{ mb: 2 }}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <PhoneIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  }}
                />
                
                <TextField
                  fullWidth
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isSignUp ? "Tạo mật khẩu (ít nhất 6 ký tự)" : "Nhập mật khẩu"}
                  sx={{ mb: 2 }}
                  disabled={loading}
                  InputProps={{
                    startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    endAdornment: (
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    )
                  }}
                />
                
                {isSignUp && (
                  <TextField
                    fullWidth
                    label="Xác nhận mật khẩu"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu"
                    sx={{ mb: 2 }}
                    disabled={loading}
                    InputProps={{
                      startAdornment: <LockIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      endAdornment: (
                        <IconButton
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          edge="end"
                        >
                          {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                        </IconButton>
                      )
                    }}
                  />
                )}
                
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePhoneAuth}
                  disabled={loading || !phoneNumber || !password || (isSignUp && (!confirmPassword || !displayName))}
                  sx={{ mb: 2 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : (isSignUp ? 'Đăng ký' : 'Đăng nhập')}
                </Button>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Button
                    variant="text"
                    onClick={handleToggleMode}
                    disabled={loading}
                    size="small"
                  >
                    {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
                  </Button>
                  
                  {!isSignUp && (
                    <Button
                      variant="text"
                      onClick={handleResetMode}
                      disabled={loading}
                      size="small"
                    >
                      Quên mật khẩu?
                    </Button>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
