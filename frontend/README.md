# Food & Beverage Management System - Frontend

A modern React frontend for the Food & Beverage Management System built with TypeScript, Material-UI, and comprehensive backend integration.

## 🚀 Features

### ✅ Core Modules
- **Dashboard**: Overview with key metrics and charts
- **Product Management**: CRUD operations for products and categories
- **Inventory Management**: Real-time inventory tracking and alerts
- **Purchase Management**: Purchase order creation and approval workflow
- **Sales Management**: Sales order processing and tracking
- **Product Assembly**: Bill of Materials (BOM) management
- **Product Requests**: Request workflow and approval system
- **Reports & Analytics**: Comprehensive reporting and data visualization

### ✅ Technical Features
- **Modern React**: Built with React 18 and TypeScript
- **Material-UI**: Beautiful, responsive UI components
- **Data Grid**: Advanced data tables with sorting, filtering, pagination
- **Charts & Analytics**: Interactive charts using Recharts
- **Authentication**: JWT-based authentication system
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data synchronization

## 🛠️ Technology Stack

- **React 18** with TypeScript
- **Material-UI (MUI)** for UI components
- **React Router** for navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **MUI X Data Grid** for advanced tables

## 📦 Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   The `.env` file is already configured with the default API URL:
   ```
   REACT_APP_API_URL=http://localhost:5152
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables
- `REACT_APP_API_URL`: Backend API URL (default: http://localhost:5152)

### API Integration
The frontend communicates with the backend through the `api.ts` service layer, which includes:
- Authentication endpoints
- Product management
- Inventory operations
- Purchase order management
- Sales order processing
- Assembly operations
- Request management
- Reporting and analytics

## 📱 User Interface

### Dashboard
- **Overview Cards**: Key metrics and statistics
- **Charts**: Sales vs purchases trends
- **System Overview**: Pie chart showing system distribution
- **Recent Activity**: Latest system activities

### Product Management
- **Product List**: Data grid with all products
- **CRUD Operations**: Create, read, update, delete products
- **Category Management**: Product categorization
- **Search & Filter**: Advanced filtering capabilities

### Inventory Management
- **Real-time Inventory**: Current stock levels
- **Stock Alerts**: Low stock and out-of-stock warnings
- **Inventory Summary**: Total value and item counts
- **Status Indicators**: Visual stock status indicators

### Purchase Management
- **Order List**: All purchase orders with status
- **Order Details**: Detailed view of order items
- **Approval Workflow**: Approve pending orders
- **Receipt Processing**: Mark orders as received

### Reports & Analytics
- **Interactive Charts**: Line charts, bar charts, pie charts
- **Date Range Filtering**: Customizable reporting periods
- **Multiple Report Types**: Movement, sales, purchase reports
- **Export Capabilities**: Data export functionality

## 🔐 Authentication

### Login System
- **Email/Password Authentication**: Secure login form
- **JWT Token Management**: Automatic token handling
- **Session Persistence**: Remember login state
- **Demo Credentials**: Pre-configured test account

### Demo Credentials
- **Email**: admin@example.com
- **Password**: Admin123!

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Backend API running on port 5152

### Quick Start
1. **Start the backend API** (from the Api directory):
   ```bash
   cd ../Api
   dotnet run
   ```

2. **Start the frontend** (from the frontend directory):
   ```bash
   cd frontend
   npm start
   ```

3. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5152

## 📊 Available Pages

| Page | Description | Features |
|------|-------------|----------|
| **Dashboard** | Main overview | Metrics, charts, recent activity |
| **Products** | Product management | CRUD operations, categories |
| **Inventory** | Stock management | Real-time inventory, alerts |
| **Purchases** | Purchase orders | Order management, approval workflow |
| **Sales** | Sales management | Order processing, customer management |
| **Assembly** | Product assembly | BOM management, production tracking |
| **Requests** | Product requests | Request workflow, approval system |
| **Reports** | Analytics & reporting | Charts, data visualization |

## 🔧 Development

### Project Structure
```
src/
├── components/          # Reusable UI components
│   └── Layout.tsx      # Main layout with navigation
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication context
├── pages/              # Page components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Products.tsx    # Product management
│   ├── Inventory.tsx   # Inventory management
│   ├── Purchases.tsx   # Purchase management
│   ├── Sales.tsx       # Sales management
│   ├── Assembly.tsx    # Assembly management
│   ├── Requests.tsx    # Request management
│   └── Reports.tsx     # Reports & analytics
├── services/           # API services
│   └── api.ts         # Backend API integration
└── App.tsx            # Main application component
```

### Adding New Features
1. **Create new page components** in `src/pages/`
2. **Add API methods** in `src/services/api.ts`
3. **Update navigation** in `src/components/Layout.tsx`
4. **Add routing** in `src/App.tsx`

## 🐛 Troubleshooting

### Common Issues

1. **API Connection Error**:
   - Ensure backend is running on port 5152
   - Check CORS configuration in backend
   - Verify API URL in `.env` file

2. **Authentication Issues**:
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify backend authentication endpoints

3. **Build Errors**:
   - Clear node_modules and reinstall
   - Check TypeScript errors
   - Verify all dependencies are installed

### Debug Mode
Enable debug mode by adding to `.env`:
```
REACT_APP_DEBUG=true
```

## 📈 Performance

### Optimization Features
- **Code Splitting**: Lazy loading of components
- **Memoization**: React.memo for expensive components
- **Virtual Scrolling**: Efficient data grid rendering
- **Caching**: API response caching
- **Bundle Optimization**: Webpack optimization

## 🔒 Security

### Security Features
- **JWT Authentication**: Secure token-based auth
- **HTTPS Support**: Secure communication
- **Input Validation**: Client-side validation
- **XSS Protection**: Sanitized user inputs
- **CSRF Protection**: Cross-site request forgery protection

## 📝 License

This project is part of the Food & Beverage Management System and follows the same licensing terms.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For support and questions:
- Check the backend API documentation
- Review the troubleshooting section
- Check browser console for errors
- Verify network connectivity

---

**Happy Coding! 🚀**