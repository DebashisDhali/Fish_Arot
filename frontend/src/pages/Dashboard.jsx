import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import { transactionService } from '../services/transactionService';
import { settingsService } from '../services/settingsService';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { useLanguage } from '../context/LanguageContext';
import logo from '../assets/images/logo.jpg';

const Dashboard = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { t, language, toggleLanguage } = useLanguage();
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState(null);
    const [stats, setStats] = useState(null);

    // Get active tab from URL or default to 'entry'
    const activeTab = searchParams.get('tab') || 'entry';

    const setActiveTab = (tab) => {
        setSearchParams({ tab });
    };
    const [refreshKey, setRefreshKey] = useState(0);
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        const currentUser = authService.getCurrentUser();
        if (!currentUser) {
            navigate('/login');
            return;
        }
        setUser(currentUser);
        loadSettings();
        loadStats();
    }, [navigate, refreshKey]);

    const loadSettings = async () => {
        try {
            const response = await settingsService.get();
            setSettings(response.data);
        } catch (err) {
            console.error('Failed to load settings:', err);
        }
    };

    const loadStats = async () => {
        try {
            const response = await transactionService.getStats();
            setStats(response.data);
        } catch (err) {
            console.error('Failed to load stats:', err);
        }
    };

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    const handleTransactionSuccess = () => {
        setRefreshKey(prev => prev + 1);
        setEditingTransaction(null);
        loadStats();
    };

    const handleEdit = (transaction) => {
        setEditingTransaction(transaction);
        setActiveTab('entry');
    };

    const handleCancelEdit = () => {
        setEditingTransaction(null);
        setActiveTab('history');
    };

    return (
        <div className="min-h-screen pb-20 bg-slate-50/50">
            {/* Premium Navigation Header */}
            <header className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-xl overflow-hidden shadow-lg shadow-indigo-100 flex items-center justify-center p-0.5 border border-slate-100">
                                <img src={logo} alt="Arot Logo" className="w-full h-full object-contain" />
                            </div>
                            <h1 className="text-lg font-black text-slate-800 tracking-tight">{t('appName')}</h1>
                        </div>

                        <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                            <button onClick={() => { setActiveTab('entry'); setEditingTransaction(null); }} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'entry' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('newTransaction')}</button>
                            <button onClick={() => setActiveTab('history')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{t('transactions')}</button>
                            {user?.role === 'admin' && (
                                <button onClick={() => setActiveTab('settings')} className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>System</button>
                            )}
                        </nav>

                        <div className="flex items-center gap-4 border-l border-slate-200 pl-6">
                            <button onClick={toggleLanguage} className="px-3 py-1.5 rounded-lg border border-indigo-100 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
                                {language === 'en' ? 'বাংলা' : 'English'}
                            </button>
                            <button onClick={handleLogout} className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Arot Identity Bar - Top Bar for Identity Only */}
            <div className="bg-white border-b border-slate-200/60 py-5">
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex flex-col">
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-0.5">
                                {language === 'bn' ? 'আড়ত পরিচিতি' : 'Arot Identity'}
                            </p>
                            <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none">
                                {settings?.arotName || 'Chitalmari-Bagerhat Motsho Arot'}
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 mt-1">
                                {settings?.arotLocation || 'Foltita Bazar, Fakirhat, Bagerhat'}
                                {settings?.mobile && <span className="text-indigo-600 ml-2">📞 {settings.mobile}</span>}
                            </p>
                        </div>

                        <div className="flex items-center gap-8 md:divide-x divide-slate-100">
                            <div className="flex flex-col">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                    {language === 'bn' ? 'মাছ কমিশন' : 'Fish Commission'}
                                </p>
                                <p className="text-base font-black text-slate-700">
                                    {settings?.commissionRate || '2.5'}%
                                </p>
                            </div>
                            <div className="flex flex-col md:pl-8">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                    {language === 'bn' ? 'পোনা কমিশন' : 'Pona Commission'}
                                </p>
                                <p className="text-base font-black text-emerald-600">
                                    {settings?.ponaCommissionRate || '3.0'}%
                                </p>
                            </div>
                            <div className="flex flex-col md:pl-8">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">
                                    Dhalta / Kortun
                                </p>
                                <p className="text-base font-black text-slate-700">
                                    {settings?.fishDeductionRate || '5'}% - {settings?.shrimpDeductionRate || '2.5'}%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 mt-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                    {/* Main Content Area (Left) */}
                    <div className="lg:col-span-9 order-2 lg:order-1">
                        <div className="animate-fade-in">
                            {activeTab === 'entry' && (
                                <TransactionForm
                                    onSuccess={handleTransactionSuccess}
                                    editData={editingTransaction}
                                    onCancel={handleCancelEdit}
                                />
                            )}

                            {activeTab === 'history' && (
                                <TransactionList key={refreshKey} onEdit={handleEdit} refreshKey={refreshKey} />
                            )}

                            {activeTab === 'settings' && user?.role === 'admin' && (
                                <div className="max-w-2xl mx-auto glass-card p-10">
                                    {/* Settings Form Content */}
                                    <div className="flex items-center gap-3 mb-8">
                                        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">System Core Configuration</h2>
                                    </div>

                                    <form className="space-y-8" onSubmit={(e) => {
                                        e.preventDefault();
                                        settingsService.update(settings).then(() => {
                                            alert('System profile updated successfully');
                                            loadSettings();
                                        });
                                    }}>
                                        <div className="grid grid-cols-1 gap-6">
                                            <div className="space-y-1">
                                                <label className="input-label">Arot Identity Name (Title)</label>
                                                <input type="text" value={settings?.arotName || ''} onChange={(e) => setSettings({ ...settings, arotName: e.target.value })} className="input font-bold" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">Business Location (Subtitle)</label>
                                                <input type="text" value={settings?.arotLocation || ''} onChange={(e) => setSettings({ ...settings, arotLocation: e.target.value })} className="input" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">Contact / Mobile (Optional)</label>
                                                <input type="text" value={settings?.mobile || ''} onChange={(e) => setSettings({ ...settings, mobile: e.target.value })} className="input" placeholder="e.g. 017xxxxxxxx" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">Tagline (Optional)</label>
                                                <input type="text" value={settings?.tagline || ''} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} className="input" placeholder="e.g. Safe Fish, Fair Price" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">Logo URL (Optional)</label>
                                                <input type="text" value={settings?.logoUrl || ''} onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })} className="input" placeholder="https://example.com/logo.png" />
                                            </div>

                                            <div className="h-px bg-slate-100 my-4"></div>

                                            <div className="space-y-1">
                                                <label className="input-label">{language === 'bn' ? 'মাছ কমিশন হার (%)' : 'Fish Commission Rate (%)'}</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={settings?.commissionRate || ''} onChange={(e) => setSettings({ ...settings, commissionRate: e.target.value })} className="input font-black !pr-10" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">{language === 'bn' ? 'পোনা কমিশন হার (%)' : 'Pona Commission Rate (%)'}</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={settings?.ponaCommissionRate || ''} onChange={(e) => setSettings({ ...settings, ponaCommissionRate: e.target.value })} className="input font-black !pr-10 border-emerald-100 focus:border-emerald-500" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">{language === 'bn' ? 'চিংড়ির ওজন কর্তন (%)' : 'Shrimp Weight Deduction (%)'}</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={settings?.shrimpDeductionRate || ''} onChange={(e) => setSettings({ ...settings, shrimpDeductionRate: e.target.value })} className="input font-black !pr-10" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="input-label">{language === 'bn' ? 'মাছের ওজন কর্তন (%)' : 'General Fish Weight Deduction (%)'}</label>
                                                <div className="relative">
                                                    <input type="number" step="0.1" value={settings?.fishDeductionRate || ''} onChange={(e) => setSettings({ ...settings, fishDeductionRate: e.target.value })} className="input font-black !pr-10" />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="submit" className="btn btn-primary w-full py-4 shadow-2xl">
                                            Save System Configuration
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Panel - Live Stats Only (Requested to be on right) */}
                    <div className="lg:col-span-3 order-1 lg:order-2 space-y-5 sticky top-32">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1 mb-2">
                            {language === 'bn' ? 'লাইভ বাজার আপডেট' : 'Live Market Stats'}
                        </p>

                        {stats && (
                            <>
                                <div className="stat-card !p-5">
                                    <div className="stat-glow bg-emerald-500"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {language === 'bn' ? 'মোট বিক্রয়' : 'Total Sales'}
                                    </p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tight">
                                        ৳{stats.totalGrossAmount.toLocaleString()}
                                    </p>
                                </div>

                                <div className="stat-card !p-5">
                                    <div className="stat-glow bg-amber-500"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {language === 'bn' ? 'আড়ত কমিশন' : 'Arot Commission'}
                                    </p>
                                    <p className="text-2xl font-black text-slate-800 tracking-tight">
                                        ৳{stats.totalCommission.toLocaleString()}
                                    </p>
                                </div>

                                <div className="stat-card !p-5">
                                    <div className="stat-glow bg-rose-500"></div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                        {language === 'bn' ? 'বকেয়া' : 'Pending Dues'}
                                    </p>
                                    <p className="text-2xl font-black text-rose-500 tracking-tight">
                                        ৳{stats.totalDue.toLocaleString()}
                                    </p>
                                    <p className="text-[9px] font-bold text-rose-400 mt-2 uppercase tracking-tighter">
                                        {stats.dueCount} {language === 'bn' ? 'টি বকেয়া ভাউচার' : 'Pending Vouchers'}
                                    </p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
