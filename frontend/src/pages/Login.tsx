import React, { useState } from 'react';
import {
  Container,
  Paper,
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Link,
  Divider,
  Avatar,
  Fade,
  Grow,
} from '@mui/material';
import { Store as StoreIcon } from '@mui/icons-material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if user came from registration
  const registrationMessage = location.state?.message;
  const registrationEmail = location.state?.email;
  
  // Pre-fill email if coming from registration
  React.useEffect(() => {
    if (registrationEmail) {
      setEmail(registrationEmail);
    }
  }, [registrationEmail]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Login form submitted');
      await login(email, password);
      console.log('Login successful, navigating to dashboard');
      navigate('/'); // Redirect to dashboard after successful login
    } catch (err: any) {
      console.error('Login failed:', err);
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      py: 4
    }}>
      <Container component="main" maxWidth="sm">
        <Fade in timeout={800}>
          <Paper sx={{ 
            p: 6, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            {/* Heritage Brand Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Grow in timeout={1000}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  width: 80, 
                  height: 80,
                  mx: 'auto',
                  mb: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}>
                  <StoreIcon sx={{ fontSize: 40 }} />
                </Avatar>
              </Grow>
              <Typography variant="h3" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}>
                Heritage
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300, mb: 2 }}>
                Perfumes Store Management System
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Sign in to access your dashboard
              </Typography>
            </Box>
            
            {registrationMessage && (
              <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                {registrationMessage}
              </Alert>
            )}
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 3 }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={loading}
                sx={{
                  mt: 2,
                  mb: 2,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  fontWeight: 'bold',
                  fontSize: '1.1rem',
                  '&:hover': {
                    boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                    transform: 'translateY(-2px)'
                  }
                }}
              >
                {loading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
              
              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Don't have an account?
                </Typography>
              </Divider>
              
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Link component={RouterLink} to="/register" variant="body2" sx={{ 
                  color: 'primary.main',
                  fontWeight: 600,
                  textDecoration: 'none',
                  '&:hover': {
                    textDecoration: 'underline'
                  }
                }}>
                  Create a new account
                </Link>
              </Box>

              {/* <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  Having trouble logging in?{' '}
                  <Link component={RouterLink} to="/login-debug" variant="body2" sx={{ 
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': {
                      textDecoration: 'underline'
                    }
                  }}>
                    Try the debug page
                  </Link>
                </Typography>
              </Box> */}

              {/* <Box sx={{ 
                mt: 3, 
                p: 3, 
                bgcolor: 'rgba(102, 126, 234, 0.1)', 
                borderRadius: 2,
                border: '1px solid rgba(102, 126, 234, 0.2)'
              }}>
                <Typography variant="body2" color="primary.main" align="center" sx={{ fontWeight: 600, mb: 1 }}>
                  Demo Credentials:
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Email: newuser@test.com
                </Typography>
                <Typography variant="body2" color="text.secondary" align="center">
                  Password: NewUser123!
                </Typography>
              </Box> */}
            </Box>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
};

export default Login;
