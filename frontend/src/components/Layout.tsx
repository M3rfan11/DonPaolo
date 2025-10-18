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
  const baseItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/' },
  ];

  // Cashier and Customer don't get Dashboard in their menu
  const getBaseItemsForRole = (roles: string[]) => {
    if (roles.includes('Cashier') || roles.includes('Customer')) {
      return [];
    }
    return baseItems;
  };

  // SuperAdmin - Global scope, all modules
  if (userRoles.includes('SuperAdmin')) {
    return [
      ...getBaseItemsForRole(userRoles),
      { text: 'Users', icon: <People />, path: '/users' },
      { text: 'Store Management', icon: <Store />, path: '/store-management' },
      { text: 'Categories', icon: <Inventory />, path: '/categories' },
      { text: 'Products', icon: <Inventory />, path: '/products' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
      { text: 'Purchases', icon: <ShoppingCart />, path: '/purchases' },
      { text: 'Sales', icon: <PointOfSale />, path: '/sales' },
      { text: 'Assembly', icon: <Build />, path: '/assembly' },
      { text: 'Requests', icon: <RequestQuote />, path: '/requests' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Profile', icon: <Person />, path: '/profile' },
    ];
  }

  // StoreManager - Single-store scope, management permissions
  if (userRoles.includes('StoreManager')) {
    return [
      ...getBaseItemsForRole(userRoles),
      { text: 'Users', icon: <People />, path: '/users' },
      { text: 'Products', icon: <Inventory />, path: '/products' },
      { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
      { text: 'Purchases', icon: <ShoppingCart />, path: '/purchases' },
      { text: 'Sales', icon: <PointOfSale />, path: '/sales' },
      { text: 'Assembly', icon: <Build />, path: '/assembly' },
      { text: 'Requests', icon: <RequestQuote />, path: '/requests' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Profile', icon: <Person />, path: '/profile' },
    ];
  }

  // WarehouseManager - Warehouse-bound scope
  if (userRoles.includes('WarehouseManager')) {
    return [
      ...getBaseItemsForRole(userRoles),
      { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
      { text: 'Assembly', icon: <Build />, path: '/assembly' },
      { text: 'Requests', icon: <RequestQuote />, path: '/requests' },
      { text: 'Reports', icon: <Assessment />, path: '/reports' },
      { text: 'Profile', icon: <Person />, path: '/profile' },
    ];
  }


  // Cashier - POS-focused permissions
  if (userRoles.includes('Cashier')) {
    return [
      ...getBaseItemsForRole(userRoles),
      { text: 'POS', icon: <PointOfSale />, path: '/pos' },
      { text: 'Products', icon: <Inventory />, path: '/products' },
      { text: 'Requests', icon: <RequestQuote />, path: '/requests' },
      { text: 'Profile', icon: <Person />, path: '/profile' },
    ];
  }

  // Customer - Online shopping and order tracking
  if (userRoles.includes('Customer')) {
    return [
      ...getBaseItemsForRole(userRoles),
      { text: 'Online Store', icon: <ShoppingCart />, path: '/customer-store' },
      { text: 'My Orders', icon: <Receipt />, path: '/customer-orders' },
      { text: 'Profile', icon: <Person />, path: '/profile' },
    ];
  }

  // User (basic staff) - Read-only access and requests
  return [
    ...getBaseItemsForRole(userRoles),
    { text: 'Products', icon: <Inventory />, path: '/products' },
    { text: 'Inventory', icon: <Inventory />, path: '/inventory' },
    { text: 'Requests', icon: <RequestQuote />, path: '/requests' },
    { text: 'Profile', icon: <Person />, path: '/profile' },
  ];
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
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
        }}
      >
        <Toolbar sx={{ px: { xs: 2, md: 4 } }}>
          {/* Heritage Brand Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mr: 4 }}>
            <Avatar sx={{ 
              bgcolor: 'rgba(255,255,255,0.2)', 
              width: 40, 
              height: 40 
            }}>
              <Store sx={{ fontSize: 24 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold', lineHeight: 1 }}>
                Heritage
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8, fontSize: '0.7rem' }}>
                Management System
              </Typography>
            </Box>
          </Box>

          {/* Navigation Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {/* Dashboard - Only for SuperAdmin and StoreManager */}
            {(user?.roles?.includes('SuperAdmin') || user?.roles?.includes('StoreManager')) && (
              <Button
                onClick={() => navigate('/')}
                startIcon={<Dashboard />}
                sx={{
                  color: 'white',
                  fontWeight: location.pathname === '/' ? 'bold' : 'normal',
                  bgcolor: location.pathname === '/' ? 'rgba(255,255,255,0.2)' : 'transparent',
                  borderRadius: 2,
                  px: 2,
                  py: 1,
                  textTransform: 'none',
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.15)',
                  },
                }}
              >
                Dashboard
              </Button>
            )}

            {/* Management Dropdown */}
            {user?.roles?.includes('SuperAdmin') && (
              <ClickAwayListener onClickAway={handleManagementMenuClose}>
                <Box>
                  <Button
                    onClick={handleManagementMenuOpen}
                    endIcon={<ArrowDropDown />}
                    sx={{
                      color: 'white',
                      fontWeight: 'normal',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Management
                  </Button>
                  <Menu
                    anchorEl={managementMenuAnchor}
                    open={Boolean(managementMenuAnchor)}
                    onClose={handleManagementMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    <MenuList>
                      <MenuItem onClick={() => handleNavigation('/users')}>
                        <ListItemIcon><People fontSize="small" /></ListItemIcon>
                        <ListItemText>Users</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/store-management')}>
                        <ListItemIcon><Storefront fontSize="small" /></ListItemIcon>
                        <ListItemText>Store Management</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/categories')}>
                        <ListItemIcon><Category fontSize="small" /></ListItemIcon>
                        <ListItemText>Categories</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/products')}>
                        <ListItemIcon><Inventory fontSize="small" /></ListItemIcon>
                        <ListItemText>Products</ListItemText>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              </ClickAwayListener>
            )}

            {/* Operations Dropdown - SuperAdmin and StoreManager only */}
            {(user?.roles?.includes('SuperAdmin') || user?.roles?.includes('StoreManager')) && (
              <ClickAwayListener onClickAway={handleOperationsMenuClose}>
                <Box>
                  <Button
                    onClick={handleOperationsMenuOpen}
                    endIcon={<ArrowDropDown />}
                    sx={{
                      color: 'white',
                      fontWeight: 'normal',
                      borderRadius: 2,
                      px: 2,
                      py: 1,
                      textTransform: 'none',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.15)',
                      },
                    }}
                  >
                    Operations
                  </Button>
                  <Menu
                    anchorEl={operationsMenuAnchor}
                    open={Boolean(operationsMenuAnchor)}
                    onClose={handleOperationsMenuClose}
                    PaperProps={{
                      sx: {
                        mt: 1,
                        minWidth: 200,
                        borderRadius: 2,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                      }
                    }}
                  >
                    <MenuList>
                      <MenuItem onClick={() => handleNavigation('/inventory')}>
                        <ListItemIcon><Inventory fontSize="small" /></ListItemIcon>
                        <ListItemText>Inventory</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/purchases')}>
                        <ListItemIcon><ShoppingCart fontSize="small" /></ListItemIcon>
                        <ListItemText>Purchases</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/sales')}>
                        <ListItemIcon><TrendingUp fontSize="small" /></ListItemIcon>
                        <ListItemText>Sales</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/assembly')}>
                        <ListItemIcon><Build fontSize="small" /></ListItemIcon>
                        <ListItemText>Assembly</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/requests')}>
                        <ListItemIcon><RequestQuote fontSize="small" /></ListItemIcon>
                        <ListItemText>Requests</ListItemText>
                      </MenuItem>
                      <MenuItem onClick={() => handleNavigation('/reports')}>
                        <ListItemIcon><Assessment fontSize="small" /></ListItemIcon>
                        <ListItemText>Reports</ListItemText>
                      </MenuItem>
                    </MenuList>
                  </Menu>
                </Box>
              </ClickAwayListener>
            )}

            {/* Cashier-specific navigation - Only POS and Requests */}
            {user?.roles?.includes('Cashier') && (
              <>
                <Button
                  onClick={() => navigate('/pos')}
                  startIcon={<PointOfSale />}
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === '/pos' ? 'bold' : 'normal',
                    bgcolor: location.pathname === '/pos' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  POS
                </Button>
                <Button
                  onClick={() => navigate('/requests')}
                  startIcon={<RequestQuote />}
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === '/requests' ? 'bold' : 'normal',
                    bgcolor: location.pathname === '/requests' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  Requests
                </Button>
              </>
            )}

            {/* Customer-specific navigation */}
            {user?.roles?.includes('Customer') && (
              <>
                <Button
                  onClick={() => navigate('/customer-store')}
                  startIcon={<ShoppingCart />}
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === '/customer-store' ? 'bold' : 'normal',
                    bgcolor: location.pathname === '/customer-store' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  Online Store
                </Button>
                <Button
                  onClick={() => navigate('/customer-orders')}
                  startIcon={<Receipt />}
                  sx={{
                    color: 'white',
                    fontWeight: location.pathname === '/customer-orders' ? 'bold' : 'normal',
                    bgcolor: location.pathname === '/customer-orders' ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderRadius: 2,
                    px: 2,
                    py: 1,
                    textTransform: 'none',
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.15)',
                    },
                  }}
                >
                  My Orders
                </Button>
              </>
            )}

          </Box>

          {/* User Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip 
              label={user?.roles?.[0] || 'User'} 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '0.7rem'
              }} 
            />
            <Typography variant="body2" sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
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
              <MenuItem onClick={() => { navigate('/profile'); handleMenuClose(); }}>
                <ListItemIcon>
                  <AccountCircle fontSize="small" />
                </ListItemIcon>
                <ListItemText>Profile</ListItemText>
              </MenuItem>
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
