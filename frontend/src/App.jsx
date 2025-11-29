import React, { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import NewScreening from './components/NewScreening';
import ResultScreen from './components/ResultScreen';
import BlockchainScreen from './components/BlockchainScreen';
import LoadingScreen from './components/LoadingScreen';
import ThemeToggle from './components/common/ThemeToggle';
import Toast from './components/common/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import ChatWidget from './components/ChatWidget';
import LoginPage from './components/LoginPage';
import { signOutUser, getUserFromStorage } from './services/auth';
import { api } from './services/api';
import CardanoLogo from './components/common/CardanoLogo';

function App({ theme, toggleTheme }) {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // State Machine: 'new', 'loading', 'result', 'blockchain'
  const [currentScreen, setCurrentScreen] = useState('new');
  const [toast, setToast] = useState(null);

  // Dashboard Data
  const [todayStats, setTodayStats] = useState({ countToday: 0, highRiskPercent: 0 });
  const [recentScreenings, setRecentScreenings] = useState([]);

  // Global State - MUST be declared before any conditional returns
  const [globalState, setGlobalState] = useState({
    patientId: '',
    screeningId: '',
    riskScore: '',
    confidence: '',
    explanation: '',
    txHash: '',
    did: '',
    timestamp: '',
    images: [],
    anchorStatus: 'not_requested' // 'not_requested', 'pending', 'anchored', 'failed'
  });

  // Check for existing auth on mount
  useEffect(() => {
    const savedUser = getUserFromStorage();
    if (savedUser) {
      setUser(savedUser);
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch stats on mount and when screening completes
  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();
    }
  }, [isAuthenticated, currentScreen]);

  const fetchDashboardData = async () => {
    try {
      const [stats, recent] = await Promise.all([
        api.getTodayStats(),
        api.getRecentScreenings()
      ]);
      setTodayStats(stats);
      setRecentScreenings(recent);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleDemoMode = () => {
    const demoUser = {
      uid: 'demo-user',
      displayName: 'Demo User',
      email: 'demo@t7mediscan.ai',
      photoURL: null
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('isAuthenticated', 'true');
  };

  const handleSignOut = async () => {
    try {
      await signOutUser();
      setUser(null);
      setIsAuthenticated(false);
      setCurrentScreen('new');
      showToast('Signed out successfully', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  };

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <LoginPage onAuthSuccess={handleAuthSuccess} onDemoMode={handleDemoMode} theme={theme} />;
  }

  // File validation
  const validateFile = (file) => {
    if (!file) return { valid: false, error: 'No file selected' };
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) return { valid: false, error: 'Only PNG and JPG images are allowed' };
    if (file.size > maxSize) return { valid: false, error: 'File size must be less than 5MB' };
    return { valid: true };
  };

  const handleRunScreening = async (data) => {
    // Check internet connection
    if (!navigator.onLine) {
      showToast('No internet connection. Please check your network and try again.', 'error');
      return;
    }

    // Validate retinal image
    if (data.retinalImage) {
      const val = validateFile(data.retinalImage);
      if (!val.valid) { showToast(`Retinal Image: ${val.error}`, 'error'); return; }
    }

    setCurrentScreen('loading');

    try {
      // Prepare FormData for backend /predict endpoint
      const formData = new FormData();
      formData.append('patientId', data.patientId);
      if (data.retinalImage) formData.append('file', data.retinalImage); // Backend expects 'file'

      // Call API
      const result = await api.predict(formData);

      // Create object URL for retinal image to display in result
      const imageUrl = data.retinalImage ? URL.createObjectURL(data.retinalImage) : null;

      setGlobalState(prev => ({
        ...prev,
        patientId: result.patientId,
        screeningId: result.screeningId,
        diagnosis: result.diagnosis,
        riskScore: result.riskScore,
        confidence: result.confidence.toFixed(1) + '%',
        explanation: result.explanation,
        classProbabilities: result.class_probabilities,
        heatmapFilename: result.heatmap_filename,
        heatmapAvailable: result.heatmap_available,
        timestamp: new Date().toLocaleString(),
        originalImage: imageUrl,
        txHash: '',
        did: ''
      }));

      setCurrentScreen('result');
      // fetchDashboardData(); // Refresh stats - This is now handled by the optimistic update block
    } catch (error) {
      console.error(error);
      showToast('AI Screening Failed. Please try again.', 'error');
      setCurrentScreen('new');
    }
  };

  const handleViewBlockchain = async () => {
    if (globalState.anchorStatus === 'anchored') {
      setCurrentScreen('blockchain');
      return;
    }

    setGlobalState(prev => ({ ...prev, anchorStatus: 'pending' }));

    try {
      // Call API to anchor on chain
      const result = await api.storeOnChain({
        screeningId: globalState.screeningId,
        patientId: globalState.patientId,
        riskScore: globalState.riskScore
      });

      setGlobalState(prev => ({
        ...prev,
        txHash: result.txHash,
        did: result.did,
        anchored: true,
        anchorStatus: 'anchored'
      }));

      // Auto-switch to blockchain screen
      setCurrentScreen('blockchain');

    } catch (error) {
      console.error(error);
      setGlobalState(prev => ({ ...prev, anchorStatus: 'failed' }));
      showToast('Blockchain anchoring failed. Please try again.', 'error');
    }
  };

  const handleBackToNew = () => {
    setGlobalState({
      patientId: '',
      screeningId: '',
      riskScore: '',
      confidence: '',
      explanation: '',
      txHash: '',
      did: '',
      timestamp: '',
      images: [],
      anchorStatus: 'not_requested'
    });
    setCurrentScreen('new');
  };

  const handleBackToResult = () => {
    setCurrentScreen('result');
  };

  const handleResetDemo = async () => {
    if (confirm('Are you sure you want to clear all screening data? This cannot be undone.')) {
      await api.clearScreenings();
      fetchDashboardData();
      showToast('Demo data cleared', 'success');
    }
  };

  return (
    <ErrorBoundary>
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-950 text-slate-50' : 'bg-[#f4f5fb] text-slate-900'}`}>
        {/* Top Navigation */}
        <header className="border-b bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-semibold shadow-sm">
                T7
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-semibold text-lg tracking-tight">T7 MediScan AI</h1>
                  {/* Cardano Pill */}
                  <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-[10px] font-medium text-blue-700 dark:text-blue-300" title="Screening hashes and DIDs are anchored on Cardano preprod for integrity and non-repudiation.">
                    <CardanoLogo size={12} />
                    <span>Powered by Cardano</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Early diabetes pre-screening · AI + Cardano
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Network Indicator */}
              <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 text-[10px] font-mono text-amber-700 dark:text-amber-400" title="Using Cardano preprod via Blockfrost for this demo.">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                Network: Cardano preprod
              </div>

              {/* User Info */}
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName} className="h-6 w-6 rounded-full" />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    {user.displayName || user.email}
                  </span>
                </div>
              )}

              {/* Sign Out Button */}
              <button
                onClick={handleSignOut}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                Sign out
              </button>

              <ThemeToggle isDark={theme === 'dark'} toggleTheme={toggleTheme} />
            </div>
          </div>
        </header>

        {/* Demo Auth Banner */}
        {user && user.phone && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800">
            <div className="max-w-6xl mx-auto px-6 py-2 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span><strong>Demo auth:</strong> Phone sign-in is simulated. In production this would use real SMS.</span>
            </div>
          </div>
        )}

        {/* Main Content: left nav, center workspace, right sidebar */}
        <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-12 gap-6">
          {/* Left navigation */}
          <aside className="col-span-12 md:col-span-2">
            <div className="sticky top-24 space-y-2">
              <button onClick={() => setCurrentScreen('new')} className={`w-full text-left py-2 px-3 rounded-md text-sm ${currentScreen === 'new' ? 'bg-slate-200 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                New screening
              </button>
              <button onClick={() => setCurrentScreen('result')} className={`w-full text-left py-2 px-3 rounded-md text-sm ${currentScreen === 'result' ? 'bg-slate-200 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                Results
              </button>
              <button onClick={() => setCurrentScreen('blockchain')} className={`w-full text-left py-2 px-3 rounded-md text-sm ${currentScreen === 'blockchain' ? 'bg-slate-200 dark:bg-slate-800/50' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}>
                Verification
              </button>

              {/* Demo Reset Button */}
              {user?.uid === 'demo-user' && (
                <button onClick={handleResetDemo} className="w-full text-left py-2 px-3 rounded-md text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4 border-t border-slate-200 dark:border-slate-700 pt-4">
                  Reset Demo Data
                </button>
              )}
            </div>
          </aside>

          {/* Center workspace */}
          <section className="col-span-12 md:col-span-7">
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{currentScreen === 'new' ? 'New Screening' : currentScreen === 'result' ? 'Screening Result' : 'Blockchain Record'}</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Operator: {user?.displayName || 'Demo User'}</p>
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">Clinic: Demo Clinic 01</div>
              </div>

              <div>
                {currentScreen === 'new' && (
                  <NewScreening onRunScreening={handleRunScreening} />
                )}

                {currentScreen === 'loading' && (
                  <div className="flex items-center justify-center min-h-[40vh]"><LoadingScreen /></div>
                )}

                {currentScreen === 'result' && (
                  <ResultScreen results={globalState} onViewBlockchain={handleViewBlockchain} onBack={handleBackToNew} user={user} />
                )}

                {currentScreen === 'blockchain' && (
                  <BlockchainScreen record={globalState} onBack={handleBackToResult} />
                )}
              </div>
            </div>
          </section>

          {/* Right sidebar: recent screenings & today stats */}
          <aside className="col-span-12 md:col-span-3">
            <div className="sticky top-24 space-y-4">
              <div className="p-3 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-md shadow-sm">
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">Today's stats</div>
                <div className="mt-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="text-lg font-semibold">{todayStats.countToday}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">screenings</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-emerald-600">{(todayStats.highRiskPercent * 100).toFixed(0)}%</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">high risk</div>
                  </div>
                </div>
              </div>

              <div className="p-2 bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/40 rounded-md shadow-sm">
                <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">Recent screenings</div>
                {recentScreenings.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {recentScreenings.map((s, i) => (
                      <li key={i} className="flex justify-between items-center">
                        <div className="text-slate-700 dark:text-slate-200">PID: {s.patientId}</div>
                        <div className={`text-xs ${s.riskLabel === 'High' ? 'text-red-600' :
                          s.riskLabel === 'Medium' ? 'text-amber-600' : 'text-emerald-600'
                          }`}>{s.riskLabel}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-xs text-slate-400 text-center py-2">No recent screenings</div>
                )}
              </div>
            </div>
          </aside>
        </main>

        <AnimatePresence>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </AnimatePresence>

        {/* Chat Widget */}
        <ChatWidget />
      </div>
    </ErrorBoundary>
  );
}

export default App;
