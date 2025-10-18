#!/bin/bash

# Food & Beverage Management System - Complete Setup Script
# This script sets up both the backend API and frontend React application

echo "🚀 Setting up Food & Beverage Management System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "Api" ] || [ ! -d "frontend" ]; then
    print_error "Please run this script from the gradproject directory"
    exit 1
fi

print_status "Starting complete system setup..."

# Step 1: Setup Backend API
print_status "Setting up Backend API..."
cd Api

# Check if .NET is installed
if ! command -v dotnet &> /dev/null; then
    print_error ".NET is not installed. Please install .NET 9.0 or later."
    exit 1
fi

print_status "Building backend API..."
if dotnet build; then
    print_success "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi

print_status "Running database migrations..."
if dotnet ef database update; then
    print_success "Database migrations completed"
else
    print_error "Database migrations failed"
    exit 1
fi

# Step 2: Setup Frontend
print_status "Setting up Frontend React Application..."
cd ../frontend

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 16+ and npm."
    exit 1
fi

print_status "Installing frontend dependencies..."
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Frontend dependencies installation failed"
    exit 1
fi

# Step 3: Create startup scripts
print_status "Creating startup scripts..."

# Backend startup script
cat > ../start_backend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Backend API..."
cd Api
dotnet run
EOF

# Frontend startup script
cat > ../start_frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Frontend React App..."
cd frontend
npm start
EOF

# Full system startup script
cat > ../start_full_system.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Full Food & Beverage Management System..."

# Function to kill background processes on exit
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start backend in background
echo "Starting backend API..."
cd Api
dotnet run &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 5

# Start frontend in background
echo "Starting frontend React app..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo "✅ System started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5152"
echo "📊 API Documentation: http://localhost:5152/swagger"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for processes
wait
EOF

# Make scripts executable
chmod +x ../start_backend.sh
chmod +x ../start_frontend.sh
chmod +x ../start_full_system.sh

print_success "Startup scripts created"

# Step 4: Create test script
print_status "Creating test script..."

cat > ../test_system.sh << 'EOF'
#!/bin/bash
echo "🧪 Testing Food & Beverage Management System..."

# Test backend API
echo "Testing backend API..."
if curl -s http://localhost:5152/api/Product > /dev/null; then
    echo "✅ Backend API is running"
else
    echo "❌ Backend API is not responding"
fi

# Test frontend
echo "Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is running"
else
    echo "❌ Frontend is not responding"
fi

echo "🧪 System test completed"
EOF

chmod +x ../test_system.sh

# Step 5: Create comprehensive README
print_status "Creating comprehensive system documentation..."

cat > ../COMPLETE_SYSTEM_README.md << 'EOF'
# 🍔 Food & Beverage Management System - Complete Setup

A comprehensive full-stack solution for food & beverage business management with modern React frontend and .NET Core backend.

## 🚀 Quick Start

### Option 1: Start Everything at Once
```bash
./start_full_system.sh
```

### Option 2: Start Services Separately
```bash
# Terminal 1 - Backend
./start_backend.sh

# Terminal 2 - Frontend  
./start_frontend.sh
```

## 🌐 Access Points

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5152
- **API Documentation**: http://localhost:5152/swagger
- **Database**: SQLite (authrbac_dev.db)

## 🔐 Demo Credentials

- **Email**: admin@example.com
- **Password**: Admin123!

## 📋 System Features

### Backend API (.NET Core)
- ✅ Authentication & Authorization (JWT)
- ✅ User & Role Management
- ✅ Product & Category Management
- ✅ Warehouse Management
- ✅ Inventory Management
- ✅ Purchase Management
- ✅ Sales Management
- ✅ Product Assembly (BOM)
- ✅ Product Request System
- ✅ Product Movement Reports
- ✅ Audit Logging
- ✅ Swagger Documentation

### Frontend (React + TypeScript)
- ✅ Modern Material-UI Interface
- ✅ Responsive Design
- ✅ Real-time Dashboard
- ✅ Product Management
- ✅ Inventory Tracking
- ✅ Purchase Order Management
- ✅ Sales Order Processing
- ✅ Assembly Management
- ✅ Request Workflow
- ✅ Reports & Analytics
- ✅ Interactive Charts

## 🛠️ Technology Stack

### Backend
- .NET 9.0
- Entity Framework Core
- SQLite Database
- JWT Authentication
- Swagger/OpenAPI

### Frontend
- React 18
- TypeScript
- Material-UI (MUI)
- React Router
- Axios
- Recharts

## 📁 Project Structure

```
gradproject/
├── Api/                          # Backend .NET Core API
│   ├── Controllers/             # API Controllers
│   ├── Models/                  # Data Models
│   ├── DTOs/                    # Data Transfer Objects
│   ├── Services/                # Business Logic
│   ├── Data/                    # Database Context
│   └── Migrations/              # Database Migrations
├── frontend/                    # React Frontend
│   ├── src/
│   │   ├── components/          # React Components
│   │   ├── pages/               # Page Components
│   │   ├── services/            # API Services
│   │   └── contexts/            # React Contexts
│   └── public/                  # Static Assets
├── start_full_system.sh         # Start everything
├── start_backend.sh             # Start backend only
├── start_frontend.sh            # Start frontend only
└── test_system.sh               # Test system health
```

## 🔧 Development Commands

### Backend Development
```bash
cd Api
dotnet run                    # Start API
dotnet build                  # Build project
dotnet ef migrations add Name # Add migration
dotnet ef database update     # Apply migrations
```

### Frontend Development
```bash
cd frontend
npm start                     # Start development server
npm run build                 # Build for production
npm test                     # Run tests
```

## 🧪 Testing

### Test System Health
```bash
./test_system.sh
```

### Manual Testing
1. **Backend API**: Visit http://localhost:5152/swagger
2. **Frontend**: Visit http://localhost:3000
3. **Login**: Use demo credentials
4. **Test Features**: Navigate through all modules

## 📊 API Endpoints

### Authentication
- `POST /api/Auth/login` - User login
- `POST /api/Auth/register` - User registration

### Products
- `GET /api/Product` - Get all products
- `POST /api/Product` - Create product
- `PUT /api/Product/{id}` - Update product
- `DELETE /api/Product/{id}` - Delete product

### Inventory
- `GET /api/ProductInventory` - Get inventory
- `PUT /api/ProductInventory/{id}` - Update inventory

### Purchases
- `GET /api/Purchase` - Get purchase orders
- `POST /api/Purchase` - Create purchase order
- `POST /api/Purchase/{id}/approve` - Approve order
- `POST /api/Purchase/{id}/receive` - Receive order

### Sales
- `GET /api/Sales` - Get sales orders
- `POST /api/Sales` - Create sales order
- `POST /api/Sales/{id}/confirm` - Confirm order
- `POST /api/Sales/{id}/ship` - Ship order

### Reports
- `POST /api/ProductMovement/report` - Movement report
- `GET /api/ProductMovement/analytics` - Analytics
- `GET /api/ProductMovement/alerts` - Stock alerts

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports
   lsof -ti:5152 | xargs kill -9  # Backend
   lsof -ti:3000 | xargs kill -9  # Frontend
   ```

2. **Database Issues**
   ```bash
   cd Api
   dotnet ef database drop
   dotnet ef database update
   ```

3. **Frontend Build Issues**
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   ```

4. **API Connection Issues**
   - Check if backend is running on port 5152
   - Verify CORS settings
   - Check browser console for errors

### Debug Mode
- **Backend**: Add logging in appsettings.json
- **Frontend**: Check browser developer tools
- **Database**: Use SQLite browser to inspect data

## 📈 Performance

### Backend Optimization
- Entity Framework query optimization
- Database indexing
- Response caching
- Connection pooling

### Frontend Optimization
- Code splitting
- Lazy loading
- Memoization
- Bundle optimization

## 🔒 Security

### Backend Security
- JWT token authentication
- Role-based authorization
- Input validation
- SQL injection prevention
- CORS configuration

### Frontend Security
- HTTPS support
- XSS protection
- Input sanitization
- Secure token storage

## 📝 Documentation

- **API Documentation**: http://localhost:5152/swagger
- **Backend README**: Api/README.md
- **Frontend README**: frontend/README.md
- **Database Schema**: Api/DATABASE_ERD_DOCUMENTATION.md

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check browser console for errors
4. Verify all services are running

---

**🎉 Your Food & Beverage Management System is ready!**

Start the system with: `./start_full_system.sh`
EOF

print_success "System documentation created"

# Step 6: Final summary
print_status "Setup completed successfully!"
echo ""
print_success "🎉 Food & Beverage Management System is ready!"
echo ""
print_status "📋 Next Steps:"
echo "1. Start the system: ./start_full_system.sh"
echo "2. Or start services separately:"
echo "   - Backend: ./start_backend.sh"
echo "   - Frontend: ./start_frontend.sh"
echo ""
print_status "🌐 Access Points:"
echo "- Frontend: http://localhost:3000"
echo "- Backend API: http://localhost:5152"
echo "- API Docs: http://localhost:5152/swagger"
echo ""
print_status "🔐 Demo Credentials:"
echo "- Email: admin@example.com"
echo "- Password: Admin123!"
echo ""
print_status "📚 Documentation:"
echo "- Complete System README: COMPLETE_SYSTEM_README.md"
echo "- Backend README: Api/README.md"
echo "- Frontend README: frontend/README.md"
echo ""
print_success "Happy coding! 🚀"
