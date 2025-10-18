import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  TrendingUp,
  Inventory,
  LocalOffer,
  CheckCircle,
  Info,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface SuggestedOfferItem {
  productId: number;
  productName: string;
  suggestedQuantity: number;
  unitPrice: number;
  availableQuantity: number;
  category: string;
}

interface SuggestedOffer {
  offerName: string;
  description: string;
  items: SuggestedOfferItem[];
  individualTotalPrice: number;
  suggestedPrice: number;
  savings: number;
  discountPercentage: number;
  maxQuantityAvailable: number;
  estimatedProfitMargin: number;
}

const OfferSuggestions: React.FC = () => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<SuggestedOffer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedOffer, setSelectedOffer] = useState<SuggestedOffer | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      setLoading(true);
      setError('');
      const request = {
        storeId: user?.roles?.includes('SuperAdmin') ? undefined : user?.assignedStoreId,
        maxSuggestions: 8
      };
      const data = await api.suggestAssemblyOffers(request);
      setSuggestions(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load offer suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOffer = async (offer: SuggestedOffer) => {
    try {
      setCreating(true);
      const offerData = {
        name: offer.offerName,
        description: offer.description,
        salePrice: offer.suggestedPrice,
        storeId: user?.roles?.includes('SuperAdmin') ? undefined : user?.assignedStoreId,
        items: offer.items.map(item => ({
          productId: item.productId,
          quantity: item.suggestedQuantity,
          notes: `Suggested quantity based on inventory levels`
        }))
      };

      await api.createAssemblyOffer(offerData);
      setCreateDialogOpen(false);
      setSelectedOffer(null);
      // Refresh suggestions after creating an offer
      loadSuggestions();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create offer');
    } finally {
      setCreating(false);
    }
  };

  const getProfitColor = (margin: number) => {
    if (margin >= 30) return 'success';
    if (margin >= 20) return 'warning';
    return 'error';
  };

  const getInventoryColor = (available: number) => {
    if (available >= 10) return 'success';
    if (available >= 5) return 'warning';
    return 'error';
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Smart Offer Suggestions
        </Typography>
        <Button
          variant="outlined"
          startIcon={<TrendingUp />}
          onClick={loadSuggestions}
          disabled={loading}
        >
          Refresh Suggestions
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {suggestions.length === 0 && !loading ? (
        <Alert severity="info">
          No offer suggestions available. Make sure you have products with inventory in your store.
        </Alert>
      ) : (
        <Grid container spacing={3}>
          {suggestions.map((offer, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" sx={{ fontWeight: 'bold' }}>
                      {offer.offerName}
                    </Typography>
                    <Chip
                      label={`${offer.discountPercentage.toFixed(0)}% OFF`}
                      color="primary"
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {offer.description}
                  </Typography>

                  <Box mb={2}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      <strong>Items included:</strong>
                    </Typography>
                    {offer.items.map((item, itemIndex) => (
                      <Box key={itemIndex} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                        <Typography variant="body2">
                          {item.suggestedQuantity}x {item.productName}
                        </Typography>
                        <Chip
                          label={`${item.availableQuantity} available`}
                          size="small"
                          color={getInventoryColor(item.availableQuantity) as any}
                          variant="outlined"
                        />
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Individual Total:
                    </Typography>
                    <Typography variant="body2" sx={{ textDecoration: 'line-through' }}>
                      ${offer.individualTotalPrice.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Typography variant="body2" color="text.secondary">
                      Offer Price:
                    </Typography>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                      ${offer.suggestedPrice.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      You Save:
                    </Typography>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                      ${offer.savings.toFixed(2)}
                    </Typography>
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Profit Margin:
                    </Typography>
                    <Chip
                      label={`${offer.estimatedProfitMargin.toFixed(0)}%`}
                      color={getProfitColor(offer.estimatedProfitMargin) as any}
                      size="small"
                    />
                  </Box>

                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Max Available:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {offer.maxQuantityAvailable} offers
                    </Typography>
                  </Box>
                </CardContent>

                <Box p={2} pt={0}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => {
                      setSelectedOffer(offer);
                      setCreateDialogOpen(true);
                    }}
                    disabled={offer.maxQuantityAvailable === 0}
                  >
                    Create This Offer
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Assembly Offer</DialogTitle>
        <DialogContent>
          {selectedOffer && (
            <Box>
              <Typography variant="h6" sx={{ mb: 2 }}>
                {selectedOffer.offerName}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {selectedOffer.description}
              </Typography>

              <Box mb={2}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Items to include:
                </Typography>
                {selectedOffer.items.map((item, index) => (
                  <Box key={index} display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
                    <Typography variant="body2">
                      {item.suggestedQuantity}x {item.productName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ${item.unitPrice.toFixed(2)} each
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  <strong>Offer Price:</strong>
                </Typography>
                <Typography variant="h6" color="primary">
                  ${selectedOffer.suggestedPrice.toFixed(2)}
                </Typography>
              </Box>

              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="body2">
                  <strong>Savings:</strong>
                </Typography>
                <Typography variant="body2" color="success.main">
                  ${selectedOffer.savings.toFixed(2)} ({selectedOffer.discountPercentage.toFixed(0)}% off)
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  This offer can be created up to {selectedOffer.maxQuantityAvailable} times based on current inventory levels.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)} disabled={creating}>
            Cancel
          </Button>
          <Button
            onClick={() => selectedOffer && handleCreateOffer(selectedOffer)}
            variant="contained"
            disabled={creating}
            startIcon={creating ? <CircularProgress size={20} /> : <CheckCircle />}
          >
            {creating ? 'Creating...' : 'Create Offer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OfferSuggestions;
