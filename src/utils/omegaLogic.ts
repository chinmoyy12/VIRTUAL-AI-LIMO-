/**
 * OMEGA OS - Pure Logic & Domain Functions
 * Decoupled for fast, deterministic unit testing and runtime execution.
 */

import type { TaskPlan, TaskStep, RiskLevel, SystemTelemetry } from '../types/omega.ts';

/**
 * Clamps a number between min and max bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Interpolates variables in a prompt template like {git_diff} or {pr_logs}.
 */
export function interpolatePrompt(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = `{${key}}`;
    result = result.split(placeholder).join(value);
  }
  return result;
}

/**
 * Evaluates the safety risk level of a terminal command.
 * Strictly prevents unconfirmed execution of high-risk operations.
 */
export function evaluateRisk(command: string): RiskLevel {
  const cleanCmd = command.trim().toLowerCase();
  
  // High risk triggers
  const highRiskPatterns = [
    /\brm\b/i,
    /\bdel\b/i,
    /\bformat\b/i,
    /\bmkfs\b/i,
    /\bdd\b/i,
    /\bsudo\b/i,
    /\bchmod\s+777\b/i,
    /\bchown\b/i,
    /\bkillall\b/i,
    /\bshutdown\b/i,
    /\breboot\b/i,
    />\s*\/dev\//i,
    /\bcurl\b.*\|\s*sh\b/i,
    /\bwget\b.*\|\s*sh\b/i,
    /\.ssh\b/i,
    /\.env\b/i,
  ];

  for (const pattern of highRiskPatterns) {
    if (pattern.test(cleanCmd)) {
      return 'high';
    }
  }

  // Medium risk triggers
  const mediumRiskPatterns = [
    /\bnpm\s+(i|install|update|publish)\b/i,
    /\bpip\s+install\b/i,
    /\bgit\s+(clone|push|reset|checkout\s+-f)\b/i,
    /\bdocker\s+(run|rm|prune)\b/i,
    /\bmake\b/i,
    /\bcargo\s+install\b/i,
  ];

  for (const pattern of mediumRiskPatterns) {
    if (pattern.test(cleanCmd)) {
      return 'medium';
    }
  }

  return 'low';
}

/**
 * Formats milliseconds to concise telemetry string (e.g. 420ms, 1.8s).
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Calculates subtle jitter for living telemetry gauges within safe boundaries.
 */
export function calculateNextTelemetry(prev: SystemTelemetry, seedJitter = 0.5): SystemTelemetry {
  const jitter = (Math.random() - 0.5) * seedJitter * 2;
  const cpu = clamp(Math.round(prev.cpuLoad + jitter * 2), 12, 78);
  const ram = clamp(Math.round(prev.ramUsage + jitter * 0.5), 38, 62);
  const gpu = clamp(Math.round(prev.gpuLoad + jitter * 1.5), 10, 85);
  const net = clamp(Number((prev.netSpeedMbps + jitter * 0.1).toFixed(1)), 0.8, 2.4);
  const disk = clamp(Math.round(prev.diskIoMbps + jitter * 5), 30, 240);
  const latency = clamp(Number((prev.latencyMs + (Math.random() - 0.45) * 0.6).toFixed(1)), 4.2, 14.8);

  const ramUsed = Number(((ram / 100) * prev.ramTotalGB).toFixed(1));
  const gpuUsed = Number(((gpu / 100) * prev.gpuVramTotalGB).toFixed(1));

  return {
    ...prev,
    cpuLoad: cpu,
    ramUsage: ram,
    ramUsedGB: ramUsed,
    gpuLoad: gpu,
    gpuVramUsedGB: gpuUsed,
    netSpeedMbps: net,
    diskIoMbps: disk,
    latencyMs: latency,
  };
}

/**
 * Creates a structured execution plan from a user's natural language goal.
 */
export function createTaskPlan(goal: string): TaskPlan {
  const goalLower = goal.toLowerCase();
  const traceId = `#${Math.floor(1000 + Math.random() * 9000)}-${['XF', 'AL', 'OM', 'NX'][Math.floor(Math.random() * 4)]}`;

  let steps: TaskStep[] = [];
  let cognitionSummary = '';

  if (goalLower.includes('rtx 5090') || goalLower.includes('gpu') || goalLower.includes('hardware')) {
    cognitionSummary = 'Deconstructing prompt across 4 synchronous execution vectors. Target memory allocated: 384 MB. Routing query to Gemini Pro & Chromium sandbox.';
    steps = [
      {
        id: 's1',
        index: 1,
        title: '01 — Query Web Knowledge (Gemini Pro)',
        tool: 'web',
        description: 'Extracted 14 whitepaper citations • Synthesized Blackwell microarchitecture diffs',
        status: 'completed',
        duration: '420ms',
      },
      {
        id: 's2',
        index: 2,
        title: '02 — Extract Tech Specs from Chromium',
        tool: 'browser',
        description: 'Reading CUDA cores, GDDR7 memory bus bandwidth, and TDP profiles from verified database.',
        status: 'active',
        duration: '1.8s',
        metadata: {
          url: 'techpowerup.com/gpu-specs',
          parser: 'DOM_TREE_OK',
          payload: '12.4 KB',
          progress: 75,
        },
      },
      {
        id: 's3',
        index: 3,
        title: '03 — Format Slide Architecture in Keynote',
        tool: 'applications',
        description: 'Prepare presentation deck templates with parsed hardware specs.',
        status: 'queued',
      },
      {
        id: 's4',
        index: 4,
        title: '04 — Generate 3D Concept Renders',
        tool: 'creative',
        description: 'Produce high-precision die schematics using generative raytracing.',
        status: 'standby',
      },
    ];
  } else if (goalLower.includes('vs code') || goalLower.includes('folder') || goalLower.includes('testproject')) {
    cognitionSummary = 'Validating directory path ~/Developer/TestProject. Preparing isolated shell execution with verification hook.';
    steps = [
      {
        id: 's1',
        index: 1,
        title: '01 — Verify Workspace Directory Access',
        tool: 'filesystem',
        description: 'Check permission boundaries and target parent folder ~/Developer',
        status: 'completed',
        duration: '85ms',
      },
      {
        id: 's2',
        index: 2,
        title: '02 — Create Directory ~/Developer/TestProject',
        tool: 'filesystem',
        description: 'Filesystem mkdir executed and verified on local disk.',
        status: 'completed',
        duration: '120ms',
      },
      {
        id: 's3',
        index: 3,
        title: '03 — Launch Visual Studio Code with Workspace',
        tool: 'applications',
        description: 'Dispatching process launch command for VS Code targeting TestProject.',
        status: 'active',
        duration: '1.2s',
      },
      {
        id: 's4',
        index: 4,
        title: '04 — Verify Process & Window Existence',
        tool: 'computer',
        description: 'Inspect OS window table to ensure VS Code active window PID confirmed.',
        status: 'queued',
      },
    ];
  } else if (goalLower.includes('portfolio') || goalLower.includes('react') || goalLower.includes('website')) {
    cognitionSummary = 'Targeting React + Vite + Tailwind scaffolding. Generating component tree, responsive layouts, and assets.';
    steps = [
      {
        id: 's1',
        index: 1,
        title: '01 — Scaffolding React + Vite Project',
        tool: 'filesystem',
        description: 'Generating package.json, vite.config.ts, and index.html in ~/Developer/portfolio-web',
        status: 'completed',
        duration: '310ms',
      },
      {
        id: 's2',
        index: 2,
        title: '02 — Synthesizing Aesthetic UI Components',
        tool: 'creative',
        description: 'Creating Hero, Projects Grid, Kinetic Typography, and Contact Sections',
        status: 'active',
        duration: '2.4s',
        metadata: {
          progress: 60,
          tokensStreamed: 840,
          tokensTotal: 1200,
        },
      },
      {
        id: 's3',
        index: 3,
        title: '03 — Launch Dev Server on Port 5173',
        tool: 'terminal',
        description: 'Start local server and ping HTTP 200 endpoint.',
        status: 'queued',
      },
      {
        id: 's4',
        index: 4,
        title: '04 — Visual Verification via Sandbox Chrome',
        tool: 'browser',
        description: 'Open headless browser, verify DOM paint, capture thumbnail.',
        status: 'standby',
      },
    ];
  } else {
    cognitionSummary = `Deconstructing user goal into verifiable subtasks. Routing to Gemini 1.5 Pro inference engine.`;
    steps = [
      {
        id: 's1',
        index: 1,
        title: '01 — Intent Analysis & Context Retrieval',
        tool: 'web',
        description: `Queried memory vectors and system state for: "${goal}"`,
        status: 'completed',
        duration: '290ms',
      },
      {
        id: 's2',
        index: 2,
        title: '02 — Orchestrate Tool Execution Plan',
        tool: 'system',
        description: 'Executing permitted action sequence with strict safety verification.',
        status: 'active',
        duration: '1.4s',
        metadata: {
          progress: 50,
          payload: 'OK',
        },
      },
      {
        id: 's3',
        index: 3,
        title: '03 — Verify Output State & Persist',
        tool: 'filesystem',
        description: 'Checking integrity of generated artifacts and environment stability.',
        status: 'queued',
      },
      {
        id: 's4',
        index: 4,
        title: '04 — Audio & Visual Synthesis Report',
        tool: 'voice',
        description: 'Prepare concise status summary for user.',
        status: 'standby',
      },
    ];
  }

  return {
    id: `plan-${Date.now()}`,
    traceId,
    goal,
    state: 'executing',
    cognitionSummary,
    steps,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
}

/**
 * Verification check for a step execution.
 */
export function verifyStepSuccess(step: TaskStep): { verified: boolean; message: string } {
  if (step.status === 'completed') {
    return { verified: true, message: `Step "${step.title}" verified successfully.` };
  }
  if (step.status === 'failed') {
    return { verified: false, message: `Step "${step.title}" failed verification.` };
  }
  return { verified: false, message: `Step "${step.title}" is still ${step.status}.` };
}
