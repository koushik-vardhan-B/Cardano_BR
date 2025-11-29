import React from 'react';
import { motion } from 'framer-motion';

const LoadingScreen = () => {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-screen p-4"
        >
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md transition-colors duration-300">
                <div className="animate-pulse space-y-6">
                    {/* Skeleton Header */}
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mx-auto"></div>

                    {/* Skeleton Content */}
                    <div className="space-y-4">
                        <div className="h-24 bg-slate-50 dark:bg-slate-900/20 rounded-lg w-full border border-slate-100 dark:border-slate-800"></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        </div>
                        <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                    </div>

                    {/* Caption */}
                    <div className="text-center space-y-2">
                        <p className="text-slate-600 dark:text-slate-300 font-medium animate-pulse">Analyzing ocular and nail biomarkers…</p>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                            <motion.div
                                className="bg-slate-800/60 dark:bg-slate-300/30 h-2.5 rounded-full"
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, ease: "easeInOut" }}
                            ></motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default LoadingScreen;
