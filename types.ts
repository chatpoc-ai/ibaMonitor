export enum SignalType {
  ANALOG = 'ANALOG',
  DIGITAL = 'DIGITAL',
  CALCULATED = 'CALCULATED'
}

export interface SignalConfig {
  id: string;
  name: string;
  unit: string;
  type: SignalType;
  expression?: string; // User defined expression, e.g., "x * 2 > 100"
  thresholdHigh?: number;
  thresholdLow?: number;
  description: string;
}

export interface SignalValue {
  id: string;
  timestamp: number;
  value: number;
  isAlarming: boolean;
}

export interface AlarmLog {
  id: string;
  signalId: string;
  signalName: string;
  timestamp: number;
  value: number;
  message: string;
  severity: 'WARNING' | 'CRITICAL';
}

export interface IbaConnectionStatus {
  connected: boolean;
  ip: string;
  port: number;
  latency: number;
}