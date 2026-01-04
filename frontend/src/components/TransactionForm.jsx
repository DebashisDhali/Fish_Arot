import { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import { useLanguage } from '../context/LanguageContext';
import { FISH_TYPES, FISH_CATEGORIES } from '../i18n/translations';

const SHRIMP_TYPES = ['Bagda', 'Golda', 'Venami', 'Horina', 'Caka Cingi'];

const TransactionForm = ({ onSuccess, onCancel, editData = null }) => {
    const { t, language } = useLanguage();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [savedTransaction, setSavedTransaction] = useState(null);
    const [showPreview, setShowPreview] = useState(false);

    const [headerData, setHeaderData] = useState({
        date: new Date().toISOString().split('T')[0],
        farmerName: '',
        buyerName: ''
    });

    const [items, setItems] = useState([
        { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' },
        { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' },
        { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' }
    ]);

    const [paidAmount, setPaidAmount] = useState('0');
    const [farmerPaidAmount, setFarmerPaidAmount] = useState('0');
    const [transactionType, setTransactionType] = useState(editData?.transactionType || 'Fish');

    useEffect(() => {
        loadSettings();
        if (editData) {
            setTransactionType(editData.transactionType || 'Fish');
            setHeaderData({
                date: new Date(editData.date).toISOString().split('T')[0],
                farmerName: editData.farmerName,
                buyerName: editData.buyerName
            });
            setItems(editData.items.map(item => ({
                fishType: item.fishType || 'Rui',
                fishCategory: item.fishCategory || 'Large',
                ratePerMon: item.ratePerMon || '',
                rate: item.rate || '',
                kachaWeight: item.kachaWeight || '0',
                pakaWeight: item.pakaWeight || '0.00',
                quantity: item.quantity || '0'
            })));
            setPaidAmount(editData.paidAmount?.toString() || '0');
            setFarmerPaidAmount((editData.farmerPaidAmount || 0).toString());
        }
    }, [editData]);

    const loadSettings = async () => {
        try {
            const response = await settingsService.get();
            setSettings(response.data);
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    };

    const handleHeaderChange = (e) => {
        setHeaderData({ ...headerData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleItemChange = (index, e) => {
        const { name, value } = e.target;
        const newItems = [...items];
        newItems[index][name] = value;

        // Auto-calculate pakaWeight if kachaWeight or fishType changes
        if (name === 'kachaWeight' || name === 'fishType') {
            const kacha = parseFloat(newItems[index].kachaWeight) || 0;
            const isShrimp = SHRIMP_TYPES.includes(newItems[index].fishType);
            // Shrimp deduction is now less (2.5%), General Fish is more (5%)
            const deductionRate = isShrimp
                ? (settings?.shrimpDeductionRate || 2.5)
                : (settings?.fishDeductionRate || 5);

            const paka = kacha * (1 - deductionRate / 100);
            newItems[index].pakaWeight = paka.toFixed(2);
        }

        setItems(newItems);
        setError('');
    };

    const addItem = () => {
        setItems([...items, { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' }]);
    };

    const removeItem = (index) => {
        if (items.length > 1) {
            const newItems = items.filter((_, i) => i !== index);
            setItems(newItems);
        }
    };

    // Calculations
    const calculatedItems = items.map(item => {
        const isPona = transactionType === 'Pona';

        if (isPona) {
            const qty = parseFloat(item.quantity) || 0;
            const rate = parseFloat(item.rate) || 0;
            const itemGrossAmount = Math.round(qty * rate);
            return { ...item, itemGrossAmount };
        } else {
            const paka = parseFloat(item.pakaWeight) || 0;
            const rate = parseFloat(item.ratePerMon) || 0;
            const isShrimp = SHRIMP_TYPES.includes(item.fishType);

            // Business logic update: paka is the final weight
            const itemTotalWeight = paka;
            // Calculation: if shrimp, rate is per KG. Else, rate is per MON (40 KG).
            const itemGrossAmount = isShrimp
                ? Math.round(itemTotalWeight * rate)
                : Math.round((itemTotalWeight / 40) * rate);

            return { ...item, itemTotalWeight, itemGrossAmount };
        }
    });

    const totalGross = calculatedItems.reduce((acc, item) => acc + item.itemGrossAmount, 0);
    const activeCommissionRate = (transactionType === 'Pona' ? (settings?.ponaCommissionRate || 3.0) : (settings?.commissionRate || 2.5));
    const commissionAmount = Math.round((totalGross * activeCommissionRate) / 100);
    const netFarmerAmount = totalGross - commissionAmount;
    const buyerPayable = totalGross;
    const dueAmount = buyerPayable - (parseFloat(paidAmount) || 0);

    const fPaid = parseFloat(farmerPaidAmount) || 0;
    const farmerDueAmount = netFarmerAmount - fPaid;

    const handleSubmit = async () => {
        setError('');
        setLoading(true);

        try {
            setShowPreview(false); // Close preview immediately for better sync

            // Filter out empty items based on transaction type
            const validItems = items.filter(item => {
                if (transactionType === 'Pona') {
                    return parseFloat(item.quantity) > 0 && parseFloat(item.rate) > 0;
                } else {
                    return (parseFloat(item.kachaWeight) > 0 || parseFloat(item.pakaWeight) > 0) && parseFloat(item.ratePerMon) > 0;
                }
            });

            if (validItems.length === 0) {
                setError(language === 'bn'
                    ? (transactionType === 'Pona' ? 'দয়া করে অন্তত একটি পোনার সঠিক পরিমাণ এবং দর দিন।' : 'দয়া করে অন্তত একটি মাছের সঠিক বিবরণ দিন।')
                    : 'Please provide at least one valid item.');
                setLoading(false);
                return;
            }

            if (!headerData.farmerName || !headerData.buyerName) {
                setError(language === 'bn' ? 'দয়া করে চাষী এবং ক্রেতার নাম দিন।' : 'Please provide both Farmer and Buyer names.');
                setLoading(false);
                return;
            }

            const payload = {
                ...headerData,
                transactionType,
                items: validItems.map(it => {
                    // Common fields
                    const baseItem = {
                        fishType: it.fishType,
                        fishCategory: transactionType === 'Pona' ? 'Pona' : it.fishCategory,
                        unit: transactionType === 'Pona' ? 'Hazar' : (SHRIMP_TYPES.includes(it.fishType) ? 'KG' : 'Mon')
                    };

                    // Type specific fields
                    if (transactionType === 'Pona') {
                        return {
                            ...baseItem,
                            quantity: parseFloat(it.quantity) || 0,
                            rate: parseFloat(it.rate) || 0
                        };
                    } else {
                        return {
                            ...baseItem,
                            ratePerMon: parseFloat(it.ratePerMon) || 0,
                            kachaWeight: parseFloat(it.kachaWeight) || 0,
                            pakaWeight: parseFloat(it.pakaWeight) || 0
                        };
                    }
                }),
                paidAmount: parseFloat(paidAmount) || 0,
                farmerPaidAmount: parseFloat(farmerPaidAmount) || 0
            };

            let response;
            if (editData) {
                response = await transactionService.update(editData._id, payload);
            } else {
                response = await transactionService.create(payload);
            }

            setSavedTransaction(response.data);
            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || t('error'));
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSuccess(false);
        setSavedTransaction(null);
        setHeaderData({
            date: new Date().toISOString().split('T')[0],
            farmerName: '',
            buyerName: ''
        });
        setItems([
            { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' },
            { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' },
            { fishType: FISH_TYPES[0], fishCategory: FISH_CATEGORIES[0], ratePerMon: '', kachaWeight: '0', pakaWeight: '0.00', quantity: '0', rate: '' }
        ]);
        setPaidAmount('0');
        setFarmerPaidAmount('0');
    };

    const handleView = async (type) => {
        if (!savedTransaction) return;
        try {
            if (type === 'farmer') {
                await transactionService.viewFarmerReceipt(savedTransaction._id);
            } else {
                await transactionService.viewBuyerReceipt(savedTransaction._id);
            }
        } catch (err) {
            alert('Failed to view receipt');
        }
    };

    const handleDownload = async (type) => {
        if (!savedTransaction) return;
        try {
            if (type === 'farmer') {
                await transactionService.downloadFarmerReceipt(savedTransaction._id);
            } else {
                await transactionService.downloadBuyerReceipt(savedTransaction._id);
            }
        } catch (err) {
            alert('Failed to download receipt');
        }
    };

    if (success && savedTransaction) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in">
                <div className="glass-card p-12 text-center border-emerald-100 shadow-2xl shadow-emerald-500/5 relative overflow-hidden">
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/5 rounded-full -ml-24 -mb-24"></div>

                    <div className="relative">
                        <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200 rotate-12 hover:rotate-0 transition-transform duration-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">
                            {language === 'bn' ? 'লেনদেন সফল হয়েছে!' : 'Transaction Successful!'}
                        </h2>
                        <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mb-10">
                            Digital Voucher Generated • {savedTransaction.receiptNo}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-12">
                            <div className="p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('grossSales')}</p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">৳{savedTransaction.grossAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {savedTransaction.transactionType === 'Pona'
                                        ? (language === 'bn' ? 'পোনা কমিশন' : 'Pona Commission')
                                        : t('arotCommission')}
                                </p>
                                <p className="text-xl font-black text-amber-600 tracking-tight">৳{savedTransaction.commissionAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-[1.5rem] bg-emerald-50 border border-emerald-100 transition-all hover:bg-white hover:shadow-lg">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">
                                    {savedTransaction.transactionType === 'Pona'
                                        ? (language === 'bn' ? 'মালিকের নিট আয়' : 'Owner Net Earning')
                                        : t('netFarmerEarning')}
                                </p>
                                <p className="text-xl font-black text-emerald-700 tracking-tight">৳{savedTransaction.netFarmerAmount.toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {savedTransaction.transactionType === 'Pona'
                                        ? (language === 'bn' ? 'চাষীর জমা (নগদ)' : 'Cashi Paid (Cash)')
                                        : (language === 'bn' ? 'ক্রেতার জমা (নগদ)' : 'Buyer Paid (Cash)')}
                                </p>
                                <p className="text-xl font-black text-indigo-600 tracking-tight">৳{(savedTransaction.paidAmount || 0).toLocaleString()}</p>
                            </div>
                            <div className="p-4 rounded-[1.5rem] bg-slate-50 border border-slate-100 transition-all hover:bg-white hover:shadow-lg">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                    {savedTransaction.transactionType === 'Pona'
                                        ? (language === 'bn' ? 'মালিককে প্রদান' : 'Paid to Owner')
                                        : (language === 'bn' ? 'চাষীকে প্রদান' : 'Paid to Farmer')}
                                </p>
                                <p className="text-xl font-black text-slate-800 tracking-tight">৳{(savedTransaction.farmerPaidAmount || 0).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row gap-6 justify-center">
                            <button onClick={() => handleView('farmer')} className="flex-1 group bg-indigo-600 text-white rounded-2xl py-5 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                <svg className="w-5 h-5 group-hover:bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {savedTransaction.transactionType === 'Pona' ? (language === 'bn' ? 'পোনার মালিকের রশিদ' : 'Owner Receipt') : t('farmerReceipt')}
                            </button>
                            <button onClick={() => handleView('buyer')} className="flex-1 group bg-slate-800 text-white rounded-2xl py-5 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:bg-slate-900 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3">
                                <svg className="w-5 h-5 group-hover:bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {savedTransaction.transactionType === 'Pona' ? (language === 'bn' ? 'চাষীর রশিদ' : 'Cashi Receipt') : t('buyerReceipt')}
                            </button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                            <div className="text-left">
                                <p className="text-xs font-bold text-slate-400 uppercase">{language === 'bn' ? 'লেনদেন আইডি' : 'Transaction ID'}</p>
                                <p className="text-[10px] font-mono text-slate-300">{savedTransaction._id}</p>
                            </div>
                            <button onClick={resetForm} className="px-10 py-4 rounded-xl font-black uppercase tracking-widest text-[11px] text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-100">
                                {t('enterNewAuction')}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative space-y-8 max-w-6xl mx-auto animate-fade-in">
            {/* Global Saving Overlay */}
            {loading && !showPreview && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] animate-fade-in">
                    <div className="glass-card p-10 flex flex-col items-center shadow-2xl scale-110">
                        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-indigo-900 font-black uppercase tracking-widest text-sm italic animate-pulse">
                            {t('saving')}
                        </p>
                    </div>
                </div>
            )}

            {/* Header Info */}
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('basicInfo')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <label className="input-label flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                            {t('auctionDate')}
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={headerData.date}
                            max={new Date().toISOString().split('T')[0]}
                            onChange={handleHeaderChange}
                            className="input font-bold text-slate-700 bg-slate-50 cursor-pointer border-slate-200"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="input-label">
                            {transactionType === 'Pona'
                                ? (language === 'bn' ? 'মালিকের নাম (পোনার মালিক)' : 'Owner / Malik Name')
                                : t('farmerName')}
                        </label>
                        <input
                            type="text"
                            name="farmerName"
                            placeholder={transactionType === 'Pona'
                                ? (language === 'bn' ? 'পোনার মালিকের নাম' : 'Enter Owner Name')
                                : (language === 'bn' ? 'চাষীর নাম' : 'Enter Farmer Name')}
                            value={headerData.farmerName}
                            onChange={handleHeaderChange}
                            className="input"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="input-label">
                            {transactionType === 'Pona'
                                ? (language === 'bn' ? 'ক্রেতার নাম (চাষী)' : 'Buyer / Cashi Name')
                                : t('buyerName')}
                        </label>
                        <input
                            type="text"
                            name="buyerName"
                            placeholder={transactionType === 'Pona'
                                ? (language === 'bn' ? 'ক্রেতা/চাষীর নাম' : 'Enter Cashi Name')
                                : (language === 'bn' ? 'ক্রেতার নাম' : 'Enter Buyer Name')}
                            value={headerData.buyerName}
                            onChange={handleHeaderChange}
                            className="input"
                        />
                    </div>
                </div>
            </div>

            {/* Transaction Type Switcher */}
            <div className="flex justify-center -mb-4 relative z-10">
                <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex gap-2">
                    <button
                        onClick={() => setTransactionType('Fish')}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${transactionType === 'Fish' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        {language === 'bn' ? 'মাছ বিক্রি (Mach)' : 'Fish Sales'}
                    </button>
                    <button
                        onClick={() => setTransactionType('Pona')}
                        className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${transactionType === 'Pona' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'text-slate-400 hover:bg-slate-50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 7v10c0 2 1.5 3 3.5 3s3.5-1 3.5-3V7c0-2-1.5-3-3.5-3S4 5 4 7zM13 7v10c0 2 1.5 3 3.5 3s3.5-1 3.5-3V7c0-2-1.5-3-3.5-3s-3.5 1-3.5 3z" /></svg>
                        {language === 'bn' ? 'পোনা বিক্রি (Pona)' : 'Pona Sales'}
                    </button>
                </div>
            </div>

            {/* Fish Items Table */}
            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('fishItems')}</h2>
                    </div>
                </div>

                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('type')}</th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('category')}</th>
                                {transactionType === 'Fish' ? (
                                    <>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('kacha')}</th>
                                        <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('paka')}</th>
                                    </>
                                ) : (
                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{language === 'bn' ? 'পরিমাণ (হাজার)' : 'Qty (Hazar)'}</th>
                                )}
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                                    {language === 'bn' ? 'দর' : 'Rate'}
                                </th>
                                <th className="px-4 py-4 text-[10px] font-black uppercase text-slate-400 tracking-widest">{t('subTotal')}</th>
                                <th className="px-8 py-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {items.map((item, index) => {
                                const totalWt = parseFloat(item.pakaWeight) || 0;
                                const isShrimp = SHRIMP_TYPES.includes(item.fishType);
                                const gross = isShrimp
                                    ? Math.round(totalWt * (parseFloat(item.ratePerMon) || 0))
                                    : Math.round((totalWt / 40) * (parseFloat(item.ratePerMon) || 0));

                                return (
                                    <tr key={index} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <select name="fishType" value={item.fishType} onChange={(e) => handleItemChange(index, e)} className="input !py-2 !text-sm w-full min-w-[120px]">
                                                {transactionType === 'Pona'
                                                    ? SHRIMP_TYPES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                                                    : FISH_TYPES.map(cat => <option key={cat} value={cat}>{cat}</option>)
                                                }
                                            </select>
                                        </td>
                                        <td className="px-2 py-4">
                                            <select name="fishCategory" value={item.fishCategory} onChange={(e) => handleItemChange(index, e)} className="input !py-2 !text-sm w-full min-w-[100px]">
                                                {transactionType === 'Pona'
                                                    ? <option value="Pona">{language === 'bn' ? 'পোনা' : 'Fry'}</option>
                                                    : FISH_CATEGORIES.map(size => <option key={size} value={size}>{t(size.toLowerCase().replace(' ', ''))}</option>)
                                                }
                                            </select>
                                        </td>
                                        {transactionType === 'Fish' ? (
                                            <>
                                                <td className="px-2 py-4">
                                                    <input type="number" step="0.01" name="kachaWeight" placeholder="0.00" value={item.kachaWeight} onFocus={(e) => e.target.select()} onChange={(e) => handleItemChange(index, e)} className="input !py-2 !text-sm !w-20 font-bold border-indigo-200" />
                                                </td>
                                                <td className="px-2 py-4">
                                                    <div className="relative">
                                                        <input type="number" step="0.01" name="pakaWeight" placeholder="0.00" value={item.pakaWeight} readOnly className="input !py-2 !text-sm !w-20 bg-slate-50 border-slate-200 text-slate-500 cursor-not-allowed" />
                                                        <div className="absolute -bottom-4 left-0 text-[8px] font-black text-rose-400 uppercase tracking-tighter whitespace-nowrap">
                                                            -{SHRIMP_TYPES.includes(item.fishType) ? settings?.shrimpDeductionRate || 2.5 : settings?.fishDeductionRate || 5}% {language === 'bn' ? 'কর্তন' : 'OFF'}
                                                        </div>
                                                    </div>
                                                </td>
                                            </>
                                        ) : (
                                            <td className="px-2 py-4">
                                                <input type="number" step="1" name="quantity" placeholder="0" value={item.quantity || ''} onFocus={(e) => e.target.select()} onChange={(e) => handleItemChange(index, e)} className="input !py-2 !text-sm !w-28 font-bold border-emerald-200" />
                                            </td>
                                        )}
                                        <td className="px-2 py-4">
                                            <div className="relative">
                                                <input type="number" step="0.01" name={transactionType === 'Pona' ? 'rate' : 'ratePerMon'} placeholder="0" value={transactionType === 'Pona' ? item.rate : item.ratePerMon} onFocus={(e) => e.target.select()} onChange={(e) => handleItemChange(index, e)} className="input !py-2 !text-sm !w-28 font-bold" />
                                                <div className="absolute -bottom-4 right-0 text-[8px] font-black text-indigo-400 uppercase tracking-tighter">
                                                    {transactionType === 'Pona' ? '/ HAZAR' : (SHRIMP_TYPES.includes(item.fishType) ? '/ KG' : '/ MON')}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 min-w-[120px]">
                                            <div className="font-bold text-slate-700 text-sm">৳{calculatedItems[index].itemGrossAmount.toLocaleString()}</div>
                                            <div className="text-[10px] text-slate-400 leading-tight">
                                                {transactionType === 'Pona'
                                                    ? `${item.quantity || 0} Haz × ${item.rate || 0}`
                                                    : (SHRIMP_TYPES.includes(item.fishType)
                                                        ? `${parseFloat(item.pakaWeight).toFixed(2)}KG × ${item.ratePerMon}`
                                                        : `${parseFloat(item.pakaWeight).toFixed(2)}KG @ ${item.ratePerMon}`)}
                                            </div>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <button onClick={() => removeItem(index)} className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                    <button onClick={addItem} className="btn btn-secondary text-indigo-600 font-bold border-indigo-100 bg-indigo-50/50 w-full max-w-xs transition-all hover:scale-105 active:scale-95">
                        {t('addFishType')}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Payment Logic */}
                <div className="lg:col-span-5 glass-card p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('paymentSettlement')}</h2>
                    </div>

                    <div className="mb-6">
                        <label className="input-label">
                            {transactionType === 'Pona'
                                ? (language === 'bn' ? 'চাষীর নগদ প্রদান (নগদ আদায়)' : 'Paid by Farmer (Cash Collection)')
                                : (language === 'bn' ? 'ক্রেতার নগদ প্রদান (নগদ আদায়)' : 'Paid by Buyer (Cash Collection)')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold">৳</span>
                            <input type="number" step="0.01" value={paidAmount} onFocus={(e) => e.target.select()} onChange={(e) => setPaidAmount(e.target.value)} className="input !pl-10 !py-4 !text-xl font-black text-emerald-600 border-2 border-emerald-100 focus:border-emerald-500" />
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {transactionType === 'Pona'
                                    ? (language === 'bn' ? 'চাষীর মোট দেয়' : 'Farmer Total Purchase')
                                    : t('buyerPayable')}
                            </span>
                            <span className="font-bold text-slate-700">৳{buyerPayable.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {language === 'bn' ? 'পরিশোধিত' : 'Already Paid'} ({transactionType === 'Pona' ? 'Cashi' : 'Buyer'})
                            </span>
                            <span className="font-bold text-emerald-600">- ৳{(parseFloat(paidAmount) || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-slate-700 font-black uppercase tracking-widest text-xs">
                                {language === 'bn' ? 'বকেয়া' : 'Remaining Due'} ({transactionType === 'Pona' ? 'Cashi' : 'Buyer'})
                            </span>
                            <span className={`text-xl font-black ${dueAmount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                ৳{Math.abs(dueAmount).toLocaleString()} {dueAmount < 0 ? t('extra') : ''}
                            </span>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    <div>
                        <label className="input-label">
                            {transactionType === 'Pona'
                                ? (language === 'bn' ? 'মালিককে নগদ প্রদান (আড়ত থেকে)' : 'Paid to Owner (Cash from Arot)')
                                : (language === 'bn' ? 'চাষীকে নগদ প্রদান (আড়ত থেকে)' : 'Paid to Farmer (Cash from Arot)')}
                        </label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-600 font-bold">৳</span>
                            <input type="number" step="0.01" value={farmerPaidAmount} onFocus={(e) => e.target.select()} onChange={(e) => setFarmerPaidAmount(e.target.value)} className="input !pl-10 !py-4 !text-xl font-black text-indigo-600 border-2 border-indigo-100 focus:border-indigo-500" />
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {transactionType === 'Pona'
                                    ? (language === 'bn' ? 'মালিকের নিট আয়' : 'Owner Net Earning')
                                    : t('netFarmerEarning')}
                            </span>
                            <span className="font-bold text-slate-700">৳{netFarmerAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {language === 'bn' ? 'নগদ প্রদান' : 'Already Paid'} ({transactionType === 'Pona' ? 'Malik' : 'Farmer'})
                            </span>
                            <span className="font-bold text-indigo-600">- ৳{(parseFloat(farmerPaidAmount) || 0).toLocaleString()}</span>
                        </div>
                        <div className="pt-3 border-t border-indigo-200 flex justify-between items-center">
                            <span className="text-indigo-700 font-black uppercase tracking-widest text-xs">
                                {transactionType === 'Pona'
                                    ? (language === 'bn' ? 'মালিকের বকেয়া' : 'Owner Due')
                                    : (language === 'bn' ? 'চাষীর বকেয়া' : 'Farmer Due')}
                            </span>
                            <span className={`text-xl font-black ${farmerDueAmount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                ৳{Math.abs(farmerDueAmount).toLocaleString()} {farmerDueAmount < 0 ? t('extra') : ''}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Totals & Summary */}
                <div className="lg:col-span-7 glass-card p-8 bg-indigo-900 text-white border-transparent">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black tracking-tight">{t('financialSummary')}</h2>
                    </div>

                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{t('grossSales')}</p>
                            <p className="text-4xl font-black">৳{totalGross.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">
                                {transactionType === 'Pona'
                                    ? (language === 'bn' ? 'পোনা কমিশন' : 'Pona Commission')
                                    : t('arotCommission')}
                                ({transactionType === 'Pona' ? (settings?.ponaCommissionRate || 3.0) : (settings?.commissionRate || 2.5)}%)
                            </p>
                            <p className="text-4xl font-black text-amber-400">- ৳{commissionAmount.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 mb-8">
                        <p className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-2">
                            {transactionType === 'Pona'
                                ? (language === 'bn' ? 'মালিকের নিট আয়' : 'Owner Net Earning')
                                : t('netFarmerEarning')}
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black text-emerald-400">৳{netFarmerAmount.toLocaleString()}</span>
                            <span className="text-sm text-indigo-300 font-bold">BDT</span>
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setShowPreview(true)}
                            disabled={loading || !headerData.farmerName || !headerData.buyerName}
                            className="flex-1 btn btn-primary !bg-white !text-indigo-900 !shadow-none hover:!bg-indigo-50"
                        >
                            {t('previewVerify')}
                        </button>
                        {editData && (
                            <button
                                onClick={onCancel}
                                className="btn btn-ghost !text-white hover:!bg-white/10"
                            >
                                {t('cancelEdit')}
                            </button>
                        )}
                    </div>
                    {error && <p className="mt-4 text-rose-300 text-sm font-bold bg-rose-500/20 p-3 rounded-xl border border-rose-500/30">⚠️ {error}</p>}
                </div>
            </div>

            {/* Preview Modal - Finalized Receipt Design */}
            {
                showPreview && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
                        <div className="bg-white max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100">
                            {/* Receipt Header */}
                            <div className="p-8 pb-4 text-center">
                                <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl shadow-indigo-200">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                                </div>
                                <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-none mb-1">
                                    {settings?.arotName || 'Fish Arot'}
                                </h2>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                    {settings?.arotLocation || 'Bagerhat, Bangladesh'}
                                </p>
                                <div className="mt-4 flex items-center justify-center gap-2">
                                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-tighter rounded-full border border-indigo-100 italic">
                                        Official Sales Voucher
                                    </span>
                                </div>
                            </div>

                            {/* Receipt Body */}
                            <div className="p-8 pt-4 overflow-y-auto">
                                {/* Voucher Header Info */}
                                <div className="grid grid-cols-2 gap-8 mb-8 p-6 bg-slate-50/50 rounded-3xl border border-slate-100">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('farmer')}</p>
                                        <p className="text-lg font-black text-slate-800">{headerData.farmerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('buyer')}</p>
                                        <p className="text-lg font-black text-slate-800">{headerData.buyerName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('auctionDate')}</p>
                                        <p className="text-sm font-bold text-slate-600">{new Date(headerData.date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'স্ট্যাটাস' : 'Status'}</p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                                            <span className="text-xs font-black text-emerald-600 uppercase">Authenticated</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Items Table */}
                                <div className="space-y-4 mb-8">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Itemized Summary</p>
                                    <div className="rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 border-b border-slate-100">
                                                <tr>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('type')}</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">{transactionType === 'Pona' ? (language === 'bn' ? 'পরিমাণ' : 'Qty') : (language === 'bn' ? 'ওজন' : 'Weight')}</th>
                                                    <th className="px-5 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t('subTotal')}</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {calculatedItems.filter(it =>
                                                    transactionType === 'Pona'
                                                        ? (parseFloat(it.quantity) > 0 && parseFloat(it.rate) > 0)
                                                        : ((parseFloat(it.kachaWeight) > 0 || parseFloat(it.pakaWeight) > 0) && parseFloat(it.ratePerMon) > 0)
                                                ).map((it, idx) => (
                                                    <tr key={idx}>
                                                        <td className="px-5 py-4">
                                                            <p className="font-black text-slate-700">{it.fishType}</p>
                                                            <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">
                                                                {transactionType === 'Pona' ? (language === 'bn' ? 'পোনা' : 'Fry') : t(it.fishCategory.toLowerCase().replace(' ', ''))}
                                                            </p>
                                                        </td>
                                                        <td className="px-5 py-4 text-center">
                                                            {transactionType === 'Pona' ? (
                                                                <>
                                                                    <p className="font-bold text-slate-600 text-sm">{it.quantity} HAZAR</p>
                                                                    <p className="text-[9px] font-bold text-slate-300">@{it.rate}/HAZ</p>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <p className="font-bold text-slate-600 text-sm">{parseFloat(it.pakaWeight).toFixed(2)} KG</p>
                                                                    <p className="text-[9px] font-bold text-slate-300">@{it.ratePerMon}/{SHRIMP_TYPES.includes(it.fishType) ? 'KG' : 'M'}</p>
                                                                </>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <p className="font-black text-slate-800">৳{it.itemGrossAmount.toLocaleString()}</p>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Financial Summary */}
                                <div className="space-y-3 p-6 bg-slate-900 rounded-3xl text-white shadow-xl shadow-indigo-100">
                                    <div className="flex justify-between items-center opacity-60">
                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('grossSales')}</span>
                                        <span className="font-bold">৳{totalGross.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-amber-400 border-b border-white/10 pb-3">
                                        <span className="text-[10px] font-black uppercase tracking-widest">
                                            {transactionType === 'Pona'
                                                ? (language === 'bn' ? 'পোনা কমিশন' : 'Pona Commission')
                                                : t('arotCommission')}
                                            ({transactionType === 'Pona' ? (settings?.ponaCommissionRate || 3.0) : (settings?.commissionRate || 2.5)}%)
                                        </span>
                                        <span className="font-bold">- ৳{commissionAmount.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="text-xs font-black uppercase tracking-widest text-indigo-300">
                                            {transactionType === 'Pona'
                                                ? (language === 'bn' ? 'মালিকের নিট আয়' : 'Owner Net Earning')
                                                : t('netFarmerEarning')}
                                        </span>
                                        <span className="text-3xl font-black text-emerald-400">৳{netFarmerAmount.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                                <button onClick={() => setShowPreview(false)} className="flex-1 py-4 font-black uppercase tracking-widest text-xs text-slate-500 hover:text-slate-800 transition-all">
                                    {t('goBack')}
                                </button>
                                <button onClick={handleSubmit} disabled={loading} className="flex-[2] bg-indigo-600 text-white rounded-2xl py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-200 hover:bg-indigo-700 transform hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" /></svg>
                                            {t('confirmSave')}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default TransactionForm;
