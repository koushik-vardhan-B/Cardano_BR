import React from 'react';
import { motion } from 'framer-motion';
import CardContainer from './common/CardContainer';
import InfoRow from './common/InfoRow';
import SecondaryButton from './common/SecondaryButton';
import CardanoLogo from './common/CardanoLogo';

const BlockchainScreen = ({ record, onBack }) => {
    const { patientId, screeningId, txHash, did } = record;

    const onCopy = (value) => {
        try { navigator.clipboard?.writeText(value); } catch (e) { /* ignore */ }
    };

    return (
        <CardContainer>
            <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                    <CardanoLogo size={20} className="text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">Blockchain verification (Cardano)</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 ml-7">This record is anchored on Cardano testnet for integrity and non-repudiation.</p>

                <div className="mt-6 space-y-5">
                    {/* TxHash */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cardano reference</div>
                            <button onClick={() => onCopy(txHash)} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Copy</button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
                            <CardanoLogo size={16} className="text-slate-400 flex-shrink-0" />
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onCopy(txHash)}>
                                {txHash || '—'}
                            </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Reference on Cardano preprod (via Blockfrost).</p>
                    </div>

                    {/* DID */}
                    <div className="group">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cardano DID</div>
                            <button onClick={() => onCopy(did)} className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline">Copy</button>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
                            <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                            </svg>
                            <div className="text-xs font-mono text-slate-700 dark:text-slate-300 break-all cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onCopy(did)}>
                                {did || '—'}
                            </div>
                        </div>
                        <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">Decentralized identifier derived from the anchored hash.</p>
                    </div>
                </div>
            </div>

            {/* Worker Reward */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-800/50 rounded-lg shadow-sm">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <CardanoLogo size={14} className="text-blue-600 dark:text-blue-400" />
                            <div className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Worker reward (Cardano)</div>
                        </div>
                        <div className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                            Estimated reward: <span className="font-bold">0.12 ADA</span> equivalent
                        </div>
                        <div className="text-[10px] text-blue-600 dark:text-blue-400 mt-0.5 opacity-80">
                            (simulated for prototype)
                        </div>
                    </div>
                    <div className="text-[10px] font-mono text-blue-600 dark:text-blue-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">
                        Network: Cardano preprod · Not real ADA
                    </div>
                </div>
            </div>

            <SecondaryButton onClick={onBack} className="mt-6">
                Back to Result
            </SecondaryButton>
        </CardContainer>
    );
};

export default BlockchainScreen;
