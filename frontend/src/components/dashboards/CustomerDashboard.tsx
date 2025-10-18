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
  LinearProgress,
  Fade,
  Grow,
  IconButton,
  Badge,
} from '@mui/material';
import {
  ShoppingCart,
  Receipt,
  LocalShipping,
  CheckCircle,
  Pending,
  Person,
  Store,
  TrendingUp,
  Favorite,
  Notifications,
  Star,
  ArrowForward,
  Refresh,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';

interface CustomerStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  shippedOrders: number;
}

interface RecentOrder {
  id: number;
  orderNumber: string;
  status: string;
  totalAmount: number;
  orderDate: string;
  itemCount: number;
}

const CustomerDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCustomerData();
  }, []);

  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const [ordersData] = await Promise.all([
        api.getCustomerOrders().catch(() => []),
      ]);

      const orders = Array.isArray(ordersData) ? ordersData : [];
      
      const pendingOrders = orders.filter((order: any) => order.status === 'Pending').length;
      const completedOrders = orders.filter((order: any) => order.status === 'Completed').length;
      const shippedOrders = orders.filter((order: any) => order.status === 'Shipped').length;

      setStats({
        totalOrders: orders.length,
        pendingOrders,
        completedOrders,
        shippedOrders,
      });

      // Get recent orders (last 3)
      const recentOrdersData = orders
        .sort((a: any, b: any) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
        .slice(0, 3)
        .map((order: any) => ({
          id: order.id,
          orderNumber: order.orderNumber,
          status: order.status,
          totalAmount: order.totalAmount,
          orderDate: order.orderDate,
          itemCount: order.items?.length || 0,
        }));
      
      setRecentOrders(recentOrdersData);
    } catch (err) {
      console.error('Error loading Customer data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCustomerData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return '#ff9800';
      case 'confirmed': return '#2196f3';
      case 'shipped': return '#9c27b0';
      case 'delivered': return '#4caf50';
      case 'cancelled': return '#f44336';
      default: return '#757575';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

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
                  <Store sx={{ fontSize: 32 }} />
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
                    Heritage
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Welcome back, {user?.fullName}! 👋
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Your premium shopping experience awaits
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                  }}
                >
                  <Refresh sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
                <Chip 
                  icon={<Star sx={{ color: '#ffd700' }} />} 
                  label="Premium Member" 
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
              title: 'Total Orders', 
              value: stats?.totalOrders || 0, 
              icon: <ShoppingCart />, 
              color: '#667eea',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            { 
              title: 'Pending Orders', 
              value: stats?.pendingOrders || 0, 
              icon: <Pending />, 
              color: '#ff9800',
              gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
            },
            { 
              title: 'Shipped Orders', 
              value: stats?.shippedOrders || 0, 
              icon: <LocalShipping />, 
              color: '#9c27b0',
              gradient: 'linear-gradient(135deg, #9c27b0 0%, #7b1fa2 100%)'
            },
            { 
              title: 'Completed Orders', 
              value: stats?.completedOrders || 0, 
              icon: <CheckCircle />, 
              color: '#4caf50',
              gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
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

        {/* Quick Actions with Enhanced Design */}
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
                title: 'Browse Products',
                description: 'Discover our premium collection',
                icon: <ShoppingCart />,
                color: '#667eea',
                action: () => navigate('/customer-store'),
                gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              },
              {
                title: 'My Orders',
                description: 'Track your order history',
                icon: <Receipt />,
                color: '#4caf50',
                action: () => navigate('/customer-orders'),
                gradient: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)'
              },
              {
                title: 'My Profile',
                description: 'Manage your account',
                icon: <Person />,
                color: '#ff9800',
                action: () => navigate('/profile'),
                gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
              },
              {
                title: 'Wishlist',
                description: 'Save your favorites',
                icon: <Favorite />,
                color: '#e91e63',
                action: () => navigate('/wishlist'),
                gradient: 'linear-gradient(135deg, #e91e63 0%, #c2185b 100%)'
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
                          Explore
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

        {/* Recent Orders Section */}
        {recentOrders.length > 0 && (
          <Fade in timeout={1400}>
            <Card sx={{ 
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <CardContent sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    Recent Orders
                  </Typography>
                  <Button 
                    variant="outlined" 
                    onClick={() => navigate('/customer-orders')}
                    endIcon={<ArrowForward />}
                    sx={{ borderRadius: 2 }}
                  >
                    View All
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {recentOrders.map((order, index) => (
                    <Grow in timeout={1600 + index * 200} key={order.id}>
                      <Paper sx={{ 
                        p: 3, 
                        borderRadius: 2,
                        border: '1px solid rgba(0,0,0,0.05)',
                        transition: 'all 0.2s ease',
                        '&:hover': { 
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)'
                        }
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                              Order #{order.orderNumber}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(order.orderDate)} • {order.itemCount} items
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                              {formatCurrency(order.totalAmount)}
                            </Typography>
                            <Chip
                              label={order.status}
                              sx={{
                                bgcolor: getStatusColor(order.status),
                                color: 'white',
                                fontWeight: 'bold',
                                borderRadius: 2
                              }}
                            />
                          </Box>
                        </Box>
                      </Paper>
                    </Grow>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Fade>
        )}

        {/* Order Status Overview */}
        <Fade in timeout={1800}>
          <Card sx={{ 
            mt: 4,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                Order Status Overview
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
                {[
                  { status: 'Pending', count: stats?.pendingOrders || 0, icon: <Pending />, color: '#ff9800' },
                  { status: 'Processing', count: stats?.shippedOrders || 0, icon: <CheckCircle />, color: '#2196f3' },
                  { status: 'Shipped', count: stats?.shippedOrders || 0, icon: <LocalShipping />, color: '#9c27b0' },
                  { status: 'Completed', count: stats?.completedOrders || 0, icon: <CheckCircle />, color: '#4caf50' }
                ].map((item, index) => (
                  <Grow in timeout={2000 + index * 200} key={item.status}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'rgba(0,0,0,0.02)',
                      minWidth: '200px',
                      justifyContent: 'center'
                    }}>
                      <Avatar sx={{ bgcolor: item.color, width: 40, height: 40 }}>
                        {item.icon}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {item.status}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          {item.count} orders
                        </Typography>
                      </Box>
                    </Box>
                  </Grow>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Fade>
      </Container>
    </Box>
  );
};

export default CustomerDashboard;