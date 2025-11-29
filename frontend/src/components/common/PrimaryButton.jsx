import React from 'react';
import { motion } from 'framer-motion';

const PrimaryButton = ({ children, onClick, type = 'button', className = '' }) => {
    return (
        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type={type}
            onClick={onClick}
            className={`w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200 ${className}`}
        >
            {children}
        </motion.button>
    );
};

export default PrimaryButton;
