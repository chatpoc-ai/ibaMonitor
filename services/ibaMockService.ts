import { SignalConfig, SignalValue, SignalType } from '../types';

/**
 * NOTE: In a real production environment, this service would be replaced by 
 * an API call to a .NET Backend (C# WebAPI) that wraps the actual 
 * ibaNET.dll provided by iba AG. 
 * 
 * Since browsers cannot directly load .NET DLLs or connect to raw TCP 
 * automation ports, this class simulates the data stream you would receive 
 * from the ibaPDA system.
 */

export class IbaMockService {
  private signals: SignalConfig[] = [];
  private startTime: number = Date.now();

  constructor(initialSignals: SignalConfig[]) {
    this.signals = initialSignals;
  }

  // Simulates reading a snapshot of data from ibaPDA
  public readValues(): SignalValue[] {
    const now = Date.now();
    const elapsed = (now - this.startTime) / 1000;

    return this.signals.map(sig => {
      let val = 0;
      
      // Simulate different industrial signal behaviors
      if (sig.name.includes('Motor Speed')) {
        // Ramp up and add noise
        val = Math.min(1500, elapsed * 100) + (Math.random() * 20 - 10);
        // Introduce a dip periodically
        if (Math.floor(elapsed) % 20 > 15) val -= 300;
      } 
      else if (sig.name.includes('Temp')) {
        // Slow rising sine wave
        val = 60 + 20 * Math.sin(elapsed * 0.1) + Math.random();
      }
      else if (sig.name.includes('Vibration')) {
        // Fast noise
        val = 2 + Math.random() * 3;
        // Random spike
        if (Math.random() > 0.98) val += 5; 
      }
      else if (sig.name.includes('Torque')) {
        val = 400 + 100 * Math.cos(elapsed * 0.5) + (Math.random() * 10);
      }
      else {
        val = Math.random() * 100;
      }

      // Check logic (Simulating the processing expression check)
      // In a real app, use a math parser library. Here we do simple checks.
      let isAlarming = false;
      if (sig.thresholdHigh !== undefined && val > sig.thresholdHigh) isAlarming = true;
      if (sig.thresholdLow !== undefined && val < sig.thresholdLow) isAlarming = true;

      return {
        id: sig.id,
        timestamp: now,
        value: parseFloat(val.toFixed(2)),
        isAlarming
      };
    });
  }
}

export const MOCK_CONFIGS: SignalConfig[] = [
  {
    id: 'sig_1',
    name: 'Main Motor Speed',
    unit: 'rpm',
    type: SignalType.ANALOG,
    thresholdHigh: 1450,
    description: 'Primary drive shaft rotation speed',
    expression: 'val > 1450'
  },
  {
    id: 'sig_2',
    name: 'Bearing Temp A',
    unit: '°C',
    type: SignalType.ANALOG,
    thresholdHigh: 78,
    description: 'Front bearing temperature monitoring',
    expression: 'val > 78'
  },
  {
    id: 'sig_3',
    name: 'Shaft Vibration',
    unit: 'mm/s',
    type: SignalType.ANALOG,
    thresholdHigh: 6.5,
    description: 'Vibration sensor reading (RMS)',
    expression: 'val > 6.5'
  },
  {
    id: 'sig_4',
    name: 'Drive Torque',
    unit: 'Nm',
    type: SignalType.ANALOG,
    thresholdHigh: 510,
    description: 'Output torque load',
    expression: 'val > 510'
  }
];