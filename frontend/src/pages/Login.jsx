import { useState, useEffect } from 'react';
import logo from '../assets/images/logo.jpg';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
    const navigate = useNavigate();
    const { t, language, toggleLanguage } = useLanguage();
    const [settings, setSettings] = useState(null);

    // Redirect if already logged in & Load Settings
    useEffect(() => {
        if (authService.isAuthenticated()) {
            navigate('/dashboard', { replace: true });
        }
        loadSettings();
    }, [navigate]);

    const loadSettings = async () => {
        try {
            // Assuming settingsService.get() is now public or we use a direct axios call if service adds token
            // Since we made the route public, we can use the service IF it handles no-token gracefully or we just manually call it.
            // But settingsService likely adds auth header if token exists. Even if it sends invalid token, backend might reject if we reused "protect" but we removed it.
            // Let's use the service.
            const response = await import('../services/settingsService').then(m => m.settingsService.get());
            setSettings(response.data);
        } catch (err) {
            console.error('Failed to load settings', err);
        }
    };

    const [formData, setFormData] = useState({
        username: 'admin',
        password: 'admin123'
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await authService.login(formData.username, formData.password);
            navigate('/dashboard', { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || (language === 'bn' ? 'লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।' : 'Login failed. Please try again.'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 sm:p-6 lg:p-8 font-outfit">
            <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-2 bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.15)] overflow-hidden min-h-[600px]">

                {/* Branding Column - Left */}
                <div className="relative hidden lg:flex flex-col justify-between p-12 bg-indigo-600 text-white overflow-hidden">
                    {/* Abstract background blobs */}
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-indigo-500 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-indigo-700 rounded-full blur-3xl opacity-50"></div>

                    <div className="relative z-10">
                        <div className="w-20 h-20 bg-white rounded-2xl p-2 shadow-xl mb-8 flex items-center justify-center overflow-hidden">
                            <img
                                src={settings?.logoUrl || logo}
                                alt="Arot Logo"
                                className="w-full h-full object-contain"
                                onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                            />
                        </div>
                        <h1 className="text-4xl font-black mb-4 tracking-tight leading-tight">
                            {settings?.arotName || t('appName')}
                        </h1>
                        <p className="text-indigo-100 text-lg font-medium max-w-sm leading-relaxed">
                            {settings?.tagline || settings?.arotLocation || t('arotSubText')}
                        </p>
                    </div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-4 text-sm font-bold uppercase tracking-widest text-indigo-200">
                            <span className="w-12 h-[1px] bg-indigo-200/30"></span>
                            Trusted Fish Management
                        </div>
                    </div>
                </div>

                {/* Login Column - Right */}
                <div className="flex flex-col p-8 sm:p-12 lg:p-16 relative">
                    {/* Language Toggle */}
                    <button
                        onClick={toggleLanguage}
                        className="absolute top-8 right-8 px-4 py-2 rounded-xl bg-slate-100 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200"
                    >
                        {language === 'en' ? 'বাংলা' : 'English'}
                    </button>

                    <div className="flex-1 flex flex-col justify-center">
                        <div className="mb-10">
                            {/* Mobile Logo Only */}
                            <div className="lg:hidden w-16 h-16 bg-white rounded-xl p-1.5 shadow-lg mb-6 flex items-center justify-center border border-slate-100">
                                <img
                                    src={settings?.logoUrl || logo}
                                    alt="Logo"
                                    className="w-full h-full object-contain"
                                />
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">
                                {t('login')}
                            </h2>
                            <p className="text-slate-500 font-medium">
                                {language === 'bn' ? 'আপনার অ্যাকাউন্টে লগইন করুন' : 'Sign in to access your portal'}
                            </p>
                        </div>

                        {error && (
                            <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                                <p className="text-sm text-rose-600 font-bold">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="group">
                                <label htmlFor="username" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 transition-colors group-focus-within:text-indigo-600">
                                    {t('username')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300"
                                        placeholder={language === 'bn' ? 'ইউজারনেম' : 'Username'}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="group">
                                <label htmlFor="password" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 transition-colors group-focus-within:text-indigo-600">
                                    {t('password')}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl outline-none focus:border-indigo-600 focus:bg-white transition-all text-slate-800 font-bold placeholder:text-slate-300"
                                        placeholder={language === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('loggingIn')}
                                    </span>
                                ) : (
                                    t('login')
                                )}
                            </button>
                        </form>
                    </div>

                    <div className="mt-12 text-center lg:text-left">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                            {t('copyright')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
