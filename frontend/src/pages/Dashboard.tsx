import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

// Import role-specific dashboards
import SuperAdminDashboard from '../components/dashboards/SuperAdminDashboard';
import StoreManagerDashboard from '../components/dashboards/StoreManagerDashboard';
import CashierDashboard from '../components/dashboards/CashierDashboard';
import CustomerDashboard from '../components/dashboards/CustomerDashboard';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Determine which dashboard to show based on user role
  const renderRoleSpecificDashboard = () => {
    if (!user?.roles || user.roles.length === 0) {
      return (
        <Alert severity="warning" sx={{ mb: 2 }}>
          No roles assigned. Please contact your administrator.
        </Alert>
      );
    }

    // SuperAdmin gets the most comprehensive dashboard
    if (user.roles.includes('SuperAdmin')) {
      return <SuperAdminDashboard />;
    }

    // StoreManager gets store-specific management dashboard
    if (user.roles.includes('StoreManager')) {
      return <StoreManagerDashboard />;
    }

    // Cashier gets POS-focused dashboard
    if (user.roles.includes('Cashier')) {
      return <CashierDashboard />;
    }

    // Customer gets shopping and order tracking dashboard
    if (user.roles.includes('Customer')) {
      return <CustomerDashboard />;
    }

    // Fallback for any other roles
  return (
    <Box>
        <Typography variant="h4" gutterBottom>
          Welcome, {user?.fullName || 'User'}! 👋
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          Your role-specific dashboard is being prepared.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {user?.roles?.map((role) => (
            <Chip key={role} label={role} color="primary" size="small" />
          ))}
        </Box>
      </Box>
    );
  };

  return (
                    <Box>
      {renderRoleSpecificDashboard()}
    </Box>
  );
};

export default Dashboard;