import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from './WalletConnect';
import CardContainer from './common/CardContainer';
import walletService from '../services/walletService';

const WalletDashboard = () => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletInfo, setWalletInfo] = useState(null);
    const [visionBalance, setVisionBalance] = useState(null);
    const [verificationHistory, setVerificationHistory] = useState([]);
    const [rewardTiers, setRewardTiers] = useState(null);
    const [contractInfo, setContractInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Check if wallet is already connected
        const info = walletService.getWalletInfo();
        if (info.connected) {
            setWalletConnected(true);
            setWalletInfo(info);
            fetchWalletData(info.address);
        }

        // Fetch contract info and reward tiers (doesn't require wallet)
        fetchContractInfo();
        fetchRewardTiers();
    }, []);

    const fetchWalletData = async (address) => {
        setIsLoading(true);
        try {
            // Fetch VISION balance
            const balanceResponse = await fetch(`http://localhost:8000/blockchain/balance/${address}`);
            const balanceData = await balanceResponse.json();
            setVisionBalance(balanceData);

            // Fetch verification history
            const historyResponse = await fetch(`http://localhost:8000/blockchain/history/${address}`);
            const historyData = await historyResponse.json();
            setVerificationHistory(historyData.verifications || []);
        } catch (error) {
            console.error('Failed to fetch wallet data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContractInfo = async () => {
        try {
            const response = await fetch('http://localhost:8000/blockchain/contracts');
            const data = await response.json();
            setContractInfo(data);
        } catch (error) {
            console.error('Failed to fetch contract info:', error);
        }
    };

    const fetchRewardTiers = async () => {
        try {
            const response = await fetch('http://localhost:8000/blockchain/reward-tiers');
            const data = await response.json();
            setRewardTiers(data);
        } catch (error) {
            console.error('Failed to fetch reward tiers:', error);
        }
    };

    const handleWalletConnect = (result) => {
        setWalletConnected(true);
        setWalletInfo(result);
        fetchWalletData(result.address);
    };

    const handleWalletDisconnect = () => {
        setWalletConnected(false);
        setWalletInfo(null);
        setVisionBalance(null);
        setVerificationHistory([]);
    };

    const onCopy = (value) => {
        try {
            navigator.clipboard?.writeText(value);
            alert('Copied to clipboard!');
        } catch (e) {
            console.error('Copy failed:', e);
        }
    };

    const formatDate = (timestamp) => {
        return new Date(timestamp * 1000).toLocaleString();
    };

    return (
        <CardContainer>
            <div className="space-y-6">
                {/* Page Header */}
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                        💳 Wallet Dashboard
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                        View your VISION tokens, verification history, and wallet details
                    </p>
                </div>

                {/* Wallet Connection */}
                <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />

                {/* VISION Balance Card */}
                {walletConnected && visionBalance && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl shadow-lg text-white"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="text-sm font-medium opacity-90 mb-2">Total VISION Balance</div>
                                <div className="text-5xl font-bold mb-4">
                                    {visionBalance.vision_balance || 0}
                                    <span className="text-2xl ml-2 opacity-80">VISION</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-6">
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <div className="text-xs opacity-80">Total Verifications</div>
                                        <div className="text-2xl font-bold">{visionBalance.total_verifications || 0}</div>
                                    </div>
                                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                                        <div className="text-xs opacity-80">Rewards Earned</div>
                                        <div className="text-2xl font-bold">{visionBalance.total_rewards_earned || 0}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="text-6xl opacity-20">🪙</div>
                        </div>
                    </motion.div>
                )}

                {/* Wallet Details */}
                {walletConnected && walletInfo && (
                    <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                            Wallet Details
                        </h3>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Wallet Type</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 capitalize">
                                    {walletInfo.walletName}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Wallet Address</div>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all flex-1">
                                        {walletInfo.address}
                                    </div>
                                    <button onClick={() => onCopy(walletInfo.address)} className="text-xs text-blue-600 hover:underline">
                                        Copy
                                    </button>
                                </div>
                                <div className="mt-1 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                                    ℹ️ This address is in hexadecimal format (technical format used by Cardano wallets). It's valid for blockchain transactions.
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">ADA Balance</div>
                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {walletInfo.balance?.ada || '0.00'} ADA
                                    <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">(Preprod Testnet)</span>
                                </div>
                                {walletInfo.balance?.ada === '0.00' && (
                                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                                        💡 Get free test ADA from the <a href="https://docs.cardano.org/cardano-testnet/tools/faucet/" target="_blank" rel="noopener noreferrer" className="underline">Cardano Faucet</a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Verification History */}
                {walletConnected && (
                    <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                            Verification History
                        </h3>

                        {isLoading ? (
                            <div className="text-center py-8 text-slate-500">Loading...</div>
                        ) : verificationHistory.length > 0 ? (
                            <div className="space-y-3">
                                {verificationHistory.map((verification, index) => (
                                    <div key={index} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                                    {formatDate(verification.timestamp)}
                                                </div>
                                                <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                                                    Diagnosis: {verification.diagnosis_label || `Level ${verification.diagnosis}`}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-slate-500 dark:text-slate-400">Confidence</div>
                                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">
                                                    {verification.confidence}%
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                                            <div className="text-xs font-mono text-slate-600 dark:text-slate-400">
                                                {verification.verification_id?.slice(0, 16)}...
                                            </div>
                                            <div className="text-sm font-bold text-purple-600 dark:text-purple-400">
                                                +{verification.reward_amount || 0} VISION
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                                No verifications yet. Complete a screening to earn VISION tokens!
                            </div>
                        )}
                    </div>
                )}

                {/* Reward Tiers */}
                {rewardTiers && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                            🏆 VISION Token Reward Tiers
                        </h3>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-slate-800/50 rounded">
                                <span className="text-slate-600 dark:text-slate-400">🥉 Low Confidence (0-69%):</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.low.reward} VISION</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-slate-800/50 rounded">
                                <span className="text-slate-600 dark:text-slate-400">🥈 Medium Confidence (70-89%):</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.medium.reward} VISION</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-white/50 dark:bg-slate-800/50 rounded">
                                <span className="text-slate-600 dark:text-slate-400">🥇 High Confidence (90-100%):</span>
                                <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.high.reward} VISION</span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-800">
                                <span className="text-slate-600 dark:text-slate-400">⭐ Professional Bonus:</span>
                                <span className="font-bold text-purple-600 dark:text-purple-400">+{rewardTiers.tiers.professional_bonus.reward} VISION</span>
                            </div>
                        </div>
                        <div className="mt-3 text-xs text-slate-600 dark:text-slate-400 text-center">
                            Maximum possible: {rewardTiers.total_possible} VISION per verification
                        </div>
                    </div>
                )}

                {/* Contract Information */}
                {contractInfo && (
                    <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                            📜 Smart Contract Information
                        </h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Network</div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize">
                                    Cardano {contractInfo.network}
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Verification Contract</div>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all flex-1">
                                        {contractInfo.contracts.verification_contract}
                                    </div>
                                    <button onClick={() => onCopy(contractInfo.contracts.verification_contract)} className="text-xs text-blue-600 hover:underline">
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Reward Policy ID</div>
                                <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                                    <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all flex-1">
                                        {contractInfo.contracts.reward_policy_id}
                                    </div>
                                    <button onClick={() => onCopy(contractInfo.contracts.reward_policy_id)} className="text-xs text-blue-600 hover:underline">
                                        Copy
                                    </button>
                                </div>
                            </div>

                            {contractInfo.explorer_base && (
                                <a
                                    href={contractInfo.explorer_base}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline mt-2"
                                >
                                    View on Cardano Explorer
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Help Section */}
                {!walletConnected && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2">
                            👋 Welcome to VisionChain Wallet
                        </h3>
                        <p className="text-sm text-blue-700 dark:text-blue-400">
                            Connect your Cardano wallet to view your VISION token balance, verification history, and earn rewards for contributing medical diagnoses to the blockchain.
                        </p>
                    </div>
                )}
            </div>
        </CardContainer>
    );
};

export default WalletDashboard;
