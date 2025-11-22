import React, { useState, useEffect } from 'react';
import { X, Save, Settings, AlertTriangle, Info } from 'lucide-react';
import { SignalConfig } from '../types';

interface ConfigureSignalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  signals: SignalConfig[];
  onSave: (updatedSignals: SignalConfig[]) => void;
}

const ConfigureSignalsModal: React.FC<ConfigureSignalsModalProps> = ({
  isOpen,
  onClose,
  signals,
  onSave,
}) => {
  const [localSignals, setLocalSignals] = useState<SignalConfig[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalSignals(JSON.parse(JSON.stringify(signals)));
      if (signals.length > 0 && !selectedId) {
        setSelectedId(signals[0].id);
      }
    }
  }, [isOpen, signals]);

  const handleSave = () => {
    onSave(localSignals);
    onClose();
  };

  const getSelectedSignal = () => localSignals.find(s => s.id === selectedId);

  const updateSelectedSignal = (updates: Partial<SignalConfig>) => {
    setLocalSignals(prev => prev.map(s => 
      s.id === selectedId ? { ...s, ...updates } : s
    ));
  };

  if (!isOpen) return null;

  const selectedSignal = getSelectedSignal();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e1e1e] border border-[#3e3e42] w-full max-w-4xl rounded-xl shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-[#3e3e42] flex justify-between items-center bg-[#252526]">
          <div className="flex items-center gap-2">
            <Settings className="text-iba-accent" size={20} />
            <h2 className="text-lg font-semibold text-gray-200">Configure Signal Logic</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Sidebar: Signal List */}
          <div className="w-1/3 border-r border-[#3e3e42] overflow-y-auto bg-[#181818]">
            {localSignals.map(sig => (
              <button
                key={sig.id}
                onClick={() => setSelectedId(sig.id)}
                className={`w-full text-left p-4 border-b border-[#3e3e42] hover:bg-[#2d2d30] transition-colors flex flex-col gap-1 ${
                  selectedId === sig.id ? 'bg-[#007acc]/20 border-l-4 border-l-[#007acc]' : 'border-l-4 border-l-transparent'
                }`}
              >
                <span className="font-medium text-gray-200 text-sm">{sig.name}</span>
                <span className="text-xs text-gray-500 truncate">{sig.description}</span>
              </button>
            ))}
          </div>

          {/* Main: Edit Form */}
          <div className="w-2/3 p-6 overflow-y-auto bg-[#1e1e1e]">
            {selectedSignal ? (
              <div className="space-y-6">
                
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-mono uppercase">Signal Name</label>
                    <input 
                      type="text" 
                      value={selectedSignal.name}
                      onChange={(e) => updateSelectedSignal({ name: e.target.value })}
                      className="w-full bg-[#252526] border border-[#3e3e42] rounded p-2 text-sm text-white focus:border-iba-accent outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500 font-mono uppercase">Unit</label>
                    <input 
                      type="text" 
                      value={selectedSignal.unit}
                      onChange={(e) => updateSelectedSignal({ unit: e.target.value })}
                      className="w-full bg-[#252526] border border-[#3e3e42] rounded p-2 text-sm text-white focus:border-iba-accent outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500 font-mono uppercase">Description</label>
                  <input 
                    type="text" 
                    value={selectedSignal.description}
                    onChange={(e) => updateSelectedSignal({ description: e.target.value })}
                    className="w-full bg-[#252526] border border-[#3e3e42] rounded p-2 text-sm text-white focus:border-iba-accent outline-none"
                  />
                </div>

                <div className="h-px bg-[#3e3e42] w-full" />

                {/* Logic Configuration */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-orange-400" />
                    <h3 className="text-sm font-semibold text-gray-200">Alarm Logic Configuration</h3>
                  </div>
                  
                  <div className="p-4 rounded-lg bg-[#252526] border border-[#3e3e42] space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs text-gray-500 font-mono uppercase flex justify-between">
                        <span>Logic Expression (JS Syntax)</span>
                        <span className="text-iba-accent/80">Use 'val' variable</span>
                      </label>
                      <div className="relative">
                         <input 
                          type="text" 
                          value={selectedSignal.expression || ''}
                          onChange={(e) => updateSelectedSignal({ expression: e.target.value })}
                          className="w-full bg-[#181818] border border-[#3e3e42] rounded p-3 font-mono text-sm text-green-400 focus:border-iba-accent outline-none"
                          placeholder="val > 100"
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 flex gap-1 items-center">
                        <Info size={10}/> Examples: <code>val {'>'} 50</code>, <code>val {'<'} 10 && val {'>'} 0</code>, <code>Math.abs(val) {'>'} 5</code>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-mono uppercase">Legacy Threshold High</label>
                        <input 
                          type="number" 
                          value={selectedSignal.thresholdHigh || ''}
                          onChange={(e) => updateSelectedSignal({ thresholdHigh: parseFloat(e.target.value) })}
                          className="w-full bg-[#181818] border border-[#3e3e42] rounded p-2 font-mono text-sm text-gray-300 focus:border-iba-accent outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-gray-500 font-mono uppercase">Legacy Threshold Low</label>
                        <input 
                          type="number" 
                          value={selectedSignal.thresholdLow || ''}
                          onChange={(e) => updateSelectedSignal({ thresholdLow: parseFloat(e.target.value) })}
                          className="w-full bg-[#181818] border border-[#3e3e42] rounded p-2 font-mono text-sm text-gray-300 focus:border-iba-accent outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                Select a signal to configure
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3e3e42] bg-[#252526] flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded border border-[#3e3e42] text-gray-300 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded bg-iba-blue hover:bg-blue-600 text-white flex items-center gap-2 text-sm font-medium shadow-lg transition-all"
          >
            <Save size={16} />
            Save Configuration
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfigureSignalsModal;