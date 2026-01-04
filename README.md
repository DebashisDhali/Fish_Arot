# 🐟 Fish Arot Management System

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/DebashisDhali/Fish_Arot)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-v4-lightgrey.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green.svg)](https://www.mongodb.com/)

> A professional, production-ready solution for digitalizing fish market (Arot) operations. Specifically designed for **Chitalmari-Bagerhat Motsho Arot**.

---

## 🌟 Introduction

The **Fish Arot Management System** is a robust MERN stack application designed to modernize traditional fish trading workflows. It replaces manual calculations and paper ledgers with a secure, automated, and efficient digital platform.

### 📍 Project Context
- **Organization**: Chitalmari-Bagerhat Motsho Arot
- **Location**: Foltita Bazar, Fakirhat, Bagerhat, Bangladesh.

---

## 🚀 Key Features

### 📝 Smart Data Entry
- **Real-time Calculations**: Calculate gross amounts, commissions, and net payables as you type.
- **Categorization**: Specialized drop-downs for various fish species (Rui, Katla, Mrigel, etc.).
- **Dual Weight Support**: Handles both *Kacha* (Raw) and *Paka* (Final) weight systems used in traditional markets.

### 📄 Professional Receipt Generation
- **Automated PDFs**: One-click generation of professional receipts for both Farmers and Buyers.
- **Branding**: Automatically includes Arot identity, metadata, and signature placeholders.
- **Transparency**: Clear breakdown of costs, commissions, and amounts due.

### 📊 Dashboard & Analytics
- **Financial Insights**: Track total sales, commission earnings, and outstanding dues at a glance.
- **Advanced Filtering**: Search and filter transactions by date, farmer, buyer, or status.
- **Data Visualization**: (Upcoming) Visual charts for market trends.

### 🔐 Enterprise Security
- **RBAC**: Role-Based Access Control (Admin vs. Muhuri).
- **Secure Auth**: JWT-based authentication with bcrypt password hashing.
- **Data Integrity**: Soft-delete mechanisms to prevent accidental data loss.

---

## 🛠️ Technical Stack

| Category | Technology |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router, Axios |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB with Mongoose ODM |
| **PDF Engine** | PDFKit |
| **Auth** | JSON Web Tokens (JWT) |

---

## 📂 Project Structure

```text
Fish-Arot/
├── backend/            # Express API Server
│   ├── controllers/    # Business Logic
│   ├── models/         # Database Schemas
│   ├── routes/         # API Endpoints
│   └── utils/          # Calculations & PDF PDF Generation
├── frontend/           # React Client
│   ├── src/
│   │   ├── components/ # Reusable UI Modules
│   │   ├── pages/      # View Components
│   │   └── services/   # API Integrations
└── README.md
```

---

## ⚙️ Installation & Setup

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/DebashisDhali/Fish_Arot.git
cd Fish_Arot
npm install
cd backend && npm install
cd ../frontend && npm install
```

### 2. Environment Configuration

Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
AROT_NAME=Chitalmari-Bagerhat Motsho Arot
AROT_LOCATION=Foltita Bazar, Fakirhat, Bagerhat
DEFAULT_COMMISSION_RATE=2.5
```

Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Run Development Server
From the root directory:
```bash
npm run dev
```

---

## 🧮 Calculation Logic

We use strict integer-based math server-side to ensure 100% financial accuracy.

- **Standard Unit**: 1 Mon = 40 kg
- **Gross Amount** = `(Total Weight / 40) × Rate per Mon`
- **Commission** = `Gross Amount × (Rate / 100)`
- **Net Farmer Amount** = `Gross Amount - Commission`

---

## 📝 Fish Categories Supported

- 🐟 Rui (রুই)
- 🐟 Katla (কাতলা)
- 🐟 Mrigel (মৃগেল)
- 🐟 Silver Carp (সিলভার কার্প)
- 🐟 Grass Carp (গ্রাস কার্প)
- 🐟 Pangas (পাঙ্গাস)
- 🐟 Tilapia (তেলাপিয়া)
- 🐟 Ilish (ইলিশ) - *Adding soon*
- 🐟 Other (অন্যান্য)

---

## 🤝 Contributing & Support

This project is maintained for **Chitalmari-Bagerhat Motsho Arot**. For support or feature requests, please reach out to the development team.

---

## 📄 License

This project is licensed under the MIT License.

---
© 2024 **Fish Arot Management System** | Built with ❤️ for the Fish Trading Community.