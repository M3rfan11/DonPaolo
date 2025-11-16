import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Button,
  ListItemIcon,
  ListItemText,
  MenuList,
  Paper,
  ClickAwayListener,
} from '@mui/material';
import {
  Dashboard,
  Inventory,
  ShoppingCart,
  PointOfSale,
  Build,
  RequestQuote,
  Assessment,
  AccountCircle,
  Logout,
  People,
  Person,
  Receipt,
  Store,
  ArrowDropDown,
  Storefront,
  Category,
  TrendingUp,
  Settings,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const getMenuItems = (userRoles: string[] = []) => {
  // SuperAdmin sees dashboard, Cashier sees only POS
  if (userRoles.includes('SuperAdmin')) {
    return [
      { text: 'Dashboard', icon: <Dashboard />, path: '/admin' },
    ];
  }
  
  if (userRoles.includes('Cashier')) {
    return [
      { text: 'POS', icon: <PointOfSale />, path: '/pos' },
    ];
  }
  
  return [];
};

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [managementMenuAnchor, setManagementMenuAnchor] = useState<null | HTMLElement>(null);
  const [operationsMenuAnchor, setOperationsMenuAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const menuItems = getMenuItems(user?.roles || []);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleManagementMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setManagementMenuAnchor(event.currentTarget);
  };

  const handleManagementMenuClose = () => {
    setManagementMenuAnchor(null);
  };

  const handleOperationsMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setOperationsMenuAnchor(event.currentTarget);
  };

  const handleOperationsMenuClose = () => {
    setOperationsMenuAnchor(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleManagementMenuClose();
    handleOperationsMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{
          background: '#000000',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Heritage Brand Logo */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 }, 
            mr: { xs: 1, sm: 2, md: 4 },
            flexShrink: 0
          }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.15)', 
              width: { xs: 32, sm: 40 }, 
              height: { xs: 32, sm: 40 }
            }}>
              <Store sx={{ fontSize: { xs: 20, sm: 24 }, color: 'white' }} />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1, fontSize: { xs: '0.9rem', sm: '1rem' }, color: 'white' }}>
                DON PAOLO
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: { xs: '0.6rem', sm: '0.7rem' }, color: 'white', fontStyle: 'italic' }}>
                Ristorante Italiano Artigianale
              </Typography>
            </Box>
          </Box>

          {/* Navigation Menu */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 0.5, sm: 1 }, 
            flexGrow: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            msOverflowStyle: 'none',
            scrollbarWidth: 'none'
          }}>
            {/* SuperAdmin - Dashboard button */}
            {user?.roles?.includes('SuperAdmin') && (
              <Button
                onClick={() => navigate('/admin')}
                startIcon={<Dashboard sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                sx={{
                  color: 'white',
                  fontWeight: location.pathname === '/admin' ? 'bold' : 'normal',
                  bgcolor: location.pathname === '/admin' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderRadius: 2,
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  whiteSpace: 'nowrap',
                  border: location.pathname === '/admin' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  },
                }}
              >
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Dashboard</Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>Dash</Box>
              </Button>
            )}

            {/* Cashier - POS button */}
            {user?.roles?.includes('Cashier') && (
                <Button
                  onClick={() => navigate('/pos')}
                startIcon={<PointOfSale sx={{ fontSize: { xs: 18, sm: 24 } }} />}
                sx={{
                  color: 'white',
                  fontWeight: location.pathname === '/pos' ? 'bold' : 'normal',
                  bgcolor: location.pathname === '/pos' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderRadius: 2,
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 },
                  textTransform: 'none',
                  fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                  whiteSpace: 'nowrap',
                  border: location.pathname === '/pos' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                    border: '1px solid rgba(255,255,255,0.3)',
                  },
                }}
                >
                  POS
                </Button>
            )}
          </Box>

          {/* User Menu */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, sm: 2 },
            flexShrink: 0
          }}>
            <Chip 
              label={user?.roles?.[0] || 'User'} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                height: { xs: 20, sm: 24 },
                display: { xs: 'none', sm: 'flex' }
              }} 
            />
            <Typography 
              variant="body2" 
              sx={{ 
                opacity: 0.9, 
                display: { xs: 'none', md: 'block' },
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {user?.fullName}
          </Typography>
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuOpen}
            color="inherit"
          >
              <Avatar sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)', 
                width: 32, 
                height: 32,
                fontSize: '0.9rem'
              }}>
                {user?.fullName?.charAt(0) || 'U'}
            </Avatar>
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
          >
            <MenuItem disabled>
              <Typography variant="body2" color="text.secondary">
                {user?.fullName}
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default' }}>
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
