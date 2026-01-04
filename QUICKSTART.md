# 🚀 Quick Start Guide - Fish Arot Management System

## ⚡ Fast Setup (5 Minutes)

### Step 1: Install Dependencies (2 min)

```bash
# From project root
cd Fish-Arot

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Start MongoDB (1 min)

**Windows:**
```bash
# If MongoDB is installed as a service
net start MongoDB

# Or start manually
mongod --dbpath C:\data\db
```

**Mac/Linux:**
```bash
# If installed via Homebrew
brew services start mongodb-community

# Or start manually
mongod --dbpath /usr/local/var/mongodb
```

### Step 3: Initialize Database (30 sec)

```bash
# From project root
cd backend
node scripts/init-db.js
```

**Default Credentials Created:**
- Username: `admin`
- Password: `admin123`
- ⚠️ Change this immediately after first login!

### Step 4: Start the Application (1 min)

**Option A: Run Both (Recommended)**
```bash
# From project root
npm run dev
```

**Option B: Run Separately**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 5: Access the Application (30 sec)

1. Open browser: http://localhost:5173
2. Login with:
   - Username: `admin`
   - Password: `admin123`
3. **Change password immediately!**

---

## 🎯 First Transaction Test

1. Click "Data Entry" tab
2. Fill in the form:
   - Date: Today
   - Farmer Name: Test Farmer
   - Buyer Name: Test Buyer
   - Fish Category: Rui
   - Kacha Weight: 50 kg
   - Paka Weight: 30 kg
   - Rate per Mon: 5000 ৳
   - Paid Amount: 8000 ৳

3. See real-time calculation:
   - Total Weight: 80 kg
   - Gross Amount: ৳10,000
   - Commission (2.5%): ৳250
   - Net Farmer Amount: ৳9,750
   - Buyer Payable: ৳10,000
   - Due Amount: ৳2,000

4. Click "Create Transaction"
5. Go to "Transaction History" tab
6. Click "Farmer PDF" or "Buyer PDF" to download receipt

---

## 📋 Common Tasks

### Create New User (Muhuri)

1. Login as admin
2. Use API or create via script:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "username": "muhuri1",
    "password": "secure_password",
    "role": "muhuri"
  }'
```

### Change Commission Rate

1. Login as admin
2. Go to "Settings" tab
3. Update commission rate
4. Click "Update Settings"

### Filter Transactions

1. Go to "Transaction History" tab
2. Use filter fields:
   - Farmer Name
   - Buyer Name
   - Fish Category
   - Date Range
   - Payment Status

### Download Receipts

1. Find transaction in history
2. Click "Farmer PDF" for farmer receipt
3. Click "Buyer PDF" for buyer receipt

---

## 🔧 Troubleshooting

### Backend Won't Start

**Error: MongoDB connection failed**
```bash
# Solution: Start MongoDB
net start MongoDB  # Windows
brew services start mongodb-community  # Mac
```

**Error: Port 5000 already in use**
```bash
# Solution: Change port in backend/.env
PORT=5001
```

### Frontend Won't Start

**Error: Port 5173 already in use**
```bash
# Solution: Kill the process or use different port
# Vite will automatically suggest alternative port
```

**Error: Cannot connect to backend**
```bash
# Solution: Check backend is running
# Verify VITE_API_URL in frontend/.env
VITE_API_URL=http://localhost:5000/api
```

### Database Issues

**Error: Cannot find module**
```bash
# Solution: Reinstall dependencies
cd backend
rm -rf node_modules
npm install
```

**Error: Validation failed**
```bash
# Solution: Check all required fields are filled
# Ensure weights and rates are positive numbers
```

---

## 📱 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health
- **MongoDB**: mongodb://localhost:27017/fish-arot

---

## 🎓 Learning Path

### Day 1: Basic Operations
- [ ] Login to system
- [ ] Create first transaction
- [ ] Download receipts
- [ ] View transaction history

### Day 2: Advanced Features
- [ ] Use filters
- [ ] Update transaction
- [ ] Check statistics
- [ ] Change settings (admin)

### Day 3: Daily Workflow
- [ ] Enter morning transactions
- [ ] Generate receipts for farmers
- [ ] Generate receipts for buyers
- [ ] Review daily statistics

---

## 🆘 Need Help?

1. **Check Logs**
   - Backend: Terminal running `npm run dev`
   - Frontend: Browser console (F12)

2. **Verify Setup**
   - MongoDB is running
   - All dependencies installed
   - Environment variables set
   - Ports not in use

3. **Common Solutions**
   - Restart MongoDB
   - Restart backend server
   - Clear browser cache
   - Reinstall dependencies

---

## 📞 Support Checklist

Before asking for help, verify:
- [ ] MongoDB is running
- [ ] Backend server is running (no errors)
- [ ] Frontend is running (no errors)
- [ ] Environment files exist (.env)
- [ ] Dependencies are installed
- [ ] Ports are available (5000, 5173)
- [ ] Browser console shows no errors

---

## 🎉 You're Ready!

The system is now running and ready for daily use at:

**Chitalmari-Bagerhat Motsho Arot**  
Foltita Bazar, Fakirhat, Bagerhat

Happy fish trading! 🐟
