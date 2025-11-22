import React from 'react';
import { AreaChart, Area, YAxis, ResponsiveContainer } from 'recharts';
import { SignalConfig, SignalValue } from '../types';
import { AlertTriangle, Activity, Settings } from 'lucide-react';

interface SignalCardProps {
  config: SignalConfig;
  currentValue: SignalValue | undefined;
  history: SignalValue[];
}

const SignalCard: React.FC<SignalCardProps> = ({ config, currentValue, history }) => {
  const isAlarm = currentValue?.isAlarming ?? false;
  
  // Prepare data for sparkline (take last 30 points for performance)
  const chartData = history.slice(-30).map(h => ({ val: h.value }));

  return (
    <div className={`relative overflow-hidden rounded-xl border p-4 transition-all duration-300 ${
      isAlarm 
        ? 'bg-red-900/20 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
        : 'bg-[#252526] border-[#3e3e42] hover:border-[#007acc]'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="flex items-center gap-2">
            <Activity size={16} className={isAlarm ? 'text-red-400' : 'text-gray-400'} />
            <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
              {config.name}
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 truncate max-w-[200px]">
            {config.description}
          </p>
        </div>
        
        <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-bold ${
          isAlarm ? 'bg-red-600 text-white animate-pulse' : 'bg-[#1e1e1e] text-cyan-400'
        }`}>
          {currentValue?.value.toFixed(2) ?? '---'} <span className="text-[10px] opacity-70">{config.unit}</span>
        </div>
      </div>

      {/* Logic Display */}
      <div className="mb-3 px-2 py-1 bg-black/30 rounded border border-white/5">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono">
          <Settings size={10} />
          <span>Logic: {config.expression || `val > ${config.thresholdHigh}`}</span>
        </div>
      </div>

      {/* Sparkline Chart */}
      <div className="h-16 w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad_${config.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isAlarm ? '#ef4444' : '#00A3D9'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={isAlarm ? '#ef4444' : '#00A3D9'} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['auto', 'auto']} hide />
            <Area 
              type="monotone" 
              dataKey="val" 
              stroke={isAlarm ? '#ef4444' : '#00A3D9'} 
              fill={`url(#grad_${config.id})`} 
              strokeWidth={2}
              isAnimationActive={false} 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {isAlarm && (
        <div className="absolute bottom-2 right-2 flex items-center gap-1 text-red-500 text-xs font-bold">
          <AlertTriangle size={12} />
          <span>ALARM</span>
        </div>
      )}
    </div>
  );
};

export default SignalCard;