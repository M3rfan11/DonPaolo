import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Store,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface StoreData {
  id: number;
  name: string;
  address: string;
  city: string;
  phoneNumber: string;
  managerName: string;
  managerUserId?: number;
  assignedUsersCount: number;
  assignedUsers: Array<{
    id: number;
    fullName: string;
    email: string;
  }>;
}

const StoreManagement: React.FC = () => {
  const { user } = useAuth();
  const [stores, setStores] = useState<StoreData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingStore, setEditingStore] = useState<StoreData | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    phoneNumber: '',
    managerUserId: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading store data...', { 
        user: user?.email, 
        roles: user?.roles,
        token: localStorage.getItem('authToken') ? 'Present' : 'Missing'
      });
      
      const storesData = await api.getStores();
      
      console.log('✅ Store data loaded successfully:', { 
        storesCount: storesData?.length,
        stores: storesData
      });
      
      setStores(storesData || []);
    } catch (err: any) {
      console.error('❌ Failed to load stores data:', err);
      setError(`Failed to load stores data: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const handleOpenDialog = (store?: StoreData) => {
    if (store) {
      setEditingStore(store);
      setFormData({
        name: store.name,
        address: store.address,
        city: store.city,
        phoneNumber: store.phoneNumber,
        managerUserId: store.managerUserId?.toString() || '',
      });
    } else {
      setEditingStore(null);
      setFormData({
        name: '',
        address: '',
        city: '',
        phoneNumber: '',
        managerUserId: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStore(null);
    setFormData({
      name: '',
      address: '',
      city: '',
      phoneNumber: '',
      managerUserId: '',
    });
  };

  const handleSave = async () => {
    try {
      setError(null);
      
      const storeData = {
        name: formData.name,
        address: formData.address,
        city: formData.city,
        phoneNumber: formData.phoneNumber,
        managerUserId: formData.managerUserId ? parseInt(formData.managerUserId) : null,
      };

      console.log('💾 Saving store:', storeData);

      if (editingStore) {
        await api.updateStore(editingStore.id, storeData);
        console.log('✅ Store updated successfully');
      } else {
        await api.createStore(storeData);
        console.log('✅ Store created successfully');
      }

      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      console.error('❌ Failed to save store:', err);
      setError(`Failed to save store: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this store?')) {
      try {
        setError(null);
        console.log('🗑️ Deleting store:', id);
        
        await api.deleteStore(id);
        console.log('✅ Store deleted successfully');
        
        await loadData();
      } catch (err: any) {
        console.error('❌ Failed to delete store:', err);
        setError(`Failed to delete store: ${err?.response?.data?.message || err?.message || 'Unknown error'}`);
      }
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Please log in to access Store Management.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading stores...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Store Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Store
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Total Stores: {stores.length}
        </Typography>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Store Name</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>City</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Manager</TableCell>
              <TableCell>Users</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stores.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No stores found. Click "Add Store" to create your first store.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              stores.map((store) => (
                <TableRow key={store.id}>
                  <TableCell>{store.id}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Store sx={{ mr: 1, color: 'primary.main' }} />
                      {store.name}
                    </Box>
                  </TableCell>
                  <TableCell>{store.address}</TableCell>
                  <TableCell>{store.city}</TableCell>
                  <TableCell>{store.phoneNumber}</TableCell>
                  <TableCell>{store.managerName}</TableCell>
                  <TableCell>
                    <Chip
                      label={store.assignedUsersCount}
                      color="primary"
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(store)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(store.id)}
                      size="small"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingStore ? 'Edit Store' : 'Create Store'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Store Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="City"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Phone Number"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Manager User ID"
              value={formData.managerUserId}
              onChange={(e) => setFormData({ ...formData, managerUserId: e.target.value })}
              fullWidth
              type="number"
              helperText="Leave empty if no manager assigned"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">
            {editingStore ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StoreManagement;
