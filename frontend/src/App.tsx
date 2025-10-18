import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import POS from './pages/POS';
import Orders from './pages/Orders';
import OrderStatus from './pages/OrderStatus';
import Users from './pages/Users';
import Categories from './pages/Categories';
import Products from './pages/Products';
import Inventory from './pages/Inventory';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Assembly from './pages/Assembly';
import Requests from './pages/Requests';
import StoreManagement from './pages/StoreManagement';
import CustomerStore from './pages/CustomerStore';
import CustomerOrders from './pages/CustomerOrders';
import ProductDetail from './pages/ProductDetail';
import Reports from './pages/Reports';

const theme = createTheme({
  palette: {
    primary: {
      main: '#667eea',
      light: '#8fa4f3',
      dark: '#4a5ba8',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#764ba2',
      light: '#9575cd',
      dark: '#5e3a7a',
      contrastText: '#ffffff',
    },
    background: {
      default: '#f8f9ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c3e50',
      secondary: '#6c757d',
    },
    success: {
      main: '#4caf50',
      light: '#81c784',
      dark: '#388e3c',
    },
    warning: {
      main: '#ff9800',
      light: '#ffb74d',
      dark: '#f57c00',
    },
    error: {
      main: '#f44336',
      light: '#e57373',
      dark: '#d32f2f',
    },
    info: {
      main: '#2196f3',
      light: '#64b5f6',
      dark: '#1976d2',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  // Determine default route based on user role
  const getDefaultRoute = () => {
    if (user?.roles?.includes('Cashier')) {
      return '/pos';
    }
    if (user?.roles?.includes('Customer')) {
      return '/customer-store';
    }
    return '/';
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <Login />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to={getDefaultRoute()} /> : <Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/pos" element={<POS />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/order-status" element={<OrderStatus />} />
                <Route path="/products" element={<Products />} />
                <Route path="/inventory" element={<Inventory />} />
                {/* SuperAdmin routes - Global scope */}
                {user?.roles?.includes('SuperAdmin') && (
                  <>
                    <Route path="/users" element={<Users />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/assembly" element={<Assembly />} />
                    <Route path="/store-management" element={<StoreManagement />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/reports" element={<Reports />} />
                  </>
                )}

                {/* StoreManager routes - Single-store scope */}
                {user?.roles?.includes('StoreManager') && (
                  <>
                    <Route path="/users" element={<Users />} />
                    <Route path="/purchases" element={<Purchases />} />
                    <Route path="/sales" element={<Sales />} />
                    <Route path="/assembly" element={<Assembly />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/reports" element={<Reports />} />
                  </>
                )}

                {/* WarehouseManager routes - Warehouse-bound scope */}
                {user?.roles?.includes('WarehouseManager') && (
                  <>
                    <Route path="/assembly" element={<Assembly />} />
                    <Route path="/requests" element={<Requests />} />
                    <Route path="/reports" element={<Reports />} />
                  </>
                )}

                {/* SalesStaff routes - POS-focused */}
                {user?.roles?.includes('Cashier') && (
                  <>
                    <Route path="/pos" element={<POS />} />
                    <Route path="/requests" element={<Requests />} />
                  </>
                )}

                {/* StoreManager routes - Store management including online orders */}
                {user?.roles?.includes('StoreManager') && (
                  <>
                    <Route path="/online-orders" element={<Orders />} />
                    <Route path="/online-inventory" element={<Inventory />} />
                  </>
                )}

                {/* Customer routes - Online shopping and order tracking */}
                {user?.roles?.includes('Customer') && (
                  <>
                    <Route path="/customer-store" element={<CustomerStore />} />
                    <Route path="/customer-orders" element={<CustomerOrders />} />
                    <Route path="/product/:id" element={<ProductDetail />} />
                  </>
                )}

                {/* Common routes for all roles */}
                <Route path="/requests" element={<Requests />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                {/* Redirect unauthorized users to dashboard */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;