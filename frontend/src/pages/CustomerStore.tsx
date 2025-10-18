import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Box,
  Chip,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
  Avatar,
  Fade,
  Grow,
  Rating,
  Tooltip,
  Skeleton,
} from '@mui/material';
import {
  Search as SearchIcon,
  ShoppingCart as ShoppingCartIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
  Store as StoreIcon,
  Star as StarIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  TrendingUp as TrendingUpIcon,
  FlashOn as FlashOnIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  sku?: string;
  brand?: string;
  unit?: string;
  categoryName: string;
  availableQuantity: number;
  isAvailable: boolean;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  isOnSale?: boolean;
  salePrice?: number;
  isNew?: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  productCount: number;
}

interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productSKU?: string;
  productDescription?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  unit?: string;
  categoryName: string;
  availableQuantity: number;
  createdAt: string;
  updatedAt: string;
}

interface CartSummary {
  items: CartItem[];
  subTotal: number;
  tax: number;
  total: number;
  itemCount: number;
}

const CustomerStore: React.FC = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | ''>('');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<Product | null>(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [imageLoading, setImageLoading] = useState<{ [key: number]: boolean }>({});
  const [imageError, setImageError] = useState<{ [key: number]: boolean }>({});

  // Checkout form state
  const [checkoutData, setCheckoutData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    customerAddress: '',
    deliveryDate: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes, cartRes] = await Promise.all([
        api.getCustomerProducts(),
        api.getCustomerCategories(),
        api.getCart()
      ]);
      
      setProducts(productsRes);
      setCategories(categoriesRes);
      setCart(cartRes);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load store data');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId: number, quantity: number = 1) => {
    try {
      await api.addToCart(productId, quantity);
      await loadData(); // Refresh cart
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
    }
  };

  const updateCartItem = async (cartItemId: number, quantity: number) => {
    try {
      await api.updateCartItem(cartItemId, quantity);
      await loadData(); // Refresh cart
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update cart item');
    }
  };

  const removeFromCart = async (cartItemId: number) => {
    try {
      await api.removeFromCart(cartItemId);
      await loadData(); // Refresh cart
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to remove item from cart');
    }
  };

  const clearCart = async () => {
    try {
      await api.clearCart();
      await loadData(); // Refresh cart
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    try {
      // Validate delivery date
      if (!checkoutData.deliveryDate) {
        setError('Delivery date is required');
        return;
      }

      const today = new Date();
      const deliveryDate = new Date(checkoutData.deliveryDate);
      const minDate = new Date(today);
      minDate.setDate(today.getDate() + 2);

      if (deliveryDate < minDate) {
        setError('Delivery date must be at least 2 days from today');
        return;
      }

      const response = await api.createOrder({
        ...checkoutData,
        useCartItems: true
      });
      
      setCheckoutOpen(false);
      navigate('/customer-orders', { state: { newOrder: response } });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create order');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const toggleWishlist = (productId: number) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleProductHover = (product: Product, event: React.MouseEvent) => {
    setHoveredProduct(product);
    setHoverPosition({ x: event.clientX, y: event.clientY });
  };

  const handleProductLeave = () => {
    setHoveredProduct(null);
  };

  const handleProductClick = (productId: number) => {
    navigate(`/product/${productId}`);
  };

  const handleImageLoad = (productId: number) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
  };

  const handleImageError = (productId: number) => {
    setImageLoading(prev => ({ ...prev, [productId]: false }));
    setImageError(prev => ({ ...prev, [productId]: true }));
  };

  const getImageUrl = (product: Product) => {
    if (imageError[product.id]) {
      return `https://via.placeholder.com/300x220/667eea/ffffff?text=${encodeURIComponent(product.name)}`;
    }
    return product.imageUrl || `https://via.placeholder.com/300x220/667eea/ffffff?text=${encodeURIComponent(product.name)}`;
  };

  const filteredProducts = products
    .filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || product.categoryName === categories.find(c => c.id === selectedCategory)?.name;
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return (b.rating || 0) - (a.rating || 0);
        case 'newest':
          return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
        default:
          return a.name.localeCompare(b.name);
      }
  });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'warning';
      case 'confirmed': return 'info';
      case 'shipped': return 'primary';
      case 'delivered': return 'success';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 4
    }}>
      <Container maxWidth="xl">
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

        {/* Heritage Store Header */}
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
                  <StoreIcon sx={{ fontSize: 32 }} />
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
                    Heritage Store
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Discover our premium collection
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Quality products for your lifestyle
        </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                  }}
                >
                  <RefreshIcon sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
        <Button
          variant="contained"
          startIcon={<ShoppingCartIcon />}
          onClick={() => setCartOpen(true)}
                  sx={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: 2,
                    px: 3,
                    py: 1.5,
                    fontWeight: 'bold',
                    boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      boxShadow: '0 8px 30px rgba(102, 126, 234, 0.6)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Cart ({cart?.itemCount || 0})
        </Button>
      </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Search and Filter */}
        <Fade in timeout={1000}>
          <Paper sx={{ 
            p: 3, 
            mb: 4, 
            borderRadius: 3,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
              <Box sx={{ flex: 1, minWidth: 250 }}>
            <TextField
              fullWidth
                  placeholder="Search products, brands, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                        <SearchIcon sx={{ color: 'primary.main' }} />
                  </InputAdornment>
                ),
              }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      '&:hover fieldset': {
                        borderColor: 'primary.main',
                      },
                    },
              }}
            />
          </Box>
              <Box sx={{ minWidth: 200 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as number | '')}
                label="Category"
                    sx={{ borderRadius: 2 }}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name} ({category.productCount})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
              <Box sx={{ minWidth: 150 }}>
                <FormControl fullWidth>
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="name">Name A-Z</MenuItem>
                    <MenuItem value="price-low">Price: Low to High</MenuItem>
                    <MenuItem value="price-high">Price: High to Low</MenuItem>
                    <MenuItem value="rating">Highest Rated</MenuItem>
                    <MenuItem value="newest">Newest First</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Paper>
        </Fade>

        {/* Products Grid with Enhanced Design */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          {filteredProducts.map((product, index) => (
            <Grow in timeout={1200 + index * 100} key={product.id}>
              <Box sx={{ 
                width: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                maxWidth: { xs: '100%', sm: 'calc(50% - 12px)', md: 'calc(33.333% - 16px)' },
                minWidth: '280px'
              }}>
                <Card sx={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': { 
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
                  }
                }}
                onMouseEnter={(e) => handleProductHover(product, e)}
                onMouseLeave={handleProductLeave}
                onClick={() => handleProductClick(product.id)}>
                  <Box sx={{ 
                    position: 'relative', 
                    height: 220, 
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '12px 12px 0 0'
                  }}>
                    {/* Loading Skeleton */}
                    {imageLoading[product.id] && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
                          backgroundSize: '200% 100%',
                          animation: 'loading 1.5s infinite',
                          '@keyframes loading': {
                            '0%': { backgroundPosition: '200% 0' },
                            '100%': { backgroundPosition: '-200% 0' }
                          }
                        }}
                      />
                    )}
                    
              <CardMedia
                component="img"
                      image={getImageUrl(product)}
                alt={product.name}
                      onLoad={() => handleImageLoad(product.id)}
                      onError={() => handleImageError(product.id)}
                      sx={{ 
                        objectFit: 'contain', 
                        borderRadius: '12px 12px 0 0',
                        maxWidth: '90%',
                        maxHeight: '90%',
                        width: 'auto',
                        height: 'auto',
                        transition: 'transform 0.3s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    {/* Product Badges */}
                    <Box sx={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {product.isNew && (
                        <Chip 
                          label="NEW" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#4caf50', 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }} 
                        />
                      )}
                      {product.isOnSale && (
                        <Chip 
                          label="SALE" 
                          size="small" 
                          sx={{ 
                            bgcolor: '#f44336', 
                            color: 'white', 
                            fontWeight: 'bold',
                            fontSize: '0.7rem'
                          }} 
                        />
                      )}
                    </Box>
                    {/* Wishlist Button */}
                    <IconButton
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: 'rgba(255,255,255,0.9)',
                        backdropFilter: 'blur(10px)',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,1)',
                          transform: 'scale(1.1)'
                        }
                      }}
                      onClick={() => toggleWishlist(product.id)}
                    >
                      {wishlist.includes(product.id) ? (
                        <FavoriteIcon sx={{ color: '#e91e63' }} />
                      ) : (
                        <FavoriteBorderIcon />
                      )}
                    </IconButton>
                  </Box>
                  
                  <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                    <Typography gutterBottom variant="h6" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  {product.name}
                </Typography>
                    {product.brand && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 500 }}>
                        by {product.brand}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
                  {product.description}
                </Typography>
                    
                    {/* Rating */}
                    {product.rating && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Rating value={product.rating} size="small" readOnly />
                        <Typography variant="body2" color="text.secondary">
                          ({product.reviewCount || 0})
                        </Typography>
                      </Box>
                    )}
                    
                    <Chip 
                      label={product.categoryName} 
                      size="small" 
                      sx={{ 
                        mb: 2, 
                        alignSelf: 'flex-start',
                        bgcolor: 'rgba(102, 126, 234, 0.1)',
                        color: 'primary.main',
                        fontWeight: 'bold'
                      }} 
                    />
                    
                    {/* Price */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      {product.isOnSale && product.salePrice ? (
                        <>
                          <Typography variant="h6" sx={{ 
                            fontWeight: 'bold',
                            background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                            backgroundClip: 'text',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}>
                            ${product.salePrice.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" sx={{ 
                            textDecoration: 'line-through', 
                            color: 'text.secondary' 
                          }}>
                            ${product.price.toFixed(2)}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="h6" sx={{ 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          ${product.price.toFixed(2)}
                        </Typography>
                      )}
                      {product.unit && (
                        <Typography variant="body2" color="text.secondary">
                          / {product.unit}
                </Typography>
                      )}
                    </Box>
                    
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Available: {product.availableQuantity} {product.unit}
                </Typography>
                    
                    {/* Action Buttons */}
                <Box sx={{ display: 'flex', gap: 1, mt: 'auto' }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          addToCart(product.id);
                        }}
                    disabled={!product.isAvailable || product.availableQuantity === 0}
                    fullWidth
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
                    Add to Cart
                  </Button>
                      <Tooltip title="View Details">
                  <IconButton
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/product/${product.id}`);
                          }}
                          sx={{
                            bgcolor: 'rgba(102, 126, 234, 0.1)',
                            '&:hover': {
                              bgcolor: 'rgba(102, 126, 234, 0.2)',
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <ViewIcon sx={{ color: 'primary.main' }} />
                  </IconButton>
                      </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Box>
            </Grow>
        ))}
      </Box>

      {/* Hover Image Popup */}
      {hoveredProduct && (
        <Box
          sx={{
            position: 'fixed',
            top: hoverPosition.y - 200,
            left: hoverPosition.x + 20,
            zIndex: 9999,
            pointerEvents: 'none',
            animation: 'fadeInScale 0.3s ease-out',
            '@keyframes fadeInScale': {
              '0%': {
                opacity: 0,
                transform: 'scale(0.8) translateY(20px)',
              },
              '100%': {
                opacity: 1,
                transform: 'scale(1) translateY(0)',
              },
            },
          }}
        >
          <Paper
            sx={{
              p: 2,
              borderRadius: 3,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              maxWidth: 300,
            }}
          >
            <Box sx={{ 
              height: 200, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f8f9fa',
              borderRadius: 2,
              mb: 2,
              overflow: 'hidden'
            }}>
              <CardMedia
                component="img"
                image={getImageUrl(hoveredProduct)}
                alt={hoveredProduct.name}
                sx={{ 
                  objectFit: 'contain', 
                  borderRadius: 2,
                  maxWidth: '90%',
                  maxHeight: '90%',
                  width: 'auto',
                  height: 'auto'
                }}
              />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {hoveredProduct.name}
            </Typography>
            {hoveredProduct.brand && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                by {hoveredProduct.brand}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {hoveredProduct.description}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography variant="h6" sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                ${hoveredProduct.price.toFixed(2)}
          </Typography>
              <Chip 
                label={hoveredProduct.categoryName} 
                size="small" 
                sx={{ 
                  bgcolor: 'rgba(102, 126, 234, 0.1)',
                  color: 'primary.main',
                  fontWeight: 'bold'
                }} 
              />
            </Box>
          </Paper>
        </Box>
      )}

        {filteredProducts.length === 0 && !loading && (
          <Fade in timeout={1400}>
            <Paper sx={{ 
              p: 6, 
              textAlign: 'center', 
              mt: 4,
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
              <Typography variant="h5" color="text.secondary" sx={{ mb: 2 }}>
                No products found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                Try adjusting your search criteria or browse all categories
          </Typography>
              <Button 
                variant="contained" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setSortBy('name');
                }}
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  fontWeight: 'bold'
                }}
              >
                Clear Filters
              </Button>
            </Paper>
          </Fade>
      )}

      {/* Shopping Cart Dialog */}
      <Dialog open={cartOpen} onClose={() => setCartOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Shopping Cart ({cart?.itemCount || 0} items)
        </DialogTitle>
        <DialogContent>
          {cart && cart.items.length > 0 ? (
            <List>
              {cart.items.map((item) => (
                <React.Fragment key={item.id}>
                  <ListItem>
                    <ListItemText
                      primary={item.productName}
                      secondary={`${item.quantity} × $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateCartItem(item.id, Math.max(1, item.quantity - 1))}
                      >
                        <RemoveIcon />
                      </IconButton>
                      <Typography variant="body2" sx={{ minWidth: 20, textAlign: 'center' }}>
                        {item.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateCartItem(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.availableQuantity}
                      >
                        <AddIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => removeFromCart(item.id)}
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          ) : (
            <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Your cart is empty
            </Typography>
          )}
          
          {cart && cart.items.length > 0 && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Subtotal:</Typography>
                <Typography>${cart.subTotal.toFixed(2)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Tax:</Typography>
                <Typography>${cart.tax.toFixed(2)}</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Total:</Typography>
                <Typography variant="h6">${cart.total.toFixed(2)}</Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCartOpen(false)}>Continue Shopping</Button>
          {cart && cart.items.length > 0 && (
            <>
              <Button onClick={clearCart} color="error">Clear Cart</Button>
              <Button variant="contained" onClick={() => { setCartOpen(false); setCheckoutOpen(true); }}>
                Checkout
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onClose={() => setCheckoutOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Checkout</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Full Name"
              value={checkoutData.customerName}
              onChange={(e) => setCheckoutData({ ...checkoutData, customerName: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={checkoutData.customerEmail}
              onChange={(e) => setCheckoutData({ ...checkoutData, customerEmail: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Phone"
              value={checkoutData.customerPhone}
              onChange={(e) => setCheckoutData({ ...checkoutData, customerPhone: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Delivery Address"
              multiline
              rows={3}
              value={checkoutData.customerAddress}
              onChange={(e) => setCheckoutData({ ...checkoutData, customerAddress: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Delivery Date"
              type="date"
              value={checkoutData.deliveryDate}
              onChange={(e) => setCheckoutData({ ...checkoutData, deliveryDate: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
              inputProps={{
                min: (() => {
                  const today = new Date();
                  const minDate = new Date(today);
                  minDate.setDate(today.getDate() + 2); // Minimum 2 days from today
                  return minDate.toISOString().split('T')[0];
                })()
              }}
              helperText="Delivery date must be at least 2 days from today"
              required
            />
            <TextField
              fullWidth
              label="Notes"
              multiline
              rows={2}
              value={checkoutData.notes}
              onChange={(e) => setCheckoutData({ ...checkoutData, notes: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCheckoutOpen(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleCheckout}
            disabled={!checkoutData.customerName || !checkoutData.customerAddress || !checkoutData.deliveryDate}
          >
            Place Order
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
    </Box>
  );
};

export default CustomerStore;
