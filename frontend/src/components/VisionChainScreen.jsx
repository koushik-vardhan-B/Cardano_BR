import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import WalletConnect from './WalletConnect';
import CardContainer from './common/CardContainer';
import SecondaryButton from './common/SecondaryButton';
import walletService from '../services/walletService';
import { api } from '../services/api';

const VisionChainScreen = ({ record, onBack }) => {
    const [walletConnected, setWalletConnected] = useState(false);
    const [walletInfo, setWalletInfo] = useState(null);
    const [visionBalance, setVisionBalance] = useState(null);
    const [rewardTiers, setRewardTiers] = useState(null);
    const [verificationStatus, setVerificationStatus] = useState('not_submitted');
    const [verificationData, setVerificationData] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isClaiming, setIsClaiming] = useState(false);

    useEffect(() => {
        // Check if wallet is already connected
        const info = walletService.getWalletInfo();
        if (info.connected) {
            setWalletConnected(true);
            setWalletInfo(info);
            fetchVisionBalance(info.address);
        }

        // Fetch reward tiers
        fetchRewardTiers();
    }, []);

    const fetchRewardTiers = async () => {
        try {
            const response = await fetch('http://localhost:8000/blockchain/reward-tiers');
            const data = await response.json();
            setRewardTiers(data);
        } catch (error) {
            console.error('Failed to fetch reward tiers:', error);
        }
    };

    const fetchVisionBalance = async (address) => {
        try {
            const response = await fetch(`http://localhost:8000/blockchain/balance/${address}`);
            const data = await response.json();
            setVisionBalance(data);
        } catch (error) {
            console.error('Failed to fetch VISION balance:', error);
        }
    };

    const handleWalletConnect = (result) => {
        setWalletConnected(true);
        setWalletInfo(result);
        fetchVisionBalance(result.address);
    };

    const handleWalletDisconnect = () => {
        setWalletConnected(false);
        setWalletInfo(null);
        setVisionBalance(null);
    };

    const handleSubmitVerification = async () => {
        if (!walletConnected) {
            alert('Please connect your wallet first');
            return;
        }

        setIsSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('screening_id', record.screeningId);
            formData.append('image_path', `uploads/${record.screeningId}.jpg`);
            formData.append('diagnosis', record.prediction_index || 0);
            formData.append('confidence', Math.round(parseFloat(record.confidence)));
            formData.append('verifier_address', walletInfo.address);

            const response = await fetch('http://localhost:8000/blockchain/verify', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            setVerificationData(data);
            setVerificationStatus('verified');

            // Refresh balance
            fetchVisionBalance(walletInfo.address);
        } catch (error) {
            console.error('Verification failed:', error);
            alert('Failed to submit verification to blockchain');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClaimReward = async () => {
        if (!verificationData) {
            alert('No verification to claim rewards for');
            return;
        }

        setIsClaiming(true);
        try {
            const formData = new FormData();
            formData.append('verification_id', verificationData.verification_id);
            formData.append('wallet_address', walletInfo.address);

            const response = await fetch('http://localhost:8000/blockchain/claim-reward', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                alert(`Successfully claimed ${data.reward_amount} VISION tokens!`);
                fetchVisionBalance(walletInfo.address);
            }
        } catch (error) {
            console.error('Claim failed:', error);
            alert('Failed to claim rewards');
        } finally {
            setIsClaiming(false);
        }
    };

    const calculateReward = () => {
        if (!record.confidence || !rewardTiers) return 0;

        const confidence = parseFloat(record.confidence);
        if (confidence >= 90) return rewardTiers.tiers.high.reward;
        if (confidence >= 70) return rewardTiers.tiers.medium.reward;
        return rewardTiers.tiers.low.reward;
    };

    const onCopy = (value) => {
        try { navigator.clipboard?.writeText(value); } catch (e) { /* ignore */ }
    };

    return (
        <CardContainer>
            {/* Wallet Connection */}
            <div className="mb-6">
                <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
            </div>

            {/* VISION Balance */}
            {walletConnected && visionBalance && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-xs font-medium text-purple-600 dark:text-purple-400 uppercase tracking-wide mb-1">
                                Your VISION Tokens
                            </div>
                            <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                                {visionBalance.vision_balance || 0} VISION
                            </div>
                            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                                {visionBalance.total_verifications || 0} verifications · {visionBalance.total_rewards_earned || 0} tokens earned
                            </div>
                        </div>
                        <div className="text-4xl">🪙</div>
                    </div>
                </motion.div>
            )}

            {/* Diagnosis Info */}
            <div className="mb-6 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                    Diagnosis Summary
                </h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Screening ID:</span>
                        <span className="font-mono text-slate-900 dark:text-slate-100">{record.screeningId}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Diagnosis:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{record.diagnosis}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Confidence:</span>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">{record.confidence}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Potential Reward:</span>
                        <span className="font-bold text-purple-600 dark:text-purple-400">{calculateReward()} VISION</span>
                    </div>
                </div>
            </div>

            {/* Blockchain Verification */}
            <div className="mb-6 p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                    Blockchain Verification
                </h3>

                {/* Check if already verified (from old system or new system) */}
                {(record.txHash || record.did || verificationStatus === 'verified') ? (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold">Verified on Blockchain!</span>
                        </div>

                        <div className="space-y-3">
                            {/* Transaction Hash - support both old (txHash) and new (tx_hash) format */}
                            {(record.txHash || verificationData?.tx_hash) && (
                                <div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">Transaction Hash</div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all flex-1 cursor-pointer" onClick={() => onCopy(record.txHash || verificationData?.tx_hash)}>
                                            {record.txHash || verificationData?.tx_hash}
                                        </div>
                                        <button onClick={() => onCopy(record.txHash || verificationData?.tx_hash)} className="text-xs text-blue-600 hover:underline">Copy</button>
                                    </div>
                                </div>
                            )}

                            {/* Verification ID / DID - support both formats */}
                            {(record.did || verificationData?.verification_id) && (
                                <div>
                                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-1">
                                        {record.did ? 'Cardano DID' : 'Verification ID'}
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-200 dark:border-slate-800">
                                        <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all flex-1 cursor-pointer" onClick={() => onCopy(record.did || verificationData?.verification_id)}>
                                            {record.did || verificationData?.verification_id}
                                        </div>
                                        <button onClick={() => onCopy(record.did || verificationData?.verification_id)} className="text-xs text-blue-600 hover:underline">Copy</button>
                                    </div>
                                </div>
                            )}

                            {verificationData?.explorer_url && (
                                <a
                                    href={verificationData.explorer_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    View on Cardano Explorer
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                </a>
                            )}
                        </div>

                        {walletConnected && (
                            <button
                                onClick={handleClaimReward}
                                disabled={isClaiming}
                                className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                            >
                                {isClaiming ? 'Claiming Rewards...' : `Claim ${calculateReward()} VISION Tokens`}
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            Submit this diagnosis to the Cardano blockchain for permanent verification and earn VISION tokens.
                        </p>
                        <button
                            onClick={handleSubmitVerification}
                            disabled={!walletConnected || isSubmitting}
                            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-semibold rounded-lg transition-colors disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? 'Submitting to Blockchain...' : 'Verify on Blockchain'}
                        </button>
                        {!walletConnected && (
                            <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                                Connect your wallet first to submit verification
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Reward Tiers Info */}
            {rewardTiers && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide mb-3">
                        VISION Token Reward Tiers
                    </h3>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">🥉 Low (0-69%):</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.low.reward} VISION</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">🥈 Medium (70-89%):</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.medium.reward} VISION</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-400">🥇 High (90-100%):</span>
                            <span className="font-bold text-slate-900 dark:text-slate-100">{rewardTiers.tiers.high.reward} VISION</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-blue-200 dark:border-blue-800">
                            <span className="text-slate-600 dark:text-slate-400">⭐ Professional Bonus:</span>
                            <span className="font-bold text-purple-600 dark:text-purple-400">+{rewardTiers.tiers.professional_bonus.reward} VISION</span>
                        </div>
                    </div>
                </div>
            )}

            <SecondaryButton onClick={onBack} className="mt-6">
                Back to Result
            </SecondaryButton>
        </CardContainer>
    );
};

export default VisionChainScreen;
