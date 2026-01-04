const PDFDocument = require('pdfkit');
const moment = require('moment');
const path = require('path');

// Global Constants
const COLORS = {
  primary: '#4338ca',    // Deep Indigo
  secondary: '#1e293b',  // Slate 800
  accent: '#10b981',     // Emerald
  danger: '#e11d48',     // Rose
  border: '#e2e8f0',     // Slate 200
  light: '#f8fafc',      // Slate 50
  muted: '#64748b'       // Slate 500
};

// Helper to convert English numbers to Bangla digits
const bin = (num) => {
  if (num === null || num === undefined) return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[digit]);
};

// Common translations
const getBn = (text) => {
  const map = {
    'Rui': 'রুই', 'Katla': 'কাতলা', 'Mrigel': 'মৃগেল', 'Silver Carp': 'সিলভার কার্প',
    'Grass Carp': 'গ্রাস কার্প', 'Pangas': 'পাঙ্গাস', 'Tilapia': 'তেলাপিয়া',
    'Boal': 'বোয়াল', 'Ayre': 'আইড়', 'Chitol': 'চিতল', 'Other': 'অন্যান্য',
    'Bagda': 'বাগদা', 'Golda': 'গলদা', 'Venami': 'ভেনামি', 'Horina': 'হরিণা', 'Caka Cingi': 'চাকা চিংড়ি',
    'Small': 'ছোট', 'Medium': 'মাঝারি', 'Large': 'বড়', 'Extra Large': 'বিশাল'
  };
  return map[text] || text;
};

const generateReceipt = (res, transaction, settings, type = 'farmer') => {
  const aName = (settings?.arotName || 'মাছ আড়ত').toUpperCase();
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `${aName}-${transaction.receiptNo}`,
      Author: 'Digital Arot Management'
    }
  });

  // Fonts
  const fontPath = path.join(__dirname, '../assets/fonts/kalpurush.ttf');
  // doc.registerFont('BnFont', fontPath);
  doc.font(fontPath);

  // Stream PDF
  doc.pipe(res);

  // Variable aName already declared above
  const aLoc = settings?.arotLocation || 'বাংলাদেশ';
  const aContact = settings?.mobile ? `Mob: ${settings.mobile}` : '';
  const aTagline = settings?.tagline || 'বিএসটিআই অনুমোদিত ডিজিটাল ভাউচার';
  const logoPath = path.join(__dirname, '../assets/images/logo.jpg');

  // --- 1. Background Watermark ---
  doc.save();
  doc.opacity(0.04);
  doc.image(logoPath, 150, 250, { width: 300 });
  doc.restore();

  // --- 2. Top Header Banner ---
  doc.rect(0, 0, 10, 180).fill(COLORS.primary); // Tall accent bar
  
  // Header Zones Coordinates
  const logoZone = { x: 45, y: 30, w: 90 };
  const brandingZone = { x: 140, y: 30, w: 260 };
  const metaZone = { x: 410, y: 30, w: 145 };

  // --- LOGO ---
  doc.image(logoPath, logoZone.x, logoZone.y, { height: 75 });
  
  // --- BRANDING (Center Zone - No Overlap) ---
  doc.fillColor(COLORS.primary)
     .fontSize(16)
     .text(aName, brandingZone.x, brandingZone.y, { width: brandingZone.w, lineGap: 0 });
  
  doc.fillColor(COLORS.muted)
     .fontSize(8.5)
     .text(`${aLoc} ${aContact ? ' | ' + aContact : ''}`, brandingZone.x, doc.y + 4, { width: brandingZone.w });
  
  doc.fillColor(COLORS.secondary)
     .fontSize(9)
     .text(aTagline, brandingZone.x, doc.y + 12, { width: brandingZone.w });

  // --- METADATA (Right Zone) ---
  doc.rect(metaZone.x, metaZone.y, metaZone.w, 90).fill(COLORS.light);
  
  // Receipt No
  doc.fillColor(COLORS.muted).fontSize(7).text('রশিদ নম্বর / RECEIPT NO', metaZone.x + 10, metaZone.y + 12);
  doc.fillColor(COLORS.primary).fontSize(12).text(transaction.receiptNo, metaZone.x + 10, metaZone.y + 24);
  
  // Date (Close allignment - No Gaps)
  const dateY = metaZone.y + 60;
  doc.fillColor(COLORS.muted).fontSize(8).text('তারিখ:', metaZone.x + 10, dateY, { continued: true });
  const dt = moment(transaction.date).format('DD/MM/YYYY');
  doc.fillColor(COLORS.secondary).fontSize(9).text(` ${bin(dt)}`, { width: 100 });

  // --- Divider and Copy Badge ---
  doc.moveTo(50, 140).lineTo(545, 140).lineWidth(0.5).stroke(COLORS.border);
  
  const isPona = transaction.transactionType === 'Pona';
  
  let copyLabel = '';
  if (type === 'farmer') {
      copyLabel = isPona ? 'মালিকের কপি / OWNER COPY' : 'বিক্রেতা বা চাষীর কপি / FARMER COPY';
  } else {
      copyLabel = isPona ? 'চাষীর কপি / CASHI COPY' : 'ক্রেতার কপি / BUYER COPY';
  }
  
  const badgeColor = type === 'farmer' ? COLORS.primary : COLORS.secondary;
  
  // Draw Badge Background
  const badgeW = 220;
  const badgeH = 18;
  const badgeX = (600 - badgeW) / 2;
  const badgeY = 131; // Positioning on the divider line for a modern look
  
  doc.rect(badgeX, badgeY, badgeW, badgeH).fill(badgeColor);
  doc.fillColor('#ffffff')
     .fontSize(9)
     .text(copyLabel, badgeX, badgeY + 5, { align: 'center', width: badgeW });

  // --- 3. Party Information ---
  const py = 165; // Adjusted for badge room
  // Seller Card
  doc.rect(45, py, 240, 60).fill(COLORS.light);
  doc.fillColor(COLORS.muted).fontSize(8).text(isPona ? 'মালিক (Owner Info)' : 'বিক্রেতা (Seller Info)', 55, py + 10);
  doc.fillColor(COLORS.secondary).fontSize(13).text(transaction.farmerName, 55, py + 25);
  doc.fillColor(COLORS.muted).fontSize(8).text(isPona ? 'পোনার মালিক ও সরবরাহকারী' : 'মাছ চাষী ও সরবরাহকারী', 55, py + 42);

  // Buyer Card
  doc.rect(310, py, 240, 60).fill(COLORS.light);
  doc.fillColor(COLORS.muted).fontSize(8).text(isPona ? 'চাষী (Cashi Info)' : 'ক্রেতা (Buyer Info)', 320, py + 10);
  doc.fillColor(COLORS.secondary).fontSize(13).text(transaction.buyerName, 320, py + 25);
  doc.fillColor(COLORS.muted).fontSize(8).text(isPona ? 'মৎস্য চাষী' : 'মাছ পাইকারি বিক্রেতা', 320, py + 42);

  // --- 4. Main Transaction Table ---
  const ty = 230;
  const tw = 495;
  const col = { desc: 60, wt: 220, rate: 320, total: 440 };
  // isPona is already defined above

  // Header
  doc.rect(50, ty, tw, 35).fill(COLORS.secondary);
  doc.fillColor('#ffffff').fontSize(10);
  doc.text(isPona ? 'পোনা বর্ণনা (Fry Details)' : 'মাছের বর্ণনা (Fish Details)', col.desc, ty + 12);
  doc.text(isPona ? 'পরিমাণ (হাজার)' : 'ওজন (KG)', col.wt, ty + 12, { width: 90, align: 'center' });
  doc.text('দর / একক', col.rate, ty + 12, { width: 110, align: 'right' });
  doc.text('মোট টাকা', col.total, ty + 12, { width: 100, align: 'right' });

  let cy = ty + 35;
  transaction.items.forEach((it, idx) => {
    const rh = 35;
    if (idx % 2 !== 0) doc.rect(50, cy, tw, rh).fill(COLORS.light);
    
    doc.fillColor(COLORS.secondary).fontSize(10);
    const categoryText = isPona ? 'পোনা' : getBn(it.fishCategory);
    doc.text(`${getBn(it.fishType)} (${categoryText})`, col.desc, cy + 12, { width: 155 });
    
    doc.fillColor(COLORS.muted).fontSize(9);
    if (isPona) {
        doc.text(`${bin(it.quantity)} হাজার`, col.wt, cy + 12, { width: 90, align: 'center' });
    } else {
        const weightText = `${bin(it.kachaWeight)} / ${bin(it.pakaWeight)}`;
        doc.text(weightText, col.wt, cy + 12, { width: 90, align: 'center' });
    }
    
    const isS = ['Bagda', 'Golda', 'Venami', 'Horina', 'Caka Cingi'].includes(it.fishType);
    let rateLabel = '';
    if (isPona) rateLabel = 'হাজা'; // Short for Hazar
    else rateLabel = isS ? 'কেজি' : 'মন';

    const rateVal = isPona ? (it.rate || 0) : (it.ratePerMon || 0);
    doc.text(`${bin(rateVal.toLocaleString())}/${rateLabel}`, col.rate, cy + 12, { width: 110, align: 'right' });
    
    doc.fillColor(COLORS.secondary).fontSize(11).text(bin(it.itemGrossAmount.toLocaleString()), col.total, cy + 12, { width: 100, align: 'right' });
    
    cy += rh;
    doc.moveTo(50, cy).lineTo(545, cy).lineWidth(0.2).stroke(COLORS.border);
  });

  // --- 5. Financial Summary Statement ---
  cy += 30;
  const sx = 345;
  const sw = 200;
  const lineH = 22;

  // Function to draw a summary line
  const drawLine = (label, value, color = COLORS.muted, isBold = false, isDanger = false) => {
    doc.fillColor(color).fontSize(isBold ? 11 : 10).text(label, sx, cy);
    doc.fillColor(isDanger ? COLORS.danger : COLORS.secondary)
       .fontSize(isBold ? 11 : 11)
       .text(`${bin(value.toLocaleString())} ৳`, sx, cy, { align: 'right', width: sw });
    cy += lineH;
  };

  if (type === 'farmer') {
    const netEarning = transaction.netFarmerAmount || (transaction.grossAmount - transaction.commissionAmount);
    const fPaid = transaction.farmerPaidAmount || 0;
    const fDue = transaction.farmerDueAmount !== undefined ? transaction.farmerDueAmount : (netEarning - fPaid);

    drawLine('মোট বিক্রয়মূল্য (Gross Total):', transaction.grossAmount);
    drawLine(`আড়ত কমিশন (Commission ${bin(transaction.commissionRate)}%):`, transaction.commissionAmount, COLORS.muted, false, true);
    
    // Net Earning Line
    doc.moveTo(sx, cy - 5).lineTo(sx + sw, cy - 5).lineWidth(0.5).stroke(COLORS.border);
    cy += 5;
    drawLine(isPona ? 'নিট মালিকের আয় (Net Earning):' : 'নিট চাষী প্রদেয় (Net Earning):', netEarning, COLORS.primary, true);
    
    drawLine(isPona ? 'নগদ প্রদান (Cash to Malik):' : 'নগদ প্রদান (Cash Paid by Arot):', fPaid, COLORS.muted, false, true);
    cy += 10;

    // Highlight Box for Due
    doc.rect(sx - 10, cy - 5, sw + 10, 50).fill(COLORS.primary);
    doc.fillColor('#ffffff').fontSize(10).text(isPona ? 'মালিকের বকেয়া (Owner Balance Due)' : 'চাষীর বকেয়া (Farmer Balance Due)', sx, cy + 5);
    doc.fontSize(18).text(`${bin(fDue.toLocaleString())} ৳`, sx, cy + 22, { align: 'right', width: sw - 5 });
  } else {
    const bPayable = transaction.buyerPayable || transaction.grossAmount;
    const bPaid = transaction.paidAmount || 0;
    const bDue = transaction.dueAmount !== undefined ? transaction.dueAmount : (bPayable - bPaid);

    drawLine('মোট ক্রয়মূল্য (Gross Total):', transaction.grossAmount);
    drawLine('পরিশোধিত নগদ (Paid Cash):', bPaid, COLORS.accent, false);
    cy += 15;

    // Highlight Box for Due
    doc.rect(sx - 10, cy - 5, sw + 10, 50).fill(COLORS.secondary);
    doc.fillColor('#ffffff').fontSize(10).text(isPona ? 'চাষীর বকেয়া (Cashi Balance Due)' : 'ক্রেতার বকেয়া (Buyer Balance Due)', sx, cy + 5);
    doc.fillColor('#fbbf24').fontSize(18).text(`${bin(bDue.toLocaleString())} ৳`, sx, cy + 22, { align: 'right', width: sw - 5 });
  }

  // --- 6. Security Footer & Verification ---
  const footerY = 720;
  doc.rect(50, footerY, 200, 70).lineWidth(1).stroke(COLORS.border).dash(3, {space: 3});
  doc.fillColor(COLORS.muted).fontSize(7).text('SYSTEM VERIFIED VOUCHER', 60, footerY + 12);
  doc.fillColor(COLORS.secondary).fontSize(9).text(`ট্র্যাকিং আইডি: ${transaction._id}`, 60, footerY + 28, { width: 180 });
  doc.fillColor(COLORS.accent).fontSize(8).text('স্বয়ংক্রিয়ভাবে সংরক্ষিত ডকুমেন্ট', 60, footerY + 48);

  // Footer Note
  doc.rect(0, 810, 600, 32).fill(COLORS.light);
  doc.fillColor(COLORS.muted).fontSize(8).text('মাছ চাষে দেশি প্রযুক্তির বিপ্লব - দেশি মাছের সুরক্ষা আমাদের লক্ষ্য।', 0, 822, { align: 'center', width: 600 });

  doc.end();
};

const generateStatement = (res, transactions, buyerName, settings, range) => {
  const doc = new PDFDocument({ 
    size: 'A4', 
    margin: 50,
    info: {
      Title: `ক্রেতার-স্টেটমেন্ট-${buyerName}`,
      Author: 'Digital Arot Management'
    }
  });

  const fontPath = path.join(__dirname, '../assets/fonts/kalpurush.ttf');
  // doc.registerFont('BnFont', fontPath);
  doc.font(fontPath);
  doc.pipe(res);

  const aName = (settings?.arotName || 'মাছ আড়ত').toUpperCase();
  const aLoc = settings?.arotLocation || 'বাংলাদেশ';
  const aContact = settings?.mobile ? `Mob: ${settings.mobile}` : '';
  const aTagline = settings?.tagline || 'বিএসটিআই অনুমোদিত ডিজিটাল ভাউচার';
  const logoPath = path.join(__dirname, '../assets/images/logo.jpg');

  // --- 1. Background Watermark ---
  doc.save();
  doc.opacity(0.04);
  doc.image(logoPath, 150, 250, { width: 300 });
  doc.restore();

  // --- 2. Top Header Banner (Matching Identity) ---
  doc.rect(0, 0, 10, 180).fill(COLORS.primary); // Tall accent bar
  
  const logoZone = { x: 45, y: 30, w: 90 };
  const brandingZone = { x: 140, y: 30, w: 260 };
  const metaZone = { x: 410, y: 30, w: 145 };

  // --- LOGO ---
  doc.image(logoPath, logoZone.x, logoZone.y, { height: 75 });
  
  // --- BRANDING ---
  doc.fillColor(COLORS.primary).fontSize(16).text(aName, brandingZone.x, brandingZone.y, { width: brandingZone.w });
  doc.fillColor(COLORS.muted).fontSize(8.5).text(`${aLoc} ${aContact ? ' | ' + aContact : ''}`, brandingZone.x, doc.y + 4, { width: brandingZone.w });
  doc.fillColor(COLORS.secondary).fontSize(9).text(aTagline, brandingZone.x, doc.y + 12, { width: brandingZone.w });

  // --- METADATA (Buyer Info & Date Range) ---
  doc.rect(metaZone.x, metaZone.y, metaZone.w, 90).fill(COLORS.light);
  doc.fillColor(COLORS.muted).fontSize(7).text('ক্রেতার লেজার / BUYER LEDGER', metaZone.x + 10, metaZone.y + 12);
  doc.fillColor(COLORS.primary).fontSize(11).text(buyerName, metaZone.x + 10, metaZone.y + 24, { width: 125 });
  
  const dateRange = range.startDate 
    ? `${moment(range.startDate).format('DD/MM/YY')} - ${moment(range.endDate || new Date()).format('DD/MM/YY')}`
    : 'All Time Records';
  doc.fillColor(COLORS.muted).fontSize(8).text(dateRange, metaZone.x + 10, metaZone.y + 65);

  // --- Divider and Badge ---
  doc.moveTo(50, 140).lineTo(545, 140).lineWidth(0.5).stroke(COLORS.border);
  
  const badgeW = 200;
  const badgeH = 18;
  const badgeX = (600 - badgeW) / 2;
  const badgeY = 131;
  
  doc.rect(badgeX, badgeY, badgeW, badgeH).fill(COLORS.secondary);
  doc.fillColor('#ffffff').fontSize(9).text('ক্রেতার পূর্ণাঙ্গ স্টেটমেন্ট / BUYER STATEMENT', badgeX, badgeY + 5, { align: 'center', width: badgeW });

  // --- 3. Summary Bar ---
  const totalGross = transactions.reduce((sum, t) => sum + (parseFloat(t.grossAmount) || 0), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + (parseFloat(t.paidAmount) || 0), 0);
  const totalDue = transactions.reduce((sum, t) => sum + (parseFloat(t.dueAmount) || 0), 0);

  let py = 165;
  const bw = 160;
  const gap = 15;
  
  const drawBox = (x, label, value, color) => {
    doc.rect(x, py, bw, 55).fill(COLORS.light);
    doc.fillColor(COLORS.muted).fontSize(8).text(label, x + 10, py + 12);
    doc.fillColor(color).fontSize(14).text(`${bin((value || 0).toLocaleString())} `, x + 10, py + 28, { continued: true }).fontSize(10).text('৳');
  };

  drawBox(45, 'মোট ক্রয় (Total Purchase)', totalGross, COLORS.secondary);
  drawBox(45 + bw + gap, 'মোট জমা (Total Paid)', totalPaid, COLORS.accent);
  drawBox(45 + (bw + gap) * 2, 'মোট বকেয়া (Outstanding)', totalDue, COLORS.danger);

  // --- 4. Table ---
  py = 240;
  const tw = 495;
  doc.rect(50, py, tw, 30).fill(COLORS.secondary);
  doc.fillColor('#ffffff').fontSize(9);
  doc.text('রশিদ নং', 60, py + 10);
  doc.text('তারিখ', 130, py + 10);
  doc.text('মাছের বিবরণ', 200, py + 10);
  doc.text('মোট টাকা', 340, py + 10, { width: 65, align: 'right' });
  doc.text('জমা', 415, py + 10, { width: 60, align: 'right' });
  doc.text('বকেয়া', 485, py + 10, { width: 60, align: 'right' });

  py += 30;
  transactions.forEach((t, idx) => {
    const rh = 35;
    if (py > 750) { 
      doc.addPage(); 
      py = 50;
      doc.rect(50, py, tw, 30).fill(COLORS.secondary);
      doc.fillColor('#ffffff').fontSize(9);
      doc.text('রশিদ নং', 60, py + 10);
      doc.text('তারিখ', 130, py + 10);
      doc.text('মাছের বিবরণ', 200, py + 10);
      doc.text('মোট টাকা', 340, py + 10, { width: 65, align: 'right' });
      doc.text('জমা', 415, py + 10, { width: 60, align: 'right' });
      doc.text('বকেয়া', 485, py + 10, { width: 60, align: 'right' });
      py += 35;
    }
    
    if (idx % 2 !== 0) doc.rect(50, py, tw, rh).fill(COLORS.light);
    
    doc.fillColor(COLORS.secondary).fontSize(8);
    doc.text(t.receiptNo, 60, py + 12);
    doc.text(moment(t.date).format('DD/MM/YY'), 130, py + 12);
    
    const itemsText = (t.items || []).map(it => getBn(it.fishType)).join(', ');
    doc.text(itemsText, 200, py + 12, { width: 140, height: 25, ellipsis: true });
    
    doc.text(bin((t.grossAmount || 0).toLocaleString()), 340, py + 12, { width: 65, align: 'right' });
    doc.text(bin((t.paidAmount || 0).toLocaleString()), 415, py + 12, { width: 60, align: 'right' });
    
    doc.fillColor((t.dueAmount || 0) > 0 ? COLORS.danger : COLORS.accent);
    doc.text(bin((t.dueAmount || 0).toLocaleString()), 485, py + 12, { width: 60, align: 'right' });
    
    py += rh;
    doc.moveTo(50, py).lineTo(545, py).lineWidth(0.2).stroke(COLORS.border);
  });

  // Footer Part
  const footerY = 750;
  doc.moveTo(50, footerY).lineTo(545, footerY).lineWidth(0.5).stroke(COLORS.border);
  doc.fontSize(8).fillColor(COLORS.muted).text(`Generated on: ${moment().format('LLL')}`, 50, footerY + 10, { align: 'center', width: 495 });
  doc.text('মাছ চাষে দেশি প্রযুক্তির বিপ্লব - দেশি মাছের সুরক্ষা আমাদের লক্ষ্য।', 50, footerY + 25, { align: 'center', width: 495 });

  doc.end();
};

/**
 * Generate a consolidated statement (ledger) for the Farmer/Owner/Malik
 */
/**
 * Generate a consolidated statement (ledger) for the Farmer/Owner/Malik
 * Redesigned to match Buyer Statement
 */
const generateFarmerStatement = (res, transactions, name, settings, options = {}) => {
  console.log('Generating Owner Statement for:', name, 'Transactions:', transactions.length);
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  
  // Handle stream errors
  doc.on('error', (err) => {
    console.error('PDF Stream Error:', err);
  });

  doc.pipe(res);

  // Fonts - Fail-safe loading
  let fontLoaded = false;
  try {
    const fontPath = path.join(__dirname, '../assets/fonts/kalpurush.ttf');
    doc.font(fontPath); // Try custom font
    fontLoaded = true;
  } catch (fontErr) {
    console.error('Font loading failed, falling back to Helvetica:', fontErr.message);
    doc.font('Helvetica'); // Fallback
  }

  try {
  const aName = (settings?.arotName || 'মাছ আড়ত').toUpperCase();
  const aLoc = settings?.arotLocation || 'বাংলাদেশ';
  const aContact = settings?.mobile ? `Mob: ${settings.mobile}` : '';
  const aTagline = settings?.tagline || 'বিএসটিআই অনুমোদিত ডিজিটাল ভাউচার';
  // Match exactly with generateStatement logic
  const logoPath = path.join(__dirname, '../assets/images/logo.jpg');

  // --- 1. Background Watermark ---
  if (logoPath) {
      try {
        doc.save();
        doc.opacity(0.04);
        doc.image(logoPath, 150, 250, { width: 300 });
        doc.restore();
      } catch(e) {}
  }

  // --- 2. Top Header Banner (Matching Identity) ---
  doc.rect(0, 0, 10, 180).fill(COLORS.primary); // Tall accent bar
  
  const logoZone = { x: 45, y: 30, w: 90 };
  const brandingZone = { x: 140, y: 30, w: 260 };
  const metaZone = { x: 410, y: 30, w: 145 };

  // --- LOGO ---
  if (logoPath) {
      try {
         doc.image(logoPath, logoZone.x, logoZone.y, { height: 75 });
      } catch (e) { console.error('Logo draw error:', e.message); }
  }
  
  // --- BRANDING ---
  doc.fillColor(COLORS.primary).fontSize(16).text(aName, brandingZone.x, brandingZone.y, { width: brandingZone.w });
  doc.fillColor(COLORS.muted).fontSize(8.5).text(`${aLoc} ${aContact ? ' | ' + aContact : ''}`, brandingZone.x, doc.y + 4, { width: brandingZone.w });
  doc.fillColor(COLORS.secondary).fontSize(9).text(aTagline, brandingZone.x, doc.y + 12, { width: brandingZone.w });

      // --- METADATA (Owner Info & Date Range) ---
      doc.rect(metaZone.x, metaZone.y, metaZone.w, 90).fill(COLORS.light);
      doc.fillColor(COLORS.muted).fontSize(7).text(fontLoaded ? 'মালিকের লেজার / OWNER LEDGER' : 'OWNER LEDGER', metaZone.x + 10, metaZone.y + 12);
      
      // Use actual name from transactions if available, otherwise fallback to search term
      const displayName = transactions.length > 0 ? transactions[0].farmerName : name;
      doc.fillColor(COLORS.primary).fontSize(11).text(displayName, metaZone.x + 10, metaZone.y + 24, { width: 125, ellipsis: true });
      
      let rangeText = 'All Time Records';
      if (options.startDate && options.endDate) {
          const s = moment(options.startDate).format('DD/MM/YY');
          const e = moment(options.endDate).format('DD/MM/YY');
          rangeText = (s === e) ? s : `${s} - ${e}`;
      }
      doc.fillColor(COLORS.muted).fontSize(8).text(rangeText, metaZone.x + 10, metaZone.y + 65);

      // --- Divider and Badge ---
      doc.moveTo(50, 140).lineTo(545, 140).lineWidth(0.5).stroke(COLORS.border);
      
      const badgeW = 200;
      const badgeH = 18;
      const badgeX = (600 - badgeW) / 2;
      const badgeY = 131;
      
      doc.rect(badgeX, badgeY, badgeW, badgeH).fill(COLORS.primary); // Primary color for Owner
      doc.fillColor('#ffffff').fontSize(9).text(fontLoaded ? 'মালিকের পূর্ণাঙ্গ স্টেটমেন্ট / OWNER STATEMENT' : 'OWNER STATEMENT', badgeX, badgeY + 5, { align: 'center', width: badgeW });

      // --- 3. Summary Bar ---
      const totalNet = transactions.reduce((sum, t) => sum + (parseFloat(t.netFarmerAmount) || 0), 0);
      const totalPaid = transactions.reduce((sum, t) => sum + (parseFloat(t.farmerPaidAmount) || 0), 0);
      const totalDue = transactions.reduce((sum, t) => sum + (parseFloat(t.farmerDueAmount) || 0), 0);

      let py = 165;
      const bw = 160;
      const gap = 15;
      
      const drawBox = (x, label, value, color) => {
        doc.rect(x, py, bw, 55).fill(COLORS.light);
        doc.fillColor(COLORS.muted).fontSize(8).text(label, x + 10, py + 12);
        const valStr = bin((value || 0).toLocaleString());
        doc.fillColor(color).fontSize(14).text(`${valStr} `, x + 10, py + 28, { continued: true }).fontSize(10).text('৳');
      };

      drawBox(45, fontLoaded ? 'মোট নিট পাওনা (Total Net)' : 'Total Net', totalNet, COLORS.secondary);
      drawBox(45 + bw + gap, fontLoaded ? 'মোট নগদ গ্রহণ (Total Paid)' : 'Total Paid', totalPaid, COLORS.accent);
      drawBox(45 + (bw + gap) * 2, fontLoaded ? 'অবশিষ্ট বকেয়া (Due)' : 'Total Due', totalDue, COLORS.danger);

      // --- 4. Table ---
      py = 240;
      const tw = 495;
      
      const drawTableHead = (y) => {
        doc.rect(50, y, tw, 30).fill(COLORS.secondary);
        doc.fillColor('#ffffff').fontSize(9);
        doc.text(fontLoaded ? 'রশিদ নং' : 'Receipt', 60, y + 10);
        doc.text(fontLoaded ? 'তারিখ' : 'Date', 130, y + 10);
        doc.text(fontLoaded ? 'ক্রেতার নাম' : 'Buyer', 200, y + 10); // Changed to Buyer Name column
        doc.text(fontLoaded ? 'নিট টাকা' : 'Net', 340, y + 10, { width: 65, align: 'right' });
        doc.text(fontLoaded ? 'প্রদান' : 'Paid', 415, y + 10, { width: 60, align: 'right' });
        doc.text(fontLoaded ? 'বকেয়া' : 'Due', 485, y + 10, { width: 60, align: 'right' });
      };

      drawTableHead(py);
      py += 30;

      transactions.forEach((t, idx) => {
        try {
            const rh = 35;
            if (py > 750) { 
              doc.addPage(); 
              py = 50;
              drawTableHead(py);
              py += 35;
            }
            
            if (idx % 2 !== 0) doc.rect(50, py, tw, rh).fill(COLORS.light);
            
            doc.fillColor(COLORS.secondary).fontSize(8);
            doc.text(t.receiptNo || '-', 60, py + 12);
            doc.text(t.date ? moment(t.date).format('DD/MM/YY') : '-', 130, py + 12);
            
            // Show Buyer Name (This is important for Owner to know who bought)
            // Or Description if preferred? 
            // Buyer Ledger shows "Fish Details". Owner Ledger usually wants to know Buyer or Details?
            // User requested "Buyer Name" in previous step's table.
            // Let's combine: Buyer Name + Short Desc
            const buyer = t.buyerName || 'N/A';
            const isPona = t.transactionType === 'Pona';
            const items = t.items || [];
            const firstItem = items[0] || {};
            const fishType = firstItem.fishType ? getBn(firstItem.fishType) : '';
            let shortDesc = '';
            if (items.length > 0) {
                 shortDesc = isPona ? `${bin(firstItem.quantity || 0)}হাজা` : `${bin(firstItem.pakaWeight || 0)}কেজি`;
            }
            
            doc.text(`${buyer} (${shortDesc})`, 200, py + 12, { width: 135, height: 25, ellipsis: true });
            
            doc.text(bin((t.netFarmerAmount || 0).toLocaleString()), 340, py + 12, { width: 65, align: 'right' });
            doc.text(bin((t.farmerPaidAmount || 0).toLocaleString()), 415, py + 12, { width: 60, align: 'right' });
            
            const fDue = t.farmerDueAmount || 0;
            doc.fillColor(fDue > 0 ? COLORS.danger : COLORS.accent);
            doc.text(bin(fDue.toLocaleString()), 485, py + 12, { width: 60, align: 'right' });
            
            py += rh;
            doc.fillColor(COLORS.border).moveTo(50, py).lineTo(545, py).lineWidth(0.2).stroke();
        } catch (rowError) {
            console.error('Row Error:', rowError);
        }
      });

      // Footer Part
      const footerY = 750;
      doc.moveTo(50, footerY).lineTo(545, footerY).lineWidth(0.5).stroke(COLORS.border);
      doc.fontSize(8).fillColor(COLORS.muted).text(`Generated on: ${moment().format('LLL')}`, 50, footerY + 10, { align: 'center', width: 495 });
      doc.text(fontLoaded ? 'মাছ চাষে দেশি প্রযুক্তির বিপ্লব - দেশি মাছের সুরক্ষা আমাদের লক্ষ্য।' : 'Digital Fish Arot Management System', 50, footerY + 25, { align: 'center', width: 495 });

  } catch (mainError) {
      console.error('Critical Error inside PDF Generation Main Block:', mainError);
      doc.fontSize(12).fillColor(COLORS.danger).text('Error generating full report. Please contact support.', 50, 50);
  }

  doc.end();
};

module.exports = {
  generateReceipt,
  generateStatement,
  generateFarmerStatement
};
