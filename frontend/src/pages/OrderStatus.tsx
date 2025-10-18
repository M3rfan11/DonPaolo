import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import {
  ShoppingCart,
  LocalShipping,
  CheckCircle,
  Schedule,
  Visibility,
  Refresh,
} from '@mui/icons-material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  warehouseId: number;
  warehouseName: string;
}

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  orderDate: string;
  deliveryDate?: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdByUserName: string;
  confirmedByUserName?: string;
  salesItems?: OrderItem[];
  items?: OrderItem[]; // API returns 'items' instead of 'salesItems'
}

const OrderStatus: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const ordersData = await api.getSalesOrders();
      // Filter orders for the current user (assuming they're created by the user)
      const userOrders = ordersData.filter((order: any) => 
        order.customerEmail === user?.email || order.createdByUserName === user?.fullName
      );
      setOrders(userOrders);
    } catch (err: any) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'warning';
      case 'Confirmed':
        return 'info';
      case 'Shipped':
        return 'primary';
      case 'Delivered':
        return 'success';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Schedule />;
      case 'Confirmed':
        return <CheckCircle />;
      case 'Shipped':
        return <LocalShipping />;
      case 'Delivered':
        return <CheckCircle />;
      case 'Cancelled':
        return <Schedule />;
      default:
        return <Schedule />;
    }
  };

  const getOrderSteps = (status: string) => {
    const steps = [
      { label: 'Order Placed', completed: true },
      { label: 'Confirmed', completed: status !== 'Pending' },
      { label: 'Shipped', completed: ['Shipped', 'Delivered'].includes(status) },
      { label: 'Delivered', completed: status === 'Delivered' },
    ];
    return steps;
  };

  const handleViewOrder = async (order: SalesOrder) => {
    try {
      // Fetch detailed order data including items
      const detailedOrder = await api.getSalesOrder(order.id);
      setSelectedOrder(detailedOrder);
      setOpenDialog(true);
    } catch (err: any) {
      setError('Failed to load order details');
    }
  };

  const handleRefresh = () => {
    loadOrders();
  };

  const columns: GridColDef[] = [
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    { field: 'customerName', headerName: 'Customer', width: 150 },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || ''}
          color={getStatusColor(params.value) as any}
          size="small"
          icon={getStatusIcon(params.value)}
        />
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || ''}
          color={params.value === 'Paid' ? 'success' : 'warning'}
          size="small"
        />
      ),
    },
    { field: 'totalAmount', headerName: 'Total', width: 100, valueFormatter: (params: any) => params?.value ? `$${params.value.toFixed(2)}` : '$0.00' },
    { field: 'orderDate', headerName: 'Order Date', width: 120, valueFormatter: (params: any) => params?.value ? new Date(params.value).toLocaleDateString() : '' },
    { field: 'deliveryDate', headerName: 'Delivery Date', width: 120, valueFormatter: (params: any) => params?.value ? new Date(params.value).toLocaleDateString() : 'TBD' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <Button
          key="view"
          startIcon={<Visibility />}
          onClick={() => handleViewOrder(params.row)}
          size="small"
        >
          View
        </Button>,
      ],
    },
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Orders
        </Typography>
        <Button
          startIcon={<Refresh />}
          onClick={handleRefresh}
          variant="outlined"
        >
          Refresh
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {orders.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <ShoppingCart sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No orders found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your orders will appear here once you place them through the POS system.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box sx={{ height: 400, width: '100%' }}>
          <DataGrid
            rows={orders}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: 10 },
              },
            }}
            pageSizeOptions={[10, 25, 50]}
            disableRowSelectionOnClick
          />
        </Box>
      )}

      {/* Order Details Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box>
              {/* Order Status Stepper */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Progress
                </Typography>
                <Stepper orientation="vertical">
                  {getOrderSteps(selectedOrder.status).map((step, index) => (
                    <Step key={step.label} completed={step.completed}>
                      <StepLabel>{step.label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Order Information */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Order Information
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Customer Name
                    </Typography>
                    <Typography variant="body1">
                      {selectedOrder.customerName}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Order Date
                    </Typography>
                    <Typography variant="body1">
                      {new Date(selectedOrder.orderDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Amount
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      ${selectedOrder.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Payment Status
                    </Typography>
                    <Chip
                      label={selectedOrder.paymentStatus}
                      color={selectedOrder.paymentStatus === 'Paid' ? 'success' : 'warning'}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Order Items */}
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Warehouse</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedOrder.items || selectedOrder.salesItems)?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">${item.totalPrice.toFixed(2)}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrderStatus;
