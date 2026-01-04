# Fish Arot Management System

## 🐟 Overview

A complete, production-ready Fish Arot (Fish Market) Management System built for **Chitalmari-Bagerhat Motsho Arot**, located in Foltita Bazar, Fakirhat, Bagerhat, Bangladesh.

This system handles the complete workflow from data entry to receipt generation, replacing manual calculations with automated, accurate, and secure digital management.

## 🎯 System Philosophy

- **Manual Auction**: Auction (haka), price calling, and token management remain manual processes
- **Digital Entry Point**: Website starts from data entry by Muhuri (accountant)
- **Automated Calculations**: All financial calculations are done server-side with deterministic accuracy
- **Receipt Generation**: Automatic PDF generation for both farmer and buyer
- **Historical Tracking**: Complete transaction history with advanced filtering

## 🏗️ Architecture

### Tech Stack

**Frontend:**
- React 18
- Vite (Build tool)
- Tailwind CSS (Styling)
- React Router (Navigation)
- Axios (HTTP client)

**Backend:**
- Node.js
- Express.js
- MongoDB (Database)
- Mongoose (ODM)
- JWT (Authentication)
- PDFKit (PDF generation)

## 📁 Project Structure

```
Fish-Arot/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── models/
│   │   ├── User.js               # User model
│   │   ├── Transaction.js        # Transaction model
│   │   └── Settings.js           # Settings model
│   ├── controllers/
│   │   ├── authController.js     # Authentication logic
│   │   ├── transactionController.js
│   │   ├── receiptController.js
│   │   └── settingsController.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── transactionRoutes.js
│   │   ├── receiptRoutes.js
│   │   └── settingsRoutes.js
│   ├── middleware/
│   │   ├── auth.js               # JWT authentication
│   │   └── validate.js           # Input validation
│   ├── utils/
│   │   ├── calculations.js       # Calculation engine
│   │   └── pdfGenerator.js       # PDF generation
│   ├── .env
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── TransactionForm.jsx
│   │   │   └── TransactionList.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   └── Dashboard.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── transactionService.js
│   │   │   └── settingsService.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   ├── package.json
│   ├── tailwind.config.js
│   └── index.html
├── package.json
└── README.md
```

## 💾 Data Model

### Transaction Schema

```javascript
{
  receiptNo: String (auto-generated: AR-2024-000001),
  date: Date,
  farmerName: String,
  buyerName: String,
  fishCategory: Enum,
  ratePerMon: Number,
  kachaWeight: Number,
  pakaWeight: Number,
  totalWeight: Number (calculated),
  grossAmount: Number (calculated),
  commissionRate: Number,
  commissionAmount: Number (calculated),
  netFarmerAmount: Number (calculated),
  buyerPayable: Number (calculated),
  paidAmount: Number,
  dueAmount: Number (calculated),
  isPaid: Boolean,
  createdBy: ObjectId (User),
  isDeleted: Boolean (soft delete)
}
```

## 🧮 Calculation Rules

### Constants
- **1 Mon = 40 kg** (fixed)

### Formulas
1. **Total Weight** = Kacha Weight + Paka Weight
2. **Gross Amount** = (Total Weight / 40) × Rate Per Mon
3. **Commission Amount** = Gross Amount × Commission Rate %
4. **Net Farmer Amount** = Gross Amount - Commission Amount
5. **Buyer Payable** = Gross Amount (no commission for buyer)
6. **Due Amount** = Buyer Payable - Paid Amount
7. **Payment Status** = Due Amount <= 0

### Implementation
- All calculations use **integer-based math** to avoid floating-point errors
- Calculations are **server-side only** for security and consistency
- Results are **deterministic** and **auditable**

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication
2. **Role-Based Access Control**: Admin and Muhuri roles
3. **Input Validation**: Server-side validation for all inputs
4. **Soft Delete**: No hard deletion of records
5. **Password Hashing**: bcrypt with salt rounds
6. **CORS Protection**: Configured CORS policy
7. **Environment Variables**: Sensitive data in .env files

## 📊 Features

### Data Entry (Muhuri)
- Date selection
- Farmer and Buyer names
- Fish category selection
- Weight entry (Kacha and Paka)
- Rate per Mon
- Paid amount (optional)
- **Real-time calculation preview**

### Receipt Generation
- **Farmer Receipt**: Shows net amount after commission
- **Buyer Receipt**: Shows total payable and due
- Clean, tabular, print-ready A4 format
- Automatic Arot identity header
- Signature placeholders
- PDF download

### Transaction History
- Advanced filtering:
  - By farmer name
  - By buyer name
  - By fish category
  - By date range
  - By payment status (Paid/Due)
- Pagination (50 per page)
- Quick PDF downloads
- Responsive table design

### Dashboard Statistics
- Total transactions count
- Total gross amount
- Total commission earned
- Total due amount
- Paid vs unpaid count

### Settings (Admin Only)
- Configure commission rate
- Update Arot name
- Update Arot location

## 🚀 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v6 or higher)
- npm or yarn

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd Fish-Arot

# Install root dependencies
npm install

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment

**Backend (.env):**
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fish-arot
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=30d
NODE_ENV=development

AROT_NAME=Chitalmari-Bagerhat Motsho Arot
AROT_LOCATION=Foltita Bazar, Fakirhat, Bagerhat
DEFAULT_COMMISSION_RATE=2.5
```

**Frontend (.env):**
```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start MongoDB

```bash
# Windows (if MongoDB is installed as service)
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

### Step 4: Run the Application

**Option 1: Run separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

**Option 2: Run concurrently (from root)**
```bash
npm run dev
```

### Step 5: Create Admin User

Use an API client (Postman/Insomnia) or create a script:

```bash
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123",
  "role": "admin"
}
```

### Step 6: Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Login with created admin credentials

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    # Register new user
POST   /api/auth/login       # Login
GET    /api/auth/me          # Get current user
```

### Transactions
```
POST   /api/transactions              # Create transaction
GET    /api/transactions              # Get all (with filters)
GET    /api/transactions/stats        # Get statistics
GET    /api/transactions/:id          # Get single transaction
PUT    /api/transactions/:id          # Update transaction
DELETE /api/transactions/:id          # Delete (admin only)
```

### Receipts
```
GET    /api/receipts/:id/farmer       # Download farmer receipt PDF
GET    /api/receipts/:id/buyer        # Download buyer receipt PDF
```

### Settings
```
GET    /api/settings                  # Get settings
PUT    /api/settings                  # Update settings (admin only)
```

## 🎨 UI/UX Features

- **Modern Gradient Design**: Beautiful, professional interface
- **Responsive Layout**: Works on desktop, tablet, and mobile
- **Real-time Calculations**: Instant preview of amounts
- **Loading States**: Clear feedback during operations
- **Error Handling**: User-friendly error messages
- **Success Notifications**: Confirmation of actions
- **Smooth Animations**: Professional transitions
- **Accessible Forms**: Proper labels and validation

## 📈 Database Indexes

Optimized indexes for fast queries:
- `farmerName + date`
- `buyerName + date`
- `fishCategory + date`
- `isPaid + date`
- `receiptNo` (unique)

## 🔧 Production Deployment

### Backend Deployment (e.g., Heroku, Railway, Render)

1. Set environment variables
2. Use production MongoDB (MongoDB Atlas)
3. Set `NODE_ENV=production`
4. Update `JWT_SECRET` to a strong random string

### Frontend Deployment (e.g., Vercel, Netlify)

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `dist` folder
3. Update `VITE_API_URL` to production backend URL

### Database Backup

```bash
# Backup
mongodump --db fish-arot --out ./backup

# Restore
mongorestore --db fish-arot ./backup/fish-arot
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] User registration and login
- [ ] Transaction creation with various inputs
- [ ] Calculation accuracy verification
- [ ] PDF generation for both receipts
- [ ] Filtering by all criteria
- [ ] Pagination functionality
- [ ] Settings update (admin)
- [ ] Logout and session management

## 📝 Fish Categories

- Rui (রুই)
- Katla (কাতলা)
- Mrigel (মৃগেল)
- Silver Carp (সিলভার কার্প)
- Grass Carp (গ্রাস কার্প)
- Pangas (পাঙ্গাস)
- Tilapia (তেলাপিয়া)
- Boal (বোয়াল)
- Ayre (আইড়)
- Chitol (চিতল)
- Other (অন্যান্য)

## 🤝 Support

For issues or questions:
- Check the documentation
- Review error logs in browser console and server terminal
- Verify MongoDB connection
- Ensure all environment variables are set

## 📄 License

MIT License - Free to use and modify

## 🎯 Future Enhancements

- SMS notifications for receipts
- Multi-language support (Bangla/English)
- Mobile app (React Native)
- Advanced analytics and reports
- Farmer/Buyer ledger accounts
- Inventory management
- Expense tracking
- Profit/loss reports

---

**Built for Chitalmari-Bagerhat Motsho Arot**  
**Location**: Foltita Bazar, Fakirhat, Bagerhat  
**© 2024 Fish Arot Management System**
#   F i s h _ A r o t  
 