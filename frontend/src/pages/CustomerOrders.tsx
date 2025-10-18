import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Fade,
  Grow,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Store as StoreIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productSKU?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
}

interface TrackingEntry {
  id: number;
  status: string;
  notes?: string;
  location?: string;
  timestamp: string;
  updatedByUserName?: string;
}

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAddress: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  notes?: string;
  items: OrderItem[];
  trackingHistory: TrackingEntry[];
}

const CustomerOrders: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadOrders();
    
    // Check if there's a new order from navigation state
    if (location.state?.newOrder) {
      setSelectedOrder(location.state.newOrder);
      setDetailsOpen(true);
    }
  }, [location.state]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const response = await api.getCustomerOrders();
      setOrders(response);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <ScheduleIcon />;
      case 'confirmed': return <CheckCircleIcon />;
      case 'shipped': return <ShippingIcon />;
      case 'delivered': return <CheckCircleIcon />;
      case 'cancelled': return <CancelIcon />;
      default: return <ScheduleIcon />;
    }
  };

  const getStepIndex = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 0;
      case 'confirmed': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          📦 My Orders
        </Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadOrders}
            sx={{ mr: 2 }}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate('/customer-store')}
          >
            Continue Shopping
          </Button>
        </Box>
      </Box>

      {orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No orders found
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Start shopping to see your orders here
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/customer-store')}
            >
              Start Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {orders.map((order) => (
            <Box key={order.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" component="h2">
                        Order #{order.orderNumber}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Placed on {formatDate(order.orderDate)}
                      </Typography>
                      {order.deliveryDate && (
                        <Typography variant="body2" color="text.secondary">
                          Expected delivery: {formatDate(order.deliveryDate)}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Chip
                        icon={getStatusIcon(order.status)}
                        label={order.status}
                        color={getStatusColor(order.status) as any}
                        variant="outlined"
                      />
                      <IconButton
                        onClick={() => {
                          setSelectedOrder(order);
                          setDetailsOpen(true);
                        }}
                        color="primary"
                      >
                        <ViewIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {formatCurrency(order.totalAmount)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Order Progress */}
                  <Box sx={{ mt: 2 }}>
                    <Stepper activeStep={getStepIndex(order.status)} alternativeLabel>
                      <Step>
                        <StepLabel>Ordered</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Confirmed</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Shipped</StepLabel>
                      </Step>
                      <Step>
                        <StepLabel>Delivered</StepLabel>
                      </Step>
                    </Stepper>
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>
      )}

      {/* Order Details Dialog */}
      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - #{selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Order Info */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Information</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary">Customer</Typography>
                    <Typography variant="body1">{selectedOrder.customerName}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary">Email</Typography>
                    <Typography variant="body1">{selectedOrder.customerEmail || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary">Phone</Typography>
                    <Typography variant="body1">{selectedOrder.customerPhone || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>
                    <Typography variant="body2" color="text.secondary">Status</Typography>
                    <Chip
                      icon={getStatusIcon(selectedOrder.status)}
                      label={selectedOrder.status}
                      color={getStatusColor(selectedOrder.status) as any}
                      size="small"
                    />
                  </Box>
                  <Box sx={{ flex: '1 1 100%' }}>
                    <Typography variant="body2" color="text.secondary">Delivery Address</Typography>
                    <Typography variant="body1">{selectedOrder.customerAddress}</Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Order Items */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Order Items</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity</TableCell>
                        <TableCell align="right">Unit Price</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {selectedOrder.items.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Typography variant="body2" fontWeight="medium">
                              {item.productName}
                            </Typography>
                            {item.productSKU && (
                              <Typography variant="caption" color="text.secondary">
                                SKU: {item.productSKU}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">
                            {item.quantity} {item.unit}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell align="right">
                            {formatCurrency(item.totalPrice)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                  <Typography variant="h6">
                    Total: {formatCurrency(selectedOrder.totalAmount)}
                  </Typography>
                </Box>
              </Paper>

              {/* Tracking History */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>Tracking History</Typography>
                <List>
                  {selectedOrder.trackingHistory.map((entry, index) => (
                    <React.Fragment key={entry.id}>
                      <ListItem>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip
                                icon={getStatusIcon(entry.status)}
                                label={entry.status}
                                color={getStatusColor(entry.status) as any}
                                size="small"
                              />
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(entry.timestamp)}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <Box>
                              {entry.notes && (
                                <Typography variant="body2" sx={{ mb: 0.5 }}>
                                  {entry.notes}
                                </Typography>
                              )}
                              {entry.location && (
                                <Typography variant="caption" color="text.secondary">
                                  Location: {entry.location}
                                </Typography>
                              )}
                              {entry.updatedByUserName && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                                  Updated by: {entry.updatedByUserName}
                                </Typography>
                              )}
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < selectedOrder.trackingHistory.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CustomerOrders;
