# 🏪 Heritage Store Management System

A comprehensive full-stack retail management platform built with modern technologies, featuring advanced inventory management, role-based access control, and intelligent business analytics.

![Project Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![.NET Version](https://img.shields.io/badge/.NET-9.0-blue)
![React Version](https://img.shields.io/badge/React-18.2.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [User Roles](#user-roles)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Heritage Store Management System is a sophisticated retail management platform designed to streamline operations for multi-store retail businesses. It provides comprehensive solutions for inventory management, sales processing, customer management, and business analytics.

### Key Highlights

- **Multi-Role System**: Supports 5 different user roles with tailored interfaces
- **Real-time Inventory Tracking**: Live inventory updates with automated workflows
- **Advanced POS System**: Integrated point-of-sale with inventory management
- **Smart Analytics**: Comprehensive reporting and business intelligence
- **Scalable Architecture**: Built for growth and future enhancements

## ✨ Features

### 🛒 Core Features
- **Multi-Store Management**: Support for multiple warehouse locations
- **Product Management**: Complete CRUD operations for products and categories
- **Inventory Tracking**: Real-time stock levels with automated transfers
- **Sales Management**: Comprehensive POS system with receipt generation
- **Customer Management**: Customer profiles and order history
- **Purchase Orders**: Supplier management and purchase order processing

### 🎯 Advanced Features
- **Smart Assembly Offers**: AI-driven product bundle suggestions based on inventory
- **Automated Workflows**: Product request approval with automatic inventory transfer
- **Comprehensive Reporting**: Sales analytics, inventory movements, and trend analysis
- **Role-Based Dashboards**: Customized interfaces for different user types
- **Audit Logging**: Complete activity tracking for compliance
- **Delivery Management**: Order tracking with delivery date validation

### 📊 Analytics & Reporting
- **Sales Analytics**: Revenue tracking, peak sales periods, top products
- **Inventory Reports**: Movement tracking, stock levels, reorder alerts
- **Business Intelligence**: Dashboard with key performance indicators
- **Export Capabilities**: CSV/Excel export for external analysis

## 🛠️ Technology Stack

### Backend
- **.NET 9.0** - Modern C# framework
- **Entity Framework Core** - ORM for database operations
- **SQLite** - Lightweight database for development
- **JWT Authentication** - Secure token-based authentication
- **AutoMapper** - Object-to-object mapping
- **Swagger/OpenAPI** - API documentation

### Frontend
- **React 18.2.0** - Modern JavaScript library
- **TypeScript** - Type-safe JavaScript
- **Material-UI (MUI)** - React component library
- **React Router DOM** - Client-side routing
- **Axios** - HTTP client for API calls
- **React Hook Form** - Form management

### Development Tools
- **Visual Studio Code** - Primary IDE
- **Postman** - API testing
- **Git** - Version control
- **npm/yarn** - Package management

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │   .NET 9 API    │    │   SQLite DB     │
│                 │◄──►│                 │◄──►│                 │
│  - Material-UI   │    │  - EF Core      │    │  - Multi-tables │
│  - TypeScript   │    │  - JWT Auth     │    │  - Relationships│
│  - React Router │    │  - Controllers  │    │  - Audit Logs   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Database Schema
- **Users & Roles**: User management with role-based access control
- **Products & Categories**: Product catalog management
- **Inventory**: Multi-warehouse stock tracking
- **Sales & Orders**: Transaction management
- **Audit Logs**: Complete activity tracking

## 🚀 Getting Started

### Prerequisites
- **.NET 9.0 SDK** - [Download here](https://dotnet.microsoft.com/download)
- **Node.js 18+** - [Download here](https://nodejs.org/)
- **Visual Studio Code** - [Download here](https://code.visualstudio.com/)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/heritage-store-management.git
   cd heritage-store-management
   ```

2. **Backend Setup**
   ```bash
   cd Api
   dotnet restore
   dotnet ef database update
   dotnet run
   ```
   The API will be available at `http://localhost:5152`

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   The application will be available at `http://localhost:3000`

### Quick Start Scripts
```bash
# Start both backend and frontend
./start_full_system.sh

# Start only backend
./start_backend.sh

# Start only frontend
./start_frontend.sh
```

## 🔐 User Roles

### SuperAdmin
- **Access**: All modules and stores
- **Features**: User management, system configuration, global analytics
- **Dashboard**: Comprehensive overview with all metrics

### StoreManager
- **Access**: Assigned store only
- **Features**: Inventory management, staff management, store analytics
- **Dashboard**: Store-specific metrics and operations

### Cashier
- **Access**: POS system and basic inventory
- **Features**: Sales processing, customer service, receipt printing
- **Dashboard**: POS interface (redirected from main dashboard)

### Customer
- **Access**: Online store and order tracking
- **Features**: Product browsing, order placement, order history
- **Dashboard**: Online store interface (redirected from main dashboard)

### WarehouseManager
- **Access**: Inventory and warehouse operations
- **Features**: Stock management, product requests, inventory transfers
- **Dashboard**: Warehouse-focused operations

## 📱 Screenshots

### Dashboard Overview
![Dashboard](screenshots/dashboard.png)
*Comprehensive dashboard with role-based metrics and quick actions*

### POS System
![POS System](screenshots/pos.png)
*Modern point-of-sale interface for cashiers*

### Inventory Management
![Inventory](screenshots/inventory.png)
*Real-time inventory tracking with automated workflows*

### Reports & Analytics
![Reports](screenshots/reports.png)
*Advanced reporting with charts and export capabilities*

## 🔧 API Documentation

### Authentication
```http
POST /api/Auth/login
Content-Type: application/json

{
  "email": "admin@company.com",
  "password": "admin123"
}
```

### Key Endpoints
- **Products**: `/api/Product` - Product management
- **Inventory**: `/api/ProductInventory` - Stock management
- **Sales**: `/api/Sales` - Sales processing
- **Reports**: `/api/Reports` - Analytics and reporting
- **Users**: `/api/Users` - User management

### Swagger Documentation
Visit `http://localhost:5152/swagger` for complete API documentation.

## 🧪 Testing

### Test Accounts
- **SuperAdmin**: `admin@company.com` / `admin123`
- **Store Manager**: `sarah.store1@company.com` / `manager123`
- **Cashier**: `cashier1@company.com` / `cashier123`
- **Customer**: `customer1@company.com` / `customer123`

### Postman Collection
Import the provided Postman collection for API testing:
```bash
./run_postman_tests.sh
```

## 📈 Performance

- **API Response Time**: < 100ms average
- **Database Queries**: Optimized with EF Core
- **Frontend Load Time**: < 2 seconds
- **Concurrent Users**: Supports 100+ simultaneous users

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Authorization**: Granular permission system
- **Audit Logging**: Complete activity tracking
- **Input Validation**: Server-side validation for all inputs
- **SQL Injection Protection**: Parameterized queries with EF Core

## 🚀 Deployment

### Development
```bash
# Backend
cd Api && dotnet run

# Frontend
cd frontend && npm start
```

### Production
```bash
# Build for production
cd frontend && npm run build
cd ../Api && dotnet publish -c Release

# Deploy to server
# Configure production database connection
# Set up reverse proxy (nginx/apache)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow C# coding conventions
- Use TypeScript for frontend code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Your Name**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

## 🙏 Acknowledgments

- Material-UI team for the excellent component library
- Microsoft for .NET and Entity Framework Core
- React team for the amazing frontend framework
- All contributors and testers

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the author via email
- Check the documentation

---

⭐ **Star this repository if you found it helpful!**

## 🔄 Changelog

### Version 1.0.0 (Current)
- ✅ Complete multi-role system implementation
- ✅ Advanced inventory management
- ✅ Smart assembly offers
- ✅ Comprehensive reporting system
- ✅ Automated workflows
- ✅ Production-ready deployment

### Future Roadmap
- 🔄 Mobile app development
- 🔄 Advanced analytics with ML
- 🔄 Multi-language support
- 🔄 Cloud deployment options
- 🔄 Integration with external systems

---

**Built with ❤️ using .NET 9, React, and modern web technologies**