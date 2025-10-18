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
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Container,
  Fade,
  Grow,
  Avatar,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import { 
  Add, 
  Edit, 
  Visibility, 
  CheckCircle, 
  Cancel, 
  PlayArrow,
  Delete,
  RequestQuote,
  Refresh,
  Star,
  TrendingUp,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface ProductRequestItem {
  id: number;
  productId: number;
  productName: string;
  quantityRequested: number;
  quantityApproved?: number;
  quantityReceived?: number;
  unit: string;
  notes?: string;
}

interface ProductRequest {
  id: number;
  requestedByUserId: number;
  requestedByUserName: string; // Changed from requestedByUserFullName
  requestDate: string;
  status: string; // Pending, Approved, Rejected, Completed
  warehouseId: number;
  warehouseName: string;
  notes?: string;
  approvedByUserId?: number;
  approvedByUserName?: string; // Changed from approvedByUserFullName
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  items: ProductRequestItem[]; // Changed from productRequestItems to match API
  itemCount?: number; // Added from API response
  totalQuantityRequested?: number; // Added from API response
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

interface Warehouse {
  id: number;
  name: string;
}

const Requests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [viewingRequest, setViewingRequest] = useState<ProductRequest | null>(null);
  const [editingRequest, setEditingRequest] = useState<ProductRequest | null>(null);
  const [loadingRequestDetails, setLoadingRequestDetails] = useState(false);
  const [approvalMode, setApprovalMode] = useState(false);
  const [approvalQuantities, setApprovalQuantities] = useState<{[key: number]: number}>({});
  const [approvalNotes, setApprovalNotes] = useState('');
  const [formData, setFormData] = useState({
    warehouseId: user?.assignedStoreId || 0,
    notes: '',
    items: [] as { productId: number; quantityRequested: number; unit: string; notes?: string }[],
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(''); // Clear any previous errors
      
      console.log('Loading requests data...');
      const [requestsData, productsData, warehousesData] = await Promise.all([
        api.getProductRequests(),
        api.getProducts(),
        api.getWarehouses(),
      ]);
      
      console.log('API responses:', { requestsData, productsData, warehousesData });
      
      // Filter requests data to only include the fields we want to display
      const filteredRequests = (requestsData || []).map((request: any) => {
        console.log('Processing request:', request.id, 'itemCount:', request.itemCount, 'totalQuantityRequested:', request.totalQuantityRequested);
        return {
          id: request.id,
          requestedByUserId: request.requestedByUserId,
          requestedByUserName: request.requestedByUserName,
          requestDate: request.requestDate,
          status: request.status,
          warehouseId: request.warehouseId,
          warehouseName: request.warehouseName,
          notes: request.notes,
          approvedByUserId: request.approvedByUserId,
          approvedByUserName: request.approvedByUserName,
          approvedAt: request.approvedAt,
          rejectedAt: request.rejectedAt,
          rejectionReason: request.rejectionReason,
          createdAt: request.createdAt,
          items: request.items || [], // Include items array
          itemCount: request.itemCount,
          totalQuantityRequested: request.totalQuantityRequested,
          // Keep the full object for the dialog
          _fullData: request
        };
      });
      
      console.log('Filtered requests:', filteredRequests);
      setRequests(filteredRequests);
      setProducts(productsData);
      setWarehouses(warehousesData);
    } catch (err: any) {
      console.error('Error loading requests data:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load product requests';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingRequest(null);
    setViewingRequest(null);
    setFormData({
      warehouseId: user?.assignedStoreId || 0,
      notes: '',
      items: [{ productId: 0, quantityRequested: 0, unit: '' }],
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (request: any) => {
    const fullRequest = request._fullData;
    setEditingRequest(fullRequest);
    setViewingRequest(null);
    setFormData({
      warehouseId: fullRequest.warehouseId,
      notes: fullRequest.notes || '',
      items: (fullRequest.productRequestItems || []).map((item: any) => ({
        productId: item.productId,
        quantityRequested: item.quantityRequested,
        unit: item.unit,
        notes: item.notes,
      })),
    });
    setOpenDialog(true);
  };

  const handleViewRequest = async (request: any) => {
    try {
      setLoadingRequestDetails(true);
      // Fetch the complete request details with items
      const fullRequest = await api.getProductRequest(request.id);
      setViewingRequest(fullRequest);
      setEditingRequest(null);
      setOpenDialog(true);
    } catch (err: any) {
      setError('Failed to load request details');
      console.error('Error loading request:', err);
    } finally {
      setLoadingRequestDetails(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewingRequest(null);
    setEditingRequest(null);
    setApprovalMode(false);
    setApprovalQuantities({});
    setApprovalNotes('');
    setError('');
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { productId: 0, quantityRequested: 0, unit: '' }],
    });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async () => {
    try {
      if (editingRequest) {
        await api.updateProductRequest(editingRequest.id, formData);
      } else {
        await api.createProductRequest(formData);
      }
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product request');
    }
  };

  const handleApprove = async (id: number) => {
    try {
      setLoadingRequestDetails(true);
      
      // Fetch the full request details from the API
      const fullRequest = await api.getProductRequest(id);
      
      console.log('Full request data from API:', fullRequest);
      console.log('Items in full request:', fullRequest.items);
      console.log('Items length:', fullRequest.items?.length);
      console.log('Items type:', typeof fullRequest.items);
      console.log('Is items array:', Array.isArray(fullRequest.items));
      
      // Initialize approval mode
      setApprovalMode(true);
      setApprovalNotes('');
      
      // Initialize approval quantities with requested quantities
      const quantities: {[key: number]: number} = {};
      if (fullRequest.items && Array.isArray(fullRequest.items)) {
        fullRequest.items.forEach((item: any) => {
          quantities[item.id] = item.quantityRequested;
        });
      }
      setApprovalQuantities(quantities);

      // Set the request for approval dialog
      setViewingRequest(fullRequest);
      setOpenDialog(true);
    } catch (err: any) {
      setError('Failed to load request details');
      console.error('Error loading request:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
    } finally {
      setLoadingRequestDetails(false);
    }
  };

  const handleReject = async (id: number) => {
    const reason = window.prompt('Please provide a reason for rejection:');
    if (reason) {
      try {
        await api.rejectProductRequest(id, { rejectionReason: reason });
        await loadData();
      } catch (err: any) {
        setError('Failed to reject product request');
      }
    }
  };

  const handleApproveWithModifications = async (requestId: number, approvalData: any) => {
    try {
      await api.approveProductRequest(requestId, approvalData);
      await loadData();
      handleCloseDialog();
    } catch (err: any) {
      setError('Failed to approve product request');
    }
  };

  const handleQuickApprove = async () => {
    if (!viewingRequest) return;
    
    // Approve with original quantities
    const approvalData = {
      items: (viewingRequest.items || []).map(item => ({
        itemId: item.id,
        quantityApproved: item.quantityRequested
      })),
      notes: approvalNotes
    };
    
    await handleApproveWithModifications(viewingRequest.id, approvalData);
  };

  const handleApproveWithChanges = async () => {
    if (!viewingRequest) return;
    
    // Approve with modified quantities
    const approvalData = {
      items: (viewingRequest.items || []).map(item => ({
        itemId: item.id,
        quantityApproved: approvalQuantities[item.id] || item.quantityRequested
      })),
      notes: approvalNotes
    };
    
    await handleApproveWithModifications(viewingRequest.id, approvalData);
  };

  const handleCancelApproval = () => {
    setApprovalMode(false);
    setApprovalQuantities({});
    setApprovalNotes('');
    setViewingRequest(null);
    setOpenDialog(false);
  };

  // handleReceive function removed - inventory transfer is now automatic on approval

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved':
        return 'success';
      case 'Pending':
        return 'warning';
      case 'Rejected':
        return 'error';
      case 'Completed':
        return 'primary';
      default:
        return 'default';
    }
  };

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'requestedByUserName', headerName: 'Requested By', width: 150 },
    { field: 'warehouseName', headerName: 'Warehouse', width: 150 },
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
    { field: 'requestDate', headerName: 'Request Date', width: 130, valueFormatter: (params: any) => params?.value ? new Date(params.value).toLocaleDateString() : '' },
    { field: 'itemCount', headerName: 'Items', width: 80 },
    { field: 'totalQuantityRequested', headerName: 'Total Qty', width: 100 },
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
            onClick={() => handleViewRequest(params.row)}
            showInMenu
          />,
        ];

        // Role-based actions
        const isCashier = user?.roles?.includes('Cashier') || user?.roles?.includes('User');
        const isManager = user?.roles?.includes('StoreManager') || user?.roles?.includes('SuperAdmin');

        if (params.row.status === 'Pending') {
          // Cashiers can only edit their own requests
          if (isCashier && params.row.requestedByUserName === user?.fullName) {
            actions.push(
              <GridActionsCellItem
                key="edit"
                icon={<Edit />}
                label="Edit"
                onClick={() => handleOpenEditDialog(params.row)}
                showInMenu
              />
            );
          }
          
          // Only managers can approve/reject requests
          if (isManager) {
            actions.push(
              <GridActionsCellItem
                key="approve"
                icon={<CheckCircle />}
                label="Approve"
                onClick={() => handleApprove(params.row.id)}
                showInMenu
              />,
              <GridActionsCellItem
                key="reject"
                icon={<Cancel />}
                label="Reject"
                onClick={() => handleReject(params.row.id)}
                showInMenu
              />
            );
          }
        }

        // Note: Receive functionality is now automatic when approving requests
        // No separate receive action needed

        return actions;
      },
    },
  ];

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
                  <RequestQuote sx={{ fontSize: 32 }} />
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
                    Product Requests
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Manage product requests and approvals
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
                  onClick={handleOpenCreateDialog}
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
                  Create Request
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
              rows={requests}
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

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {approvalMode ? `Approve Request - #${viewingRequest?.id}` :
           viewingRequest ? `Request Details - #${viewingRequest.id}` : 
           editingRequest ? `Edit Request - #${editingRequest.id}` : 'Create New Request'}
        </DialogTitle>
        <DialogContent>
          {loadingRequestDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
              <CircularProgress />
            </Box>
          ) : viewingRequest && (
            <Box>
              {/* Role-based information */}
              {(user?.roles?.includes('Cashier') || user?.roles?.includes('User')) && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Cashier View:</strong> You can only view request status. Only store managers can approve or reject requests.
                  </Typography>
                </Alert>
              )}
              
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Status: <Chip label={viewingRequest.status} color={getStatusColor(viewingRequest.status) as any} size="small" />
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Requested By: {viewingRequest.requestedByUserName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Warehouse: {viewingRequest.warehouseName}
                  </Typography>
                </Box>
                <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Typography variant="body2" color="text.secondary">
                    Request Date: {new Date(viewingRequest.requestDate).toLocaleDateString()}
                  </Typography>
                </Box>
              </Box>

              {viewingRequest.approvedByUserName && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Approved By: {viewingRequest.approvedByUserName} on {new Date(viewingRequest.approvedAt!).toLocaleDateString()}
                  </Typography>
                </Box>
              )}

              {viewingRequest.rejectionReason && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="error">
                    Rejection Reason: {viewingRequest.rejectionReason}
                  </Typography>
                </Box>
              )}

              {viewingRequest.notes && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>Notes</Typography>
                  <Typography variant="body2">{viewingRequest.notes}</Typography>
                </Box>
              )}

              <Typography variant="h6" gutterBottom>
                Requested Items
              </Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Requested</TableCell>
                      <TableCell align="right">Approved</TableCell>
                      <TableCell align="right">Received</TableCell>
                      <TableCell>Unit</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(viewingRequest.items || []).length > 0 ? (
                      (viewingRequest.items || []).map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.productName}</TableCell>
                          <TableCell align="right">{item.quantityRequested}</TableCell>
                          <TableCell align="right">{item.quantityApproved || '-'}</TableCell>
                          <TableCell align="right">{item.quantityReceived || '-'}</TableCell>
                          <TableCell>{item.unit}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">
                            No items found for this request
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Manager Approval Interface */}
              {approvalMode && viewingRequest.status === 'Pending' && (
                <Box sx={{ mt: 3, p: 2, border: '1px solid', borderColor: 'primary.main', borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom color="primary">
                    Manager Approval
                  </Typography>
                  
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      <strong>Manager Options:</strong> You can approve the request as-is, modify quantities, or decline it.
                    </Typography>
                  </Alert>

                  {/* Approval Notes */}
                  <TextField
                    fullWidth
                    label="Approval Notes (Optional)"
                    value={approvalNotes}
                    onChange={(e) => setApprovalNotes(e.target.value)}
                    margin="normal"
                    multiline
                    rows={2}
                    placeholder="Add any notes about this approval..."
                  />

                  {/* Items with Quantity Modification */}
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    Modify Quantities (if needed):
                  </Typography>
                  
                  <TableContainer component={Paper} sx={{ mb: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Product</TableCell>
                          <TableCell align="right">Requested</TableCell>
                          <TableCell align="right">Approved Qty</TableCell>
                          <TableCell>Unit</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(viewingRequest.items || []).length > 0 ? (
                          (viewingRequest.items || []).map((item) => (
                            <TableRow key={item.id}>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell align="right">{item.quantityRequested}</TableCell>
                              <TableCell align="right">
                                <TextField
                                  type="number"
                                  size="small"
                                  value={approvalQuantities[item.id] || item.quantityRequested}
                                  onChange={(e) => setApprovalQuantities({
                                    ...approvalQuantities,
                                    [item.id]: parseFloat(e.target.value) || 0
                                  })}
                                  inputProps={{ min: 0, step: 0.01 }}
                                  sx={{ width: 100 }}
                                />
                              </TableCell>
                              <TableCell>{item.unit}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                              <Typography variant="body2" color="text.secondary">
                                No items found for this request
                              </Typography>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Approval Action Buttons */}
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', mt: 2 }}>
                    <Button
                      variant="outlined"
                      color="success"
                      onClick={handleQuickApprove}
                      startIcon={<CheckCircle />}
                    >
                      Approve & Transfer to POS
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleApproveWithChanges}
                      startIcon={<CheckCircle />}
                    >
                      Approve with Changes & Transfer
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => {
                        const reason = window.prompt('Please provide a reason for rejection:');
                        if (reason) {
                          handleReject(viewingRequest.id);
                        }
                      }}
                      startIcon={<Cancel />}
                    >
                      Decline Request
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={handleCancelApproval}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}

          {!viewingRequest && (
            <Box sx={{ pt: 1 }}>
              <FormControl fullWidth margin="normal">
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={formData.warehouseId}
                  onChange={(e) => setFormData({ ...formData, warehouseId: e.target.value as number })}
                  label="Warehouse"
                  required
                  disabled={user?.roles?.includes('Cashier') || user?.roles?.includes('User')}
                >
                  {(warehouses || []).map((warehouse) => (
                    <MenuItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              {(user?.roles?.includes('Cashier') || user?.roles?.includes('User')) && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                  You can only request products for your assigned store: {warehouses.find(w => w.id === user?.assignedStoreId)?.name || 'Your Store'}
                </Typography>
              )}
              <TextField
                fullWidth
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                margin="normal"
                multiline
                rows={3}
              />

              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Requested Items
              </Typography>
              {(formData.items || []).map((item, index) => (
                <Box key={index} sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center' }}>
                  <FormControl sx={{ flex: 3 }}>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={item.productId}
                      label="Product"
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value as number)}
                    >
                      {(products || []).map((product) => (
                        <MenuItem key={product.id} value={product.id}>
                          {product.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Quantity Requested"
                    type="number"
                    value={item.quantityRequested}
                    onChange={(e) => handleItemChange(index, 'quantityRequested', parseFloat(e.target.value))}
                    sx={{ flex: 1 }}
                    required
                  />
                  <TextField
                    label="Unit"
                    value={item.unit}
                    onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                    sx={{ flex: 1 }}
                    required
                  />
                  <IconButton onClick={() => handleRemoveItem(index)} color="error">
                    <Delete />
                  </IconButton>
                </Box>
              ))}
              <Button startIcon={<Add />} onClick={handleAddItem} sx={{ mt: 1 }}>
                Add Item
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {approvalMode ? (
            // Approval mode - buttons are handled in the approval interface
            <Button onClick={handleCancelApproval}>Cancel</Button>
          ) : (
            <>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              {!viewingRequest && (
                <Button onClick={handleSubmit} variant="contained">
                  {editingRequest ? 'Update Request' : 'Create Request'}
                </Button>
              )}
            </>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Requests;