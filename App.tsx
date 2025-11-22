import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Wifi, WifiOff, Play, Pause, Settings, Zap, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

import { SignalConfig, SignalValue, AlarmLog, IbaConnectionStatus } from './types';
import { IbaMockService, MOCK_CONFIGS } from './services/ibaMockService';
import { analyzeAlarms } from './services/geminiService';
import SignalCard from './components/SignalCard';
import AlarmList from './components/AlarmList';
import ConfigureSignalsModal from './components/ConfigureSignalsModal';

// Initial mock service setup
const mockService = new IbaMockService(MOCK_CONFIGS);

// Generate some initial demo alarms to show workflow immediately
const generateDemoAlarms = (): AlarmLog[] => {
  const now = Date.now();
  return [
    {
      id: 'demo_1',
      signalId: 'sig_2',
      signalName: 'Bearing Temp A',
      timestamp: now - 1000 * 60 * 15,
      value: 82.5,
      message: 'Value 82.50 exceeded limit defined by: val > 78',
      severity: 'WARNING'
    },
    {
      id: 'demo_2',
      signalId: 'sig_3',
      signalName: 'Shaft Vibration',
      timestamp: now - 1000 * 60 * 12,
      value: 7.2,
      message: 'Value 7.20 exceeded limit defined by: val > 6.5',
      severity: 'CRITICAL'
    },
    {
      id: 'demo_3',
      signalId: 'sig_1',
      signalName: 'Main Motor Speed',
      timestamp: now - 1000 * 60 * 10,
      value: 1550,
      message: 'Value 1550.00 exceeded limit defined by: val > 1450',
      severity: 'CRITICAL'
    },
    {
      id: 'demo_4',
      signalId: 'sig_4',
      signalName: 'Drive Torque',
      timestamp: now - 1000 * 60 * 5,
      value: 520,
      message: 'Value 520.00 exceeded limit defined by: val > 510',
      severity: 'WARNING'
    }
  ];
};

const App: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [signals, setSignals] = useState<SignalConfig[]>(MOCK_CONFIGS);
  const [signalValues, setSignalValues] = useState<Record<string, SignalValue>>({});
  const [signalHistory, setSignalHistory] = useState<Record<string, SignalValue[]>>({});
  const [alarms, setAlarms] = useState<AlarmLog[]>(generateDemoAlarms());
  const [connectionStatus, setConnectionStatus] = useState<IbaConnectionStatus>({
    connected: false,
    ip: '192.168.10.55',
    port: 5001,
    latency: 0
  });

  // Configuration State
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);

  // Gemini AI Analysis State
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState<boolean>(false);

  // Audio context for alarm sound (initialized on first user interaction usually, but simplifying here)
  const audioContextRef = useRef<AudioContext | null>(null);

  const playAlarmSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') ctx.resume();

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(440, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.5);
  }, []);

  // Handle Config Save
  const handleSaveConfig = (updatedSignals: SignalConfig[]) => {
    setSignals(updatedSignals);
    mockService.updateConfigs(updatedSignals);
  };

  // Inject a simulated fault for demo purposes
  const handleSimulateFault = () => {
    const now = Date.now();
    const newAlarms: AlarmLog[] = [
      {
        id: crypto.randomUUID(),
        signalId: 'sig_3',
        signalName: 'Shaft Vibration',
        timestamp: now - 2000,
        value: 9.1,
        message: 'Value 9.10 exceeded limit defined by: val > 6.5',
        severity: 'CRITICAL'
      },
      {
        id: crypto.randomUUID(),
        signalId: 'sig_2',
        signalName: 'Bearing Temp A',
        timestamp: now - 1000,
        value: 88.4,
        message: 'Value 88.40 exceeded limit defined by: val > 78',
        severity: 'CRITICAL'
      },
      {
        id: crypto.randomUUID(),
        signalId: 'sig_1',
        signalName: 'Main Motor Speed',
        timestamp: now,
        value: 0,
        message: 'Value 0.00 triggered logic: val < 100 (Stopped)',
        severity: 'WARNING'
      }
    ];
    
    setAlarms(prev => [...prev, ...newAlarms]);
    playAlarmSound();
  };

  // Data Polling Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isConnected && !isPaused) {
      interval = setInterval(() => {
        const newValues = mockService.readValues();
        
        // Update Latency Simulation
        setConnectionStatus(prev => ({
          ...prev,
          connected: true,
          latency: Math.floor(Math.random() * 15 + 5)
        }));

        setSignalValues(prev => {
          const next = { ...prev };
          newValues.forEach(v => next[v.id] = v);
          return next;
        });

        // Update History
        setSignalHistory(prev => {
          const next = { ...prev };
          newValues.forEach(v => {
            const hist = next[v.id] || [];
            const newHist = [...hist, v];
            if (newHist.length > 50) newHist.shift(); // Keep buffer small for performance
            next[v.id] = newHist;
          });
          return next;
        });

        // Check for Alarms (Rising Edge Logic)
        newValues.forEach(v => {
          const config = signals.find(s => s.id === v.id);
          if (v.isAlarming && config) {
             // Only add alarm if the LAST value was NOT alarming (rising edge) to prevent spam
             // Or strictly if it is alarming right now. 
             // For this demo, we'll check if the last logged alarm for this ID was recent to avoid spam
             setAlarms(prevAlarms => {
               const lastAlarmForSignal = prevAlarms.findLast(a => a.signalId === v.id);
               const timeSinceLast = lastAlarmForSignal ? v.timestamp - lastAlarmForSignal.timestamp : Infinity;
               
               if (timeSinceLast > 5000) { // 5 seconds deadband
                 playAlarmSound();
                 return [...prevAlarms, {
                   id: crypto.randomUUID(),
                   signalId: v.id,
                   signalName: config.name,
                   timestamp: v.timestamp,
                   value: v.value,
                   message: `Value ${v.value.toFixed(2)} exceeded limit defined by: ${config.expression || config.thresholdHigh}`,
                   severity: 'CRITICAL'
                 }];
               }
               return prevAlarms;
             });
          }
        });

      }, 200); // 5Hz poll rate
    } else {
      setConnectionStatus(prev => ({ ...prev, connected: false, latency: 0 }));
    }

    return () => clearInterval(interval);
  }, [isConnected, isPaused, signals, playAlarmSound]);

  const handleConnect = () => setIsConnected(!isConnected);
  const handleClearAlarms = () => setAlarms([]);
  
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setShowAnalysisModal(true);
    const result = await analyzeAlarms(alarms);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-gray-100 font-sans flex flex-col">
      {/* Header */}
      <header className="bg-[#1e1e1e] border-b border-[#3e3e42] px-6 py-3 flex justify-between items-center sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-iba-blue p-2 rounded-lg shadow-glow">
             <Zap size={24} className="text-white fill-current" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">ibaMonitor <span className="text-iba-accent font-light">Pro</span></h1>
            <p className="text-xs text-gray-400 font-mono">ibaPDA Interface v2.4.0 // NET.ADAPTER</p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="hidden md:flex items-center gap-6 bg-[#252526] px-4 py-2 rounded-full border border-[#3e3e42]">
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-500">STATUS:</span>
            <span className={isConnected ? "text-green-400" : "text-red-400"}>
              {isConnected ? "ONLINE" : "OFFLINE"}
            </span>
          </div>
          <div className="h-4 w-[1px] bg-gray-700"></div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-gray-500">TARGET:</span>
            <span className="text-blue-300">{connectionStatus.ip}:{connectionStatus.port}</span>
          </div>
           <div className="h-4 w-[1px] bg-gray-700"></div>
          <div className="flex items-center gap-2 text-xs font-mono">
             <span className="text-gray-500">LATENCY:</span>
            <span className="text-yellow-300">{connectionStatus.latency}ms</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
             onClick={handleSimulateFault}
             className="flex items-center gap-2 px-3 py-2 rounded-md border border-orange-900/50 bg-orange-900/20 text-orange-400 hover:bg-orange-900/40 text-xs font-medium transition-colors"
             title="Inject simulated fault data"
          >
             <AlertTriangle size={16} /> <span className="hidden sm:inline">Simulate Fault</span>
          </button>

          <button 
            onClick={() => setIsPaused(!isPaused)}
            disabled={!isConnected}
            className={`p-2 rounded-md border transition-all ${isPaused ? 'bg-yellow-900/20 border-yellow-600 text-yellow-500' : 'border-[#3e3e42] text-gray-400 hover:text-white'}`}
          >
            {isPaused ? <Play size={20} fill="currentColor"/> : <Pause size={20} fill="currentColor"/>}
          </button>
          
          <button 
            onClick={handleConnect}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all shadow-lg ${
              isConnected 
                ? 'bg-red-900/20 border border-red-600 text-red-400 hover:bg-red-900/40' 
                : 'bg-iba-blue hover:bg-blue-600 text-white'
            }`}
          >
            {isConnected ? (
              <> <WifiOff size={16} /> Disconnect </>
            ) : (
              <> <Wifi size={16} /> Connect ibaPDA </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-hidden max-h-[calc(100vh-72px)]">
        
        {/* Left Column: Signals Grid */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
           <div className="flex justify-between items-center">
             <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
               <ActivityIcon /> Live Signals
             </h2>
             <button 
               onClick={() => setShowConfigModal(true)}
               className="text-xs flex items-center gap-1 text-gray-400 hover:text-iba-accent transition-colors"
             >
               <Settings size={14} /> Configure Logic
             </button>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto pr-2 pb-20">
             {signals.map(sig => (
               <SignalCard 
                 key={sig.id} 
                 config={sig} 
                 currentValue={signalValues[sig.id]} 
                 history={signalHistory[sig.id] || []}
               />
             ))}
             {/* Placeholder for visual balance if few signals */}
             {!isConnected && signals.length > 0 && (
                <div className="col-span-full p-12 border-2 border-dashed border-[#3e3e42] rounded-xl flex flex-col items-center justify-center text-gray-600">
                  <Wifi size={48} className="mb-4 opacity-20" />
                  <p>System Offline. Connect to ibaPDA to stream data.</p>
                </div>
             )}
           </div>
        </div>

        {/* Right Column: Alarms */}
        <div className="lg:col-span-1 h-full">
          <AlarmList 
            alarms={alarms} 
            onClear={handleClearAlarms} 
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
          />
        </div>
      </main>

      <ConfigureSignalsModal 
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        signals={signals}
        onSave={handleSaveConfig}
      />

      {/* Gemini Analysis Modal */}
      {showAnalysisModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-[#1e1e1e] border border-[#3e3e42] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#3e3e42] flex justify-between items-center bg-gradient-to-r from-purple-900/20 to-[#1e1e1e]">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="text-purple-400" /> 
                Root Cause Analysis
              </h3>
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <WifiOff className="rotate-45" size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto text-sm text-gray-300 leading-relaxed">
              {isAnalyzing ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4">
                  <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-purple-300 animate-pulse">Consulting AI Engine...</p>
                </div>
              ) : (
                 <div className="prose prose-invert prose-sm max-w-none">
                   <ReactMarkdown>{analysisResult || ""}</ReactMarkdown>
                 </div>
              )}
            </div>
            
            <div className="p-4 border-t border-[#3e3e42] bg-[#252526] flex justify-end">
              <button 
                onClick={() => setShowAnalysisModal(false)}
                className="px-4 py-2 bg-white text-black font-medium rounded hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ActivityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-iba-accent">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default App;