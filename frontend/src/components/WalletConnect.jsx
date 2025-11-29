import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import walletService from '../services/walletService';

const WalletConnect = ({ onConnect, onDisconnect }) => {
    const [availableWallets, setAvailableWallets] = useState([]);
    const [walletInfo, setWalletInfo] = useState(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        checkAvailableWallets();

        // Check if already connected
        const info = walletService.getWalletInfo();
        if (info.connected) {
            setWalletInfo(info);
        }
    }, []);

    const checkAvailableWallets = async () => {
        const wallets = await walletService.getAvailableWallets();
        setAvailableWallets(wallets);
    };

    const handleConnect = async (walletName) => {
        setIsConnecting(true);
        setError(null);

        try {
            const result = await walletService.connect(walletName);
            setWalletInfo(walletService.getWalletInfo());

            if (onConnect) {
                onConnect(result);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        walletService.disconnect();
        setWalletInfo(null);

        if (onDisconnect) {
            onDisconnect();
        }
    };

    // If connected, show wallet info
    if (walletInfo && walletInfo.connected) {
        return (
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl">
                            {walletInfo.walletName === 'nami' ? '🦎' :
                                walletInfo.walletName === 'eternl' ? '♾️' : '💳'}
                        </div>
                        <div>
                            <div className="text-sm font-semibold text-slate-800 dark:text-slate-100 capitalize">
                                {walletInfo.walletName} Wallet
                            </div>
                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                {walletInfo.address ? `${walletInfo.address.slice(0, 12)}...${walletInfo.address.slice(-8)}` : 'Loading...'}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {walletInfo.balance && (
                            <div className="text-right">
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                    {walletInfo.balance.ada} ADA
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Preprod Testnet
                                </div>
                            </div>
                        )}

                        <button
                            onClick={handleDisconnect}
                            className="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            Disconnect
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    // Show wallet selection
    return (
        <div className="space-y-3">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Connect Cardano Wallet
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-700 dark:text-red-400"
                >
                    {error}
                </motion.div>
            )}

            {availableWallets.length === 0 ? (
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <div className="text-sm font-medium text-amber-800 dark:text-amber-300 mb-2">
                        No Cardano Wallet Found
                    </div>
                    <div className="text-xs text-amber-700 dark:text-amber-400 space-y-1">
                        <p>Please install a Cardano wallet extension:</p>
                        <ul className="list-disc list-inside ml-2 space-y-1">
                            <li><a href="https://namiwallet.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">Nami Wallet</a></li>
                            <li><a href="https://eternl.io/" target="_blank" rel="noopener noreferrer" className="underline hover:text-amber-900">Eternl Wallet</a></li>
                        </ul>
                        <p className="mt-2">After installation, refresh this page.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {availableWallets.map((wallet) => (
                        <button
                            key={wallet.name}
                            onClick={() => handleConnect(wallet.name)}
                            disabled={isConnecting}
                            className="p-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-lg transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <div className="flex items-center gap-3">
                                <div className="text-3xl">{wallet.icon}</div>
                                <div className="text-left">
                                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {wallet.displayName}
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        {isConnecting ? 'Connecting...' : 'Click to connect'}
                                    </div>
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            )}

            <div className="text-xs text-slate-500 dark:text-slate-400 text-center pt-2">
                Make sure your wallet is set to <span className="font-semibold text-blue-600 dark:text-blue-400">Preprod Testnet</span>
            </div>
        </div>
    );
};

export default WalletConnect;
