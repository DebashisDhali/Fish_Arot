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
        username: '',
        password: ''
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
        <div className="min-h-screen flex items-center justify-center bg-indigo-900 px-4">
            <div className="max-w-md w-full relative">
                {/* Language Toggle */}
                <button
                    onClick={toggleLanguage}
                    className="absolute -top-12 right-0 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-black uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all"
                >
                    {language === 'en' ? 'বাংলা' : 'English'}
                </button>

                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-3xl shadow-2xl mb-4 rotate-3 p-1.5 overflow-hidden border border-white/20">
                        <img
                            src={settings?.logoUrl || logo}
                            alt="Arot Logo"
                            className="w-full h-full object-contain"
                            onError={(e) => { e.target.onerror = null; e.target.src = logo; }}
                        />
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
                        {settings?.arotName || t('appName')}
                    </h1>
                    <p className="text-indigo-200 font-bold text-sm uppercase tracking-wide">
                        {settings?.tagline || settings?.arotLocation || t('arotSubText')}
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] p-10">
                    <h2 className="text-2xl font-black text-slate-800 mb-8 tracking-tight">{t('login')}</h2>

                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl">
                            <p className="text-sm text-rose-600 font-bold">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="username" className="input-label">
                                {t('username')}
                            </label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                value={formData.username}
                                onChange={handleChange}
                                className="input"
                                placeholder={language === 'bn' ? 'আপনার ইউজারনেম দিন' : 'Enter your username'}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="input-label">
                                {t('password')}
                            </label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="input"
                                placeholder={language === 'bn' ? 'আপনার পাসওয়ার্ড দিন' : 'Enter your password'}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn btn-primary py-4 text-base font-black uppercase tracking-widest shadow-xl shadow-indigo-100 disabled:opacity-50"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    {t('loggingIn')}
                                </span>
                            ) : (
                                t('login')
                            )}
                        </button>

                        <div className="pt-4 border-t border-slate-100">
                            <p className="text-center text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">
                                {language === 'bn' ? 'টেস্ট অ্যাকাউন্ট' : 'Test Account'}
                            </p>
                            <div className="flex justify-center gap-4 text-sm font-mono bg-slate-50 p-2 rounded-xl border border-slate-100">
                                <span className="text-slate-500">User: <span className="text-indigo-600 font-bold">admin</span></span>
                                <span className="text-slate-500">Pass: <span className="text-indigo-600 font-bold">admin123</span></span>
                            </div>
                        </div>
                    </form>
                </div>

                <p className="text-center text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] mt-8">
                    {t('copyright')}
                </p>
            </div>
        </div>
    );
};

export default Login;
