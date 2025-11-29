import React from 'react';

const InfoRow = ({ label, value, className = '', valueClassName = '' }) => {
    return (
        <div className={`bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors duration-300 ${className}`}>
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
            <p className={`font-mono text-sm break-all text-gray-900 dark:text-gray-100 ${valueClassName}`}>{value}</p>
        </div>
    );
};

export default InfoRow;
