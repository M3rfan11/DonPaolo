import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  Button,
  Divider,
  Container,
  Paper,
  Fade,
  Grow,
  IconButton,
} from '@mui/material';
import {
  AdminPanelSettings,
  Store,
  People,
  Inventory,
  Assessment,
  TrendingUp,
  Warning,
  CheckCircle,
  Security,
  Settings,
  Refresh,
  Star,
  ArrowForward,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface SuperAdminStats {
  totalUsers: number;
  totalStores: number;
  totalProducts: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingOrders: number;
}

const SuperAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SuperAdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSuperAdminData();
  }, []);

  const loadSuperAdminData = async () => {
    try {
      setLoading(true);
      const [usersData, inventoryData] = await Promise.all([
        api.getAllUsers().catch(() => []),
        api.getInventory().catch(() => []),
      ]);

      const users = Array.isArray(usersData) ? usersData : [];
      const inventory = Array.isArray(inventoryData) ? inventoryData : [];

      setStats({
        totalUsers: users.length,
        totalStores: 3, // Mock data - replace with actual API call
        totalProducts: inventory.length,
        totalRevenue: 125000, // Mock data - replace with actual API call
        lowStockItems: inventory.filter((item: any) => item.quantity < 10).length,
        pendingOrders: 5, // Mock data - replace with actual API call
      });
    } catch (err) {
      console.error('Error loading SuperAdmin data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 4
      }}>
        <Alert severity="error" sx={{ maxWidth: 500 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 4
    }}>
      <Container maxWidth="xl">
        {/* Heritage Brand Header */}
        <Fade in timeout={800}>
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 3,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <Avatar sx={{ 
                  bgcolor: 'primary.main', 
                  width: 64, 
                  height: 64,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
                }}>
                  <AdminPanelSettings sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    mb: 1
                  }}>
                    SuperAdmin Dashboard
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Welcome back, {user?.fullName}! 👋
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Complete system oversight and management
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={loadSuperAdminData}
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                  }}
                >
                  <Refresh />
                </IconButton>
                <Chip 
                  icon={<Star sx={{ color: '#ffd700' }} />} 
                  label="SuperAdmin" 
                  sx={{ 
                    bgcolor: 'rgba(255, 215, 0, 0.1)',
                    color: '#b8860b',
                    fontWeight: 'bold',
                    border: '1px solid rgba(255, 215, 0, 0.3)'
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Stats Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {[
            { 
              title: 'Total Users', 
              value: stats?.totalUsers || 0, 
              icon: <People />, 
              color: '#667eea',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            { 
              title: 'Total Stores', 
              value: stats?.totalStores || 0, 
              icon: <Store />, 
              color: '#4caf50',
              gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
            },
            { 
              title: 'Total Products', 
              value: stats?.totalProducts || 0, 
              icon: <Inventory />, 
              color: '#ff9800',
              gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
            },
            { 
              title: 'Total Revenue', 
              value: `$${stats?.totalRevenue?.toFixed(2) || '0.00'}`, 
              icon: <TrendingUp />, 
              color: '#9c27b0',
              gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
            }
          ].map((stat, index) => (
            <Grow in timeout={1000 + index * 200} key={stat.title}>
              <Box sx={{ flex: '1 1 250px', minWidth: '250px' }}>
                <Card sx={{ 
                  height: '100%',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                  }
                }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
                          {stat.title}
                        </Typography>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 'bold',
                          background: stat.gradient,
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          {stat.value}
                        </Typography>
                      </Box>
                      <Avatar sx={{ 
                        bgcolor: stat.color,
                        background: stat.gradient,
                        width: 56,
                        height: 56,
                        boxShadow: `0 8px 20px ${stat.color}40`
                      }}>
                        {stat.icon}
                      </Avatar>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Grow>
          ))}
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" sx={{ 
            fontWeight: 'bold', 
            mb: 3, 
            color: 'white',
            textAlign: 'center'
          }}>
            Quick Actions
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
            {[
              {
                title: 'Manage Users',
                description: 'Add, edit, and manage user accounts',
                icon: <People />,
                color: '#667eea',
                action: () => navigate('/users'),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              {
                title: 'Store Management',
                description: 'Oversee all store operations',
                icon: <Store />,
                color: '#4caf50',
                action: () => navigate('/store-management'),
                gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
              },
              {
                title: 'Inventory Control',
                description: 'Monitor and manage inventory',
                icon: <Inventory />,
                color: '#ff9800',
                action: () => navigate('/inventory'),
                gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
              },
              {
                title: 'Reports & Analytics',
                description: 'View comprehensive system reports',
                icon: <Assessment />,
                color: '#9c27b0',
                action: () => navigate('/reports'),
                gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
              }
            ].map((action, index) => (
              <Grow in timeout={1200 + index * 200} key={action.title}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px', maxWidth: '250px' }}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      cursor: 'pointer',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 3,
                      transition: 'all 0.3s ease',
                      '&:hover': { 
                        transform: 'translateY(-8px) scale(1.02)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                      }
                    }}
                    onClick={action.action}
                  >
                    <CardContent sx={{ textAlign: 'center', p: 3 }}>
                      <Avatar sx={{ 
                        bgcolor: action.color,
                        background: action.gradient,
                        mx: 'auto', 
                        mb: 2,
                        width: 64,
                        height: 64,
                        boxShadow: `0 8px 20px ${action.color}40`
                      }}>
                        {action.icon}
                      </Avatar>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                        {action.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {action.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Access
                        </Typography>
                        <ArrowForward sx={{ fontSize: 16 }} />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              </Grow>
            ))}
          </Box>
        </Box>

        {/* System Alerts */}
        {(stats?.lowStockItems || 0) > 0 && (
          <Fade in timeout={1400}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#ff9800', width: 40, height: 40 }}>
                    <Warning sx={{ color: 'white' }} />
                  </Avatar>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    System Alerts
                  </Typography>
                </Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  {stats?.lowStockItems || 0} items are running low on stock and may need attention.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Inventory />}
                  onClick={() => navigate('/inventory')}
                  sx={{
                    background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(255, 152, 0, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Review Inventory
                </Button>
              </CardContent>
            </Card>
          </Fade>
        )}
      </Container>
    </Box>
  );
};

export default SuperAdminDashboard;