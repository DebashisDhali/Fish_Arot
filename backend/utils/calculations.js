/**
 * Fish Arot Calculation Engine
 * Handles multiple fish items within a single transaction
 * Uses integer math (Math.round) to avoid floating point inaccuracies
 */

const calculateTransaction = (data, settings) => {
  const { items, transactionType = 'Fish', paidAmount = 0, farmerPaidAmount = 0 } = data;
  const isPona = transactionType === 'Pona';
  
  // Use specific commission rate for Pona
  const commissionRate = isPona 
    ? (settings?.ponaCommissionRate !== undefined ? settings.ponaCommissionRate : 3.0) 
    : (settings?.commissionRate !== undefined ? settings.commissionRate : 2.5);

  let totalGrossAmount = 0;
  let totalKachaWeight = 0;
  let totalPakaWeight = 0;
  let totalQuantity = 0;
  let totalWeight = 0;

  // Process each item
  const processedItems = (items || []).filter(item => {
      if (isPona) return (parseFloat(item.quantity) > 0 && parseFloat(item.rate) > 0);
      return (parseFloat(item.kachaWeight) > 0 || parseFloat(item.pakaWeight) > 0) && parseFloat(item.ratePerMon) > 0;
  }).map(item => {
    let itemGrossAmount = 0;
    let itemTotalWeight = 0;

    const qty = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    const kacha = parseFloat(item.kachaWeight) || 0;
    const paka = parseFloat(item.pakaWeight) || 0;
    const ratePerMon = parseFloat(item.ratePerMon) || 0;

    if (isPona) {
      itemGrossAmount = Math.round(qty * rate);
      totalQuantity += qty;
    } else {
      itemTotalWeight = paka;
      const isShrimp = ['Bagda', 'Golda', 'Venami', 'Horina', 'Caka Cingi'].includes(item.fishType);
      
      itemGrossAmount = isShrimp 
        ? Math.round(itemTotalWeight * ratePerMon)
        : Math.round((itemTotalWeight / 40) * ratePerMon);

      totalKachaWeight += kacha;
      totalPakaWeight += paka;
      totalWeight += itemTotalWeight;
    }

    totalGrossAmount += itemGrossAmount;

    return {
      fishType: item.fishType,
      fishCategory: item.fishCategory,
      unit: item.unit,
      quantity: qty,
      rate: rate,
      ratePerMon: ratePerMon,
      kachaWeight: kacha,
      pakaWeight: paka,
      itemGrossAmount,
      itemTotalWeight: isPona ? 0 : itemTotalWeight
    };
  });

  // Commission is deducted from farmer (Malik) only
  const commissionAmount = Math.round((totalGrossAmount * commissionRate) / 100);
  const netFarmerAmount = totalGrossAmount - commissionAmount;

  // Farmer (Malik) calculations
  const fPaid = parseFloat(farmerPaidAmount) || 0;
  const farmerDueAmount = netFarmerAmount - fPaid;

  // Buyer (Cashi) pays the full gross amount
  const buyerPayable = totalGrossAmount;
  const currentPaid = parseFloat(paidAmount) || 0;
  const dueAmount = buyerPayable - currentPaid;

  return {
    transactionType,
    items: processedItems,
    totalQuantity,
    totalKachaWeight,
    totalPakaWeight,
    totalWeight,
    grossAmount: totalGrossAmount,
    commissionRate,
    commissionAmount,
    netFarmerAmount,
    farmerPaidAmount: fPaid,
    farmerDueAmount,
    isFarmerPaid: farmerDueAmount <= 0,
    buyerPayable,
    paidAmount: currentPaid,
    dueAmount,
    isPaid: dueAmount <= 0
  };
};

module.exports = {
  calculateTransaction
};
