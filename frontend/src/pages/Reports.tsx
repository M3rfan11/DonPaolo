import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  IconButton,
  Container,
  Fade,
  Grow,
  Avatar,
  TextField,
} from '@mui/material';
import {
  ShoppingCart,
  AttachMoney,
  Assessment,
  Refresh,
  Star,
  EmojiEvents,
} from '@mui/icons-material';
import apiService from '../services/api';

interface SalesReport {
  fromDate?: string;
  toDate?: string;
  storeId?: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  dailyData: DailySalesData[];
  topProducts: TopProductData[];
  generatedAt: string;
}


interface QuarterlyPurchaseData {
  quarter: number;
  totalPurchases: number;
  orderCount: number;
  averageOrderValue: number;
  topSuppliers: TopSupplierData[];
  topProducts: TopProductData[];
  storeBreakdown: StoreBreakdownData[];
}

interface TopProductData {
  productId: number;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
}

interface TopSupplierData {
  supplierName: string;
  totalOrders: number;
  totalAmount: number;
  averageOrderValue: number;
}

interface RecentPurchaseOrderData {
  id: number;
  orderNumber: string;
  orderDate: string;
  supplierName: string;
  totalAmount: number;
  status: string;
}

interface PeakHourData {
  hour: number;
  totalSales: number;
  orderCount: number;
}

interface HourlySalesData {
  hour: number;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

interface DailySalesData {
  date: string;
  dayOfWeek: string;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
}

interface StoreBreakdownData {
  storeId: number;
  storeName: string;
  totalSales: number;
  orderCount: number;
}


const Reports: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states - Date range instead of year/quarter
  const [fromDate, setFromDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [toDate, setToDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);

  useEffect(() => {
    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate]);


  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading sales report with params:', { fromDate, toDate });
      
      const from = fromDate ? new Date(fromDate) : undefined;
      const to = toDate ? new Date(toDate) : undefined;
      
      const sales = await apiService.getSalesReport(from, to);
      
      console.log('Sales report loaded successfully:', sales);
      
      setSalesReport(sales);
    } catch (error: any) {
      console.error('Error loading sales report:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error loading sales report';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadReports();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };


  const renderSalesReport = () => {
    if (!salesReport) return null;

    // Get top 3 selling items
    const top3Products = salesReport.topProducts?.slice(0, 3) || [];
    const medalColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    const medalLabels = ['🥇', '🥈', '🥉'];

    return (
      <Box>
        {/* Top 3 Selling Items - Prominent Display */}
        {top3Products.length > 0 && (
          <Card sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)',
            border: '2px solid #000000',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <EmojiEvents sx={{ fontSize: 32, color: '#FFD700', mr: 1 }} />
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#000000' }}>
                  Top 3 Selling Items
                </Typography>
              </Box>
              <Box sx={{ 
                display: 'grid',
                gridTemplateColumns: { 
                  xs: '1fr',
                  sm: 'repeat(2, 1fr)',
                  md: 'repeat(3, 1fr)'
                },
                gap: 3
              }}>
                {top3Products.map((product, index) => (
                  <Grow in timeout={600 + index * 200} key={product.productId}>
                    <Card sx={{ 
                      position: 'relative',
                      background: index === 0 
                        ? 'linear-gradient(135deg, #fff9e6 0%, #ffffff 100%)'
                        : index === 1
                        ? 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)'
                        : 'linear-gradient(135deg, #faf5f0 0%, #ffffff 100%)',
                      border: `2px solid ${medalColors[index]}`,
                      borderRadius: 2,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
                      }
                    }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
                          <Box sx={{ 
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            background: medalColors[index],
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.5rem',
                            mr: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                          }}>
                            {index + 1}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold',
                              color: '#000000',
                              mb: 0.5,
                              lineHeight: 1.2
                            }}>
                              {product.productName}
                            </Typography>
                            <Chip 
                              icon={<Star sx={{ fontSize: 16 }} />}
                              label={medalLabels[index]}
                              size="small"
                              sx={{ 
                                bgcolor: medalColors[index],
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                          </Box>
                        </Box>
                        <Divider sx={{ my: 2 }} />
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Quantity Sold:
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#000000' }}>
                              {formatNumber(product.totalQuantity)}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" color="text.secondary">
                              Total Revenue:
                            </Typography>
                            <Typography variant="h6" sx={{ 
                              fontWeight: 'bold',
                              color: '#000000'
                            }}>
                              {formatCurrency(product.totalRevenue)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grow>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Summary Cards */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { 
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)'
          },
          gap: { xs: 2, sm: 3 },
          mb: 3 
        }}>
          <Box>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney sx={{ mr: 1, color: '#000000' }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(salesReport.totalSales)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ShoppingCart sx={{ mr: 1, color: '#000000' }} />
                  <Box>
                    <Typography variant="h6">{formatNumber(salesReport.totalOrders)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment sx={{ mr: 1, color: '#000000' }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(salesReport.averageOrderValue)}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Daily Sales Breakdown */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Daily Sales Breakdown</Typography>
            {salesReport.dailyData && salesReport.dailyData.length > 0 ? (
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 500 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Day</strong></TableCell>
                      <TableCell align="right"><strong>Total Sales</strong></TableCell>
                      <TableCell align="right"><strong>Orders</strong></TableCell>
                      <TableCell align="right"><strong>Avg Order</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesReport.dailyData.map((day, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {new Date(day.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{day.dayOfWeek}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                            {formatCurrency(day.totalSales)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatNumber(day.orderCount)}</TableCell>
                        <TableCell align="right">{formatCurrency(day.averageOrderValue)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No sales data for the selected date range
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Top Products */}
        {salesReport.topProducts && salesReport.topProducts.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Top Products</Typography>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table sx={{ minWidth: 400 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell align="right"><strong>Quantity Sold</strong></TableCell>
                      <TableCell align="right"><strong>Total Revenue</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesReport.topProducts.map((product, index) => (
                      <TableRow key={product.productId}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {product.productName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatNumber(product.totalQuantity)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: '#000000' }}>
                            {formatCurrency(product.totalRevenue)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: '#ffffff',
      p: { xs: 2, sm: 3, md: 4 }
    }}>
      <Container maxWidth="xl">
        {/* Heritage Brand Header */}
        <Fade in timeout={800}>
          <Paper sx={{ 
            p: 4, 
            mb: 4, 
            borderRadius: 3,
            background: '#ffffff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            border: '1px solid rgba(255,255,255,0.2)'
          }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              justifyContent: 'space-between', 
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: { xs: 2, sm: 0 },
              mb: 3 
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2, md: 3 } }}>
                <Avatar sx={{ 
                  bgcolor: '#000000', 
                  width: { xs: 48, sm: 56, md: 64 }, 
                  height: { xs: 48, sm: 56, md: 64 },
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                }}>
                  <Assessment sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: 'white' }} />
                </Avatar>
                <Box>
                  <Typography variant="h3" sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
                    color: '#000000',
                    mb: 1
                  }}>
                    Reports & Analytics
                  </Typography>
                  <Typography 
                    variant="h6" 
                    color="text.secondary" 
                    sx={{ 
                      fontWeight: 300,
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Comprehensive business insights and performance metrics
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.1)' }
                  }}
                >
                  <Refresh />
                </IconButton>
                <Chip 
                  icon={<Star sx={{ color: '#000000' }} />} 
                  label="DON PAOLO" 
                  sx={{ 
                    bgcolor: 'rgba(0, 0, 0, 0.05)',
                    color: '#000000',
                    fontWeight: 'bold',
                    border: '1px solid rgba(0, 0, 0, 0.2)'
                  }}
                />
              </Box>
            </Box>
          </Paper>
        </Fade>

        {/* Enhanced Filters */}
        <Paper sx={{ 
          mb: 4, 
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Filters
            </Typography>
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
              gap: 2,
              alignItems: 'center'
            }}>
              <Box>
                <TextField
                  fullWidth
                  label="From Date"
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Box>
              <Box>
                <TextField
                  fullWidth
                  label="To Date"
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  size="small"
                />
              </Box>
              <Box>
                <Button
                  variant="contained"
                  onClick={loadReports}
                  disabled={loading}
                  fullWidth
                  startIcon={<Refresh />}
                  sx={{
                    background: '#000000',
                    borderRadius: 2,
                    fontWeight: 'bold',
                    height: '40px',
                    color: 'white',
                    '&:hover': {
                      background: '#333333',
                      boxShadow: '0 8px 20px rgba(0, 0, 0, 0.3)',
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  {loading ? 'Loading...' : 'Apply Filters'}
                </Button>
              </Box>
            </Box>
          </CardContent>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        {loading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

        {/* Sales Report */}
        <Paper sx={{ 
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ p: 3 }}>
            {renderSalesReport()}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Reports;