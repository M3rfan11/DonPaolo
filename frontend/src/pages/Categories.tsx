import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  Typography,
  Menu,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  MoreVert,
  Category,
  CategoryOutlined,
} from '@mui/icons-material';
import api from '../services/api';

interface CategoryType {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  productCount: number;
}

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryType | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      // Use getAllCategories to include inactive categories so they can be reactivated
      const categoriesData = await api.getAllCategories();
      setCategories(categoriesData);
    } catch (err: any) {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (category: CategoryType) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      isActive: category.isActive,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingCategory(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingCategory) {
        await api.updateCategory(editingCategory.id, formData);
      } else {
        await api.createCategory(formData);
      }
      handleCloseDialog();
      await loadCategories();
    } catch (err: any) {
      setError('Failed to save category');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await api.deleteCategory(id);
        await loadCategories();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete category.');
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, category: CategoryType) => {
    setAnchorEl(event.currentTarget);
    setSelectedCategory(category);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedCategory(null);
  };

  const handleToggleActive = async () => {
    if (selectedCategory) {
      try {
        await api.updateCategory(selectedCategory.id, {
          ...formData,
          isActive: !selectedCategory.isActive,
        });
        handleMenuClose();
        await loadCategories();
      } catch (err: any) {
        setError('Failed to update category status');
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
    {
      field: 'productCount',
      headerName: 'Products',
      width: 100,
      renderCell: (params) => (
        <Chip
          label={params.value || 0}
          color="primary"
          size="small"
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => (
        <Chip
          label={params.value ? 'Active' : 'Inactive'}
          color={params.value ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => [
        <GridActionsCellItem
          key="menu"
          icon={<MoreVert />}
          label="More"
          onClick={(event) => handleMenuOpen(event, params.row)}
        />,
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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Categories Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Add Category
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Categories Overview Cards */}
      <Box sx={{ 
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
        gap: 2,
        mb: 3 
      }}>
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Categories
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: '#000000', fontWeight: 'bold' }}>
                  {categories.length}
                </Typography>
              </Box>
              <Category sx={{ color: '#000000', fontSize: { xs: 32, sm: 40 } }} />
            </Box>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Active Categories
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: '#000000', fontWeight: 'bold' }}>
                  {categories.filter(c => c.isActive).length}
                </Typography>
              </Box>
              <CategoryOutlined sx={{ color: '#000000', fontSize: { xs: 32, sm: 40 } }} />
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography color="textSecondary" gutterBottom>
                  Total Products
                </Typography>
                <Typography variant="h5" component="div" sx={{ color: '#000000', fontWeight: 'bold' }}>
                  {categories.reduce((sum, c) => sum + c.productCount, 0)}
                </Typography>
              </Box>
              <Category sx={{ color: '#000000', fontSize: { xs: 32, sm: 40 } }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      <Box sx={{ 
        height: { xs: 400, sm: 500, md: 600 },
        width: '100%',
        '& .MuiDataGrid-root': {
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }
      }}>
        <DataGrid
          rows={categories}
          columns={columns}
          pageSizeOptions={[10, 25, 50]}
          disableRowSelectionOnClick
          sx={{
            '& .MuiDataGrid-cell': {
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }
          }}
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          {editingCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Category Name"
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingCategory ? 'Update Category' : 'Create Category'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          handleOpenEditDialog(selectedCategory!);
          handleMenuClose();
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit
        </MenuItem>
        <MenuItem onClick={() => {
          handleToggleActive();
        }}>
          {selectedCategory?.isActive ? (
            <>
              <CategoryOutlined sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <Category sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        <MenuItem onClick={() => {
          handleDelete(selectedCategory!.id);
          handleMenuClose();
        }} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Categories;
