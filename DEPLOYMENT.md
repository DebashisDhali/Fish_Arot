# Deployment Guide - Fish Arot Management System

## 🚀 Production Deployment Steps

### Prerequisites
- MongoDB Atlas account (free tier available)
- Backend hosting (Railway, Render, or Heroku)
- Frontend hosting (Vercel or Netlify)

---

## Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up or log in
3. Create a new cluster (Free M0 tier is sufficient)
4. Wait for cluster to be created (2-3 minutes)

### Step 2: Configure Database Access

1. Go to "Database Access" in left sidebar
2. Click "Add New Database User"
3. Create username and password
4. Set role to "Read and write to any database"
5. Click "Add User"

### Step 3: Configure Network Access

1. Go to "Network Access" in left sidebar
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 4: Get Connection String

1. Go to "Database" in left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `myFirstDatabase` with `fish-arot`

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fish-arot?retryWrites=true&w=majority
```

---

## Part 2: Backend Deployment (Railway)

### Step 1: Prepare Backend

1. Create `.gitignore` in backend folder:
```
node_modules/
.env
*.log
```

2. Ensure `package.json` has start script:
```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  }
}
```

### Step 2: Deploy to Railway

1. Go to [Railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project"
4. Choose "Deploy from GitHub repo"
5. Select your repository
6. Choose the `backend` folder as root directory

### Step 3: Set Environment Variables

In Railway dashboard, go to Variables tab and add:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fish-arot?retryWrites=true&w=majority
JWT_SECRET=your_super_secure_random_string_here_min_32_chars
JWT_EXPIRE=30d
NODE_ENV=production
AROT_NAME=Chitalmari-Bagerhat Motsho Arot
AROT_LOCATION=Foltita Bazar, Fakirhat, Bagerhat
DEFAULT_COMMISSION_RATE=2.5
```

**Important**: Generate a strong JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Deploy

1. Railway will automatically deploy
2. Wait for deployment to complete
3. Note your backend URL (e.g., `https://your-app.railway.app`)

---

## Part 3: Frontend Deployment (Vercel)

### Step 1: Update Frontend Environment

1. Update `frontend/.env`:
```
VITE_API_URL=https://your-app.railway.app/api
```

2. Create `frontend/.env.production`:
```
VITE_API_URL=https://your-app.railway.app/api
```

### Step 2: Deploy to Vercel

1. Go to [Vercel](https://vercel.com)
2. Sign up with GitHub
3. Click "New Project"
4. Import your repository
5. Set root directory to `frontend`
6. Framework Preset: Vite
7. Add environment variable:
   - Name: `VITE_API_URL`
   - Value: `https://your-app.railway.app/api`

### Step 3: Deploy

1. Click "Deploy"
2. Wait for deployment
3. Note your frontend URL (e.g., `https://your-app.vercel.app`)

---

## Part 4: Initial Setup

### Create Admin User

Use Postman, Insomnia, or curl:

```bash
curl -X POST https://your-app.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!",
    "role": "admin"
  }'
```

### Test the Application

1. Visit your Vercel URL
2. Login with admin credentials
3. Create a test transaction
4. Download receipts to verify PDF generation
5. Test all filters and features

---

## Part 5: Domain Setup (Optional)

### Custom Domain for Frontend

1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain (e.g., `fisharot.com`)
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Custom Domain for Backend

1. In Railway dashboard, go to Settings
2. Add custom domain (e.g., `api.fisharot.com`)
3. Update DNS records as instructed
4. Update `VITE_API_URL` in Vercel to use new domain

---

## Part 6: Monitoring & Maintenance

### Backend Monitoring

1. Railway provides automatic logs
2. Check "Deployments" tab for build logs
3. Check "Metrics" for resource usage

### Frontend Monitoring

1. Vercel provides analytics
2. Check "Analytics" tab for usage stats
3. Monitor build logs in "Deployments"

### Database Monitoring

1. MongoDB Atlas provides monitoring
2. Check "Metrics" tab for performance
3. Set up alerts for high usage

---

## Part 7: Backup Strategy

### Database Backup

**Option 1: MongoDB Atlas Automated Backups**
- Available in paid tiers
- Automatic daily backups
- Point-in-time recovery

**Option 2: Manual Backup**
```bash
# Install MongoDB tools
# Run backup
mongodump --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fish-arot" --out=./backup

# Restore if needed
mongorestore --uri="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/fish-arot" ./backup/fish-arot
```

---

## Part 8: Security Checklist

- [ ] Strong JWT_SECRET (min 32 characters)
- [ ] Strong database password
- [ ] HTTPS enabled (automatic with Vercel/Railway)
- [ ] CORS configured properly
- [ ] Environment variables not in code
- [ ] Admin password changed from default
- [ ] MongoDB network access configured
- [ ] Regular backups scheduled

---

## Part 9: Cost Estimation

### Free Tier (Recommended for Start)

- **MongoDB Atlas**: Free M0 (512 MB storage)
- **Railway**: $5/month credit (usually sufficient)
- **Vercel**: Free (hobby plan)
- **Total**: ~$5/month or less

### Paid Tier (For Growth)

- **MongoDB Atlas**: M10 (~$57/month)
- **Railway**: ~$20/month
- **Vercel**: Free or Pro ($20/month)
- **Total**: ~$77-97/month

---

## Part 10: Troubleshooting

### Backend Not Starting

1. Check Railway logs
2. Verify all environment variables
3. Check MongoDB connection string
4. Ensure PORT is set correctly

### Frontend Can't Connect to Backend

1. Verify `VITE_API_URL` is correct
2. Check CORS settings in backend
3. Ensure backend is running
4. Check browser console for errors

### PDF Generation Fails

1. Check backend logs
2. Verify PDFKit is installed
3. Check transaction data is complete
4. Ensure sufficient memory on Railway

### Database Connection Issues

1. Verify MongoDB Atlas IP whitelist
2. Check connection string format
3. Verify database user credentials
4. Check network connectivity

---

## Part 11: Alternative Hosting Options

### Backend Alternatives

**Render.com**
- Similar to Railway
- Free tier available
- Easy deployment

**Heroku**
- Well-established platform
- Free tier discontinued
- $7/month minimum

**DigitalOcean App Platform**
- $5/month minimum
- More control
- Good performance

### Frontend Alternatives

**Netlify**
- Similar to Vercel
- Free tier available
- Easy deployment

**GitHub Pages**
- Free
- Requires static build
- Custom domain support

---

## Part 12: Post-Deployment Tasks

1. **Create User Accounts**
   - Create accounts for all Muhuri staff
   - Set appropriate roles

2. **Import Historical Data** (if needed)
   - Prepare CSV of old transactions
   - Create import script
   - Verify data accuracy

3. **Train Users**
   - Conduct training session
   - Provide user manual
   - Set up support channel

4. **Monitor Performance**
   - Check response times
   - Monitor error rates
   - Review user feedback

---

## Support & Updates

For deployment issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints manually
4. Review error messages

For updates:
1. Push to GitHub
2. Automatic deployment on Vercel/Railway
3. Monitor deployment status
4. Test after deployment

---

**Deployment Complete! 🎉**

Your Fish Arot Management System is now live and ready for production use.
