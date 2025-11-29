import React from 'react';
import { motion } from 'framer-motion';

const SecondaryButton = ({ children, onClick, type = 'button', className = '' }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type={type}
            onClick={onClick}
            className={`w-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 px-4 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition duration-200 ${className}`}
        >
            {children}
        </motion.button>
    );
};

export default SecondaryButton;
