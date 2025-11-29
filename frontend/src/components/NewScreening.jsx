import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import CardContainer from './common/CardContainer';
import InputField from './common/InputField';
import PrimaryButton from './common/PrimaryButton';

const NewScreening = ({ onRunScreening }) => {
    const [patientId, setPatientId] = useState('');
    const [retinalImage, setRetinalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDemoMode, setIsDemoMode] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setRetinalImage(file);
            setImagePreview(url);
        }
    };

    const removeImage = () => {
        setRetinalImage(null);
        setImagePreview(null);
    };

    const toggleDemoMode = () => {
        const newDemoState = !isDemoMode;
        setIsDemoMode(newDemoState);

        if (newDemoState) {
            setPatientId(`DEMO-${Math.floor(100 + Math.random() * 900)}`);
        } else {
            setPatientId('');
            setRetinalImage(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onRunScreening({
            patientId: patientId || `PATIENT-${Date.now()}`,
            retinalImage: retinalImage
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main input area */}
                <div className="col-span-2">
                    <div className="p-6 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Diabetic Retinopathy Screening</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Upload a retinal fundus image for AI analysis</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Patient ID */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    Patient ID
                                </label>
                                <input
                                    value={patientId}
                                    onChange={(e) => setPatientId(e.target.value)}
                                    placeholder="Enter Patient ID (optional)"
                                    className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white dark:bg-slate-900/30 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    Leave empty for auto-generated ID
                                </p>
                            </div>

                            {/* Retinal Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                                    Retinal Fundus Image *
                                </label>

                                {!imagePreview ? (
                                    <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="retinal-upload"
                                            required={!isDemoMode}
                                        />
                                        <label htmlFor="retinal-upload" className="cursor-pointer">
                                            <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
                                                Click to upload retinal image
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                JPG, PNG • Clear fundus photograph
                                            </p>
                                        </label>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <img
                                            src={imagePreview}
                                            alt="Retinal preview"
                                            className="w-full h-64 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                )}

                                <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-xs text-blue-800 dark:text-blue-300 font-medium mb-1">
                                        ℹ️ Image Requirements:
                                    </p>
                                    <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 ml-4 list-disc">
                                        <li>Retinal fundus photograph (color image of the back of the eye)</li>
                                        <li>Clear, well-lit image showing blood vessels and retina</li>
                                        <li>Minimum 100x100 pixels</li>
                                    </ul>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="submit"
                                    disabled={!retinalImage && !isDemoMode}
                                    className="flex-1 px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium shadow-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isDemoMode ? '🧪 Run Demo Analysis' : '🔍 Analyze Retinal Image'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPatientId('');
                                        setRetinalImage(null);
                                        setImagePreview(null);
                                        setIsDemoMode(false);
                                    }}
                                    className="px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Clear
                                </button>
                            </div>

                            {/* Demo Mode Toggle */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                                <span className="text-xs text-slate-500 dark:text-slate-400">Demo Mode</span>
                                <button
                                    type="button"
                                    onClick={toggleDemoMode}
                                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${isDemoMode
                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                        }`}
                                >
                                    {isDemoMode ? '✓ Enabled' : 'Disabled'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-1">
                                    AI-Powered Analysis
                                </p>
                                <p className="text-xs text-purple-700 dark:text-purple-300">
                                    Our ResNet50 deep learning model analyzes retinal images to detect signs of diabetic retinopathy across 5 severity levels. Results include confidence scores, GradCAM heatmaps, and detailed explanations.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right sidebar */}
                <aside className="col-span-1">
                    <div className="p-4 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-lg shadow-sm sticky top-4">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-3">Quick Info</div>

                        <div className="space-y-3">
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/30 rounded-lg">
                                <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Detection Classes</div>
                                <div className="space-y-1">
                                    <div className="text-xs text-slate-700 dark:text-slate-300">• No DR</div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">• Mild</div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">• Moderate</div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">• Severe</div>
                                    <div className="text-xs text-slate-700 dark:text-slate-300">• Proliferative</div>
                                </div>
                            </div>

                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="text-xs font-medium text-blue-900 dark:text-blue-200 mb-1">⚕️ Medical Note</div>
                                <div className="text-xs text-blue-700 dark:text-blue-300">
                                    This is a screening tool. Always consult with a qualified ophthalmologist for professional diagnosis.
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default NewScreening;
