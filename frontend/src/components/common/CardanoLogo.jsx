import React from 'react';

const CardanoLogo = ({ size = 24, className = "" }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20Z"
                fill="currentColor"
                opacity="0.2"
            />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <circle cx="12" cy="6" r="1.5" fill="currentColor" />
            <circle cx="12" cy="18" r="1.5" fill="currentColor" />
            <circle cx="6" cy="12" r="1.5" fill="currentColor" />
            <circle cx="18" cy="12" r="1.5" fill="currentColor" />
            <circle cx="16.24" cy="16.24" r="1.5" fill="currentColor" />
            <circle cx="7.76" cy="7.76" r="1.5" fill="currentColor" />
            <circle cx="16.24" cy="7.76" r="1.5" fill="currentColor" />
            <circle cx="7.76" cy="16.24" r="1.5" fill="currentColor" />
        </svg>
    );
};

export default CardanoLogo;
