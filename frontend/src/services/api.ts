import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://donpaolo.onrender.com';

// Log the API URL being used (for debugging)
console.log('🔧 API Configuration:', {
  'REACT_APP_API_URL env var': process.env.REACT_APP_API_URL,
  'API_BASE_URL (final)': API_BASE_URL,
  'Using default?': !process.env.REACT_APP_API_URL
});

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log detailed error information to console
        console.error('API Error:', {
          url: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
          fullError: error
        });
        
        if (error.response?.status === 401) {
          localStorage.removeItem('authToken');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // ==================== AUTHENTICATION ====================
  async login(email: string, password: string) {
    console.log('API Login Request:', { 
      url: `${this.api.defaults.baseURL}/api/Auth/login`,
      email 
    });
    try {
      const response = await this.api.post('/api/Auth/login', { email, password });
      console.log('API Login Success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('API Login Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  }

  async register(userData: any) {
    const response = await this.api.post('/api/Auth/register', userData);
    return response.data;
  }

  async refreshToken(refreshToken: string) {
    const response = await this.api.post('/api/Auth/refresh', { refreshToken });
    return response.data;
  }

  async getCurrentUser() {
    const response = await this.api.get('/api/Auth/me');
    return response.data;
  }

  // ==================== USER PROFILE MANAGEMENT ====================
  // Note: These methods are implemented later in the file

  async deactivateAccount() {
    const response = await this.api.post('/api/UserProfile/deactivate');
    return response.data;
  }

  async deleteAccount() {
    const response = await this.api.delete('/api/UserProfile');
    return response.data;
  }

  // ==================== ADMIN DASHBOARD ====================
  async getSystemStatistics() {
    const response = await this.api.get('/api/Admin/statistics');
    return response.data;
  }

  // ==================== USER MANAGEMENT (Admin) ====================
  async getAllUsers() {
    const response = await this.api.get('/api/Users');
    return response.data;
  }

  async getUserById(id: number) {
    const response = await this.api.get(`/api/Users/${id}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.api.post('/api/Users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: any) {
    console.log('🔄 Updating user:', { id, userData, url: `${this.api.defaults.baseURL}/api/Users/${id}` });
    try {
      const response = await this.api.patch(`/api/Users/${id}`, userData);
      console.log('✅ User update successful:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ User update failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url
      });
      throw error;
    }
  }

  async deleteUser(id: number) {
    const response = await this.api.delete(`/api/Users/${id}`);
    return response.data;
  }

  async assignRoleToUser(userId: number, roleId: number) {
    const response = await this.api.post(`/api/Users/${userId}/roles`, { roleId });
    return response.data;
  }

  async removeRoleFromUser(userId: number, roleId: number) {
    const response = await this.api.delete(`/api/Users/${userId}/roles/${roleId}`);
    return response.data;
  }

  async assignUserToStoreDirect(userId: number, storeId: number) {
    const response = await this.api.post(`/api/Users/${userId}/assign-store`, { storeId });
    return response.data;
  }

  async removeUserFromStoreDirect(userId: number) {
    const response = await this.api.post(`/api/Users/${userId}/remove-store`);
    return response.data;
  }

  // ==================== ROLE MANAGEMENT (Admin) ====================
  async getAllRoles() {
    const response = await this.api.get('/api/Roles');
    return response.data;
  }

  async getRoleById(id: number) {
    const response = await this.api.get(`/api/Roles/${id}`);
    return response.data;
  }

  async createRole(roleData: any) {
    const response = await this.api.post('/api/Roles', roleData);
    return response.data;
  }

  async updateRole(id: number, roleData: any) {
    const response = await this.api.patch(`/api/Roles/${id}`, roleData);
    return response.data;
  }

  async deleteRole(id: number) {
    const response = await this.api.delete(`/api/Roles/${id}`);
    return response.data;
  }

  // ==================== CATEGORY MANAGEMENT ====================
  async getCategories() {
    const response = await this.api.get('/api/Category');
    return response.data;
  }

  async getAllCategories() {
    const response = await this.api.get('/api/Category/all');
    return response.data;
  }

  async getCategoryById(id: number) {
    const response = await this.api.get(`/api/Category/${id}`);
    return response.data;
  }

  async createCategory(categoryData: any) {
    const response = await this.api.post('/api/Category', categoryData);
    return response.data;
  }

  async updateCategory(id: number, categoryData: any) {
    const response = await this.api.put(`/api/Category/${id}`, categoryData);
    return response.data;
  }

  async deleteCategory(id: number) {
    const response = await this.api.delete(`/api/Category/${id}`);
    return response.data;
  }

  async restoreCategory(id: number) {
    const response = await this.api.post(`/api/Category/${id}/restore`);
    return response.data;
  }

  // ==================== PRODUCT MANAGEMENT ====================
  async getProducts() {
    const response = await this.api.get('/api/Product');
    return response.data;
  }

  async getProduct(id: number) {
    const response = await this.api.get(`/api/Product/${id}`);
    return response.data;
  }

  async createProduct(productData: any) {
    const response = await this.api.post('/api/Product', productData);
    return response.data;
  }

  async updateProduct(id: number, productData: any) {
    const response = await this.api.put(`/api/Product/${id}`, productData);
    return response.data;
  }

  async deleteProduct(id: number) {
    const response = await this.api.delete(`/api/Product/${id}`);
    return response.data;
  }

  async updateProductInventory(id: number, inventoryData: any) {
    const response = await this.api.put(`/api/Product/${id}/inventory`, inventoryData);
    return response.data;
  }

  // ==================== WAREHOUSE MANAGEMENT ====================
  async getWarehouses() {
    const response = await this.api.get('/api/Warehouse');
    return response.data;
  }

  async getWarehouseById(id: number) {
    const response = await this.api.get(`/api/Warehouse/${id}`);
    return response.data;
  }

  async createWarehouse(warehouseData: any) {
    const response = await this.api.post('/api/Warehouse', warehouseData);
    return response.data;
  }

  async updateWarehouse(id: number, warehouseData: any) {
    const response = await this.api.put(`/api/Warehouse/${id}`, warehouseData);
    return response.data;
  }

  async deleteWarehouse(id: number) {
    const response = await this.api.delete(`/api/Warehouse/${id}`);
    return response.data;
  }

  async getWarehouseInventory(warehouseId: number) {
    const response = await this.api.get(`/api/Warehouse/${warehouseId}/inventory`);
    return response.data;
  }

  // ==================== INVENTORY MANAGEMENT ====================
  async getInventory() {
    const response = await this.api.get('/api/ProductInventory');
    return response.data;
  }

  async getInventoryById(id: number) {
    const response = await this.api.get(`/api/ProductInventory/${id}`);
    return response.data;
  }

  async updateInventory(id: number, inventoryData: any) {
    const response = await this.api.put(`/api/ProductInventory/${id}`, inventoryData);
    return response.data;
  }

  async createInventoryItem(inventoryData: any) {
    const response = await this.api.post('/api/ProductInventory', inventoryData);
    return response.data;
  }

  async deleteInventoryItem(id: number) {
    const response = await this.api.delete(`/api/ProductInventory/${id}`);
    return response.data;
  }

  async getLowStockItems() {
    const response = await this.api.get('/api/ProductInventory/low-stock');
    return response.data;
  }

  async setDefaultMinimumLevels(defaultLevel: number) {
    const response = await this.api.post('/api/ProductInventory/set-default-minimum-levels', {
      defaultMinimumLevel: defaultLevel
    });
    return response.data;
  }

  // ==================== PURCHASE MANAGEMENT ====================
  async getPurchaseOrders() {
    const response = await this.api.get('/api/Purchase');
    return response.data;
  }

  async getPurchaseOrder(id: number) {
    const response = await this.api.get(`/api/Purchase/${id}`);
    return response.data;
  }

  async createPurchaseOrder(orderData: any) {
    const response = await this.api.post('/api/Purchase', orderData);
    return response.data;
  }

  async updatePurchaseOrder(id: number, orderData: any) {
    const response = await this.api.put(`/api/Purchase/${id}`, orderData);
    return response.data;
  }

  async deletePurchaseOrder(id: number) {
    const response = await this.api.delete(`/api/Purchase/${id}`);
    return response.data;
  }

  async approvePurchaseOrder(id: number, approvalData: any) {
    const response = await this.api.post(`/api/Purchase/${id}/approve`, approvalData);
    return response.data;
  }

  async receivePurchaseOrder(id: number, receiveData: any) {
    const response = await this.api.post(`/api/Purchase/${id}/receive`, receiveData);
    return response.data;
  }

  async cancelPurchaseOrder(id: number) {
    const response = await this.api.post(`/api/Purchase/${id}/cancel`);
    return response.data;
  }

  async getPurchaseOrderItems(id: number) {
    const response = await this.api.get(`/api/Purchase/${id}/items`);
    return response.data;
  }

  async addPurchaseOrderItem(id: number, itemData: any) {
    const response = await this.api.post(`/api/Purchase/${id}/items`, itemData);
    return response.data;
  }

  async updatePurchaseOrderItem(orderId: number, itemId: number, itemData: any) {
    const response = await this.api.put(`/api/Purchase/${orderId}/items/${itemId}`, itemData);
    return response.data;
  }

  async deletePurchaseOrderItem(orderId: number, itemId: number) {
    const response = await this.api.delete(`/api/Purchase/${orderId}/items/${itemId}`);
    return response.data;
  }

  // ==================== SALES MANAGEMENT ====================
  async getSalesOrders() {
    const response = await this.api.get('/api/Sales');
    return response.data;
  }

  async getSalesOrder(id: number) {
    const response = await this.api.get(`/api/Sales/${id}`);
    return response.data;
  }

  async createSalesOrder(orderData: any) {
    const response = await this.api.post('/api/Sales', orderData);
    return response.data;
  }

  async updateSalesOrder(id: number, orderData: any) {
    const response = await this.api.put(`/api/Sales/${id}`, orderData);
    return response.data;
  }

  async deleteSalesOrder(id: number) {
    const response = await this.api.delete(`/api/Sales/${id}`);
    return response.data;
  }

  async confirmSalesOrder(id: number, confirmData: any) {
    const response = await this.api.post(`/api/Sales/${id}/confirm`, confirmData);
    return response.data;
  }

  async shipSalesOrder(id: number, shipData: any) {
    const response = await this.api.post(`/api/Sales/${id}/ship`, shipData);
    return response.data;
  }

  async deliverSalesOrder(id: number, deliverData: any) {
    const response = await this.api.post(`/api/Sales/${id}/deliver`, deliverData);
    return response.data;
  }

  async cancelSalesOrder(id: number) {
    const response = await this.api.post(`/api/Sales/${id}/cancel`);
    return response.data;
  }

  async getSalesOrderItems(id: number) {
    const response = await this.api.get(`/api/Sales/${id}/items`);
    return response.data;
  }

  async addSalesOrderItem(id: number, itemData: any) {
    const response = await this.api.post(`/api/Sales/${id}/items`, itemData);
    return response.data;
  }

  async updateSalesOrderItem(orderId: number, itemId: number, itemData: any) {
    const response = await this.api.put(`/api/Sales/${orderId}/items/${itemId}`, itemData);
    return response.data;
  }

  async deleteSalesOrderItem(orderId: number, itemId: number) {
    const response = await this.api.delete(`/api/Sales/${orderId}/items/${itemId}`);
    return response.data;
  }

  async getProductCards(warehouseId?: number) {
    const params = warehouseId ? `?warehouseId=${warehouseId}` : '';
    const response = await this.api.get(`/api/Sales/product-cards${params}`);
    return response.data;
  }

  // ==================== PRODUCT ASSEMBLY (BOM) ====================
  async getProductAssemblies() {
    const response = await this.api.get('/api/ProductAssembly');
    return response.data;
  }

  async getProductAssembly(id: number) {
    const response = await this.api.get(`/api/ProductAssembly/${id}`);
    return response.data;
  }

  async createProductAssembly(assemblyData: any) {
    const response = await this.api.post('/api/ProductAssembly', assemblyData);
    return response.data;
  }

  async updateProductAssembly(id: number, assemblyData: any) {
    const response = await this.api.put(`/api/ProductAssembly/${id}`, assemblyData);
    return response.data;
  }

  async createAssemblyOffer(offerData: any) {
    const response = await this.api.post('/api/ProductAssembly/create-offer', offerData);
    return response.data;
  }

  async suggestAssemblyOffers(request: { storeId?: number; maxSuggestions?: number }) {
    const response = await this.api.post('/api/ProductAssembly/suggest-offers', request);
    return response.data;
  }

  async validateProductAssembly(id: number) {
    const response = await this.api.get(`/api/ProductAssembly/${id}/validate`);
    return response.data;
  }

  async deleteProductAssembly(id: number) {
    const response = await this.api.delete(`/api/ProductAssembly/${id}`);
    return response.data;
  }

  async startProductAssembly(id: number, startData: any) {
    const response = await this.api.post(`/api/ProductAssembly/${id}/start`, startData);
    return response.data;
  }

  async completeProductAssembly(id: number, completeData: any) {
    const response = await this.api.post(`/api/ProductAssembly/${id}/complete`, completeData);
    return response.data;
  }

  async cancelProductAssembly(id: number) {
    const response = await this.api.post(`/api/ProductAssembly/${id}/cancel`);
    return response.data;
  }

  async getBillOfMaterials(assemblyId: number) {
    const response = await this.api.get(`/api/ProductAssembly/${assemblyId}/bill-of-materials`);
    return response.data;
  }

  async addBillOfMaterial(assemblyId: number, materialData: any) {
    const response = await this.api.post(`/api/ProductAssembly/${assemblyId}/bill-of-materials`, materialData);
    return response.data;
  }

  async updateBillOfMaterial(assemblyId: number, materialId: number, materialData: any) {
    const response = await this.api.put(`/api/ProductAssembly/${assemblyId}/bill-of-materials/${materialId}`, materialData);
    return response.data;
  }

  async deleteBillOfMaterial(assemblyId: number, materialId: number) {
    const response = await this.api.delete(`/api/ProductAssembly/${assemblyId}/bill-of-materials/${materialId}`);
    return response.data;
  }

  // ==================== PRODUCT REQUEST ====================
  async getProductRequests() {
    const response = await this.api.get('/api/ProductRequest');
    return response.data;
  }

  async getProductRequest(id: number) {
    const response = await this.api.get(`/api/ProductRequest/${id}`);
    return response.data;
  }

  async createProductRequest(requestData: any) {
    const response = await this.api.post('/api/ProductRequest', requestData);
    return response.data;
  }

  async updateProductRequest(id: number, requestData: any) {
    const response = await this.api.put(`/api/ProductRequest/${id}`, requestData);
    return response.data;
  }

  async deleteProductRequest(id: number) {
    const response = await this.api.delete(`/api/ProductRequest/${id}`);
    return response.data;
  }

  async approveProductRequest(id: number, approvalData: any) {
    const response = await this.api.post(`/api/ProductRequest/${id}/approve`, approvalData);
    return response.data;
  }

  async rejectProductRequest(id: number, rejectionData: any) {
    const response = await this.api.post(`/api/ProductRequest/${id}/reject`, rejectionData);
    return response.data;
  }

  async receiveProductRequest(id: number, receiveData: any) {
    const response = await this.api.post(`/api/ProductRequest/${id}/receive`, receiveData);
    return response.data;
  }

  async getProductRequestItems(id: number) {
    const response = await this.api.get(`/api/ProductRequest/${id}/items`);
    return response.data;
  }

  async addProductRequestItem(id: number, itemData: any) {
    const response = await this.api.post(`/api/ProductRequest/${id}/items`, itemData);
    return response.data;
  }

  async updateProductRequestItem(requestId: number, itemId: number, itemData: any) {
    const response = await this.api.put(`/api/ProductRequest/${requestId}/items/${itemId}`, itemData);
    return response.data;
  }

  async deleteProductRequestItem(requestId: number, itemId: number) {
    const response = await this.api.delete(`/api/ProductRequest/${requestId}/items/${itemId}`);
    return response.data;
  }

  // ==================== PRODUCT MOVEMENT REPORTS ====================
  async getProductMovementReport(reportData: any) {
    const response = await this.api.post('/api/ProductMovement/report', reportData);
    return response.data;
  }

  async getProductMovementAnalytics(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/analytics?${params.toString()}`);
    return response.data;
  }

  async getProductMovementTrend(productId: number, warehouseId: number, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    params.append('productId', productId.toString());
    params.append('warehouseId', warehouseId.toString());
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/trend?${params.toString()}`);
    return response.data;
  }

  async getProductMovementFilters() {
    const response = await this.api.get('/api/ProductMovement/filters');
    return response.data;
  }

  async getProductMovementComparison(comparisonData: any) {
    const response = await this.api.post('/api/ProductMovement/comparison', comparisonData);
    return response.data;
  }

  async getProductMovementAlerts() {
    const response = await this.api.get('/api/ProductMovement/alerts');
    return response.data;
  }

  async createManualMovement(movementData: any) {
    const response = await this.api.post('/api/ProductMovement/manual', movementData);
    return response.data;
  }

  async getMovementById(id: number) {
    const response = await this.api.get(`/api/ProductMovement/${id}`);
    return response.data;
  }

  async getPurchaseMovements(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/purchases?${params.toString()}`);
    return response.data;
  }

  async getSalesMovements(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/sales?${params.toString()}`);
    return response.data;
  }

  async getAssemblyMovements(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/assembly?${params.toString()}`);
    return response.data;
  }

  async getWarehouseMovementSummary(warehouseId: number, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    params.append('warehouseId', warehouseId.toString());
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductMovement/warehouse-summary?${params.toString()}`);
    return response.data;
  }

  async getAssemblyReport(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductAssembly/report?${params.toString()}`);
    return response.data;
  }

  async getProductRequestReport(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    const response = await this.api.get(`/api/ProductRequest/report?${params.toString()}`);
    return response.data;
  }

  // ==================== DASHBOARD ====================
  async getDashboardStats() {
    const response = await this.api.get('/api/Dashboard/stats');
    return response.data;
  }

  async getRecentActivity() {
    const response = await this.api.get('/api/Dashboard/recent-activity');
    return response.data;
  }

  async getLowStockAlerts() {
    const response = await this.api.get('/api/Dashboard/low-stock-alerts');
    return response.data;
  }

  async getPendingApprovals() {
    const response = await this.api.get('/api/Dashboard/pending-approvals');
    return response.data;
  }

  // User Profile endpoints
  async getUserProfile() {
    const response = await this.api.get('/api/UserProfile/profile');
    return response.data;
  }

  async updateUserProfile(data: any) {
    const response = await this.api.patch('/api/UserProfile/profile', data);
    return response.data;
  }

  async deactivateUserProfile() {
    const response = await this.api.patch('/api/UserProfile/deactivate');
    return response.data;
  }

  async deleteUserProfile() {
    const response = await this.api.delete('/api/UserProfile/account');
    return response.data;
  }

  // Sales Product Cards endpoint
  async getSalesProductCards() {
    const response = await this.api.get('/api/Sales/products/cards');
    return response.data;
  }

  // Sales Order status filtering
  async getSalesOrdersByStatus(status: string) {
    const response = await this.api.get(`/api/Sales/status/${status}`);
    return response.data;
  }


  // Store Management API
  async getStores() {
    const response = await this.api.get('/api/Stores');
    return response.data;
  }

  async getStore(id: number) {
    const response = await this.api.get(`/api/Stores/${id}`);
    return response.data;
  }

  async createStore(storeData: any) {
    const response = await this.api.post('/api/Stores', storeData);
    return response.data;
  }

  async updateStore(id: number, storeData: any) {
    const response = await this.api.put(`/api/Stores/${id}`, storeData);
    return response.data;
  }

  async deleteStore(id: number) {
    const response = await this.api.delete(`/api/Stores/${id}`);
    return response.data;
  }

  async getAvailableUsers() {
    const response = await this.api.get('/api/Stores/available-users');
    return response.data;
  }

  async assignUserToStore(storeId: number, userId: number) {
    const response = await this.api.post(`/api/Stores/${storeId}/assign-user`, { userId });
    return response.data;
  }

  async removeUserFromStore(storeId: number, userId: number) {
    const response = await this.api.delete(`/api/Stores/${storeId}/users/${userId}`);
    return response.data;
  }
  async createDirectSale(saleData: any) {
    const response = await this.api.post('/DirectSales/create-sale', saleData);
    return response.data;
  }

  async getDirectSale(id: number) {
    const response = await this.api.get(`/DirectSales/${id}`);
    return response.data;
  }

  async getStoreDirectSales(storeId: number) {
    const response = await this.api.get(`/DirectSales/store/${storeId}`);
    return response.data;
  }

  async getStoreProducts(storeId: number) {
    const response = await this.api.get(`/DirectSales/store/${storeId}/products`);
    return response.data;
  }

  // ==================== POS SYSTEM ====================
  async getPOSProducts() {
    const response = await this.api.get('/api/POS/products');
    return response.data;
  }

  async processPOSSale(saleData: any) {
    const response = await this.api.post('/api/POS/sale', saleData);
    return response.data;
  }

  async getPOSSalesHistory() {
    const response = await this.api.get('/api/POS/sales-history');
    return response.data;
  }

  async openCashDrawer() {
    const response = await this.api.post('/api/POS/open-drawer');
    return response.data;
  }

  // ==================== ADMIN STORE ANALYTICS ====================
  async getStoreSales(storeId: number, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const response = await this.api.get(`/api/Admin/store/${storeId}/sales?${params.toString()}`);
    return response.data;
  }

  async getStorePurchases(storeId: number, fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const response = await this.api.get(`/api/Admin/store/${storeId}/purchases?${params.toString()}`);
    return response.data;
  }

  async getStoresSummary(fromDate?: string, toDate?: string) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    
    const response = await this.api.get(`/api/Admin/stores/summary?${params.toString()}`);
    return response.data;
  }

  // ==================== CUSTOMER ORDER ENDPOINTS ====================
  
  // Shopping Cart
  async getCart() {
    const response = await this.api.get('/api/CustomerOrder/cart');
    return response.data;
  }

  async addToCart(productId: number, quantity: number) {
    const response = await this.api.post('/api/CustomerOrder/cart/add', {
      productId,
      quantity
    });
    return response.data;
  }

  async updateCartItem(cartItemId: number, quantity: number) {
    const response = await this.api.put(`/api/CustomerOrder/cart/${cartItemId}`, {
      quantity
    });
    return response.data;
  }

  async removeFromCart(cartItemId: number) {
    const response = await this.api.delete(`/api/CustomerOrder/cart/${cartItemId}`);
    return response.data;
  }

  async clearCart() {
    const response = await this.api.delete('/api/CustomerOrder/cart/clear');
    return response.data;
  }

  // Customer Orders
  async createOrder(orderData: any) {
    const response = await this.api.post('/api/CustomerOrder/order', orderData);
    return response.data;
  }

  async getCustomerOrders() {
    const response = await this.api.get('/api/CustomerOrder/orders');
    return response.data;
  }

  async getCustomerOrder(orderId: number) {
    const response = await this.api.get(`/api/CustomerOrder/order/${orderId}`);
    return response.data;
  }

  // Customer Product Catalog
  async getCustomerProducts(categoryId?: number, search?: string) {
    const params = new URLSearchParams();
    if (categoryId) params.append('categoryId', categoryId.toString());
    if (search) params.append('search', search);
    
    const response = await this.api.get(`/api/CustomerOrder/products?${params.toString()}`);
    return response.data;
  }

  async getCustomerCategories() {
    const response = await this.api.get('/api/CustomerOrder/categories');
    return response.data;
  }

  // Customer Management
  async lookupCustomer(phoneNumber: string) {
    const response = await this.api.get(`/api/Customer/lookup/${phoneNumber}`);
    return response.data;
  }

  async registerCustomer(customerData: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  }) {
    const response = await this.api.post('/api/Customer/register', customerData);
    return response.data;
  }

  async getCustomer(id: number) {
    const response = await this.api.get(`/api/Customer/${id}`);
    return response.data;
  }

  async getCustomers() {
    const response = await this.api.get('/api/Customer');
    return response.data;
  }

  async updateCustomer(id: number, customerData: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
  }) {
    const response = await this.api.put(`/api/Customer/${id}`, customerData);
    return response.data;
  }

  // ==================== REPORTS ====================
  async getSalesReport(fromDate?: Date, toDate?: Date) {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate.toISOString());
    if (toDate) params.append('toDate', toDate.toISOString());
    
    const response = await this.api.get(`/api/Reports/sales?${params.toString()}`);
    return response.data;
  }

  async getPurchaseReport(year?: number, quarter?: number, storeId?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (quarter) params.append('quarter', quarter.toString());
    if (storeId) params.append('storeId', storeId.toString());
    
    const response = await this.api.get(`/api/Reports/purchases?${params.toString()}`);
    return response.data;
  }

  async getPeakSalesAnalysis(year?: number, quarter?: number, storeId?: number) {
    const params = new URLSearchParams();
    if (year) params.append('year', year.toString());
    if (quarter) params.append('quarter', quarter.toString());
    if (storeId) params.append('storeId', storeId.toString());
    
    const response = await this.api.get(`/api/Reports/peak-sales?${params.toString()}`);
    return response.data;
  }

}

const apiService = new ApiService();
export default apiService;