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
  Table,
  FormControlLabel,
  Switch,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Tabs,
  Tab,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Visibility, 
  CheckCircle, 
  Cancel, 
  Build, 
  PlayArrow, 
  Stop,
  ExpandMore,
  Delete
} from '@mui/icons-material';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import AssemblyOfferCreator from '../components/AssemblyOfferCreator';
import OfferSuggestions from '../components/OfferSuggestions';

interface BillOfMaterial {
  id: number;
  rawProductId: number;
  rawProductName: string;
  warehouseId: number;
  warehouseName: string;
  requiredQuantity: number;
  availableQuantity: number;
  unit: string;
  notes?: string;
}

interface ProductAssembly {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  instructions?: string;
  status: string; // Pending, InProgress, Completed, Cancelled
  notes?: string;
  createdByUserId: number;
  createdByUserName: string;
  completedByUserId?: number;
  completedByUserName?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  salePrice?: number; // Price when sold as assembly
  isActive?: boolean; // Whether this assembly is active for POS
  billOfMaterials: BillOfMaterial[];
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  sku: string;
  categoryName: string;
}

interface ProductInventory {
  id: number;
  productId: number;
  warehouseId: number;
  quantity: number;
  unit: string;
}

interface Warehouse {
  id: number;
  name: string;
}

const Assembly: React.FC = () => {
  const { user } = useAuth();
  const [assemblies, setAssemblies] = useState<ProductAssembly[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventory, setInventory] = useState<ProductInventory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewingAssembly, setViewingAssembly] = useState<ProductAssembly | null>(null);
  const [editingAssembly, setEditingAssembly] = useState<ProductAssembly | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    quantity: 1,
    unit: '',
    instructions: '',
    notes: '',
    salePrice: 0,
    isActive: true,
    billOfMaterials: [] as { rawProductId: number; warehouseId: number; requiredQuantity: number; unit: string; notes?: string }[],
  });

  useEffect(() => {
    loadData();
  }, []);

  // Get available warehouses based on user role
  const getAvailableWarehouses = () => {
    if (!user) return [];
    
    if (user.roles.includes('SuperAdmin')) {
      // SuperAdmin can see all warehouses
      return warehouses;
    } else if (user.roles.includes('StoreManager') && user.assignedStoreId) {
      // StoreManager can only see their assigned store
      return warehouses.filter(w => w.id === user.assignedStoreId);
    }
    
    return [];
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [assembliesData, productsData, inventoryData, warehousesData] = await Promise.all([
        api.getProductAssemblies(),
        api.getProducts(),
        api.getInventory(),
        api.getWarehouses(), // Use the correct warehouses endpoint
      ]);
      setAssemblies(assembliesData || []);
      setProducts(productsData || []);
      setInventory(inventoryData || []);
      setWarehouses(warehousesData || []);
    } catch (err: any) {
      console.error('Error loading assembly data:', err);
      setError('Failed to load assembly data. Please check if the backend is running.');
      // Set empty arrays as fallback
      setAssemblies([]);
      setProducts([]);
      setInventory([]);
      setWarehouses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingAssembly(null);
    setViewingAssembly(null);
    setFormData({
      name: '',
      description: '',
      quantity: 1,
      unit: '',
      instructions: '',
      notes: '',
      salePrice: 0,
      isActive: true,
      billOfMaterials: [{ rawProductId: 0, warehouseId: 0, requiredQuantity: 0, unit: '' }],
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (assembly: ProductAssembly) => {
    setEditingAssembly(assembly);
    setViewingAssembly(null);
    setFormData({
      name: assembly.name,
      description: assembly.description || '',
      quantity: assembly.quantity,
      unit: assembly.unit || '',
      instructions: assembly.instructions || '',
      notes: assembly.notes || '',
      salePrice: assembly.salePrice || 0,
      isActive: assembly.isActive ?? true,
      billOfMaterials: (assembly.billOfMaterials || []).map(material => ({
        rawProductId: material.rawProductId,
        warehouseId: material.warehouseId,
        requiredQuantity: material.requiredQuantity,
        unit: material.unit,
        notes: material.notes,
      })),
    });
    setOpenDialog(true);
  };

  const handleViewAssembly = async (assembly: ProductAssembly) => {
    try {
      setLoading(true);
      // Fetch complete assembly details including Bill of Materials
      const fullAssembly = await api.getProductAssembly(assembly.id);
      setViewingAssembly(fullAssembly);
      setEditingAssembly(null);
      setOpenDialog(true);
    } catch (err: any) {
      console.error('Error loading assembly details:', err);
      setError('Failed to load assembly details.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewingAssembly(null);
    setEditingAssembly(null);
    setError('');
  };

  const handleMaterialChange = (index: number, field: string, value: any) => {
    const newMaterials = [...formData.billOfMaterials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setFormData({ ...formData, billOfMaterials: newMaterials });
  };

  const handleAddMaterial = () => {
    const availableWarehouses = getAvailableWarehouses();
    const defaultWarehouseId = availableWarehouses.length === 1 ? availableWarehouses[0].id : 0;
    
    setFormData({
      ...formData,
      billOfMaterials: [...formData.billOfMaterials, { 
        rawProductId: 0, 
        warehouseId: defaultWarehouseId, 
        requiredQuantity: 0, 
        unit: '' 
      }],
    });
  };

  const handleRemoveMaterial = (index: number) => {
    const newMaterials = formData.billOfMaterials.filter((_, i) => i !== index);
    setFormData({ ...formData, billOfMaterials: newMaterials });
  };

  const handleSubmit = async () => {
    try {
      if (editingAssembly) {
        await api.updateProductAssembly(editingAssembly.id, formData);
      } else {
        await api.createProductAssembly(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product assembly');
    }
  };

  const handleValidate = async (id: number) => {
    try {
      const result = await api.validateProductAssembly(id);
      if (result.canStart) {
        alert('Assembly validation successful! All materials are available.');
      } else {
        alert(`Assembly validation failed: ${result.message}`);
      }
      await loadData();
    } catch (err: any) {
      setError('Failed to validate assembly');
    }
  };

  const handleStart = async (id: number) => {
    if (window.confirm('Are you sure you want to start this assembly?')) {
      try {
        await api.startProductAssembly(id, { startedByUserId: 1 }); // Assuming user 1 is the starter
        await loadData();
      } catch (err: any) {
        setError('Failed to start assembly');
      }
    }
  };

  const handleComplete = async (id: number) => {
    if (window.confirm('Are you sure you want to complete this assembly? This will update inventory.')) {
      try {
        await api.completeProductAssembly(id, { completedByUserId: 1 }); // Assuming user 1 is the completer
        await loadData();
      } catch (err: any) {
        setError('Failed to complete assembly');
      }
    }
  };

  const handleCancel = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this assembly?')) {
      try {
        await api.cancelProductAssembly(id);
        await loadData();
      } catch (err: any) {
        setError('Failed to cancel assembly');
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success';
      case 'InProgress':
        return 'info';
      case 'Pending':
        return 'warning';
      case 'Cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getAvailableQuantity = (productId: number, warehouseId: number) => {
    const item = inventory.find(inv => inv.productId === productId && inv.warehouseId === warehouseId);
    return item ? item.quantity : 0;
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Assembly Name', width: 200 },
    { field: 'quantity', headerName: 'Quantity', width: 100, type: 'number' },
    { field: 'unit', headerName: 'Unit', width: 100 },
    {
      field: 'salePrice',
      headerName: 'Sale Price',
      width: 120,
      type: 'number',
      renderCell: (params) => (
        params.value ? `$${params.value.toFixed(2)}` : '-'
      ),
    },
    {
      field: 'isActive',
      headerName: 'POS Active',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Yes' : 'No'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
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
        />
      ),
    },
    { field: 'createdByUserName', headerName: 'Created By', width: 150 },
    { field: 'createdAt', headerName: 'Created', width: 130, valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 250,
      getActions: (params) => {
        const actions = [
          <GridActionsCellItem
            key="view"
            icon={<Visibility />}
            label="View"
            onClick={() => handleViewAssembly(params.row)}
            showInMenu
          />,
        ];

        if (params.row.status === 'Pending') {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<Edit />}
              label="Edit"
              onClick={() => handleOpenEditDialog(params.row)}
              showInMenu
            />,
            <GridActionsCellItem
              key="validate"
              icon={<CheckCircle />}
              label="Validate"
              onClick={() => handleValidate(params.row.id)}
              showInMenu
            />,
            <GridActionsCellItem
              key="start"
              icon={<PlayArrow />}
              label="Start"
              onClick={() => handleStart(params.row.id)}
              showInMenu
            />
          );
        }

        if (params.row.status === 'InProgress') {
          actions.push(
            <GridActionsCellItem
              key="complete"
              icon={<CheckCircle />}
              label="Complete"
              onClick={() => handleComplete(params.row.id)}
              showInMenu
            />
          );
        }

        if (params.row.status === 'Pending' || params.row.status === 'InProgress') {
          actions.push(
            <GridActionsCellItem
              key="cancel"
              icon={<Cancel />}
              label="Cancel"
              onClick={() => handleCancel(params.row.id)}
              showInMenu
            />
          );
        }

        return actions;
      },
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <h1>Product Assembly (BOM)</h1>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Create Assembly
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
          <Tab label="Assembly Management" />
          <Tab label="Smart Offer Suggestions" />
        </Tabs>
      </Box>

      {activeTab === 0 && (
        <>
          <Box sx={{ mb: 4 }}>
            <AssemblyOfferCreator />
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={assemblies}
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
        </>
      )}

      {activeTab === 1 && (
        <OfferSuggestions />
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {viewingAssembly ? `Assembly Details - ${viewingAssembly.name}` : 
           editingAssembly ? `Edit Assembly - ${editingAssembly.name}` : 'Create New Assembly'}
        </DialogTitle>
        <DialogContent>
          {viewingAssembly && (
            <Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={viewingAssembly.status} color={getStatusColor(viewingAssembly.status) as any} size="small" />
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {viewingAssembly.quantity} {viewingAssembly.unit}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Created By: {viewingAssembly.createdByUserName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Created: {new Date(viewingAssembly.createdAt).toLocaleDateString()}
                  </Typography>
                </Box>
                {viewingAssembly.salePrice && (
                  <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                    <Typography variant="body2" color="text.secondary">
                      Sale Price: ${viewingAssembly.salePrice.toFixed(2)}
                    </Typography>
                  </Box>
                )}
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    POS Active: <Chip label={viewingAssembly.isActive ? 'Yes' : 'No'} color={viewingAssembly.isActive ? 'success' : 'default'} size="small" />
                  </Typography>
                </Box>
              </Box>

              {viewingAssembly.description && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Description</Typography>
                  <Typography variant="body2">{viewingAssembly.description}</Typography>
                </Box>
              )}

              {viewingAssembly.instructions && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Instructions</Typography>
                  <Typography variant="body2">{viewingAssembly.instructions}</Typography>
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Bill of Materials
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Raw Product</TableCell>
                      <TableCell>Warehouse</TableCell>
                      <TableCell align="right">Required</TableCell>
                      <TableCell align="right">Available</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewingAssembly.billOfMaterials || []).map((material) => (
                      <TableRow key={material.id}>
                        <TableCell>{material.rawProductName}</TableCell>
                        <TableCell>{material.warehouseName}</TableCell>
                        <TableCell align="right">{material.requiredQuantity} {material.unit}</TableCell>
                        <TableCell align="right">{material.availableQuantity} {material.unit}</TableCell>
                        <TableCell>
                          <Chip
                            label={material.availableQuantity >= material.requiredQuantity ? 'Available' : 'Insufficient'}
                            color={material.availableQuantity >= material.requiredQuantity ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {!viewingAssembly && (
            <Box sx={{ pt: 1 }}>
              <TextField
                fullWidth
                label="Assembly Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Quantity"
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) })}
                  margin="normal"
                  required
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  margin="normal"
                  required
                  sx={{ flex: 1 }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Sale Price"
                  type="number"
                  value={formData.salePrice}
                  onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
                  margin="normal"
                  inputProps={{ step: "0.01", min: "0" }}
                  sx={{ flex: 1 }}
                  helperText="Price when sold as assembly (optional)"
                />
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    />
                  }
                  label="Active for POS"
                  sx={{ mt: 2 }}
                />
              </Box>
              <TextField
                fullWidth
                label="Instructions"
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                margin="normal"
                multiline
                rows={3}
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

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Bill of Materials
              </Typography>
              {user?.roles.includes('StoreManager') && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  As a Store Manager, you can only create assemblies using inventory from your assigned store.
                </Alert>
              )}
              {formData.billOfMaterials.map((material, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 3 }}>
                    <InputLabel>Raw Product</InputLabel>
                    <Select
                      value={material.rawProductId}
                      label="Raw Product"
                      onChange={(e) => handleMaterialChange(index, 'rawProductId', e.target.value as number)}
                    >
                      {(products || []).map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl sx={{ flex: 2 }}>
                    <InputLabel>Warehouse</InputLabel>
                    <Select
                      value={material.warehouseId}
                      label="Warehouse"
                      onChange={(e) => handleMaterialChange(index, 'warehouseId', e.target.value as number)}
                      disabled={user?.roles.includes('StoreManager') && getAvailableWarehouses().length === 1}
                    >
                      {getAvailableWarehouses().map((warehouse) => (
                        <MenuItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Required Qty"
                    type="number"
                    value={material.requiredQuantity}
                    onChange={(e) => handleMaterialChange(index, 'requiredQuantity', parseFloat(e.target.value))}
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Unit"
                    value={material.unit}
                    onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                  />
                  <IconButton onClick={() => handleRemoveMaterial(index)} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={handleAddMaterial} sx={{ mt: 1 }}>
                Add Material
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          {!viewingAssembly && (
            <Button onClick={handleSubmit} variant="contained">
              {editingAssembly ? 'Update Assembly' : 'Create Assembly'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Assembly;