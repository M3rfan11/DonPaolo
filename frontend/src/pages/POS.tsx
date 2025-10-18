import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Receipt as ReceiptIcon,
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  Print as PrintIcon,
  CheckCircle as CheckCircleIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import api from '../services/api';

interface POSProduct {
  productId: number;
  productName: string;
  price: number;
  availableQuantity: number;
  unit: string;
  categoryName: string;
  barcode?: string;
}

interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Customer {
  id: number;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  isActive: boolean;
}

interface SaleResponse {
  saleNumber: string;
  saleId: number;
  customerName: string;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  finalAmount: number;
  paymentMethod: string;
  items: Array<{
    productId: number;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  saleDate: string;
  cashierName: string;
  storeName: string;
}

const POS: React.FC = () => {
  const [products, setProducts] = useState<POSProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerLookupLoading, setCustomerLookupLoading] = useState(false);
  const [customerFound, setCustomerFound] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [taxAmount, setTaxAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [loading, setLoading] = useState(false);
  const [saleDialogOpen, setSaleDialogOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [currentSale, setCurrentSale] = useState<SaleResponse | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'info' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const productsData = await api.getPOSProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info') => {
    setSnackbar({ open: true, message, severity });
  };

  const lookupCustomer = async (phoneNumber: string) => {
    if (!phoneNumber.trim()) {
      setCustomerFound(false);
      return;
    }

    try {
      setCustomerLookupLoading(true);
      const customer = await api.lookupCustomer(phoneNumber);
      
      if (customer) {
        setCustomerName(customer.fullName);
        setCustomerEmail(customer.email || '');
        setCustomerAddress(customer.address || '');
        setCustomerFound(true);
        showSnackbar('Customer found!', 'success');
      } else {
        setCustomerFound(false);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerAddress('');
        showSnackbar('Customer not found. Please enter customer details.', 'info');
      }
    } catch (error: any) {
      if (error.response?.status === 404) {
        setCustomerFound(false);
        setCustomerName('');
        setCustomerEmail('');
        setCustomerAddress('');
        showSnackbar('Customer not found. Please enter customer details.', 'info');
      } else {
        console.error('Error looking up customer:', error);
        showSnackbar('Error looking up customer', 'error');
      }
    } finally {
      setCustomerLookupLoading(false);
    }
  };

  const handlePhoneNumberChange = (phoneNumber: string) => {
    setCustomerPhone(phoneNumber);
    
    // Auto-lookup customer when phone number is entered
    if (phoneNumber.length >= 10) {
      lookupCustomer(phoneNumber);
    } else {
      setCustomerFound(false);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerAddress('');
    }
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.barcode?.includes(searchTerm);
    const matchesCategory = !selectedCategory || product.categoryName === selectedCategory;
    return matchesSearch && matchesCategory && product.availableQuantity > 0;
  });

  const categories = Array.from(new Set(products.map(p => p.categoryName)));

  const addToCart = (product: POSProduct) => {
    const existingItem = cart.find(item => item.productId === product.productId);
    
    if (existingItem) {
      if (existingItem.quantity >= product.availableQuantity) {
        showSnackbar('Cannot add more items - insufficient stock', 'error');
        return;
      }
      updateCartItem(product.productId, existingItem.quantity + 1);
    } else {
      const newItem: CartItem = {
        productId: product.productId,
        productName: product.productName,
        quantity: 1,
        unitPrice: product.price,
        totalPrice: product.price,
      };
      setCart([...cart, newItem]);
    }
  };

  const updateCartItem = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const product = products.find(p => p.productId === productId);
    if (product && newQuantity > product.availableQuantity) {
      showSnackbar('Cannot add more items - insufficient stock', 'error');
      return;
    }

    setCart(cart.map(item =>
      item.productId === productId
        ? { ...item, quantity: newQuantity, totalPrice: newQuantity * item.unitPrice }
        : item
    ));
  };

  const removeFromCart = (productId: number) => {
    setCart(cart.filter(item => item.productId !== productId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.totalPrice, 0);
  };

  const getFinalTotal = () => {
    const subtotal = getCartTotal();
    return subtotal - discountAmount + taxAmount;
  };

  const processSale = async () => {
    if (cart.length === 0) {
      showSnackbar('Cart is empty', 'error');
      return;
    }

    try {
      setLoading(true);
      const saleData = {
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        totalAmount: getCartTotal(),
        discountAmount: discountAmount,
        taxAmount: taxAmount,
        finalAmount: getFinalTotal(),
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
        })),
      };

      const saleResponse = await api.processPOSSale(saleData);
      setCurrentSale(saleResponse);
      setSaleDialogOpen(false);
      setReceiptDialogOpen(true);
      
      // Clear cart and form
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerEmail('');
      setCustomerAddress('');
      setCustomerFound(false);
      setDiscountAmount(0);
      setTaxAmount(0);
      
      showSnackbar('Sale completed successfully!', 'success');
      loadProducts(); // Refresh product quantities
    } catch (error) {
      console.error('Error processing sale:', error);
      showSnackbar('Error processing sale', 'error');
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (currentSale) {
      const printWindow = window.open('', '_blank');
      const receiptContent = `
        <html>
          <head>
            <title>Receipt - ${currentSale.saleNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 20px; }
              .store-name { font-size: 24px; font-weight: bold; }
              .sale-info { margin-bottom: 20px; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
              .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              .totals { margin-top: 20px; }
              .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
              .final-total { font-weight: bold; font-size: 18px; border-top: 2px solid #000; padding-top: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="store-name">${currentSale.storeName}</div>
              <div>Receipt: ${currentSale.saleNumber}</div>
              <div>Date: ${new Date(currentSale.saleDate).toLocaleString()}</div>
            </div>
            
            <div class="sale-info">
              <div>Customer: ${currentSale.customerName}</div>
              <div>Cashier: ${currentSale.cashierName}</div>
              <div>Payment: ${currentSale.paymentMethod}</div>
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${currentSale.items.map(item => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>$${item.unitPrice.toFixed(2)}</td>
                    <td>$${item.totalPrice.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div class="total-line">
                <span>Subtotal:</span>
                <span>$${currentSale.totalAmount.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Discount:</span>
                <span>-$${currentSale.discountAmount.toFixed(2)}</span>
              </div>
              <div class="total-line">
                <span>Tax:</span>
                <span>$${currentSale.taxAmount.toFixed(2)}</span>
              </div>
              <div class="total-line final-total">
                <span>Total:</span>
                <span>$${currentSale.finalAmount.toFixed(2)}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <div>Thank you for your business!</div>
            </div>
          </body>
        </html>
      `;
      
      printWindow?.document.write(receiptContent);
      printWindow?.document.close();
      printWindow?.print();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Point of Sale (POS)
      </Typography>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Products Section */}
        <Box sx={{ flex: 2 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              
              {/* Search and Filter */}
              <Box sx={{ mb: 2, display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl sx={{ minWidth: 150 }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                  >
                    <MenuItem value="">All Categories</MenuItem>
                    {categories.map(category => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* Products Grid */}
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                {filteredProducts.map(product => (
                  <Box key={product.productId}>
                    <Card 
                      sx={{ 
                        cursor: 'pointer',
                        '&:hover': { backgroundColor: 'action.hover' }
                      }}
                      onClick={() => addToCart(product)}
                    >
                      <CardContent>
                        <Typography variant="h6" noWrap>
                          {product.productName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {product.categoryName}
                        </Typography>
                        <Typography variant="h6" color="primary">
                          ${product.price.toFixed(2)}
                        </Typography>
                        <Typography variant="body2">
                          Stock: {product.availableQuantity} {product.unit}
                        </Typography>
                        {product.barcode && (
                          <Typography variant="caption" color="text.secondary">
                            Barcode: {product.barcode}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Cart Section */}
        <Box sx={{ flex: 1 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ShoppingCartIcon sx={{ mr: 1 }} />
                <Typography variant="h6">
                  Cart ({cart.length} items)
                </Typography>
              </Box>

              {cart.length === 0 ? (
                <Typography color="text.secondary">
                  Cart is empty. Add products to get started.
                </Typography>
              ) : (
                <>
                  <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Item</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {cart.map(item => (
                          <TableRow key={item.productId}>
                            <TableCell>
                              <Typography variant="body2" noWrap>
                                {item.productName}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => updateCartItem(item.productId, item.quantity - 1)}
                                >
                                  <RemoveIcon />
                                </IconButton>
                                <Typography sx={{ mx: 1 }}>
                                  {item.quantity}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => updateCartItem(item.productId, item.quantity + 1)}
                                >
                                  <AddIcon />
                                </IconButton>
                              </Box>
                            </TableCell>
                            <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                            <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => removeFromCart(item.productId)}
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  <Divider sx={{ my: 2 }} />

                  {/* Totals */}
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>${getCartTotal().toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Discount:</Typography>
                      <Typography>-${discountAmount.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax:</Typography>
                      <Typography>${taxAmount.toFixed(2)}</Typography>
                    </Box>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6">Total:</Typography>
                      <Typography variant="h6">${getFinalTotal().toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={() => setSaleDialogOpen(true)}
                    disabled={cart.length === 0}
                    startIcon={<ReceiptIcon />}
                  >
                    Process Sale
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Sale Dialog */}
      <Dialog open={saleDialogOpen} onClose={() => setSaleDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Complete Sale</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Customer Phone"
              value={customerPhone}
              onChange={(e) => handlePhoneNumberChange(e.target.value)}
              sx={{ mb: 2 }}
              InputProps={{
                endAdornment: customerLookupLoading ? (
                  <CircularProgress size={20} />
                ) : customerFound ? (
                  <CheckCircleIcon color="success" />
                ) : customerPhone.length >= 10 ? (
                  <PersonAddIcon color="action" />
                ) : null
              }}
              helperText={customerFound ? "Customer found!" : customerPhone.length >= 10 ? "Customer not found - enter details below" : "Enter phone number to lookup customer"}
            />
            <TextField
              fullWidth
              label="Customer Name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              sx={{ mb: 2 }}
              required
              disabled={customerFound}
            />
            <TextField
              fullWidth
              label="Customer Email (Optional)"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              sx={{ mb: 2 }}
              disabled={customerFound}
            />
            <TextField
              fullWidth
              label="Customer Address (Optional)"
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              sx={{ mb: 2 }}
              disabled={customerFound}
            />
            <TextField
              fullWidth
              label="Discount Amount"
              type="number"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Tax Amount"
              type="number"
              value={taxAmount}
              onChange={(e) => setTaxAmount(parseFloat(e.target.value) || 0)}
              sx={{ mb: 2 }}
            />
            <FormControl fullWidth>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                label="Payment Method"
              >
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="Card">Card</MenuItem>
                <MenuItem value="Mobile Payment">Mobile Payment</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaleDialogOpen(false)}>Cancel</Button>
          <Button onClick={processSale} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : 'Complete Sale'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={receiptDialogOpen} onClose={() => setReceiptDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Sale Receipt</Typography>
            <Button
              variant="outlined"
              startIcon={<PrintIcon />}
              onClick={printReceipt}
            >
              Print Receipt
            </Button>
          </Box>
        </DialogTitle>
        <DialogContent>
          {currentSale && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Receipt: {currentSale.saleNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Date: {new Date(currentSale.saleDate).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Store: {currentSale.storeName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Cashier: {currentSale.cashierName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Customer: {currentSale.customerName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Payment: {currentSale.paymentMethod}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Item</TableCell>
                      <TableCell>Qty</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentSale.items.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>${item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell>${item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Subtotal:</Typography>
                  <Typography>${currentSale.totalAmount.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Discount:</Typography>
                  <Typography>-${currentSale.discountAmount.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography>Tax:</Typography>
                  <Typography>${currentSale.taxAmount.toFixed(2)}</Typography>
                </Box>
                <Divider sx={{ my: 1 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6">Total:</Typography>
                  <Typography variant="h6">${currentSale.finalAmount.toFixed(2)}</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptDialogOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default POS;