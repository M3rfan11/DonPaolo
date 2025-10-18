import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
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
  Tabs,
  Tab,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip,
  Container,
  Fade,
  Grow,
  Avatar,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Assessment,
  Store,
  Schedule,
  ShoppingCart,
  AttachMoney,
  BarChart,
  PieChart,
  Refresh,
  Star,
  Inventory,
  SwapHoriz,
  Warning,
} from '@mui/icons-material';
import apiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

interface SalesReport {
  year: number;
  quarter?: number;
  storeId?: number;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  quarterlyData: QuarterlySalesData[];
  topProducts: TopProductData[];
  storePerformance: StorePerformanceData[];
  generatedAt: string;
}

interface PurchaseReport {
  year: number;
  quarter?: number;
  storeId?: number;
  totalPurchases: number;
  totalOrders: number;
  averageOrderValue: number;
  quarterlyData: QuarterlyPurchaseData[];
  topSuppliers: TopSupplierData[];
  recentOrders?: RecentPurchaseOrderData[];
  generatedAt: string;
}

interface PeakSalesReport {
  year: number;
  quarter?: number;
  storeId?: number;
  hourlyAnalysis: HourlySalesData[];
  dailyAnalysis: DailySalesData[];
  peakHours: PeakHourData[];
  peakDays: DailySalesData[];
  generatedAt: string;
}

interface QuarterlySalesData {
  quarter: number;
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  topProducts: TopProductData[];
  peakHours: PeakHourData[];
  storeBreakdown: StoreBreakdownData[];
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

interface StorePerformanceData {
  storeId: number;
  storeName: string;
  totalSales: number;
  averageOrderValue: number;
}

interface ProductMovementReport {
  fromDate: string;
  toDate: string;
  productId?: number;
  productName?: string;
  warehouseId?: number;
  warehouseName?: string;
  movementType?: string;
  direction?: string;
  totalRecords: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  movements: ProductMovement[];
  summary: ProductMovementSummary;
}

interface ProductMovement {
  id: number;
  productId: number;
  productName: string;
  productSKU: string;
  warehouseId: number;
  warehouseName: string;
  movementType: string;
  quantity: number;
  unit: string;
  direction: string;
  description?: string;
  referenceNumber?: string;
  referenceId?: number;
  referenceType?: string;
  createdByUserName?: string;
  movementDate: string;
  createdAt: string;
  notes?: string;
}

interface ProductMovementSummary {
  productId: number;
  productName: string;
  productSKU: string;
  warehouseId: number;
  warehouseName: string;
  summaryDate: string;
  openingBalance: number;
  totalIn: number;
  totalOut: number;
  closingBalance: number;
  purchaseCount: number;
  saleCount: number;
  assemblyCount: number;
  transferCount: number;
  adjustmentCount: number;
  netMovement: number;
}

interface ProductMovementAnalytics {
  fromDate: string;
  toDate: string;
  totalMovements: number;
  totalProducts: number;
  totalWarehouses: number;
  totalQuantityIn: number;
  totalQuantityOut: number;
  netMovement: number;
  movementTypeCounts: Record<string, number>;
  movementTypeQuantities: Record<string, number>;
  topMovingProducts: ProductMovementSummary[];
  warehouseActivity: ProductMovementSummary[];
  recentMovements: ProductMovement[];
}

const Reports: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  const [selectedStore, setSelectedStore] = useState<number | null>(null);
  
  // Report data
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [purchaseReport, setPurchaseReport] = useState<PurchaseReport | null>(null);
  const [peakSalesReport, setPeakSalesReport] = useState<PeakSalesReport | null>(null);
  const [movementReport, setMovementReport] = useState<ProductMovementReport | null>(null);
  const [movementAnalytics, setMovementAnalytics] = useState<ProductMovementAnalytics | null>(null);
  
  // Movement report filters
  const [movementFromDate, setMovementFromDate] = useState<string>('');
  const [movementToDate, setMovementToDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [selectedWarehouse, setSelectedWarehouse] = useState<number | null>(null);
  const [selectedMovementType, setSelectedMovementType] = useState<string>('');
  const [selectedDirection, setSelectedDirection] = useState<string>('');
  
  // Available stores
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    loadStores();
    loadProducts();
    loadReports();
  }, [selectedYear, selectedQuarter, selectedStore]);

  useEffect(() => {
    if (activeTab === 3) { // Inventory Movement tab
      loadMovementReports();
    }
  }, [activeTab, movementFromDate, movementToDate, selectedProduct, selectedWarehouse, selectedMovementType, selectedDirection]);

  const loadStores = async () => {
    try {
      const warehouses = await apiService.getWarehouses();
      setStores(warehouses);
    } catch (error) {
      console.error('Error loading stores:', error);
    }
  };

  const loadProducts = async () => {
    try {
      const productsData = await apiService.getProducts();
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const loadMovementReports = async () => {
    try {
      setLoading(true);
      setError(null);

      // Set default date range if not set
      const fromDate = movementFromDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const toDate = movementToDate || new Date().toISOString().split('T')[0];

      // Load movement report
      const reportRequest = {
        fromDate: new Date(fromDate),
        toDate: new Date(toDate),
        productId: selectedProduct || undefined,
        warehouseId: selectedWarehouse || undefined,
        movementType: selectedMovementType || undefined,
        direction: selectedDirection || undefined,
        pageNumber: 1,
        pageSize: 50,
        sortBy: 'MovementDate',
        sortDirection: 'desc'
      };

      const reportData = await apiService.getProductMovementReport(reportRequest);
      setMovementReport(reportData);

      // Load movement analytics
      const analyticsData = await apiService.getProductMovementAnalytics(
        fromDate,
        toDate
      );
      setMovementAnalytics(analyticsData);

    } catch (error) {
      console.error('Error loading movement reports:', error);
      setError('Failed to load movement reports');
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('Loading reports with params:', { selectedYear, selectedQuarter, selectedStore });
      
      const [sales, purchases, peakSales] = await Promise.all([
        apiService.getSalesReport(selectedYear, selectedQuarter || undefined, selectedStore || undefined),
        apiService.getPurchaseReport(selectedYear, selectedQuarter || undefined, selectedStore || undefined),
        apiService.getPeakSalesAnalysis(selectedYear, selectedQuarter || undefined, selectedStore || undefined)
      ]);
      
      console.log('Reports loaded successfully:', { sales, purchases, peakSales });
      
      setSalesReport(sales);
      setPurchaseReport(purchases);
      setPeakSalesReport(peakSales);
    } catch (error: any) {
      console.error('Error loading reports:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Error loading reports';
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

  const getQuarterName = (quarter: number) => {
    const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];
    return quarters[quarter - 1] || `Q${quarter}`;
  };

  const getStoreName = (storeId: number) => {
    const store = stores.find(s => s.id === storeId);
    return store?.name || `Store ${storeId}`;
  };

  const renderSalesReport = () => {
    if (!salesReport) return null;

    return (
      <Box>
        {/* Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(salesReport.totalSales)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ShoppingCart color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatNumber(salesReport.totalOrders)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(salesReport.averageOrderValue)}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Store color="primary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{salesReport.storeId ? getStoreName(salesReport.storeId) : 'All Stores'}</Typography>
                    <Typography variant="body2" color="text.secondary">Store</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Quarterly Breakdown */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quarterly Breakdown</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {salesReport.quarterlyData.map((quarter) => (
                <Box key={quarter.quarter} sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="primary">{getQuarterName(quarter.quarter)}</Typography>
                      <Typography variant="h5">{formatCurrency(quarter.totalSales)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(quarter.orderCount)} orders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg: {formatCurrency(quarter.averageOrderValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Store Performance Analysis */}
        {salesReport.storePerformance && salesReport.storePerformance.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Store Performance Analysis</Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Store</TableCell>
                      <TableCell align="right">Total Sales</TableCell>
                      <TableCell align="right">Avg Order</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesReport.storePerformance.map((store) => (
                      <TableRow key={store.storeId}>
                        <TableCell>
                          <Typography variant="body2">
                            {store.storeName}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {formatCurrency(store.totalSales)}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{formatCurrency(store.averageOrderValue)}</TableCell>
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

  const renderPurchaseReport = () => {
    if (!purchaseReport) return null;

    return (
      <Box>
        {/* Summary Cards */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 3 }}>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <AttachMoney color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(purchaseReport.totalPurchases)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Purchases</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <ShoppingCart color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatNumber(purchaseReport.totalOrders)}</Typography>
                    <Typography variant="body2" color="text.secondary">Total Orders</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Assessment color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{formatCurrency(purchaseReport.averageOrderValue)}</Typography>
                    <Typography variant="body2" color="text.secondary">Avg Order Value</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center">
                  <Store color="secondary" sx={{ mr: 1 }} />
                  <Box>
                    <Typography variant="h6">{purchaseReport.storeId ? getStoreName(purchaseReport.storeId) : 'All Stores'}</Typography>
                    <Typography variant="body2" color="text.secondary">Store</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Quarterly Breakdown */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Quarterly Breakdown</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {purchaseReport.quarterlyData.map((quarter) => (
                <Box key={quarter.quarter} sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" color="secondary">{getQuarterName(quarter.quarter)}</Typography>
                      <Typography variant="h5">{formatCurrency(quarter.totalPurchases)}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatNumber(quarter.orderCount)} orders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Avg: {formatCurrency(quarter.averageOrderValue)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Top Suppliers */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Top Suppliers</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Total Amount</TableCell>
                    <TableCell align="right">Avg Order Value</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseReport.topSuppliers.map((supplier, index) => (
                    <TableRow key={index}>
                      <TableCell>{supplier.supplierName}</TableCell>
                      <TableCell align="right">{formatNumber(supplier.totalOrders)}</TableCell>
                      <TableCell align="right">{formatCurrency(supplier.totalAmount)}</TableCell>
                      <TableCell align="right">{formatCurrency(supplier.averageOrderValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>

        {/* Purchase Orders Details */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Recent Purchase Orders</Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Order #</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Supplier</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {purchaseReport.recentOrders?.map((order: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{order.orderNumber || `PO-${order.id}`}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                      <TableCell>{order.supplierName || 'N/A'}</TableCell>
                      <TableCell align="right">{formatCurrency(order.totalAmount)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={order.status || 'Unknown'} 
                          color={
                            order.status === 'Received' ? 'success' :
                            order.status === 'Pending' ? 'warning' :
                            order.status === 'Approved' ? 'primary' :
                            order.status === 'Rejected' ? 'error' : 'default'
                          }
                          size="small"
                          sx={{
                            backgroundColor: 
                              order.status === 'Received' ? '#4caf50' :
                              order.status === 'Pending' ? '#ff9800' :
                              order.status === 'Approved' ? '#9c27b0' :
                              order.status === 'Rejected' ? '#f44336' : '#757575',
                            color: 'white',
                            fontWeight: 'bold'
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          No purchase orders found for the selected period
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderPeakSalesReport = () => {
    if (!peakSalesReport) return null;

    return (
      <Box>
        {/* Peak Hours */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Peak Sales Hours</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {peakSalesReport.peakHours.map((hour, index) => (
                <Box key={hour.hour} sx={{ flex: '1 1 250px', minWidth: '250px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h6">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </Typography>
                          <Typography variant="h5" color="primary">
                            {formatCurrency(hour.totalSales)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatNumber(hour.orderCount)} orders
                          </Typography>
                        </Box>
                        <Chip 
                          label={`#${index + 1}`} 
                          color="primary" 
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Peak Days */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>Peak Sales Days</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {peakSalesReport.peakDays.map((day, index) => (
                <Box key={day.dayOfWeek} sx={{ flex: '1 1 250px', minWidth: '250px' }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box display="flex" alignItems="center" justifyContent="space-between">
                        <Box>
                          <Typography variant="h6">{day.dayOfWeek}</Typography>
                          <Typography variant="h5" color="secondary">
                            {formatCurrency(day.totalSales)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatNumber(day.orderCount)} orders
                          </Typography>
                        </Box>
                        <Chip 
                          label={`#${index + 1}`} 
                          color="secondary" 
                          size="small"
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        {/* Hourly Analysis */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Hourly Sales Analysis</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Hour</TableCell>
                    <TableCell align="right">Sales</TableCell>
                    <TableCell align="right">Orders</TableCell>
                    <TableCell align="right">Avg Order</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {peakSalesReport.hourlyAnalysis.map((hour) => (
                    <TableRow key={hour.hour}>
                      <TableCell>{hour.hour}:00</TableCell>
                      <TableCell align="right">{formatCurrency(hour.totalSales)}</TableCell>
                      <TableCell align="right">{formatNumber(hour.orderCount)}</TableCell>
                      <TableCell align="right">{formatCurrency(hour.averageOrderValue)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderInventoryMovementReport = () => {
    return (
      <Box>
        {/* Movement Report Filters */}
        <Paper sx={{ mb: 3, p: 3, borderRadius: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
            📊 Inventory Movement Filters
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>From Date</InputLabel>
                <Select
                  value={movementFromDate}
                  onChange={(e) => setMovementFromDate(e.target.value)}
                  label="From Date"
                >
                  <MenuItem value="">Last 30 days</MenuItem>
                  <MenuItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Last 7 days</MenuItem>
                  <MenuItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Last 30 days</MenuItem>
                  <MenuItem value={new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>Last 90 days</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>To Date</InputLabel>
                <Select
                  value={movementToDate}
                  onChange={(e) => setMovementToDate(e.target.value)}
                  label="To Date"
                >
                  <MenuItem value="">Today</MenuItem>
                  <MenuItem value={new Date().toISOString().split('T')[0]}>Today</MenuItem>
                  <MenuItem value={new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>7 days ago</MenuItem>
                  <MenuItem value={new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}>30 days ago</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Product</InputLabel>
                <Select
                  value={selectedProduct || ''}
                  onChange={(e) => setSelectedProduct(e.target.value ? Number(e.target.value) : null)}
                  label="Product"
                >
                  <MenuItem value="">All Products</MenuItem>
                  {products.map(product => (
                    <MenuItem key={product.id} value={product.id}>{product.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Warehouse</InputLabel>
                <Select
                  value={selectedWarehouse || ''}
                  onChange={(e) => setSelectedWarehouse(e.target.value ? Number(e.target.value) : null)}
                  label="Warehouse"
                >
                  <MenuItem value="">All Warehouses</MenuItem>
                  {stores.map(store => (
                    <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Movement Type</InputLabel>
                <Select
                  value={selectedMovementType}
                  onChange={(e) => setSelectedMovementType(e.target.value)}
                  label="Movement Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="Purchase">Purchase</MenuItem>
                  <MenuItem value="Sale">Sale</MenuItem>
                  <MenuItem value="Assembly">Assembly</MenuItem>
                  <MenuItem value="Transfer">Transfer</MenuItem>
                  <MenuItem value="Adjustment">Adjustment</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
              <FormControl fullWidth>
                <InputLabel>Direction</InputLabel>
                <Select
                  value={selectedDirection}
                  onChange={(e) => setSelectedDirection(e.target.value)}
                  label="Direction"
                >
                  <MenuItem value="">All Directions</MenuItem>
                  <MenuItem value="In">In</MenuItem>
                  <MenuItem value="Out">Out</MenuItem>
                </Select>
              </FormControl>
            </Box>
            <Button
              variant="contained"
              onClick={loadMovementReports}
              disabled={loading}
              startIcon={<Refresh />}
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
              {loading ? 'Loading...' : 'Apply Filters'}
            </Button>
          </Box>
        </Paper>

        {/* Movement Analytics Summary */}
        {movementAnalytics && (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
            <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {movementAnalytics.totalMovements}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Movements
                    </Typography>
                  </Box>
                  <SwapHoriz sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {movementAnalytics.totalQuantityIn.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total In (bottles)
                    </Typography>
                  </Box>
                  <TrendingUp sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {movementAnalytics.totalQuantityOut.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Total Out (bottles)
                    </Typography>
                  </Box>
                  <TrendingDown sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 2, background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                      {movementAnalytics.netMovement.toFixed(0)}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      Net Movement
                    </Typography>
                  </Box>
                  <Assessment sx={{ fontSize: 40, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        )}

        {/* Movement Type Breakdown */}
        {movementAnalytics && (
          <Card sx={{ mb: 3, borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📈 Movement Type Breakdown
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
                {Object.entries(movementAnalytics.movementTypeCounts).map(([type, count]) => (
                  <Box key={type} sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)' }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#667eea' }}>
                      {count}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {type} Movements
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {movementAnalytics.movementTypeQuantities[type]?.toFixed(0) || 0} bottles
                    </Typography>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Movement Details Table */}
        {movementReport && (
          <Card sx={{ borderRadius: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
                📋 Movement Details
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Date</strong></TableCell>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell><strong>Warehouse</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Direction</strong></TableCell>
                      <TableCell><strong>Quantity</strong></TableCell>
                      <TableCell><strong>Reference</strong></TableCell>
                      <TableCell><strong>User</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {movementReport.movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell>
                          {new Date(movement.movementDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                              {movement.productName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {movement.productSKU}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{movement.warehouseName}</TableCell>
                        <TableCell>
                          <Chip 
                            label={movement.movementType} 
                            size="small"
                            sx={{ 
                              bgcolor: movement.movementType === 'Purchase' ? '#4caf50' : 
                                      movement.movementType === 'Sale' ? '#f44336' :
                                      movement.movementType === 'Assembly' ? '#ff9800' :
                                      movement.movementType === 'Transfer' ? '#2196f3' : '#9c27b0',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={movement.direction} 
                            size="small"
                            sx={{ 
                              bgcolor: movement.direction === 'In' ? '#4caf50' : '#f44336',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {movement.quantity} {movement.unit}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {movement.referenceNumber && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {movement.referenceNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {movement.createdByUserName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {movement.createdByUserName}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {/* Summary */}
              {movementReport.summary && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', borderRadius: 2 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                    📊 Summary
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#4caf50' }}>
                        {movementReport.summary.totalIn.toFixed(0)}
                      </Typography>
                      <Typography variant="caption">Total In</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#f44336' }}>
                        {movementReport.summary.totalOut.toFixed(0)}
                      </Typography>
                      <Typography variant="caption">Total Out</Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ff9800' }}>
                        {movementReport.summary.netMovement.toFixed(0)}
                      </Typography>
                      <Typography variant="caption">Net Movement</Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

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
                  <Assessment sx={{ fontSize: 32 }} />
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
                    Reports & Analytics
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 300 }}>
                    Comprehensive business insights and performance metrics
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <IconButton 
                  onClick={handleRefresh}
                  disabled={loading}
                  sx={{ 
                    bgcolor: 'rgba(102, 126, 234, 0.1)',
                    '&:hover': { bgcolor: 'rgba(102, 126, 234, 0.2)' }
                  }}
                >
                  <Refresh />
                </IconButton>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth>
                  <InputLabel>Year</InputLabel>
                  <Select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    label="Year"
                  >
                    {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                      <MenuItem key={year} value={year}>{year}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth>
                  <InputLabel>Quarter</InputLabel>
                  <Select
                    value={selectedQuarter || ''}
                    onChange={(e) => setSelectedQuarter(e.target.value ? Number(e.target.value) : null)}
                    label="Quarter"
                  >
                    <MenuItem value="">All Quarters</MenuItem>
                    <MenuItem value={1}>Q1 (Jan-Mar)</MenuItem>
                    <MenuItem value={2}>Q2 (Apr-Jun)</MenuItem>
                    <MenuItem value={3}>Q3 (Jul-Sep)</MenuItem>
                    <MenuItem value={4}>Q4 (Oct-Dec)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <FormControl fullWidth>
                  <InputLabel>Store</InputLabel>
                  <Select
                    value={selectedStore || ''}
                    onChange={(e) => setSelectedStore(e.target.value ? Number(e.target.value) : null)}
                    label="Store"
                    disabled={user?.roles.includes('StoreManager')}
                  >
                    <MenuItem value="">All Stores</MenuItem>
                    {stores.map(store => (
                      <MenuItem key={store.id} value={store.id}>{store.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ flex: '1 1 200px', minWidth: '200px' }}>
                <Button
                  variant="contained"
                  onClick={loadReports}
                  disabled={loading}
                  fullWidth
                  startIcon={<Refresh />}
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

        {/* Enhanced Report Tabs */}
        <Paper sx={{ 
          borderRadius: 3,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)}>
              <Tab label="Sales Report" icon={<TrendingUp />} />
              <Tab label="Purchase Report" icon={<ShoppingCart />} />
              <Tab label="Peak Sales Analysis" icon={<Schedule />} />
              <Tab label="Inventory Movement" icon={<Inventory />} />
            </Tabs>
          </Box>
          
          <Box sx={{ p: 3 }}>
            {activeTab === 0 && renderSalesReport()}
            {activeTab === 1 && renderPurchaseReport()}
            {activeTab === 2 && renderPeakSalesReport()}
            {activeTab === 3 && renderInventoryMovementReport()}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Reports;