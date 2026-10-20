# OMEGA OS — Living Operating Layer

> **YOUR COMPUTER. YOUR COMMANDS. YOUR AI.**  
> An autonomous AI operating layer and personal digital companion designed to act as an intelligent control system for your workstation.

---

## 1. Overview

OMEGA departs from traditional chatbot interfaces. It operates under a primary product principle: **a futuristic computer that happens to have an interface, not a chatbot that happens to have computer controls.**

Users give OMEGA high-level goals (e.g., *"Analyze latest NVIDIA RTX 5090 architecture and prepare presentation outline"* or *"Open VS Code and create a new folder called TestProject"*), and OMEGA:
1. Deconstructs objectives into synchronous execution vectors.
2. Inquires memory and context vectors.
3. Builds an inspectable multi-step execution plan.
4. Enforces strict permission boundaries before executing non-idempotent operations.
5. Verifies each important action with live telemetry.
6. Provides an omnipresent **STOP OMEGA / HALT** emergency abort mechanism.

---

## 2. Core Functional Modules & Screens

### 1. Home Dashboard
- **Living Vector Field**: Concentric orbital resonance rings that respond to active AI states (`IDLE`, `PLANNING`, `EXECUTING`, `COMPLETED`, `STOPPED`).
- **Telemetry Ticker**: Live monitoring of CPU, RAM, GPU, network bandwidth, and inference latency with subtle real-time jitter.
- **Autonomous Execution Track**: Active multi-step command progression with trace IDs, parser tags, and payload metrics.
- **Active Target Session**: Real-time virtual sandbox browser view demonstrating live DOM data extraction from TechPowerUp.
- **Hardware Diagnostics & Daemons**: Sparkline load curves and daemon ports.
- **Quick Dispatch & Contextual Memory**: High-relevance vector hits linked to local markdown specs, Slack logs, and code files.

### 2. Computer Control
- **Simulated Operating System Viewport**: High-resolution virtual desktop viewport (`Display 1 (2560 × 1600 @ 120Hz Retina)`).
- **Synthetic Hardware Virtual Driver**: Interpolated Bezier mouse cursor pathing with real-time `(X, Y)` coordinate telemetry and click-state flags.
- **Controlled Environment Matrix**: Hooked process manager for Google Chrome, Visual Studio Code, Spotify Connect, and Figma Desktop.
- **Interactive Manual Takeover**: Toggle takeover mode to gain direct mouse and click interaction over the virtual canvas.
- **Authorization Scope & Guardrails**: Strict Tier 2 sandbox enforcement with toggles for file write confirmations and emergency abort.

### 3. Automations & Spell Engine
- **Visual Node Graph Canvas**: Connected flow nodes rendered with animated SVG laser signal paths and pulsing data packets.
- **Multi-Type Nodes**: Cron Triggers, System Shell Actions, AI Cognition (Gemini 1.5 Pro token streaming), Audio Engines (Spotify Connect), and Companion Speech Output.
- **Node Configuration Drawer**: Switch foundation engines (Gemini 1.5 Pro 2M, Flash, Llama-3 70B), adjust prompt templates with variable interpolation (`{git_diff}`, `{pr_logs}`), set timeouts, and test isolated nodes.
- **Preset Workflow Archive**: Pre-configured chains for Focus Mode, Design-to-Social Content Engines, and Midnight System Sanitation.

### 4. Creative Studio
- **Multi-Modal Orchestrator**: Integrated tool states for Gemini 1.5 Pro, Imagen 3, and Vector Engine.
- **Kinetic Poster Canvas**: Generative SVG geometric wireframes paired with Swiss typography (*SYNAPSE — Artificial Horizons*), zoom controls, and CMYK prepress validation.
- **Prompt Orchestration Deck**: Latent diffusion prompt editor with reference asset chips (`brand_guide.pdf`, `#B7FF72 Mint`), detail refinement, and remix triggers.
- **Revision Carousel**: Live switching between generated variations (`VAR_01.svg` through `VAR_04.svg`).
- **Design Token & Layer Inspector**: Real-time color swatches, typography pairing specifications, and scene layer tree with visibility and lock controls.

### 5. Contextual Memory
- Persistent local memory database with categorized slots (`preference`, `project`, `doc`, `slack`, `code`).
- Full search query filtering, manual context addition, and "Forget" deletion actions.

### 6. Secure Filesystem
- Approved sandbox directory explorer (`~/Developer/workspace/`).
- Inspect file metadata, read contents, create new files, and delete items with confirmation gates.

### 7. Tools & Security Registry
- Modular tool registry covering 10 capability domains: Filesystem, Browser, Computer Control, Terminal, Applications, Web Research, Vision, Voice, Creative Studio, and Document Generation.
- Zero-Trust Execution Pipeline diagram and handshake diagnostic ping buttons.

### 8. System Activity Timeline
- Chronological event audit log with severity badges, trace IDs, and category filters.

### 9. Neural Voice Interface
- Speech-to-Text and Text-to-Speech engine with audio-reactive frequency waveform bars, speech recognition state transitions (`LISTENING`, `PROCESSING`, `SPEAKING`), and tactile interrupt controls.

---

## 3. Technology Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4 with custom design tokens matching the OMEGA Living Operating Layer specification
- **Audio Synthesis**: Web Audio API oscillator synthesis for tactile sci-fi feedback (zero external audio files)
- **Speech**: Web Speech API (`SpeechRecognition` + `SpeechSynthesis`)
- **Icons & Typography**: Material Symbols Outlined, Geist, JetBrains Mono
- **Unit Testing**: Native Node.js test runner (`node:test`, `node:assert/strict`)

---

## 4. Setup & Running

### Prerequisites
- Node.js 20+ or 22+
- npm or pnpm

### Development
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` to interact with OMEGA.

### Running Unit Tests
```bash
node --test src/utils/omegaLogic.test.ts
```

### Production Build
```bash
npm run build
```

---

## 5. Security & Safety Model

1. **Least Privilege**: The AI engine never directly invokes raw OS shell or filesystem APIs. Every request routes through `AI Intent Request → Permission Gate → Tool Execution → Verification`.
2. **High-Risk Blocklist**: Destructive commands (`rm -rf`, `mkfs`, `dd`, `sudo`, `chmod 777`, `reboot`, access to `.env` or `.ssh`) are automatically flagged as High Risk and require explicit operator authorization.
3. **Global Emergency Abort**: Clicking `HALT / STOP OMEGA` in the header or `Emergency Abort` in Computer Control immediately severs all synthetic virtual pipes and pauses automation.
