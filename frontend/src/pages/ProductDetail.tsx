import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Rating,
  Paper,
  Fade,
  Grow,
  Tooltip,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  ShoppingCart as ShoppingCartIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Share as ShareIcon,
  LocalShipping as ShippingIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Store as StoreIcon,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
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

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [wishlist, setWishlist] = useState<number[]>([]);
  const [addingToCart, setAddingToCart] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      // For now, we'll simulate loading a product
      // In a real app, you'd call api.getProduct(id)
      const products = await api.getCustomerProducts();
      const foundProduct = products.find((p: Product) => p.id === parseInt(id!));
      
      if (foundProduct) {
        setProduct(foundProduct);
      } else {
        setError('Product not found');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      await api.addToCart(product.id, quantity);
      // Show success message or navigate to cart
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const toggleWishlist = () => {
    if (!product) return;
    setWishlist(prev => 
      prev.includes(product.id) 
        ? prev.filter(id => id !== product.id)
        : [...prev, product.id]
    );
  };

  const shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        text: product?.description,
        url: window.location.href,
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const getImageUrl = (product: Product) => {
    if (imageError) {
      return `https://via.placeholder.com/500x500/667eea/ffffff?text=${encodeURIComponent(product.name)}`;
    }
    return product.imageUrl || `https://via.placeholder.com/500x500/667eea/ffffff?text=${encodeURIComponent(product.name)}`;
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <CircularProgress size={60} sx={{ color: 'white' }} />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Container maxWidth="sm">
          <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
            <Typography variant="h5" color="error" sx={{ mb: 2 }}>
              {error || 'Product not found'}
            </Typography>
            <Button 
              variant="contained" 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/customer-store')}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: 2,
                px: 3,
                py: 1.5,
                fontWeight: 'bold'
              }}
            >
              Back to Store
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      p: 4
    }}>
      <Container maxWidth="lg">
        {/* Breadcrumbs */}
        <Fade in timeout={800}>
          <Box sx={{ pt: 3, pb: 2 }}>
            <Breadcrumbs sx={{ color: 'white' }}>
              <Link 
                color="inherit" 
                onClick={() => navigate('/customer-store')}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                Heritage Store
              </Link>
              <Link 
                color="inherit" 
                onClick={() => navigate('/customer-store')}
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
              >
                {product.categoryName}
              </Link>
              <Typography color="inherit">{product.name}</Typography>
            </Breadcrumbs>
          </Box>
        </Fade>

        {/* Product Detail Card */}
        <Fade in timeout={1000}>
          <Paper sx={{ 
            borderRadius: 3,
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            overflow: 'hidden'
          }}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Product Image */}
              <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                <Box sx={{ 
                  position: 'relative', 
                  height: { xs: 300, md: 500 }, 
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f8f9fa'
                }}>
                  {/* Loading Skeleton */}
                  {imageLoading && (
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
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    sx={{ 
                      objectFit: 'contain',
                      maxWidth: '90%',
                      maxHeight: '90%',
                      width: 'auto',
                      height: 'auto',
                      transition: 'transform 0.3s ease',
                      '&:hover': {
                        transform: 'scale(1.02)'
                      }
                    }}
                  />
                  
                  {/* Product Badges */}
                  <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
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

                  {/* Action Buttons */}
                  <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Tooltip title={wishlist.includes(product.id) ? "Remove from Wishlist" : "Add to Wishlist"}>
                      <IconButton
                        onClick={toggleWishlist}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,1)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        {wishlist.includes(product.id) ? (
                          <FavoriteIcon sx={{ color: '#e91e63' }} />
                        ) : (
                          <FavoriteBorderIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Share">
                      <IconButton
                        onClick={shareProduct}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.9)',
                          backdropFilter: 'blur(10px)',
                          '&:hover': {
                            bgcolor: 'rgba(255,255,255,1)',
                            transform: 'scale(1.1)'
                          }
                        }}
                      >
                        <ShareIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </Box>

              {/* Product Info */}
              <Box sx={{ flex: '1 1 50%', minWidth: 0 }}>
                <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  {/* Header */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ 
                        bgcolor: 'primary.main',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        width: 48,
                        height: 48
                      }}>
                        <StoreIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="h4" sx={{ 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          mb: 0.5
                        }}>
                          Heritage Store
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Premium Quality Products
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {product.name}
                    </Typography>
                    
                    {product.brand && (
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2, fontWeight: 500 }}>
                        by {product.brand}
                      </Typography>
                    )}

                    <Chip 
                      label={product.categoryName} 
                      sx={{ 
                        mb: 2,
                        bgcolor: 'rgba(102, 126, 234, 0.1)',
                        color: 'primary.main',
                        fontWeight: 'bold'
                      }} 
                    />
                  </Box>

                  {/* Rating */}
                  {product.rating && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Rating value={product.rating} size="large" readOnly />
                      <Typography variant="body1" color="text.secondary">
                        ({product.reviewCount || 0} reviews)
                      </Typography>
                    </Box>
                  )}

                  {/* Description */}
                  <Typography variant="body1" sx={{ mb: 3, lineHeight: 1.6 }}>
                    {product.description || 'No description available for this product.'}
                  </Typography>

                  {/* Price */}
                  <Box sx={{ mb: 3 }}>
                    {product.isOnSale && product.salePrice ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="h3" sx={{ 
                          fontWeight: 'bold',
                          background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}>
                          ${product.salePrice.toFixed(2)}
                        </Typography>
                        <Typography variant="h5" sx={{ 
                          textDecoration: 'line-through', 
                          color: 'text.secondary' 
                        }}>
                          ${product.price.toFixed(2)}
                        </Typography>
                        <Chip 
                          label={`Save $${(product.price - product.salePrice).toFixed(2)}`}
                          color="error"
                          size="small"
                        />
                      </Box>
                    ) : (
                      <Typography variant="h3" sx={{ 
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
                      <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                        per {product.unit}
                      </Typography>
                    )}
                  </Box>

                  {/* Availability */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CheckCircleIcon color={product.isAvailable ? 'success' : 'error'} />
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        {product.isAvailable ? 'In Stock' : 'Out of Stock'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Available: {product.availableQuantity} {product.unit}
                    </Typography>
                  </Box>

                  {/* Quantity and Add to Cart */}
                  <Box sx={{ mt: 'auto' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                      <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                        Quantity:
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <IconButton
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          -
                        </IconButton>
                        <Typography variant="h6" sx={{ minWidth: 40, textAlign: 'center' }}>
                          {quantity}
                        </Typography>
                        <IconButton
                          onClick={() => setQuantity(Math.min(product.availableQuantity, quantity + 1))}
                          disabled={quantity >= product.availableQuantity}
                          sx={{ border: '1px solid', borderColor: 'divider' }}
                        >
                          +
                        </IconButton>
                      </Box>
                    </Box>

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={<ShoppingCartIcon />}
                      onClick={addToCart}
                      disabled={!product.isAvailable || product.availableQuantity === 0 || addingToCart}
                      fullWidth
                      sx={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: 2,
                        py: 2,
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        '&:hover': {
                          boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      {addingToCart ? (
                        <>
                          <CircularProgress size={20} sx={{ mr: 1 }} />
                          Adding to Cart...
                        </>
                      ) : (
                        'Add to Cart'
                      )}
                    </Button>
                  </Box>
                </CardContent>
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Back Button */}
        <Fade in timeout={1200}>
          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button 
              variant="outlined" 
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/customer-store')}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Back to Store
            </Button>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default ProductDetail;
