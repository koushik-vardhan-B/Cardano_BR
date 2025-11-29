import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PhoneAuthModal = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState('phone'); // 'phone' or 'otp'
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOTP = () => {
        if (!phoneNumber || phoneNumber.length < 10) {
            return;
        }

        setIsLoading(true);
        // Simulate sending OTP
        setTimeout(() => {
            setIsLoading(false);
            setStep('otp');
        }, 1000);
    };

    const handleVerifyOTP = () => {
        if (otp.length !== 6) {
            return;
        }

        setIsLoading(true);
        // Simulate OTP verification
        setTimeout(() => {
            const mockUser = {
                uid: 'phone-demo-' + Date.now(),
                displayName: 'Health Worker',
                phone: phoneNumber,
                email: null,
                photoURL: null
            };

            onSuccess(mockUser);
            handleClose();
        }, 800);
    };

    const handleClose = () => {
        setStep('phone');
        setPhoneNumber('');
        setOtp('');
        setIsLoading(false);
        onClose();
    };

    const handleKeyPress = (e, action) => {
        if (e.key === 'Enter') {
            action();
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={handleClose}
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md rounded-2xl border border-slate-200/70 dark:border-slate-700/40 bg-white dark:bg-slate-900 shadow-2xl p-6"
                >
                    {/* Close Button */}
                    <button
                        onClick={handleClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Content */}
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                                {step === 'phone' ? 'Phone Sign-In' : 'Verify OTP'}
                            </h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {step === 'phone'
                                    ? 'Enter your phone number to receive a verification code'
                                    : `We sent a code to ${phoneNumber}`
                                }
                            </p>
                        </div>

                        {step === 'phone' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                                        placeholder="+1 (555) 123-4567"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        disabled={isLoading}
                                    />
                                </div>

                                <button
                                    onClick={handleSendOTP}
                                    disabled={!phoneNumber || phoneNumber.length < 10 || isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </span>
                                    ) : (
                                        'Send OTP'
                                    )}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Enter 6-digit code
                                    </label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        onKeyPress={(e) => handleKeyPress(e, handleVerifyOTP)}
                                        placeholder="000000"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-50 text-center text-2xl tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        maxLength={6}
                                        disabled={isLoading}
                                        autoFocus
                                    />
                                </div>

                                <button
                                    onClick={handleVerifyOTP}
                                    disabled={otp.length !== 6 || isLoading}
                                    className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white font-medium transition-colors disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Verifying...
                                        </span>
                                    ) : (
                                        'Verify'
                                    )}
                                </button>

                                <button
                                    onClick={() => setStep('phone')}
                                    disabled={isLoading}
                                    className="w-full text-sm text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                >
                                    ← Change phone number
                                </button>
                            </div>
                        )}

                        {/* Demo Notice */}
                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
                            <strong>Demo mode:</strong> Any 6-digit code will work. Real SMS is not sent.
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PhoneAuthModal;
