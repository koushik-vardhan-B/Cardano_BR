import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { signInWithGoogle } from '../services/auth';
import PhoneAuthModal from './PhoneAuthModal';
import CardanoLogo from './common/CardanoLogo';

const LoginPage = ({ onAuthSuccess, onDemoMode, theme }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        setError('');

        try {
            const user = await signInWithGoogle();
            onAuthSuccess(user);
        } catch (err) {
            setError(err.message);
            setIsLoading(false);
        }
    };

    const handlePhoneLogin = () => {
        setShowPhoneModal(true);
    };

    const handlePhoneSuccess = (user) => {
        onAuthSuccess(user);
    };

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-slate-50 text-slate-900'}`}>
            {/* Top bar */}
            <header className="h-14 bg-slate-100/60 dark:bg-slate-900/30 border-b border-slate-200 dark:border-slate-700/40 flex items-center px-4">
                <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">T7 MediScan AI</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">· Clinic: Demo Clinic 01</div>
                </div>
                <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">Health workers only · Prototype · Not a diagnostic tool.</div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
                {/* Left info panel */}
                <aside className="col-span-12 md:col-span-3 hidden md:block">
                    <div className="sticky top-24 space-y-4">
                        <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-md shadow-sm">
                            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">About this prototype</h3>
                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Designed for screening workflows. Upload retinal and nail images, then export a report for clinical review.</p>
                        </div>

                        <div className="p-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-md text-xs text-slate-600 dark:text-slate-300 shadow-sm">
                            <div className="font-semibold text-slate-700 dark:text-slate-200">Operator</div>
                            <div className="mt-1">{/* Operator from previous auth not available here; keep placeholder */}{'Demo User'}</div>
                            <div className="mt-3 text-slate-500 text-xs">Tip: Clear, well-lit images give better predictions.</div>
                        </div>
                    </div>
                </aside>

                {/* Center card */}
                <section className="col-span-12 md:col-span-6">
                    <div className="p-6 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg shadow-sm">
                        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Sign in to T7 MediScan</h1>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Clinic: Demo Clinic 01 · Operator: Demo User</p>

                        <div className="mt-6 space-y-3">
                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 py-2 rounded-md bg-slate-800 text-white text-sm hover:bg-slate-900 shadow-sm"
                            >
                                {isLoading ? 'Signing in...' : 'Sign in with Google'}
                            </button>

                            <button
                                onClick={onDemoMode}
                                className="w-full py-2 rounded-md border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/30"
                            >
                                Continue in demo mode
                            </button>
                        </div>
                    </div>

                    {/* Cardano Credibility Strip */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <CardanoLogo size={20} className="text-blue-600 dark:text-blue-400" />
                            <span className="text-sm font-semibold text-blue-900 dark:text-blue-200">AI pre-screening + Cardano-based verification</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                On-chain integrity
                            </span>
                            <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                DID-backed identity
                            </span>
                            <span className="px-2 py-1 rounded-full bg-white dark:bg-slate-800 border border-blue-100 dark:border-blue-800 text-[10px] font-medium text-slate-600 dark:text-slate-300">
                                Tokenized worker rewards
                            </span>
                        </div>
                    </div>

                    <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">Curious? Run it in demo without logging in. Data shown is for demonstration only.</div>
                </section>

                {/* Right contact */}
                <aside className="col-span-12 md:col-span-3 hidden lg:block">
                    <div className="sticky top-24 p-4 rounded-md bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="text-xs text-slate-600 dark:text-slate-300">Contact</div>
                        <div className="mt-2 text-sm text-slate-700 dark:text-slate-100">local-admin@demo.clinic</div>
                    </div>
                </aside>
            </main>

            <footer className="h-12 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
                T7 MediScan AI — Prototype report templates. Do not use for clinical diagnosis.
            </footer>

            {/* Phone Auth Modal */}
            <PhoneAuthModal
                isOpen={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
                onSuccess={handlePhoneSuccess}
            />
        </div>
    );
};

export default LoginPage;
