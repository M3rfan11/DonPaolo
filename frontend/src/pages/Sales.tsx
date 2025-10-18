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
  CardActions,
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
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Visibility, 
  CheckCircle, 
  Cancel, 
  PointOfSale,
  TrendingUp,
  Pending,
  CheckCircleOutline,
  LocalShipping,
  Search,
  AddShoppingCart,
  RemoveShoppingCart
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SalesOrder {
  id: number;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  orderDate: string;
  deliveryDate?: string;
  createdAt: string;
  createdByUserId: number;
  confirmedByUserId?: number;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  notes?: string;
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
  notes?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  description?: string;
  imageUrl?: string;
  availableQuantity?: number;
}

interface Warehouse {
  id: number;
  name: string;
  location?: string;
}

const Sales: React.FC = () => {
  const { user } = useAuth();
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewDialog, setViewDialog] = useState(false);
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<number>(0);
  const [cart, setCart] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    notes: '',
    items: [] as any[],
  });

  // Check if user is managing an online store
  const isOnlineStoreManager = () => {
    if (!user?.assignedStoreId) return false;
    const onlineStore = warehouses.find(w => w.name.toLowerCase().includes('online'));
    return onlineStore && user.assignedStoreId === onlineStore.id;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, productsData, warehousesData, inventoryData] = await Promise.all([
        api.getSalesOrders(),
        api.getProducts(),
        api.getWarehouses(),
        api.getInventory(),
      ]);
      setSalesOrders(ordersData);
      setProducts(productsData);
      setWarehouses(warehousesData);
      setInventory(inventoryData);
    } catch (err: any) {
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = async (order?: SalesOrder) => {
    if (order) {
      try {
        // Fetch detailed order data for editing
        const detailedOrder = await api.getSalesOrder(order.id);
        setEditingOrder(detailedOrder);
        setFormData({
          customerName: detailedOrder.customerName,
          notes: detailedOrder.notes || '',
          items: (detailedOrder.items || detailedOrder.salesItems)?.map((item: SalesItem) => ({
            productId: item.productId,
            warehouseId: item.warehouseId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unit: item.unit,
            notes: item.notes || '',
          })) || [],
        });
      } catch (err: any) {
        setError('Failed to load order details for editing');
        return;
      }
    } else {
      setEditingOrder(null);
      setFormData({
        customerName: '',
        notes: '',
        items: [],
      });
      setCart([]);
    }
    setOpenDialog(true);
  };

  const handleViewOrder = async (order: SalesOrder) => {
    try {
      // Fetch detailed order data including items
      const detailedOrder = await api.getSalesOrder(order.id);
      setViewingOrder(detailedOrder);
      setViewDialog(true);
    } catch (err: any) {
      setError('Failed to load order details');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingOrder(null);
    setCart([]);
  };

  const handleCloseViewDialog = () => {
    setViewDialog(false);
    setViewingOrder(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingOrder) {
        await api.updateSalesOrder(editingOrder.id, formData);
      } else {
        await api.createSalesOrder(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to save sales order');
    }
  };

  const handleConfirm = async (id: number) => {
    try {
      await api.confirmSalesOrder(id, { notes: 'Confirmed by user' });
      await loadData();
    } catch (err: any) {
      setError('Failed to confirm sales order');
    }
  };

  const handleShip = async (id: number) => {
    try {
      await api.shipSalesOrder(id, { notes: 'Shipped by user' });
      await loadData();
    } catch (err: any) {
      setError('Failed to ship sales order');
    }
  };

  const handleDeliver = async (id: number) => {
    try {
      await api.deliverSalesOrder(id, { notes: 'Delivered by user' });
      await loadData();
    } catch (err: any) {
      setError('Failed to deliver sales order');
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this sales order?')) {
      try {
        await api.cancelSalesOrder(id);
        await loadData();
      } catch (err: any) {
        setError('Failed to cancel sales order');
      }
    }
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.productId === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.productId === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: product.id,
        productName: product.name,
        warehouseId: selectedWarehouse,
        quantity: 1,
        unitPrice: product.price,
        unit: product.unit,
        notes: '',
      }]);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(cart.map(item => 
        item.productId === productId 
          ? { ...item, quantity, totalPrice: quantity * item.unitPrice }
          : item
      ));
    }
  };

  const getAvailableProducts = () => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(productSearchTerm.toLowerCase());
      const hasInventory = inventory.some(inv => 
        inv.productId === product.id && 
        inv.warehouseId === selectedWarehouse && 
        inv.quantity > 0
      );
      return matchesSearch && hasInventory;
    });
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending': return <Pending />;
      case 'Confirmed': return <CheckCircleOutline />;
      case 'Shipped': return <LocalShipping />;
      case 'Delivered': return <CheckCircle />;
      case 'Cancelled': return <Cancel />;
      default: return <Pending />;
    }
  };

  const filteredOrders = salesOrders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getTabContent = () => {
    switch (activeTab) {
      case 0:
        return filteredOrders;
      case 1:
        return salesOrders.filter(order => order.status === 'Pending');
      case 2:
        return salesOrders.filter(order => order.status === 'Confirmed');
      case 3:
        return salesOrders.filter(order => order.status === 'Shipped');
      case 4:
        return salesOrders.filter(order => order.status === 'Delivered');
      default:
        return filteredOrders;
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'orderNumber', headerName: 'Order #', width: 120 },
    { field: 'customerName', headerName: 'Customer', width: 200, flex: 1 },
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
              disabled={params.row.status === 'Delivered' || params.row.status === 'Cancelled'}
            >
              <Edit />
            </IconButton>
          </Tooltip>
          {params.row.status === 'Pending' && (
            <Tooltip title="Confirm">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleConfirm(params.row.id)}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'Confirmed' && (
            <Tooltip title="Ship">
              <IconButton
                size="small"
                color="info"
                onClick={() => handleShip(params.row.id)}
              >
                <LocalShipping />
              </IconButton>
            </Tooltip>
          )}
          {params.row.status === 'Shipped' && (
            <Tooltip title="Deliver">
              <IconButton
                size="small"
                color="success"
                onClick={() => handleDeliver(params.row.id)}
              >
                <CheckCircle />
              </IconButton>
            </Tooltip>
          )}
          {(params.row.status === 'Pending' || params.row.status === 'Confirmed') && (
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

  const pendingOrders = salesOrders.filter(order => order.status === 'Pending');
  const confirmedOrders = salesOrders.filter(order => order.status === 'Confirmed');
  const shippedOrders = salesOrders.filter(order => order.status === 'Shipped');
  const deliveredOrders = salesOrders.filter(order => order.status === 'Delivered');
  const totalValue = salesOrders.reduce((sum, order) => sum + order.totalAmount, 0);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {isOnlineStoreManager() ? 'Online Order Status Management' : 'Physical Store Sales Management'}
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  {isOnlineStoreManager() ? 'Online Orders' : 'Total Sales'}
                </Typography>
                <Typography variant="h4">
                  {salesOrders.length}
                </Typography>
              </Box>
              <PointOfSale sx={{ fontSize: 40, color: 'primary.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  {isOnlineStoreManager() ? 'Pending Orders' : 'Pending Sales'}
                </Typography>
                <Typography variant="h4" color="warning.main">
                  {pendingOrders.length}
                </Typography>
              </Box>
              <Pending sx={{ fontSize: 40, color: 'warning.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Delivered Orders
                </Typography>
                <Typography variant="h4" color="success.main">
                  {deliveredOrders.length}
                </Typography>
              </Box>
              <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
        <Card sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Revenue
                </Typography>
                <Typography variant="h4" color="success.main">
                  ${totalValue.toFixed(2)}
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: 'success.main' }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Description Section */}
      <Alert severity="info" sx={{ mb: 3 }}>
        {isOnlineStoreManager() ? (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Online Store Manager - Order Status Management
            </Typography>
            <Typography variant="body2">
              As an Online Store Manager, you can monitor and track online orders placed by customers. 
              You can view order statuses, track delivery progress, and manage customer order fulfillment.
              Orders are created by customers through the online store interface.
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
              Physical Store Manager - Cashier Sales Management
            </Typography>
            <Typography variant="body2">
              As a Physical Store Manager, you can monitor sales transactions made by cashiers in your store. 
              You can view sales data, track performance, and analyze cashier sales patterns.
              Sales are created by cashiers through the POS system.
            </Typography>
          </>
        )}
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <TextField
              label={isOnlineStoreManager() ? "Search online orders..." : "Search sales..."}
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
                <MenuItem value="Confirmed">Confirmed</MenuItem>
                <MenuItem value="Shipped">Shipped</MenuItem>
                <MenuItem value="Delivered">Delivered</MenuItem>
                <MenuItem value="Cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

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
              <Badge badgeContent={confirmedOrders.length} color="info">
                Confirmed
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={shippedOrders.length} color="primary">
                Shipped
              </Badge>
            } 
          />
          <Tab 
            label={
              <Badge badgeContent={deliveredOrders.length} color="success">
                Delivered
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
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          {editingOrder ? 'Edit Sales Order' : 'Create Sales Order'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Customer Name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              margin="normal"
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
            
            {!editingOrder && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Select Products
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <FormControl sx={{ minWidth: 200, mr: 2 }}>
                    <InputLabel>Warehouse</InputLabel>
                    <Select
                      value={selectedWarehouse}
                      onChange={(e) => setSelectedWarehouse(e.target.value as number)}
                      label="Warehouse"
                    >
                      {warehouses.map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Search products..."
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                    sx={{ minWidth: 300 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                {/* Product Cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3, maxHeight: 400, overflow: 'auto' }}>
                  {getAvailableProducts().map((product) => (
                    <Box key={product.id} sx={{ flex: '1 1 300px', minWidth: '300px' }}>
                      <Card sx={{ height: '100%' }}>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            {product.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {product.description}
                          </Typography>
                          <Typography variant="h6" color="primary">
                            ${product.price.toFixed(2)} / {product.unit}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Available: {inventory.find(inv => 
                              inv.productId === product.id && inv.warehouseId === selectedWarehouse
                            )?.quantity || 0} {product.unit}
                          </Typography>
                        </CardContent>
                        <CardActions>
                          <Button
                            size="small"
                            startIcon={<AddShoppingCart />}
                            onClick={() => addToCart(product)}
                            disabled={!inventory.find(inv => 
                              inv.productId === product.id && 
                              inv.warehouseId === selectedWarehouse && 
                              inv.quantity > 0
                            )}
                          >
                            Add to Cart
                          </Button>
                        </CardActions>
                      </Card>
                    </Box>
                  ))}
                </Box>

                {/* Shopping Cart */}
                {cart.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                      Shopping Cart
                    </Typography>
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Product</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Unit Price</TableCell>
                            <TableCell>Total Price</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {cart.map((item) => (
                            <TableRow key={item.productId}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>
                                <TextField
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateCartQuantity(item.productId, parseInt(e.target.value) || 0)}
                                  sx={{ width: 80 }}
                                  inputProps={{ min: 1 }}
                                />
                              </TableCell>
                              <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                              <TableCell>${(item.quantity * item.unitPrice).toFixed(2)}</TableCell>
                              <TableCell>
                                <IconButton onClick={() => removeFromCart(item.productId)} color="error">
                                  <RemoveShoppingCart />
                                </IconButton>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                    <Box sx={{ mt: 2, textAlign: 'right' }}>
                      <Typography variant="h6">
                        Total: ${cart.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={() => {
              setFormData({ ...formData, items: cart });
              handleSubmit();
            }} 
            variant="contained"
            disabled={!editingOrder && cart.length === 0}
          >
            {editingOrder ? 'Update Order' : 'Create Order'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialog} onClose={handleCloseViewDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Sales Order Details - {viewingOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {viewingOrder && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Customer: {viewingOrder.customerName}
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
                    {(viewingOrder?.items || viewingOrder?.salesItems)?.map((item) => (
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

export default Sales;