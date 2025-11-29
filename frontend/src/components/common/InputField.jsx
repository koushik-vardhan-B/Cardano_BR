import React from 'react';

const InputField = ({ label, type = 'text', value, onChange, placeholder, required = false, className = '' }) => {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {label}
            </label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-300"
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
};

export default InputField;
