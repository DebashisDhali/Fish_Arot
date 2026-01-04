import { useState, useEffect } from 'react';
import { transactionService } from '../services/transactionService';
import { useLanguage } from '../context/LanguageContext';

const TransactionList = ({ onEdit, refreshKey }) => {
    const { t, language } = useLanguage();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        search: '',
        date: '',
        isPaid: '',
        transactionType: '',
        page: 1,
        limit: 50
    });
    const [pagination, setPagination] = useState(null);
    const [totals, setTotals] = useState({ gross: 0, net: 0, due: 0 });

    useEffect(() => {
        loadTransactions();
    }, [filters, refreshKey]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const apiFilters = { ...filters };

            // If a specific date is selected, create a range for that entire day
            if (filters.date) {
                const start = new Date(filters.date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(filters.date);
                end.setHours(23, 59, 59, 999);

                apiFilters.startDate = start.toISOString();
                apiFilters.endDate = end.toISOString();
                delete apiFilters.date;
            }

            const response = await transactionService.getAll(apiFilters);
            setTransactions(response.data);
            setPagination(response.pagination);

            const newTotals = response.data.reduce((acc, curr) => ({
                gross: acc.gross + curr.grossAmount,
                net: acc.net + curr.netFarmerAmount,
                due: acc.due + curr.dueAmount
            }), { gross: 0, net: 0, due: 0 });
            setTotals(newTotals);
        } catch (err) {
            console.error('Failed to load transactions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            search: '',
            date: '',
            isPaid: '',
            transactionType: '',
            page: 1,
            limit: 50
        });
    };

    const [activePrintMenu, setActivePrintMenu] = useState(null);

    const handleViewReceipt = async (id, type) => {
        setActivePrintMenu(null); // Close menu
        try {
            if (type === 'farmer') {
                await transactionService.viewFarmerReceipt(id);
            } else {
                await transactionService.viewBuyerReceipt(id);
            }
        } catch (err) {
            alert('Failed to view receipt');
        }
    };

    const handleViewStatement = async () => {
        if (!filters.search) {
            alert(language === 'bn' ? 'দয়া করে নাম অনুসন্ধান করুন' : 'Please search for a name');
            return;
        }
        if (!filters.date) {
            alert(language === 'bn' ? 'দয়া করে লেজার দেখতে একটি তারিখ নির্বাচন করুন' : 'Please select a Date to view the ledger');
            return;
        }

        try {
            const apiFilters = { ...filters };
            if (filters.search) {
                apiFilters.buyerName = filters.search;
                delete apiFilters.search;
            }
            const start = new Date(filters.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            apiFilters.startDate = start.toISOString();
            apiFilters.endDate = end.toISOString();
            delete apiFilters.date;

            await transactionService.viewBuyerStatement(apiFilters);
        } catch (err) {
            console.error('Statement error:', err);
            // Error handling similar to download
            if (err.response?.status === 404) {
                const typeMsg = filters.transactionType ? `(${filters.transactionType})` : '';
                alert(language === 'bn'
                    ? `এই নাম এবং তারিখের জন্য কোনো ${typeMsg} লেনদেন পাওয়া যায়নি।`
                    : `No ${filters.transactionType || ''} transactions found for this Name & Date combination.`);
                return;
            }
            alert('Failed to view statement');
        }
    };

    const handleViewFarmerStatement = async () => {
        if (!filters.search) {
            alert(language === 'bn' ? 'দয়া করে নাম অনুসন্ধান করুন' : 'Please search for a name');
            return;
        }
        if (!filters.date) {
            alert(language === 'bn' ? 'দয়া করে লেজার দেখতে একটি তারিখ নির্বাচন করুন' : 'Please select a Date to view the ledger');
            return;
        }

        try {
            const apiFilters = { ...filters };
            if (filters.search) {
                apiFilters.farmerName = filters.search;
                delete apiFilters.search;
            }
            const start = new Date(filters.date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(filters.date);
            end.setHours(23, 59, 59, 999);
            apiFilters.startDate = start.toISOString();
            apiFilters.endDate = end.toISOString();
            delete apiFilters.date;

            await transactionService.viewFarmerStatement(apiFilters);
        } catch (err) {
            console.error('Farmer Statement error:', err);
            if (err.response?.status === 404) {
                const typeMsg = filters.transactionType ? `(${filters.transactionType})` : '';
                alert(language === 'bn'
                    ? `এই নাম এবং তারিখের জন্য কোনো ${typeMsg} লেনদেন পাওয়া যায়নি।`
                    : `No ${filters.transactionType || ''} transactions found for this Name & Date combination.`);
                return;
            }
            alert('Failed to view statement');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm(language === 'bn' ? 'আপনি কি নিশ্চিত যে আপনি এটি ডিলিট করতে চান?' : 'Are you sure you want to delete this transaction?')) {
            try {
                await transactionService.delete(id);
                loadTransactions();
            } catch (err) {
                alert('Deletion failed');
            }
        }
    };

    const formatDate = (date) => new Date(date).toLocaleDateString(language === 'bn' ? 'bn-BD' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const formatCurrency = (amount) => `৳${amount.toLocaleString()}`;

    // Close dropdown on click elsewhere
    useEffect(() => {
        const handleOutsideClick = (e) => {
            if (!e.target.closest('.print-dropdown-container')) {
                setActivePrintMenu(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Search & Filter - Pro Design */}
            <div className="glass-card p-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">{language === 'bn' ? 'আর্কাইভ অনুসন্ধান' : 'Search Archives'}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="col-span-1 md:col-span-2 lg:col-span-2">
                        <label className="input-label">{language === 'bn' ? 'নাম অনুসন্ধান (মালিক/ক্রেতা)' : 'Search Name (Owner/Buyer)'}</label>
                        <input type="text" name="search" value={filters.search} onChange={handleFilterChange} placeholder={language === 'bn' ? 'নাম লিখুন...' : 'Enter name...'} className="input !py-2.5" />
                    </div>
                    <div>
                        <label className="input-label">{language === 'bn' ? 'লেনদেনের তারিখ' : 'Transaction Date'}</label>
                        <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="input !py-2.5" />
                    </div>
                    <div>
                        <label className="input-label">{language === 'bn' ? 'পেমেন্ট অবস্থা' : 'Paid Status'}</label>
                        <select name="isPaid" value={filters.isPaid} onChange={handleFilterChange} className="input !py-2.5">
                            <option value="">{language === 'bn' ? 'সব লেনদেন' : 'All'}</option>
                            <option value="true">{language === 'bn' ? 'পরিশোধিত' : 'Paid'}</option>
                            <option value="false">{language === 'bn' ? 'বকেয়া' : 'Due'}</option>
                        </select>
                    </div>
                    <div>
                        <label className="input-label">{language === 'bn' ? 'লেনদেনের ধরণ' : 'Transaction Type'}</label>
                        <select name="transactionType" value={filters.transactionType} onChange={handleFilterChange} className="input !py-2.5">
                            <option value="">{language === 'bn' ? 'সব ধরণ' : 'All Types'}</option>
                            <option value="Fish">{language === 'bn' ? 'মাছ' : 'Fish'}</option>
                            <option value="Pona">{language === 'bn' ? 'পোনা' : 'Pona'}</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button onClick={clearFilters} className="btn btn-secondary w-full !py-2.5 text-[10px] font-black uppercase tracking-widest">
                            {language === 'bn' ? 'রিসেট' : 'Reset'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Table - Pro Design */}
            <div className="glass-card overflow-hidden">
                <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{t('transactions')}</h2>
                            <p className="text-xs font-bold text-slate-400 capitalize">{pagination?.total || 0} {language === 'bn' ? 'টি পাওয়া গেছে' : 'Total Records Found'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {filters.search && filters.transactionType !== 'Pona' && (
                            <>
                                <button
                                    onClick={handleViewStatement}
                                    className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl border border-indigo-100 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all group"
                                >
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    {language === 'bn' ? 'ক্রেতার লেজার দেখুন' : 'View Buyer Ledger'}
                                </button>
                            </>
                        )}
                        {filters.search && filters.transactionType !== 'Fish' && (
                            <button
                                onClick={handleViewFarmerStatement}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all group"
                            >
                                <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                {language === 'bn' ? 'মালিকের লেজার দেখুন' : 'View Owner Ledger'}
                            </button>
                        )}
                        <div className="flex gap-4">
                            <div className="text-right border-r border-slate-200 pr-4">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'মোট বিক্রয় (পেজ)' : 'Page Totals (Gross)'}</p>
                                <p className="text-lg font-black text-slate-800">{formatCurrency(totals.gross)}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{language === 'bn' ? 'মোট বকেয়া (পেজ)' : 'Page Totals (Due)'}</p>
                                <p className="text-lg font-black text-rose-500">{formatCurrency(totals.due)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="p-20 flex flex-col items-center justify-center opacity-50">
                        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px]">{t('loading')}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="pro-table">
                            <thead>
                                <tr>
                                    <th>{t('receiptNo')} / {t('auctionDate')}</th>
                                    <th>{language === 'bn' ? 'পক্ষদ্বয়' : 'Parties Info'}</th>
                                    <th>{language === 'bn' ? 'মাছের বিবরণ' : 'Inventory'}</th>
                                    <th className="text-right">{language === 'bn' ? 'অর্থনৈতিক' : 'Financials'}</th>
                                    <th className="text-right">{t('paymentSettlement')}</th>
                                    <th className="text-center">{language === 'bn' ? 'অ্যাকশন' : 'Actions'}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {transactions.map((t_item) => (
                                    <tr key={t_item._id} className="hover:bg-slate-50 transition-colors">
                                        <td>
                                            <div className="font-mono text-[11px] font-bold text-indigo-600 mb-1">{t_item.receiptNo}</div>
                                            <div className="font-bold text-slate-800 text-xs">{formatDate(t_item.date)}</div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-300 w-12">{t('farmer')}:</span>
                                                    <span className="font-bold text-slate-700">{t_item.farmerName}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-black uppercase text-slate-300 w-12">{t('buyer')}:</span>
                                                    <span className="font-semibold text-slate-600">{t_item.buyerName}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-black uppercase tracking-tight w-fit">
                                                    {t_item.items[0]?.fishType} - {t_item.transactionType === 'Pona' ? (language === 'bn' ? 'পোনা' : 'Fry') : t(t_item.items[0]?.fishCategory.toLowerCase().replace(' ', ''))} {t_item.items.length > 1 ? `+${t_item.items.length - 1} more` : ''}
                                                </span>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {t_item.transactionType === 'Pona'
                                                        ? `${t_item.items.reduce((acc, item) => acc + (item.quantity || 0), 0)} Hazar`
                                                        : `${t_item.totalWeight.toFixed(2)} KG`
                                                    } Total
                                                </span>
                                            </div>
                                        </td>
                                        <td className="text-right">
                                            <div className="text-[10px] font-bold text-slate-400">{language === 'bn' ? 'মোট' : 'Gross'}: {formatCurrency(t_item.grossAmount)}</div>
                                            <div className="font-black text-emerald-600">{language === 'bn' ? 'নিট' : 'Net'}: {formatCurrency(t_item.netFarmerAmount)}</div>
                                        </td>
                                        <td className="text-right">
                                            <div className="flex flex-col gap-2 items-end">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{language === 'bn' ? 'ক্রেতার বকেয়া' : 'Buyer Due'}</p>
                                                    <p className={`font-black leading-none ${t_item.dueAmount > 0 ? 'text-rose-500' : 'text-emerald-600'}`}>
                                                        {formatCurrency(t_item.dueAmount)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">{language === 'bn' ? 'চাষীর বকেয়া' : 'Farmer Due'}</p>
                                                    <p className={`font-black leading-none ${t_item.farmerDueAmount > 0 ? 'text-indigo-500' : 'text-emerald-600'}`}>
                                                        {formatCurrency(t_item.farmerDueAmount || 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="print-dropdown-container relative">
                                                    <button
                                                        onClick={() => setActivePrintMenu(activePrintMenu === t_item._id ? null : t_item._id)}
                                                        className={`p-2 rounded-lg transition-all font-bold text-xs uppercase tracking-widest ${activePrintMenu === t_item._id ? 'bg-indigo-600 text-white shadow-lg' : 'text-indigo-600 hover:bg-indigo-50'}`}
                                                    >
                                                        {language === 'bn' ? 'PDF' : 'PDF'}
                                                    </button>

                                                    {activePrintMenu === t_item._id && (
                                                        <div className="absolute right-0 bottom-full mb-3 w-44 glass-card !p-2 !rounded-2xl !shadow-2xl z-20 animate-slide-up border border-indigo-100">
                                                            <button onClick={() => handleViewReceipt(t_item._id, 'farmer')} className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between group">
                                                                {language === 'bn' ? 'মালিকের কপি' : 'Farmer Copy'}
                                                                <svg className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                                            <button onClick={() => handleViewReceipt(t_item._id, 'buyer')} className="w-full text-left p-3 hover:bg-indigo-50 rounded-xl text-xs font-black uppercase tracking-wider text-slate-700 flex items-center justify-between group">
                                                                {language === 'bn' ? 'ক্রেতার কপি' : 'Buyer Copy'}
                                                                <svg className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => onEdit(t_item)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button onClick={() => handleDelete(t_item._id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Delete">
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pro Pagination */}
                {pagination && pagination.pages > 1 && (
                    <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                            {language === 'bn' ? `পৃষ্ঠা ${pagination.page} / ${pagination.pages}` : `Page ${pagination.page} of ${pagination.pages}`}
                        </span>
                        <div className="flex gap-3">
                            <button onClick={() => setFilters(p => ({ ...p, page: p.page - 1 }))} disabled={pagination.page === 1} className="btn btn-secondary !py-2 !px-4 text-xs font-black uppercase tracking-widest">{language === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</button>
                            <button onClick={() => setFilters(p => ({ ...p, page: p.page + 1 }))} disabled={pagination.page === pagination.pages} className="btn btn-secondary !py-2 !px-4 text-xs font-black uppercase tracking-widest">{language === 'bn' ? 'পরবর্তী' : 'Next'}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionList;
