import React from 'react';
import { motion } from 'framer-motion';

const CardContainer = ({ children, className = '' }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center justify-center min-h-screen p-4 transition-colors duration-300"
        >
            <motion.div
                whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
                className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-full max-w-md mx-auto transition-colors duration-300 ${className}`}
            >
                {children}
            </motion.div>
        </motion.div>
    );
};

export default CardContainer;
