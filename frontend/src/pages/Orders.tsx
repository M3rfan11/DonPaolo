import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Grid,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Visibility,
  Edit,
  CheckCircle,
  LocalShipping,
  DeliveryDining,
  Cancel,
  Receipt,
  FilterList,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  deliveryDate: string;
  createdAt: string;
  salesItems?: SalesItem[];
  items?: SalesItem[]; // API returns 'items' instead of 'salesItems'
}

interface SalesItem {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
}

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [openActionDialog, setOpenActionDialog] = useState(false);
  const [actionType, setActionType] = useState('');
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const { user } = useAuth();

  const isAdmin = user?.roles?.includes('Admin') || false;

  useEffect(() => {
    loadOrders();
  }, [statusFilter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      let ordersData;
      
      if (statusFilter) {
        ordersData = await api.getSalesOrdersByStatus(statusFilter);
      } else {
        ordersData = await api.getSalesOrders();
      }

      // Filter orders based on user role
      if (!isAdmin) {
        ordersData = ordersData.filter((order: any) => order.createdByUserId === user?.id);
      }

      setOrders(ordersData);
    } catch (err: any) {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleViewOrder = async (order: SalesOrder) => {
    try {
      // Fetch detailed order data including items
      const detailedOrder = await api.getSalesOrder(order.id);
      setSelectedOrder(detailedOrder);
      setOpenDetailDialog(true);
    } catch (err: any) {
      setError('Failed to load order details');
    }
  };

  const handleAction = async (orderId: number, action: string) => {
    setActionType(action);
    setActionNotes('');
    setOpenActionDialog(true);
  };

  const executeAction = async () => {
    if (!selectedOrder) return;

    try {
      setProcessing(true);
      
      switch (actionType) {
        case 'confirm':
          await api.confirmSalesOrder(selectedOrder.id, { notes: actionNotes });
          break;
        case 'ship':
          await api.shipSalesOrder(selectedOrder.id, { notes: actionNotes });
          break;
        case 'deliver':
          await api.deliverSalesOrder(selectedOrder.id, { notes: actionNotes });
          break;
        case 'cancel':
          await api.cancelSalesOrder(selectedOrder.id);
          break;
      }

      setOpenActionDialog(false);
      await loadOrders();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to ${actionType} order`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Confirmed': return 'info';
      case 'Shipped': return 'primary';
      case 'Delivered': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Paid': return 'success';
      case 'Failed': return 'error';
      default: return 'default';
    }
  };

  const canPerformAction = (order: SalesOrder, action: string) => {
    if (!isAdmin) return false;
    
    switch (action) {
      case 'confirm': return order.status === 'Pending';
      case 'ship': return order.status === 'Confirmed';
      case 'deliver': return order.status === 'Shipped';
      case 'cancel': return ['Pending', 'Confirmed', 'Shipped'].includes(order.status);
      default: return false;
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    { field: 'customerName', headerName: 'Customer', width: 150 },
    { field: 'customerEmail', headerName: 'Email', width: 200 },
    { field: 'totalAmount', headerName: 'Total', width: 100, valueFormatter: (params: any) => params?.value ? `$${params.value.toFixed(2)}` : '$0.00' },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || ''}
          color={getStatusColor(params.value) as any}
          size="small"
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
          color={getPaymentStatusColor(params.value) as any}
          size="small"
        />
      ),
    },
    { field: 'orderDate', headerName: 'Order Date', width: 120, valueFormatter: (params: any) => params?.value ? new Date(params.value).toLocaleDateString() : '' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 200,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<Visibility />}
            label="View"
            onClick={() => handleViewOrder(params.row)}
          />,
        ];

        if (isAdmin) {
          if (canPerformAction(params.row, 'confirm')) {
            actions.push(
              <GridActionsCellItem
                key="confirm"
                icon={<CheckCircle />}
                label="Confirm"
                onClick={() => handleAction(params.row.id, 'confirm')}
              />
            );
          }
          if (canPerformAction(params.row, 'ship')) {
            actions.push(
              <GridActionsCellItem
                key="ship"
                icon={<LocalShipping />}
                label="Ship"
                onClick={() => handleAction(params.row.id, 'ship')}
              />
            );
          }
          if (canPerformAction(params.row, 'deliver')) {
            actions.push(
              <GridActionsCellItem
                key="deliver"
                icon={<DeliveryDining />}
                label="Deliver"
                onClick={() => handleAction(params.row.id, 'deliver')}
              />
            );
          }
          if (canPerformAction(params.row, 'cancel')) {
            actions.push(
              <GridActionsCellItem
                key="cancel"
                icon={<Cancel />}
                label="Cancel"
                onClick={() => handleAction(params.row.id, 'cancel')}
              />
            );
          }
        }

        return actions;
      },
    },
  ];

  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Sales Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Status Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }} key={status}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  {status} Orders
                </Typography>
                <Typography variant="h4" color="primary">
                  {count}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FilterList />
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Filter by Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              label="Filter by Status"
            >
              <MenuItem value="">All Orders</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Confirmed">Confirmed</MenuItem>
              <MenuItem value="Shipped">Shipped</MenuItem>
              <MenuItem value="Delivered">Delivered</MenuItem>
              <MenuItem value="Cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
          <Button variant="outlined" onClick={loadOrders}>
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* Orders Table */}
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

      {/* Order Detail Dialog */}
      <Dialog open={openDetailDialog} onClose={() => setOpenDetailDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Order Details - {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Typography variant="h6" gutterBottom>Customer Information</Typography>
                  <Typography><strong>Name:</strong> {selectedOrder.customerName}</Typography>
                  <Typography><strong>Email:</strong> {selectedOrder.customerEmail}</Typography>
                  <Typography><strong>Phone:</strong> {selectedOrder.customerPhone}</Typography>
                </Box>
                <Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                  <Typography variant="h6" gutterBottom>Order Information</Typography>
                  <Typography><strong>Order Date:</strong> {new Date(selectedOrder.orderDate).toLocaleDateString()}</Typography>
                  <Typography><strong>Delivery Date:</strong> {selectedOrder.deliveryDate ? new Date(selectedOrder.deliveryDate).toLocaleDateString() : 'Not set'}</Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip label={selectedOrder.status} color={getStatusColor(selectedOrder.status) as any} size="small" sx={{ ml: 1 }} />
                  </Typography>
                  <Typography><strong>Payment:</strong> 
                    <Chip label={selectedOrder.paymentStatus} color={getPaymentStatusColor(selectedOrder.paymentStatus) as any} size="small" sx={{ ml: 1 }} />
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>Order Items</Typography>
              {(selectedOrder.items || selectedOrder.salesItems)?.map((item) => (
                <Paper key={item.id} sx={{ p: 2, mb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body1" fontWeight="medium">
                        {item.productName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.warehouseName} • SKU: {item.productId}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body1">
                        {item.quantity} {item.unit} × ${item.unitPrice.toFixed(2)}
                      </Typography>
                      <Typography variant="h6" color="primary">
                        ${item.totalPrice.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )) || (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  No items found
                </Typography>
              )}

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h5">Total Amount:</Typography>
                <Typography variant="h5" color="primary">
                  ${selectedOrder.totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={openActionDialog} onClose={() => setOpenActionDialog(false)}>
        <DialogTitle>
          {actionType === 'confirm' && 'Confirm Order'}
          {actionType === 'ship' && 'Ship Order'}
          {actionType === 'deliver' && 'Deliver Order'}
          {actionType === 'cancel' && 'Cancel Order'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={actionNotes}
            onChange={(e) => setActionNotes(e.target.value)}
            margin="normal"
            placeholder="Add any notes for this action..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenActionDialog(false)}>Cancel</Button>
          <Button onClick={executeAction} variant="contained" disabled={processing}>
            {processing ? <CircularProgress size={20} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Orders;
