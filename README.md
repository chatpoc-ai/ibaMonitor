# ibaMonitor Pro

**ibaMonitor Pro** is a high-performance, web-based industrial monitoring dashboard designed to visualize real-time process data acquired from **ibaPDA** systems. It features advanced signal processing, threshold-based alarming, and AI-powered Root Cause Analysis (RCA) using the Google Gemini API.

![Status](https://img.shields.io/badge/Status-Active-success)
![Stack](https://img.shields.io/badge/Tech-React%20%7C%20Tailwind%20%7C%20Gemini-blue)

## 🏭 What is ibaPDA?

**ibaPDA** (Process Data Acquisition) is a world-leading PC-based system for centrally acquiring and recording high-resolution process data in industrial environments. It is widely used in steel, energy, and manufacturing industries to capture data from PLCs, drives, and sensors at millisecond sampling rates.

While ibaPDA excels at recording and offline analysis, **ibaMonitor Pro** extends its capabilities by providing a lightweight, browser-based interface for real-time remote monitoring and intelligent fault diagnosis.

## 🎯 Purpose & Utility

This software serves as a modern **HMI (Human-Machine Interface)** layer on top of the ibaPDA infrastructure. It is designed for:

1.  **Remote Condition Monitoring:** Engineers can monitor critical machinery (motors, bearings, drives) from any web-enabled device without needing the heavy ibaPDA client software.
2.  **Intelligent Alarming:** Instead of simple limits, the system evaluates logical expressions to trigger alarms only when specific operational conditions are met.
3.  **AI Maintenance Assistant:** When failures occur, the integrated Google Gemini AI analyzes the sequence of alarms to identify root causes and suggest immediate maintenance actions, reducing downtime.

## ✨ Key Features

### 📊 Real-Time Signal Visualization
*   **Live Streaming:** Simulates the `ibaNET` protocol to stream data at 50Hz+.
*   **Sparkline Trends:** Immediate visual history for every signal (last 30s) to detect patterns like drift or noise.
*   **Industrial UI:** High-contrast, dark-mode interface optimized for control room environments.

### 🚨 Advanced Alarming System
*   **Logic Expressions:** Supports complex checks (e.g., `val > 1450` or compound logic) rather than just static thresholds.
*   **Rising Edge Detection:** Prevents alarm flooding by triggering alerts only on the transition from "Normal" to "Alarm" state.
*   **Audio Feedback:** Synthesized audio alerts using the Web Audio API for critical events.
*   **Deadband Control:** Prevents jittery signals from triggering repeated false alarms.

### 🧠 AI-Powered Analysis (Gemini)
*   **Automated RCA:** One-click analysis of the alarm history buffer.
*   **Contextual Insights:** The AI identifies correlations between different signals (e.g., "Did the High Temperature trigger the Speed reduction?").
*   **Actionable Advice:** Provides concise maintenance recommendations for operators.

### 📡 Connectivity Simulation
*   **Mock ibaNET Service:** Includes a robust simulation engine that generates realistic industrial signal patterns (sine waves for temp, noise for vibration, ramps for speed).
*   **Network Telemetry:** Displays simulated connection latency and target IP status.

## 🛠️ Technical Stack

*   **Frontend:** React 19 with TypeScript
*   **Styling:** Tailwind CSS (Custom Industrial Theme)
*   **Charting:** Recharts (High-performance SVG charting)
*   **AI Integration:** Google GenAI SDK (`@google/genai`)
*   **Icons:** Lucide React

## 🚀 Getting Started

1.  **Clone the repository**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure API Key:**
    Ensure your `process.env.API_KEY` is set with a valid Google Gemini API key.
4.  **Run the development server:**
    ```bash
    npm start
    ```

---
*Note: This application includes a simulation layer (`IbaMockService`) to mimic hardware connectivity in a browser environment. In a production deployment, this would be replaced by a WebSocket connection to a C# backend running the actual `ibaNET.dll`.*