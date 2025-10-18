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
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Delete, 
  MoreVert,
  PersonAdd,
  PersonRemove,
  AdminPanelSettings,
  Security,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface User {
  id: number;
  fullName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roles: string[];
  assignedStoreId?: number;
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [openRoleDialog, setOpenRoleDialog] = useState(false);
  const [availableRoles, setAvailableRoles] = useState<{id: number, name: string}[]>([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [openStoreDialog, setOpenStoreDialog] = useState(false);
  const [availableStores, setAvailableStores] = useState<{id: number, name: string}[]>([]);
  const [selectedStore, setSelectedStore] = useState('');
  const { user: currentUser } = useAuth();
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    isActive: true,
  });

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadStores();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await api.getAllUsers();
      setUsers(usersData);
    } catch (err: any) {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await api.getAllRoles();
      setAvailableRoles(rolesData);
    } catch (err: any) {
      console.error('Failed to load roles');
    }
  };

  const loadStores = async () => {
    try {
      const storesData = await api.getStores();
      setAvailableStores(storesData);
    } catch (err: any) {
      console.error('Failed to load stores');
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingUser(null);
    setFormData({
      fullName: '',
      email: '',
      password: '',
      isActive: true,
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      fullName: user.fullName,
      email: user.email,
      password: '', // Don't pre-fill password
      isActive: user.isActive,
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      await loadUsers();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.deleteUser(id);
        await loadUsers();
      } catch (err: any) {
        setError('Failed to delete user');
      }
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, user: User) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedUser(null);
  };

  const handleOpenRoleDialog = (user: User) => {
    setSelectedUser(user);
    setOpenRoleDialog(true);
    setSelectedRole('');
  };

  const handleCloseRoleDialog = () => {
    setOpenRoleDialog(false);
    setSelectedUser(null);
    setSelectedRole('');
  };

  const handleOpenStoreDialog = (user: User) => {
    setSelectedUser(user);
    setSelectedStore(user.assignedStoreId?.toString() || '');
    setOpenStoreDialog(true);
  };

  const handleAssignStore = async () => {
    if (!selectedUser || !selectedStore) return;

    try {
      const storeId = parseInt(selectedStore);
      await api.assignUserToStoreDirect(selectedUser.id, storeId);
      await loadUsers(); // Refresh users list
      handleCloseStoreDialog();
    } catch (err: any) {
      setError('Failed to assign user to store');
    }
  };

  const handleRemoveFromStore = async () => {
    if (!selectedUser) return;

    try {
      await api.removeUserFromStoreDirect(selectedUser.id);
      await loadUsers(); // Refresh users list
      handleCloseStoreDialog();
    } catch (err: any) {
      setError('Failed to remove user from store');
    }
  };

  const handleCloseStoreDialog = () => {
    setOpenStoreDialog(false);
    setSelectedUser(null);
    setSelectedStore('');
  };

  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) return;

    try {
      const role = availableRoles.find(r => r.name === selectedRole);
      if (role) {
        await api.assignRoleToUser(selectedUser.id, role.id);
        await loadUsers(); // Refresh users list
        handleCloseRoleDialog();
      }
    } catch (err: any) {
      setError('Failed to assign role');
    }
  };

  const handleRemoveRole = async (userId: number, roleName: string) => {
    try {
      const role = availableRoles.find(r => r.name === roleName);
      if (role) {
        await api.removeRoleFromUser(userId, role.id);
        await loadUsers(); // Refresh users list
      }
    } catch (err: any) {
      setError('Failed to remove role');
    }
  };

  const handleToggleActive = async () => {
    if (selectedUser) {
      try {
        await api.updateUser(selectedUser.id, {
          ...selectedUser,
          isActive: !selectedUser.isActive,
        });
        await loadUsers();
        handleMenuClose();
      } catch (err: any) {
        setError('Failed to update user status');
      }
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'fullName', headerName: 'Full Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 250 },
    {
      field: 'roles',
      headerName: 'Roles',
      width: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {params.value?.map((role: string) => (
            <Chip
              key={role}
              label={role}
              size="small"
              color={role === 'Admin' ? 'primary' : 'default'}
              variant={role === 'Admin' ? 'filled' : 'outlined'}
              onDelete={currentUser?.id !== params.row.id ? () => handleRemoveRole(params.row.id, role) : undefined}
              deleteIcon={<PersonRemove />}
            />
          ))}
        </Box>
      ),
    },
    {
      field: 'assignedStoreId',
      headerName: 'Store',
      width: 150,
      renderCell: (params) => {
        const store = availableStores.find(s => s.id === params.value);
        return store ? (
          <Chip
            label={store.name}
            size="small"
            color="secondary"
            variant="outlined"
          />
        ) : (
          <Chip
            label="No Store"
            size="small"
            color="default"
            variant="outlined"
          />
        );
      },
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
    { field: 'createdAt', headerName: 'Created', width: 150, valueFormatter: (params: any) => params.value ? new Date(params.value).toLocaleDateString() : '' },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          key="roles"
          icon={<Security />}
          label="Manage Roles"
          onClick={() => handleOpenRoleDialog(params.row)}
          disabled={currentUser?.id === params.row.id}
        />,
        <GridActionsCellItem
          key="store"
          icon={<AdminPanelSettings />}
          label="Manage Store"
          onClick={() => handleOpenStoreDialog(params.row)}
          disabled={currentUser?.id === params.row.id}
        />,
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
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateDialog}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Users
              </Typography>
              <Typography variant="h4" color="primary">
                {users.length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Active Users
              </Typography>
              <Typography variant="h4" color="success.main">
                {users.filter(u => u.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Admin Users
              </Typography>
              <Typography variant="h4" color="warning.main">
                {users.filter(u => u.roles.includes('Admin')).length}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      <Box sx={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={users}
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

      {/* User Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => {
          if (selectedUser) {
            handleOpenEditDialog(selectedUser);
            handleMenuClose();
          }
        }}>
          <Edit sx={{ mr: 1 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={handleToggleActive}>
          {selectedUser?.isActive ? (
            <>
              <PersonRemove sx={{ mr: 1 }} />
              Deactivate
            </>
          ) : (
            <>
              <PersonAdd sx={{ mr: 1 }} />
              Activate
            </>
          )}
        </MenuItem>
        {selectedUser && selectedUser.id !== currentUser?.id && (
          <MenuItem onClick={() => {
            if (selectedUser) {
              handleDelete(selectedUser.id);
              handleMenuClose();
            }
          }}>
            <Delete sx={{ mr: 1 }} />
            Delete User
          </MenuItem>
        )}
      </Menu>

      {/* Create/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingUser ? 'Edit User' : 'Add New User'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label={editingUser ? "New Password (leave blank to keep current)" : "Password"}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
              required={!editingUser}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Role Management Dialog */}
      <Dialog open={openRoleDialog} onClose={handleCloseRoleDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Roles for {selectedUser?.fullName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current roles:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedUser?.roles.map((role) => (
                  <Chip
                    key={role}
                    label={role}
                    color="primary"
                    variant="filled"
                    onDelete={() => handleRemoveRole(selectedUser.id, role)}
                    deleteIcon={<Security />}
                  />
                ))}
                {selectedUser?.roles.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No roles assigned
                  </Typography>
                )}
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Available Roles:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableRoles.map((role) => (
                  <Chip
                    key={role.id}
                    label={role.name}
                    color={selectedUser?.roles.includes(role.name) ? 'primary' : 'default'}
                    variant={selectedUser?.roles.includes(role.name) ? 'filled' : 'outlined'}
                    onClick={() => {
                      if (!selectedUser?.roles.includes(role.name)) {
                        setSelectedRole(role.name);
                      }
                    }}
                    disabled={selectedUser?.roles.includes(role.name)}
                  />
                ))}
              </Box>
            </Box>

            {selectedRole && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Click "Assign Role" to add "{selectedRole}" to this user's roles.
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseRoleDialog}>Cancel</Button>
          <Button 
            onClick={handleAssignRole} 
            variant="contained"
            disabled={!selectedRole}
            startIcon={<Security />}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>

      {/* Store Assignment Dialog */}
      <Dialog open={openStoreDialog} onClose={handleCloseStoreDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Manage Store Assignment for {selectedUser?.fullName}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Current store:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {selectedUser?.assignedStoreId ? (
                  <Chip
                    label={availableStores.find(s => s.id === selectedUser.assignedStoreId)?.name || 'Unknown Store'}
                    size="small"
                    color="secondary"
                    variant="outlined"
                    onDelete={handleRemoveFromStore}
                    deleteIcon={<PersonRemove />}
                  />
                ) : (
                  <Chip
                    label="No Store Assigned"
                    size="small"
                    color="default"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Assign to store:
              </Typography>
              <Box sx={{ minWidth: 200 }}>
                <select
                  value={selectedStore}
                  onChange={(e) => setSelectedStore(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select a store...</option>
                  {availableStores.map(store => (
                    <option key={store.id} value={store.id}>
                      {store.name}
                    </option>
                  ))}
                </select>
              </Box>
            </Box>

            {selectedStore && (
              <Alert severity="info" sx={{ mb: 2 }}>
                Click "Assign Store" to assign this user to "{availableStores.find(s => s.id === parseInt(selectedStore))?.name}".
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStoreDialog}>Cancel</Button>
          <Button 
            onClick={handleAssignStore} 
            variant="contained"
            disabled={!selectedStore}
            startIcon={<AdminPanelSettings />}
          >
            Assign Store
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
