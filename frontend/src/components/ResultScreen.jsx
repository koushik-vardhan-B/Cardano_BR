import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import CardContainer from './common/CardContainer';
import InfoRow from './common/InfoRow';
import PrimaryButton from './common/PrimaryButton';
import SecondaryButton from './common/SecondaryButton';
import AnalyticsDashboard from './AnalyticsDashboard';
import CardanoLogo from './common/CardanoLogo';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const ResultScreen = ({ results, onViewBlockchain, onBack, user }) => {
    const {
        patientId, diagnosis, riskScore, confidence, explanation,
        screeningId, did, txHash, timestamp, anchorStatus,
        originalImage, heatmapFilename, heatmapAvailable, classProbabilities
    } = results;

    const [heatmapUrl, setHeatmapUrl] = useState(null);

    // Fetch heatmap when component mounts
    useEffect(() => {
        if (heatmapAvailable && heatmapFilename) {
            setHeatmapUrl(`${API_URL}/heatmap/${heatmapFilename}`);
        }
    }, [heatmapAvailable, heatmapFilename]);

    // Get diagnosis interpretation
    const getDiagnosisInfo = (diagnosisLabel) => {
        const interpretations = {
            "No DR": {
                emoji: "✅",
                status: "Healthy",
                color: "green",
                description: "No signs of diabetic retinopathy detected. The retina appears healthy with no visible damage from diabetes.",
                recommendation: "Continue regular eye checkups annually. Maintain good blood sugar control.",
                severity: "None"
            },
            "Mild": {
                emoji: "⚠️",
                status: "Early Stage",
                color: "yellow",
                description: "Mild non-proliferative diabetic retinopathy detected. Small areas of swelling in the retina's blood vessels (microaneurysms).",
                recommendation: "Schedule follow-up in 6-12 months. Improve diabetes management. No immediate treatment needed.",
                severity: "Low"
            },
            "Moderate": {
                emoji: "⚠️",
                status: "Moderate",
                color: "orange",
                description: "Moderate non-proliferative diabetic retinopathy. Blood vessels that nourish the retina are blocked, affecting blood flow.",
                recommendation: "See an ophthalmologist within 3-6 months. May need closer monitoring. Focus on blood sugar control.",
                severity: "Medium"
            },
            "Severe": {
                emoji: "🚨",
                status: "Advanced",
                color: "red",
                description: "Severe non-proliferative diabetic retinopathy. Many blood vessels are blocked, depriving retinal areas of blood supply.",
                recommendation: "Urgent ophthalmologist consultation needed. Treatment may be required soon to prevent vision loss.",
                severity: "High"
            },
            "Proliferative": {
                emoji: "🚨",
                status: "Critical",
                color: "red",
                description: "Proliferative diabetic retinopathy - the most advanced stage. New abnormal blood vessels are growing, which can lead to serious vision problems.",
                recommendation: "IMMEDIATE medical attention required. Treatment (laser surgery or injections) needed to prevent blindness.",
                severity: "Critical"
            }
        };

        return interpretations[diagnosisLabel] || interpretations["Moderate"];
    };

    const diagnosisInfo = getDiagnosisInfo(diagnosis);

    const getColorClasses = (color) => {
        const colors = {
            green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
            orange: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
            red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
        };
        return colors[color] || colors.green;
    };

    const generatePDF = () => {
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const operatorName = user?.displayName || 'Unknown Operator';

        const margin = 20;
        const pageHeight = doc.internal.pageSize.height;
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(18);
        doc.text("Diabetic Retinopathy Screening Report", margin, 20);

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 28);
        doc.text(`Operator: ${operatorName}`, margin, 33);
        doc.text(`Patient ID: ${patientId}`, margin, 38);

        doc.setDrawColor(200);
        doc.line(margin, 45, pageWidth - margin, 45);

        // Results
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text("Clinical Analysis", margin, 55);

        doc.setFontSize(11);
        doc.text(`Diagnosis: ${diagnosis}`, margin, 65);
        doc.text(`Confidence: ${confidence}`, margin, 72);
        doc.text(`Risk Score: ${riskScore}`, margin, 79);

        doc.setFontSize(10);
        doc.setTextColor(80);
        const splitExplanation = doc.splitTextToSize(`Explanation: ${explanation}`, pageWidth - 2 * margin);
        doc.text(splitExplanation, margin, 89);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generated by T7 MediScan AI`, margin, pageHeight - 15);
        doc.text('AI-assisted screening tool, not a medical diagnosis.', margin, pageHeight - 11);

        doc.save(`DR_Screening_Report_${patientId || 'report'}.pdf`);
    };

    return (
        <CardContainer>
            <h2 className="text-2xl font-bold mb-6 text-center text-blue-900 dark:text-blue-400">
                Screening Results
            </h2>

            {/* Patient Info */}
            <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <InfoRow label="Patient ID" value={patientId} />
                <InfoRow label="Screening ID" value={screeningId} />
                <InfoRow label="Timestamp" value={timestamp} />
            </div>

            {/* Main Diagnosis Box */}
            <div className={`p-6 rounded-xl border-2 mb-6 ${getColorClasses(diagnosisInfo.color)}`}>
                <div className="text-center">
                    <div className="text-4xl mb-2">{diagnosisInfo.emoji}</div>
                    <div className="text-3xl font-bold mb-2">{diagnosis}</div>
                    <div className="text-xl opacity-90">{diagnosisInfo.status}</div>
                    <div className="mt-3 text-lg">Confidence: {confidence}</div>
                </div>
            </div>

            {/* Image Comparison: Original vs Heatmap */}
            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3 text-slate-800 dark:text-slate-200">
                    📸 Image Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Original Image */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Original Retinal Image</div>
                        {originalImage ? (
                            <img
                                src={originalImage}
                                alt="Original retinal image"
                                className="w-full h-64 object-cover rounded-lg border-2 border-slate-300 dark:border-slate-600 shadow-md"
                            />
                        ) : (
                            <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <span className="text-slate-400">No image available</span>
                            </div>
                        )}
                    </div>

                    {/* Heatmap */}
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            AI Heatmap Analysis
                        </div>
                        {heatmapUrl ? (
                            <div className="relative">
                                <img
                                    src={heatmapUrl}
                                    alt="AI heatmap"
                                    className="w-full h-64 object-cover rounded-lg border-2 border-red-300 dark:border-red-600 shadow-md"
                                />
                                <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                                    🔴 Red = Areas of Concern
                                </div>
                            </div>
                        ) : (
                            <div className="w-full h-64 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                    <span className="text-slate-400 text-sm">Generating heatmap...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detailed Summary */}
            <div className="mb-6 space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                    📋 Detailed Summary
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="text-xs text-blue-600 dark:text-blue-400 mb-1">Status</div>
                        <div className="text-lg font-semibold text-blue-900 dark:text-blue-200">
                            {diagnosisInfo.emoji} {diagnosisInfo.status}
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                        <div className="text-xs text-purple-600 dark:text-purple-400 mb-1">Severity Level</div>
                        <div className="text-lg font-semibold text-purple-900 dark:text-purple-200">
                            {diagnosisInfo.severity}
                        </div>
                    </div>
                    <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <div className="text-xs text-green-600 dark:text-green-400 mb-1">Risk Score</div>
                        <div className="text-lg font-semibold text-green-900 dark:text-green-200">
                            {riskScore}
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-800 dark:to-blue-900/20 rounded-lg border border-slate-200 dark:border-slate-700">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">🔍 What This Means:</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                        {diagnosisInfo.description}
                    </p>

                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2">💡 Recommended Action:</h4>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                        {diagnosisInfo.recommendation}
                    </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">AI Explanation:</p>
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed">{explanation}</p>
                </div>
            </div>

            {/* Class Probabilities */}
            {classProbabilities && (
                <details className="mb-6 p-4 bg-white dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700">
                    <summary className="cursor-pointer font-semibold text-slate-800 dark:text-slate-200 mb-2">
                        📊 Detailed AI Analysis (All Classes)
                    </summary>
                    <div className="mt-3 space-y-2">
                        {Object.entries(classProbabilities).map(([className, probability]) => (
                            <div key={className}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-700 dark:text-slate-300">{className}</span>
                                    <span className="font-medium text-slate-900 dark:text-slate-100">
                                        {probability.toFixed(2)}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${probability}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </details>
            )}

            {/* Blockchain Status */}
            {anchorStatus === 'anchored' && (
                <div className="text-center mb-4">
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono flex items-center justify-center gap-1">
                        <CardanoLogo size={10} className="text-slate-400" />
                        This screening's hash has been anchored on Cardano (preprod).
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
                <PrimaryButton onClick={onViewBlockchain} disabled={anchorStatus === 'pending'}>
                    {anchorStatus === 'anchored' ? 'View Blockchain Record' :
                        anchorStatus === 'pending' ? 'Anchoring...' :
                            'Anchor to Blockchain'}
                </PrimaryButton>

                <SecondaryButton onClick={generatePDF} className="!bg-blue-100 dark:!bg-blue-900/40 !text-blue-700 dark:!text-blue-300 hover:!bg-blue-200 dark:hover:!bg-blue-900/60">
                    📄 Download Report (PDF)
                </SecondaryButton>

                {/* Anchoring Status */}
                <div className="flex justify-center pt-2">
                    {anchorStatus === 'not_requested' && (
                        <span className="px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium border border-gray-200 dark:border-gray-700">
                            Not anchored on blockchain yet
                        </span>
                    )}
                    {anchorStatus === 'pending' && (
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium border border-blue-200 dark:border-blue-800">
                            <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Anchoring on Cardano...
                        </span>
                    )}
                    {anchorStatus === 'anchored' && (
                        <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium border border-green-200 dark:border-green-800">
                            <CardanoLogo size={12} />
                            ✓ On-chain verified on Cardano
                        </span>
                    )}
                    {anchorStatus === 'failed' && (
                        <span className="px-3 py-1.5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium border border-red-200 dark:border-red-800">
                            Anchoring failed – retry available
                        </span>
                    )}
                </div>

                <SecondaryButton onClick={onBack} className="mt-4">
                    ← Back to New Screening
                </SecondaryButton>
            </div>

            {/* Medical Disclaimer */}
            <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-xs text-yellow-800 dark:text-yellow-300 text-center">
                    ⚕️ <strong>Medical Disclaimer:</strong> This is an AI-assisted screening tool.
                    Always consult with a qualified ophthalmologist for professional medical advice and diagnosis.
                </p>
            </div>

            {/* Analytics Dashboard */}
            <AnalyticsDashboard />
        </CardContainer>
    );
};

export default ResultScreen;
