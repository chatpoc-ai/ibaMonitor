import React from 'react';
import { AlarmLog } from '../types';
import { AlertCircle, BrainCircuit, XCircle } from 'lucide-react';

interface AlarmListProps {
  alarms: AlarmLog[];
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const AlarmList: React.FC<AlarmListProps> = ({ alarms, onClear, onAnalyze, isAnalyzing }) => {
  return (
    <div className="bg-[#252526] border border-[#3e3e42] rounded-xl flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-[#3e3e42] flex justify-between items-center bg-[#1e1e1e]">
        <div className="flex items-center gap-2">
          <AlertCircle className="text-orange-500" size={20} />
          <h2 className="text-lg font-semibold text-gray-200">Alarm History</h2>
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">
            {alarms.length}
          </span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={onAnalyze}
            disabled={isAnalyzing || alarms.length === 0}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              isAnalyzing 
                ? 'bg-purple-900/50 text-purple-300 cursor-wait' 
                : 'bg-purple-600 hover:bg-purple-500 text-white'
            }`}
          >
            <BrainCircuit size={14} />
            {isAnalyzing ? 'Analyzing...' : 'AI RCA'}
          </button>
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900 text-xs font-medium transition-colors"
          >
            <XCircle size={14} />
            Clear
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-0">
        {alarms.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-2">
            <div className="p-4 rounded-full bg-[#1e1e1e]">
              <AlertCircle size={32} opacity={0.2} />
            </div>
            <p className="text-sm">No active alarms recorded</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1e1e1e] text-gray-500 sticky top-0 font-mono text-xs uppercase">
              <tr>
                <th className="p-3 font-medium">Time</th>
                <th className="p-3 font-medium">Signal</th>
                <th className="p-3 font-medium">Value</th>
                <th className="p-3 font-medium">Message</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3e3e42]">
              {alarms.slice().reverse().map((alarm) => (
                <tr key={alarm.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-3 text-gray-400 font-mono text-xs whitespace-nowrap">
                    {new Date(alarm.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-medium text-cyan-400">
                    {alarm.signalName}
                  </td>
                  <td className="p-3 text-red-400 font-mono font-bold">
                    {alarm.value.toFixed(2)}
                  </td>
                  <td className="p-3 text-gray-300">
                    {alarm.message}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AlarmList;