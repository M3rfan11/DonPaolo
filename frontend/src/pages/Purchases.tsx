import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Typography,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Container,
  Fade,
  Grow,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  Visibility, 
  CheckCircle, 
  Cancel, 
  ShoppingCart,
  TrendingUp,
  Pending,
  CheckCircleOutline,
  LocalShipping,
  Refresh,
  Star,
  Store,
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierName: string;
  supplierAddress?: string;
  supplierPhone?: string;
  supplierEmail?: string;
  expectedDeliveryDate?: string;
  totalAmount: number;
  status: string;
  orderDate: string;
  createdAt: string;
  createdByUserId: number;
  approvedByUserId?: number;
  approvedAt?: string;
  receivedAt?: string;
  notes?: string;
  items?: PurchaseItem[];
}

interface PurchaseItem {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
}

interface Warehouse {
  id: number;
  name: string;
}

const Purchases: React.FC = () => {
  const { user } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<PurchaseOrder | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierAddress: '',
    supplierPhone: '',
    supplierEmail: '',
    expectedDeliveryDate: '',
    notes: '',
    items: [] as any[],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Auto-set warehouse for Store Managers when warehouses are loaded
  useEffect(() => {
    console.log('useEffect triggered with:', {
      userRoles: user?.roles,
      assignedStoreId: user?.assignedStoreId,
      warehousesCount: warehouses.length,
      warehouses: warehouses.map(w => ({ id: w.id, name: w.name }))
    });
    
    if (user?.roles.includes('StoreManager') && user?.assignedStoreId && warehouses.length > 0) {
      console.log('Auto-setting warehouse for Store Manager:', user.assignedStoreId);
      console.log('Available warehouses:', warehouses);
      
      // Find the assigned store in the warehouses list
      const assignedStore = warehouses.find(w => w.id === user.assignedStoreId);
      console.log('Found assigned store:', assignedStore);
      
      if (!assignedStore) {
        console.error('Assigned store not found in warehouses list!', {
          assignedStoreId: user.assignedStoreId,
          availableWarehouses: warehouses.map(w => ({ id: w.id, name: w.name }))
        });
        return;
      }
      
      // Update any existing items that don't have a warehouse set
      setFormData(prev => {
        const updatedItems = prev.items.map(item => {
          if (!item.warehouseId || item.warehouseId === 0) {
            console.log('Setting warehouse for item:', item, 'to:', user.assignedStoreId);
            return { ...item, warehouseId: user.assignedStoreId };
          }
          return item;
        });
        
        console.log('Updated items:', updatedItems);
        return { ...prev, items: updatedItems };
      });
    }
  }, [warehouses, user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData, warehousesData] = await Promise.all([
        api.getPurchaseOrders(),
        api.getProducts(),
        api.getWarehouses(),
      ]);
      setPurchaseOrders(ordersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  // Get available warehouses based on user role
  const getAvailableWarehouses = () => {
    if (!user) return [];
    
    console.log('getAvailableWarehouses called with:', {
      userRoles: user.roles,
      assignedStoreId: user.assignedStoreId,
      warehousesCount: warehouses.length,
      warehouses: warehouses
    });
    
    if (user.roles.includes('SuperAdmin')) {
      // SuperAdmin can see all warehouses
      console.log('SuperAdmin - returning all warehouses:', warehouses);
      return warehouses;
    } else if (user.roles.includes('StoreManager') && user.assignedStoreId) {
      // StoreManager can only see their assigned store
      const filteredWarehouses = warehouses.filter(w => w.id === user.assignedStoreId);
      console.log('StoreManager - filtered warehouses:', filteredWarehouses);
      return filteredWarehouses;
    }
    
    console.log('No matching role - returning empty array');
    return [];
  };

  const handleOpenDialog = (order?: PurchaseOrder) => {
    if (order) {
      setEditingOrder(order);
      setFormData({
        supplierName: order.supplierName,
        supplierAddress: order.supplierAddress || '',
        supplierPhone: order.supplierPhone || '',
        supplierEmail: order.supplierEmail || '',
        expectedDeliveryDate: order.expectedDeliveryDate || '',
        notes: order.notes || '',
        items: (order.items || []).map(item => ({
          productId: item.productId,
          warehouseId: item.warehouseId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          unit: item.unit,
          notes: item.notes || '',
        })),
      });
    } else {
      setEditingOrder(null);
      setFormData({
        supplierName: '',
        supplierAddress: '',
        supplierPhone: '',
        supplierEmail: '',
        expectedDeliveryDate: '',
        notes: '',
        items: [],
      });
    }
    setOpenDialog(true);
  };

  const handleViewOrder = async (order: PurchaseOrder) => {
    try {
      // Load full order details with items
      const fullOrder = await api.getPurchaseOrder(order.id);
      setViewingOrder(fullOrder);
      setViewDialog(true);
    } catch (err: any) {
      setError('Failed to load order details');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setViewingOrder(null);
  };

  const handleSubmit = async () => {
    try {
      console.log('Submitting purchase order:', formData);
      
      // Validate form data
      if (!formData.supplierName.trim()) {
        setError('Supplier name is required');
        return;
      }
      
      if (!formData.expectedDeliveryDate) {
        setError('Expected delivery date is required');
        return;
      }
      
      if (formData.items.length === 0) {
        setError('At least one item is required');
        return;
      }
      
      // Validate items
      for (let i = 0; i < formData.items.length; i++) {
        const item = formData.items[i];
        console.log(`Validating item ${i + 1}:`, item);
        
        // Convert to numbers for validation
        const productId = Number(item.productId);
        const warehouseId = Number(item.warehouseId);
        const quantity = Number(item.quantity);
        const unitPrice = Number(item.unitPrice);
        
        console.log(`Item ${i + 1} converted values:`, {
          productId,
          warehouseId,
          quantity,
          unitPrice,
          unit: item.unit,
          originalProductId: item.productId,
          originalWarehouseId: item.warehouseId
        });
        
        // More lenient validation - check if values are valid numbers
        const isValidProductId = productId && productId > 0;
        const isValidWarehouseId = warehouseId && warehouseId > 0;
        const isValidQuantity = quantity && quantity > 0;
        const isValidUnitPrice = unitPrice && unitPrice > 0;
        const isValidUnit = item.unit && item.unit.trim() !== '';
        
        console.log(`Item ${i + 1} validation checks:`, {
          isValidProductId,
          isValidWarehouseId,
          isValidQuantity,
          isValidUnitPrice,
          isValidUnit
        });
        
        if (!isValidProductId || !isValidWarehouseId || !isValidQuantity || !isValidUnitPrice || !isValidUnit) {
          setError(`Item ${i + 1} is missing required information. Please check: Product, Warehouse, Quantity (>0), Unit Price (>0), and Unit.`);
          return;
        }
      }
      
      // Prepare data for API with correct types
      const apiData = {
        supplierName: formData.supplierName,
        supplierAddress: formData.supplierAddress || '',
        supplierPhone: formData.supplierPhone || '',
        supplierEmail: formData.supplierEmail || '',
        expectedDeliveryDate: formData.expectedDeliveryDate,
        notes: formData.notes || '',
        items: formData.items.map(item => ({
          productId: Number(item.productId),
          warehouseId: Number(item.warehouseId),
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          unit: item.unit || '',
          notes: item.notes || ''
        }))
      };
      
      console.log('Sending to API:', apiData);
      
      if (editingOrder) {
        await api.updatePurchaseOrder(editingOrder.id, apiData);
      } else {
        const result = await api.createPurchaseOrder(apiData);
        console.log('Purchase order created successfully:', result);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      console.error('Error creating purchase order:', err);
      console.error('Error response:', err.response?.data);
      setError(`Failed to save purchase order: ${err.response?.data?.message || err.message || 'Unknown error'}`);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.approvePurchaseOrder(id, { notes: 'Approved by user' });
      await loadData();
    } catch (err: any) {
      setError('Failed to approve purchase order');
    }
  };

  const handleReceive = async (id: number) => {
    try {
      await api.receivePurchaseOrder(id, { notes: 'Received by user' });
      await loadData();
    } catch (err: any) {
      setError('Failed to receive purchase order');
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this purchase order?')) {
      try {
        await api.cancelPurchaseOrder(id);
        await loadData();
      } catch (err: any) {
        setError('Failed to cancel purchase order');
      }
    }
  };

  const addItem = () => {
    // Auto-set warehouse for Store Managers
    const defaultWarehouseId = user?.roles.includes('StoreManager') && user?.assignedStoreId 
      ? user.assignedStoreId 
      : 0;
    
    console.log('Adding new item with warehouse:', defaultWarehouseId);
    console.log('User role:', user?.roles);
    console.log('User assigned store:', user?.assignedStoreId);
    
    setFormData({
      ...formData,
      items: [...formData.items, {
        productId: 0,
        warehouseId: defaultWarehouseId,
        quantity: 0,
        unitPrice: 0,
        unit: 'pieces', // Default unit
        notes: '',
      }],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total price
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }
    
    setFormData({ ...formData, items: newItems });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'info';
      case 'Received': return 'success';
      case 'Cancelled': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Pending />;
      case 'Approved': return <CheckCircleOutline />;
      case 'Received': return <CheckCircle />;
      case 'Cancelled': return <Cancel />;
      default: return <Pending />;
    }
  };

  const filteredOrders = purchaseOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTabContent = () => {
    switch (activeTab) {
      case 0:
        return filteredOrders;
      case 1:
        return purchaseOrders.filter(order => order.status === 'Pending');
      case 2:
        return purchaseOrders.filter(order => order.status === 'Approved');
      case 3:
        return purchaseOrders.filter(order => order.status === 'Received');
      default:
        return filteredOrders;
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    { field: 'supplierName', headerName: 'Supplier', width: 200, flex: 1 },
    { 
      field: 'totalAmount', 
      headerName: 'Total Amount', 
      width: 120, 
      type: 'number',
      renderCell: (params) => params.value ? `$${params.value.toFixed(2)}` : '$0.00'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value || ''}
          color={getStatusColor(params.value) as any}
          size="small"
          icon={params.value ? getStatusIcon(params.value) : undefined}
        />
      ),
    },
    { 
      field: 'orderDate', 
      headerName: 'Order Date', 
      width: 120,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : ''
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Details">
            <IconButton
              size="small"
              onClick={() => handleViewOrder(params.row)}
            >
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => handleOpenDialog(params.row)}
              disabled={params.row.status === 'Received' || params.row.status === 'Cancelled'}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          {params.row.status === 'Pending' && (
            <Tooltip title="Approve">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleApprove(params.row.id)}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'Approved' && (
            <Tooltip title="Receive">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleReceive(params.row.id)}
              >
                <LocalShipping />
              </IconButton>
            </Tooltip>
          )}
          {(params.row.status === 'Pending' || params.row.status === 'Approved') && (
            <Tooltip title="Cancel">
              <IconButton
                size="small"
                color="error"
                onClick={() => handleCancel(params.row.id)}
              >
                <Cancel />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },
  ];

  const pendingOrders = purchaseOrders.filter(order => order.status === 'Pending');
  const approvedOrders = purchaseOrders.filter(order => order.status === 'Approved');
  const receivedOrders = purchaseOrders.filter(order => order.status === 'Received');
  const totalValue = purchaseOrders.reduce((sum, order) => sum + order.totalAmount, 0);

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
                  <ShoppingCart sx={{ fontSize: 32 }} />
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
                    Purchase Orders Management
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Manage supplier orders and procurement processes
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={loadData}
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                  }}
                >
                  <Refresh />
                </IconButton>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => handleOpenDialog()}
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    '&:hover': {
                      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Create Purchase Order
                </Button>
                <Chip 
                  icon={<Star sx={{ color: '#ffd700' }} />} 
                  label="Heritage" 
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

        {/* Enhanced Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {[
            { 
              title: 'Total Orders', 
              value: purchaseOrders.length, 
              icon: <ShoppingCart />, 
              color: '#667eea',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            { 
              title: 'Pending Orders', 
              value: pendingOrders.length, 
              icon: <Pending />, 
              color: '#ff9800',
              gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
            },
            { 
              title: 'Approved Orders', 
              value: approvedOrders.length, 
              icon: <CheckCircleOutline />, 
              color: '#2196f3',
              gradient: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
            },
            { 
              title: 'Total Value', 
              value: `$${totalValue.toFixed(2)}`, 
              icon: <TrendingUp />, 
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

        {/* Enhanced Filters */}
        <Paper sx={{ 
          mb: 4, 
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                sx={{ flex: '1 1 300px', minWidth: '200px' }}
              />
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  label="Status"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Approved">Approved</MenuItem>
                  <MenuItem value="Received">Received</MenuItem>
                  <MenuItem value="Cancelled">Cancelled</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </CardContent>
        </Paper>
      </Container>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab 
            label={
              <Badge badgeContent={filteredOrders.length} color="primary">
                All Orders
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={pendingOrders.length} color="warning">
                Pending
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={approvedOrders.length} color="info">
                Approved
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={receivedOrders.length} color="success">
                Received
              </Badge>
            } 
          />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={getTabContent()}
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

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Supplier Name"
              value={formData.supplierName}
              onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Supplier Address"
              value={formData.supplierAddress}
              onChange={(e) => setFormData({ ...formData, supplierAddress: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Supplier Phone"
              value={formData.supplierPhone}
              onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Supplier Email"
              value={formData.supplierEmail}
              onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })}
              margin="normal"
              type="email"
            />
            <TextField
              fullWidth
              label="Expected Delivery Date"
              value={formData.expectedDeliveryDate}
              onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              margin="normal"
              type="date"
              InputLabelProps={{ shrink: true }}
              required
            />
            <TextField
              fullWidth
              label="Notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            
            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Order Items</Typography>
                <Button variant="outlined" onClick={addItem}>
                  Add Item
                </Button>
              </Box>
              
              {/* Role-based information */}
              {user?.roles.includes('StoreManager') && user?.assignedStoreId && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  As a Store Manager, purchase orders will automatically be created for your assigned store: <strong>{getAvailableWarehouses().find(w => w.id === user.assignedStoreId)?.name}</strong>
                </Alert>
              )}
              
              {formData.items.map((item, index) => (
                <Card key={index} sx={{ mb: 2, p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 200 }}>
                      <InputLabel>Product</InputLabel>
                      <Select
                        value={item.productId}
                        onChange={(e) => updateItem(index, 'productId', e.target.value)}
                        label="Product"
                      >
                        {products.map((product) => (
                          <MenuItem key={product.id} value={product.id}>
                            {product.name} ({product.unit})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl sx={{ minWidth: 150 }}>
                      <InputLabel>Warehouse</InputLabel>
                      <Select
                        value={item.warehouseId || ''}
                        onChange={(e) => updateItem(index, 'warehouseId', e.target.value)}
                        label="Warehouse"
                        disabled={user?.roles.includes('StoreManager') && !!user?.assignedStoreId}
                        sx={{
                          backgroundColor: user?.roles.includes('StoreManager') && !!user?.assignedStoreId 
                            ? 'rgba(0, 0, 0, 0.04)' 
                            : 'transparent'
                        }}
                      >
                        {getAvailableWarehouses().map((warehouse) => (
                          <MenuItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                      sx={{ width: 100 }}
                    />
                    <TextField
                      label="Unit Price"
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      sx={{ width: 120 }}
                    />
                    <TextField
                      label="Unit"
                      value={item.unit}
                      onChange={(e) => updateItem(index, 'unit', e.target.value)}
                      placeholder="e.g., pieces, kg, liters"
                      sx={{ width: 120 }}
                      required
                    />
                    <TextField
                      label="Total Price"
                      type="number"
                      value={item.totalPrice}
                      disabled
                      sx={{ width: 120 }}
                    />
                    <IconButton onClick={() => removeItem(index)} color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Card>
              ))}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Purchase Order Details - {viewingOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {viewingOrder && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Supplier: {viewingOrder.supplierName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount: ${viewingOrder.totalAmount.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={viewingOrder.status} color={getStatusColor(viewingOrder.status) as any} size="small" />
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Order Date: {new Date(viewingOrder.orderDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Unit Price</TableCell>
                      <TableCell>Total Price</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewingOrder.items?.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.warehouseName}</TableCell>
                        <TableCell>{item.quantity} {item.unit}</TableCell>
                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No items found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Purchases;