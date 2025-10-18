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
  Container,
  Paper,
  Fade,
  Grow,
  Avatar,
  IconButton,
} from '@mui/material';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { 
  Edit, 
  Warning, 
  CheckCircle, 
  Inventory as InventoryIcon,
  Refresh,
  Star,
  Add,
  TrendingUp,
  Store,
} from '@mui/icons-material';
import api from '../services/api';

interface InventoryItem {
  id: number;
  productId: number;
  productName: string;
  warehouseId: number;
  warehouseName: string;
  quantity: number;
  unit: string;
  minimumStockLevel: number | null;
  updatedAt: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
}

interface Warehouse {
  id: number;
  name: string;
}

const Inventory: React.FC = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [setDefaultDialog, setSetDefaultDialog] = useState(false);
  const [defaultMinLevel, setDefaultMinLevel] = useState(10);
  const [formData, setFormData] = useState({
    productId: 0,
    warehouseId: 0,
    quantity: 0,
    minimumStockLevel: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [inventoryData, productsData, warehousesData] = await Promise.all([
        api.getInventory(),
        api.getProducts(),
        api.getWarehouses(),
      ]);
      setInventory(inventoryData);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        productId: item.productId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        minimumStockLevel: item.minimumStockLevel ?? 0,
      });
    } else {
      setEditingItem(null);
      setFormData({
        productId: 0,
        warehouseId: 0,
        quantity: 0,
        minimumStockLevel: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingItem) {
        await api.updateInventory(editingItem.id, formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to update inventory');
    }
  };

  const handleSetDefaultMinLevels = async () => {
    try {
      await api.setDefaultMinimumLevels(defaultMinLevel);
      await loadData();
      setSetDefaultDialog(false);
    } catch (err: any) {
      setError('Failed to set default minimum levels');
    }
  };

  const getStockStatus = (quantity: number, minimumLevel: number | null) => {
    if (quantity <= 0) return { status: 'Out of Stock', color: 'error' as const };
    if (minimumLevel && quantity <= minimumLevel) return { status: 'Low Stock', color: 'warning' as const };
    return { status: 'In Stock', color: 'success' as const };
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'productName', headerName: 'Product', width: 200 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 150 },
    { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
    { field: 'unit', headerName: 'Unit', width: 100 },
    { field: 'minimumStockLevel', headerName: 'Min Level', width: 100, type: 'number' },
    {
      field: 'stockStatus',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const status = getStockStatus(params.row.quantity, params.row.minimumStockLevel);
        return (
          <Chip
            label={status.status}
            color={status.color}
            size="small"
            icon={status.color === 'success' ? <CheckCircle /> : <Warning />}
          />
        );
      },
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <Button
          size="small"
          startIcon={<Edit />}
          onClick={() => handleOpenDialog(params.row)}
        >
          Edit
        </Button>,
      ],
    },
  ];

  const lowStockItems = inventory.filter(item => 
    item.minimumStockLevel && item.quantity <= item.minimumStockLevel && item.quantity > 0
  );
  const outOfStockItems = inventory.filter(item => item.quantity <= 0);
  const totalValue = inventory.reduce((sum, item) => {
    const product = products.find(p => p.id === item.productId);
    return sum + (item.quantity * (product?.price || 0));
  }, 0);

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
                  <InventoryIcon sx={{ fontSize: 32 }} />
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
                    Inventory Management
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Monitor and manage stock levels across all warehouses
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
                  onClick={() => setSetDefaultDialog(true)}
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
                  Set Default Min Levels
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

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {/* Enhanced Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          {[
            { 
              title: 'Total Items', 
              value: inventory.length, 
              icon: <InventoryIcon />, 
              color: '#667eea',
              gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            },
            { 
              title: 'Low Stock Items', 
              value: lowStockItems.length, 
              icon: <Warning />, 
              color: '#ff9800',
              gradient: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
            },
            { 
              title: 'Out of Stock', 
              value: outOfStockItems.length, 
              icon: <CheckCircle />, 
              color: '#f44336',
              gradient: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)'
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

        {/* Enhanced Data Grid */}
        <Paper sx={{ 
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={inventory}
              columns={columns}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 10 },
                },
              }}
              pageSizeOptions={[10, 25, 50]}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid rgba(0,0,0,0.1)',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: 'rgba(102, 126, 234, 0.1)',
                  borderBottom: '2px solid rgba(102, 126, 234, 0.2)',
                },
              }}
            />
          </Box>
        </Paper>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Update Inventory
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal" disabled>
              <InputLabel>Product</InputLabel>
              <Select
                value={formData.productId}
                label="Product"
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" disabled>
              <InputLabel>Warehouse</InputLabel>
              <Select
                value={formData.warehouseId}
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
              fullWidth
              label="Quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Minimum Stock Level"
              type="number"
              value={formData.minimumStockLevel}
              onChange={(e) => setFormData({ ...formData, minimumStockLevel: parseFloat(e.target.value) })}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Default Minimum Levels Dialog */}
      <Dialog open={setDefaultDialog} onClose={() => setSetDefaultDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Set Default Minimum Stock Levels
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              This will set the minimum stock level to {defaultMinLevel} for all products that currently don't have a minimum level set.
            </Alert>
            <TextField
              fullWidth
              label="Default Minimum Stock Level"
              type="number"
              value={defaultMinLevel}
              onChange={(e) => setDefaultMinLevel(parseFloat(e.target.value))}
              margin="normal"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSetDefaultDialog(false)}>Cancel</Button>
          <Button onClick={handleSetDefaultMinLevels} variant="contained" color="warning">
            Set Default Levels
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Inventory;
