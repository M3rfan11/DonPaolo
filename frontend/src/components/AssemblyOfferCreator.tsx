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
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Add,
  Remove,
  ShoppingCart,
  AttachMoney,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  unit: string;
  sku: string;
  categoryName: string;
}

interface AssemblyOfferItem {
  productId: number;
  quantity: number;
  notes?: string;
}

interface CreateAssemblyOfferRequest {
  name: string;
  description?: string;
  salePrice?: number;
  storeId?: number;
  items: AssemblyOfferItem[];
}

const AssemblyOfferCreator: React.FC = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<CreateAssemblyOfferRequest>({
    name: '',
    description: '',
    salePrice: 0,
    storeId: user?.assignedStoreId || undefined,
    items: [],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsData, storesData] = await Promise.all([
        api.getProducts(),
        user?.roles?.includes('SuperAdmin') ? api.getWarehouses() : Promise.resolve([])
      ]);
      setProducts(productsData);
      setStores(storesData);
    } catch (err: any) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantity: 1, notes: '' }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleItemChange = (index: number, field: keyof AssemblyOfferItem, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateIndividualTotal = () => {
    return formData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  };

  const getSavings = () => {
    const individualTotal = calculateIndividualTotal();
    const offerPrice = formData.salePrice || 0;
    return individualTotal - offerPrice;
  };

  const handleSubmit = async () => {
    try {
      if (formData.items.length === 0) {
        setError('Please add at least one item to the offer');
        return;
      }

      if (formData.salePrice && formData.salePrice <= 0) {
        setError('Sale price must be greater than 0');
        return;
      }

      // Validate store selection for SuperAdmin users
      if (user?.roles?.includes('SuperAdmin') && !formData.storeId) {
        setError('Please select a store for the assembly offer');
        return;
      }

      await api.createAssemblyOffer(formData);
      setOpenDialog(false);
      setFormData({
        name: '',
        description: '',
        salePrice: 0,
        storeId: user?.assignedStoreId || undefined,
        items: [],
      });
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create assembly offer');
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      name: '',
      description: '',
      salePrice: 0,
      storeId: user?.assignedStoreId || undefined,
      items: [],
    });
    setError('');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Card>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <ShoppingCart color="primary" />
            <Typography variant="h6">Create Assembly Offer</Typography>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Create combo offers by combining multiple products at a special price.
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenDialog(true)}
          >
            Create New Offer
          </Button>
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create Assembly Offer</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Offer Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            placeholder="e.g., Burger Combo Meal"
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            margin="normal"
            multiline
            rows={2}
            placeholder="Describe what's included in this offer"
          />

          {/* Store selection for SuperAdmin users */}
          {user?.roles?.includes('SuperAdmin') && (
            <TextField
              fullWidth
              select
              label="Store"
              value={formData.storeId || ''}
              onChange={(e) => setFormData({ ...formData, storeId: parseInt(e.target.value) || undefined })}
              margin="normal"
              required
              SelectProps={{
                native: true,
              }}
            >
              <option value="">Select a store</option>
              {stores.map((store) => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </TextField>
          )}

          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <TextField
              label="Offer Price"
              type="number"
              value={formData.salePrice}
              onChange={(e) => setFormData({ ...formData, salePrice: parseFloat(e.target.value) || 0 })}
              inputProps={{ step: "0.01", min: "0" }}
              sx={{ flex: 1 }}
              helperText="Special price for this combo offer"
            />
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Individual Total: ${calculateIndividualTotal().toFixed(2)}
              </Typography>
              {formData.salePrice && formData.salePrice > 0 && (
                <Chip
                  label={`Save $${getSavings().toFixed(2)}`}
                  color={getSavings() > 0 ? 'success' : 'error'}
                  size="small"
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Items in Offer</Typography>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={handleAddItem}
              size="small"
            >
              Add Item
            </Button>
          </Box>

          {formData.items.length === 0 ? (
            <Alert severity="info">
              No items added yet. Click "Add Item" to start building your offer.
            </Alert>
          ) : (
            <TableContainer component={Paper}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Product</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit Price</TableCell>
                    <TableCell>Total</TableCell>
                    <TableCell>Notes</TableCell>
                    <TableCell width={50}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {formData.items.map((item, index) => {
                    const product = products.find(p => p.id === item.productId);
                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <FormControl fullWidth size="small">
                            <Select
                              value={item.productId}
                              onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                            >
                              <MenuItem value={0}>Select Product</MenuItem>
                              {products.map(product => (
                                <MenuItem key={product.id} value={product.id}>
                                  {product.name} - ${product.price.toFixed(2)}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          <TextField
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 1)}
                            inputProps={{ min: 1 }}
                            size="small"
                            sx={{ width: 80 }}
                          />
                        </TableCell>
                        <TableCell>
                          ${product ? product.price.toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          ${product ? (product.price * item.quantity).toFixed(2) : '0.00'}
                        </TableCell>
                        <TableCell>
                          <TextField
                            value={item.notes || ''}
                            onChange={(e) => handleItemChange(index, 'notes', e.target.value)}
                            placeholder="Optional notes"
                            size="small"
                            sx={{ width: 120 }}
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton
                            onClick={() => handleRemoveItem(index)}
                            size="small"
                            color="error"
                          >
                            <Remove />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={formData.items.length === 0 || !formData.name}
          >
            Create Offer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AssemblyOfferCreator;
