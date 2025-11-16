import React, { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(products.map(p => p.categoryName)));

  const addToCart = (product: POSProduct) => {
    const existingItem = cart.find(item => item.productId === product.productId);
    
    if (existingItem) {
      // No stock check - inventory not used
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
    // No stock check - inventory not used

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

  const previewReceipts = () => {
    if (!currentSale) return;
    printReceipt(false, false); // Preview mode - no drawer, no auto-print
  };

  const printReceipt = async (openDrawer: boolean = true, autoPrint: boolean = true) => {
    if (!currentSale) return;

    if (openDrawer) {
      try {
        // Open cash drawer when printing invoice
        await api.openCashDrawer();
      } catch (error) {
        console.error('Error opening cash drawer:', error);
        // Continue with printing even if drawer fails
      }
    }

    // Print Customer Invoice (with prices)
    const invoiceWindow = window.open('', '_blank');
    const invoiceContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${currentSale.saleNumber}</title>
          <style>
            @media print {
              @page { size: 80mm auto; margin: 0; }
              body { margin: 5mm; }
            }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Courier New', monospace;
              font-size: 12px;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              background: white;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px dashed #000;
              padding-bottom: 10px;
              margin-bottom: 10px;
            }
            .store-name { 
              font-size: 18px; 
              font-weight: bold;
              text-transform: uppercase;
              margin-bottom: 5px;
            }
            .store-address {
              font-size: 10px;
              margin-bottom: 5px;
            }
            .receipt-info { 
              text-align: center;
              font-size: 10px;
              margin: 10px 0;
            }
            .divider {
              border-top: 1px dashed #000;
              margin: 10px 0;
            }
            .items-section {
              margin: 10px 0;
            }
            .item-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 5px;
              font-size: 11px;
            }
            .item-name {
              flex: 1;
              font-weight: bold;
            }
            .item-details {
              text-align: right;
              margin-left: 10px;
            }
            .item-quantity {
              display: inline-block;
              min-width: 30px;
            }
            .item-price {
              display: inline-block;
              min-width: 50px;
              text-align: right;
            }
            .totals { 
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 10px;
            }
            .total-line { 
              display: flex; 
              justify-content: space-between; 
              margin: 5px 0;
              font-size: 11px;
            }
            .final-total { 
              font-weight: bold; 
              font-size: 14px;
              border-top: 2px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              padding-top: 10px;
              border-top: 1px dashed #000;
              font-size: 10px;
            }
            .payment-info {
              margin: 10px 0;
              font-size: 11px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="store-name">DON PAOLO</div>
            <div class="store-address">${currentSale.storeName}</div>
            <div class="store-address">Restaurant & Bar</div>
          </div>
          
          <div class="receipt-info">
            <div>Receipt #: ${currentSale.saleNumber}</div>
            <div>Date: ${new Date(currentSale.saleDate).toLocaleString('en-US', { 
              year: 'numeric', 
              month: '2-digit', 
              day: '2-digit', 
              hour: '2-digit', 
              minute: '2-digit' 
            })}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="payment-info">
            <div>Customer: ${currentSale.customerName}</div>
            <div>Cashier: ${currentSale.cashierName}</div>
            <div>Payment: ${currentSale.paymentMethod}</div>
          </div>
          
          <div class="divider"></div>
          
          <div class="items-section">
            ${currentSale.items.map(item => `
              <div class="item-row">
                <div class="item-name">${item.productName}</div>
                <div class="item-details">
                  <span class="item-quantity">${item.quantity}x</span>
                  <span class="item-price">$${item.unitPrice.toFixed(2)}</span>
                </div>
              </div>
              <div class="item-row" style="justify-content: flex-end; font-size: 10px;">
                <span>$${item.totalPrice.toFixed(2)}</span>
              </div>
            `).join('')}
          </div>
          
          <div class="divider"></div>
          
          <div class="totals">
            <div class="total-line">
              <span>Subtotal:</span>
              <span>$${currentSale.totalAmount.toFixed(2)}</span>
            </div>
            ${currentSale.discountAmount > 0 ? `
              <div class="total-line">
                <span>Discount:</span>
                <span>-$${currentSale.discountAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            ${currentSale.taxAmount > 0 ? `
              <div class="total-line">
                <span>Tax:</span>
                <span>$${currentSale.taxAmount.toFixed(2)}</span>
              </div>
            ` : ''}
            <div class="total-line final-total">
              <span>TOTAL:</span>
              <span>$${currentSale.finalAmount.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="footer">
            <div>Thank you for dining with us!</div>
            <div style="margin-top: 5px;">We hope to see you again soon</div>
          </div>
        </body>
      </html>
    `;
    
    if (invoiceWindow) {
      invoiceWindow.document.write(invoiceContent);
      invoiceWindow.document.close();
      invoiceWindow.focus(); // Bring to front
      
      // Wait a bit then print (if auto-print is enabled)
      if (autoPrint) {
        setTimeout(() => {
          invoiceWindow.print();
        }, 250);
      }
    }

    // Print Kitchen Ticket (without prices) - separate window (open immediately)
    const kitchenWindow = window.open('', '_blank');
    const kitchenContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Kitchen Ticket - ${currentSale.saleNumber}</title>
            <style>
              @media print {
                @page { size: 80mm auto; margin: 0; }
                body { margin: 5mm; }
              }
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { 
                font-family: 'Courier New', monospace;
                font-size: 14px;
                width: 80mm;
                margin: 0 auto;
                padding: 10px;
                background: white;
              }
              .header { 
                text-align: center; 
                border-bottom: 3px solid #000;
                padding-bottom: 10px;
                margin-bottom: 10px;
              }
              .kitchen-title { 
                font-size: 20px; 
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 5px;
              }
              .order-info { 
                text-align: center;
                font-size: 12px;
                margin: 10px 0;
                font-weight: bold;
              }
              .divider {
                border-top: 2px solid #000;
                margin: 10px 0;
              }
              .items-section {
                margin: 10px 0;
              }
              .item-row {
              display: block;
              margin-bottom: 8px;
              font-size: 13px;
              }
              .item-name {
                font-weight: bold;
                font-size: 14px;
                text-transform: uppercase;
              }
              .item-quantity {
                display: inline-block;
                background: #000;
                color: white;
                padding: 2px 8px;
                margin-right: 10px;
                font-weight: bold;
                min-width: 30px;
                text-align: center;
              }
              .footer {
                text-align: center;
                margin-top: 20px;
                padding-top: 10px;
                border-top: 2px solid #000;
                font-size: 11px;
                font-weight: bold;
              }
              .timestamp {
                font-size: 11px;
                margin-top: 5px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <div class="kitchen-title">KITCHEN ORDER</div>
              <div style="font-size: 12px;">${currentSale.storeName}</div>
            </div>
            
            <div class="order-info">
              <div>Order #: ${currentSale.saleNumber}</div>
              <div class="timestamp">${new Date(currentSale.saleDate).toLocaleString('en-US', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit', 
                hour: '2-digit', 
                minute: '2-digit' 
              })}</div>
            </div>
            
            <div class="divider"></div>
            
            <div class="items-section">
              ${currentSale.items.map(item => `
                <div class="item-row">
                  <span class="item-quantity">${item.quantity}x</span>
                  <span class="item-name">${item.productName}</span>
                </div>
              `).join('')}
            </div>
            
            <div class="divider"></div>
            
            <div class="footer">
              <div>Customer: ${currentSale.customerName}</div>
              <div style="margin-top: 5px;">Cashier: ${currentSale.cashierName}</div>
            </div>
          </body>
        </html>
      `;
      
    if (kitchenWindow) {
      kitchenWindow.document.write(kitchenContent);
      kitchenWindow.document.close();
      // Position second window next to first one
      kitchenWindow.moveTo(window.screenX + 100, window.screenY + 100);
      kitchenWindow.focus(); // Bring to front
      
      if (autoPrint) {
        setTimeout(() => {
          kitchenWindow.print();
        }, 500); // Slightly longer delay so invoice prints first
      }
    }
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, mb: 2 }}>
        Point of Sale (POS)
      </Typography>

      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', lg: 'row' },
        gap: { xs: 2, md: 3 } 
      }}>
        {/* Products Section */}
        <Box sx={{ flex: { xs: '1 1 auto', lg: 2 }, order: { xs: 2, lg: 1 } }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Products
              </Typography>
              
              {/* Search and Filter */}
              <Box sx={{ 
                mb: 2, 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                gap: 2 
              }}>
                <TextField
                  fullWidth
                  placeholder="Search products or scan barcode..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  size={isMobile ? 'small' : 'medium'}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
                <FormControl sx={{ minWidth: { xs: '100%', sm: 150 } }}>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    label="Category"
                    size={isMobile ? 'small' : 'medium'}
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
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { 
                  xs: 'repeat(auto-fill, minmax(140px, 1fr))',
                  sm: 'repeat(auto-fill, minmax(180px, 1fr))',
                  md: 'repeat(auto-fill, minmax(220px, 1fr))',
                  lg: 'repeat(auto-fill, minmax(250px, 1fr))'
                }, 
                gap: { xs: 1, sm: 2 } 
              }}>
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
                        <Typography variant="h6" sx={{ color: '#000000', fontWeight: 'bold' }}>
                          ${product.price.toFixed(2)}
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
        <Box sx={{ 
          flex: { xs: '1 1 auto', lg: 1 }, 
          order: { xs: 1, lg: 2 },
          position: { xs: 'sticky', lg: 'static' },
          top: { xs: 0, lg: 'auto' },
          zIndex: { xs: 10, lg: 'auto' },
          bgcolor: { xs: 'background.paper', lg: 'transparent' },
          pb: { xs: 1, lg: 0 }
        }}>
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
                  <TableContainer 
                    component={Paper} 
                    sx={{ 
                      maxHeight: { xs: 200, sm: 300 },
                      overflowX: 'auto'
                    }}
                  >
                    <Table size="small" sx={{ minWidth: 400 }}>
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
      <Dialog 
        open={saleDialogOpen} 
        onClose={() => setSaleDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
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
      <Dialog 
        open={receiptDialogOpen} 
        onClose={() => setReceiptDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 1, sm: 2 },
            width: { xs: 'calc(100% - 16px)', sm: 'auto' }
          }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h6">Sale Receipt</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<PrintIcon />}
                onClick={previewReceipts}
                sx={{ borderColor: '#666', color: '#666' }}
              >
                Preview Invoices
              </Button>
              <Button
                variant="contained"
                startIcon={<PrintIcon />}
                onClick={() => printReceipt(true, true)}
                sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#333' } }}
              >
                Print & Open Drawer
              </Button>
            </Box>
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