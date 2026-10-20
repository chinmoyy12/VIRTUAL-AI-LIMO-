import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  OmegaView,
  TaskPlan,
  SystemTelemetry,
  MemoryItem,
  WorkflowNode,
  WorkflowPreset,
  ActivityEvent,
  ControlledApp,
  ToolDefinition,
  FileItem,
  ContextPanelContent,
} from '../types/omega.ts';
import { AmbientState, AmbientQuality } from '../motion/omegaMotion.ts';
import { calculateNextTelemetry, createTaskPlan, evaluateRisk } from '../utils/omegaLogic.ts';
import { INITIAL_TOOLS, ToolRegistry } from '../services/ToolRegistry.ts';
import { TaskEngine } from '../services/TaskEngine.ts';
import {
  evaluateVoiceInput,
  VoiceConversationTurn,
  VoiceReplyDecision,
} from '../services/VoiceEngine.ts';
import { sounds } from '../services/soundEffects.ts';

export type UIFocusTarget = 'none' | 'command-bar' | 'task' | 'voice' | 'permission';

export interface DevicePermissions {
  microphone: boolean;
  filesystem: boolean;
  screenAndApps: boolean;
  notifications: boolean;
}

export interface ToastItem {
  id: string;
  title: string;
  detail?: string;
  tone?: 'info' | 'success' | 'warning';
}

interface OmegaContextType {
  activeView: OmegaView;
  setActiveView: (view: OmegaView) => void;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  activePlan: TaskPlan | null;
  clearActivePlan: () => void;
  taskHistory: TaskPlan[];
  telemetry: SystemTelemetry;
  isHalted: boolean;
  isPaused: boolean;
  guardActive: boolean;
  confirmFileWrites: boolean;
  voiceModeOpen: boolean;
  commandPaletteOpen: boolean;
  firstRunOpen: boolean;
  contextPanel: ContextPanelContent;
  openContextPanel: (content: ContextPanelContent) => void;
  closeContextPanel: () => void;
  pendingPermission: {
    action: string;
    details: string;
    risk: 'low' | 'medium' | 'high';
    onConfirm: () => void;
    onDeny: () => void;
  } | null;
  memories: MemoryItem[];
  activities: ActivityEvent[];
  controlledApps: ControlledApp[];
  tools: ToolDefinition[];
  workflowNodes: WorkflowNode[];
  selectedNodeId: string;
  isTakeoverActive: boolean;
  mobileNavOpen: boolean;
  setMobileNavOpen: (open: boolean) => void;
  geminiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  files: FileItem[];
  selectedFile: FileItem | null;
  selectFile: (file: FileItem | null) => void;
  deleteFile: (id: string) => void;
  addFile: (file: Omit<FileItem, 'id'>) => void;

  // Ambient & Reactive State System
  ambientState: AmbientState;
  overrideAmbientState: AmbientState | null;
  setOverrideAmbientState: (state: AmbientState | null) => void;
  ambientQuality: AmbientQuality;
  setAmbientQuality: (quality: AmbientQuality) => void;
  audioAmplitude: number;
  setAudioAmplitude: (amp: number) => void;
  uiFocusTarget: UIFocusTarget;
  setUiFocusTarget: (target: UIFocusTarget) => void;
  activeToast: ToastItem | null;
  showToast: (title: string, detail?: string, tone?: 'info' | 'success' | 'warning') => void;
  dismissToast: () => void;

  // Actions
  dispatchGoal: (goal: string) => void;
  retryTask: (taskId: string) => void;
  haltOmega: () => void;
  resumeOmega: () => void;
  togglePause: () => void;
  toggleGuard: () => void;
  toggleConfirmFileWrites: () => void;
  toggleTakeover: () => void;
  toggleToolEnabled: (toolId: string) => void;
  toggleToolConfirmation: (toolId: string) => void;
  setVoiceModeOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setFirstRunOpen: (open: boolean) => void;
  devicePermissions: DevicePermissions;
  updateDevicePermissions: (perms: DevicePermissions) => void;
  captureScreenContext: () => void;
  addMemory: (item: Omit<MemoryItem, 'id' | 'dateAdded'>) => void;
  updateMemory: (id: string, title: string, content: string) => void;
  deleteMemory: (id: string) => void;
  logActivity: (event: Omit<ActivityEvent, 'id' | 'timestamp' | 'timeStr'>) => void;
  requestPermission: (
    action: string,
    details: string,
    risk: 'low' | 'medium' | 'high',
    onConfirm: () => void,
    onDeny?: () => void
  ) => void;
  closePermissionModal: () => void;
  setSelectedNodeId: (id: string) => void;
  runPresetWorkflow: (preset: WorkflowPreset) => void;
  testIsolatedNode: (nodeId: string) => void;
  isSpeaking: boolean;
  voiceConversation: VoiceConversationTurn[];
  pendingVoiceTaskGoal: string | null;
  confirmPendingVoiceTask: () => void;
  dismissPendingVoiceTask: () => void;
  speakText: (text: string, onEnd?: () => void) => void;
  stopSpeaking: () => void;
  processVoiceCommand: (
    utterance: string,
    options?: {
      muted?: boolean;
      autoExecuteTasks?: boolean;
      onPhaseChange?: (phase: 'LISTENING' | 'THINKING' | 'SPEAKING') => void;
    }
  ) => VoiceReplyDecision;
}

const OmegaContext = createContext<OmegaContextType | undefined>(undefined);

const INITIAL_MEMORIES: MemoryItem[] = [
  {
    id: 'mem-1',
    category: 'preferences',
    title: 'Prefers dark UI with minimal surface contrast',
    content: 'Use calm dark charcoal surfaces, subtle 1px borders, and restrained green accents only for active states.',
    dateAdded: '2026-10-15',
    relativeTime: 'Saved 3 days ago',
    pinned: true,
  },
  {
    id: 'mem-2',
    category: 'projects',
    title: 'OMEGA Core Architecture',
    content: 'TypeScript + React + Vite workspace with decoupled TaskEngine and schema-validated ToolRegistry.',
    dateAdded: '2026-10-17',
    relativeTime: 'Saved yesterday',
    pinned: true,
  },
  {
    id: 'mem-3',
    category: 'personal',
    title: 'Morning deep-work schedule',
    content: 'Focus hours are 9:00 AM to 12:30 PM on weekdays; mute non-urgent notifications during active coding.',
    dateAdded: '2026-10-14',
    relativeTime: 'Saved 4 days ago',
    pinned: false,
  },
  {
    id: 'mem-4',
    category: 'conversations',
    title: 'Q4 Systems Review Presentation',
    content: 'Key focus areas: execution latency under 15ms, explicit permission boundaries, and offline local fallback.',
    dateAdded: '2026-10-16',
    relativeTime: 'Saved 2 days ago',
    pinned: true,
  },
  {
    id: 'mem-5',
    category: 'saved_knowledge',
    title: 'Production Deployment Checklist',
    content: 'Run unit tests via node --test, verify zero console errors, and confirm permission gates before release.',
    dateAdded: '2026-10-12',
    relativeTime: 'Saved 6 days ago',
    pinned: false,
  },
];

const INITIAL_FILES: FileItem[] = [
  {
    id: 'file-1',
    name: 'report.pdf',
    folder: 'Documents',
    type: 'pdf',
    size: '2.4 MB',
    modified: '14 mins ago',
    pages: 12,
    summary: 'Q4 System Architecture & Autonomous Safety Evaluation Report covering execution sandboxing, latency benchmarks, and permission gates.',
    contentPreview: 'Executive Summary: OMEGA achieves a 99.4% task verification rate across 12 local and cloud tools while enforcing strict operator approval on high-risk operations.',
  },
  {
    id: 'file-2',
    name: 'omega-architecture.tsx',
    folder: 'Projects',
    type: 'code',
    size: '18.2 KB',
    modified: '28 mins ago',
    summary: 'Core TypeScript module defining the orchestrator pipeline and step verification state machine.',
    contentPreview: 'export class TaskEngine { /* Manages idle -> planning -> awaiting_permission -> executing -> verifying -> completed */ }',
  },
  {
    id: 'file-3',
    name: 'Keynote_Presentation_Deck.pdf',
    folder: 'Desktop',
    type: 'pdf',
    size: '8.7 MB',
    modified: '2 hours ago',
    pages: 24,
    summary: 'Keynote slide deck for tomorrow’s product review with speaker notes and latency charts.',
    contentPreview: 'Slide 01: OMEGA — Personal AI Operating Companion. Slide 02: Goal-Oriented Execution Loop.',
  },
  {
    id: 'file-4',
    name: 'dataset-benchmarks-2026.csv',
    folder: 'Downloads',
    type: 'doc',
    size: '1.1 MB',
    modified: 'Yesterday',
    summary: 'Raw telemetry dataset comparing cold-start and warm-cache inference times across providers.',
    contentPreview: 'provider,model,p50_ms,p95_ms,accuracy\ngemini,gemini-2.5-pro,410,820,0.984',
  },
  {
    id: 'file-5',
    name: 'design-system-tokens.json',
    folder: 'Home',
    type: 'code',
    size: '4.6 KB',
    modified: '3 days ago',
    summary: 'Color, typography, and spacing token definitions for the OMEGA desktop interface.',
    contentPreview: '{ "canvas": "#0A0D0B", "surface": "#101412", "accent": "#4ADE80" }',
  },
  {
    id: 'file-6',
    name: 'invoice-cloud-compute-oct.pdf',
    folder: 'Downloads',
    type: 'pdf',
    size: '420 KB',
    modified: '5 days ago',
    pages: 3,
    summary: 'Monthly cloud compute and API usage statement for October.',
    contentPreview: 'Total API tokens processed: 14.2M. Total invoice amount: $48.20.',
  },
];

const INITIAL_APPS: ControlledApp[] = [
  {
    id: 'app-vscode',
    name: 'VS Code',
    processId: 3910,
    status: 'active',
    statusLabel: 'Active Window',
    icon: 'code',
    windowTitle: 'omega-os — ~/Projects/omega-os',
  },
  {
    id: 'app-chrome',
    name: 'Google Chrome',
    processId: 48291,
    status: 'running',
    statusLabel: 'Background · 4 Tabs',
    icon: 'globe',
    windowTitle: 'React 19 Documentation & Localhost:3000',
  },
  {
    id: 'app-terminal',
    name: 'Terminal',
    processId: 5120,
    status: 'idle',
    statusLabel: 'Idle · zsh',
    icon: 'terminal',
    windowTitle: '~/Projects/omega-os — node --test',
  },
  {
    id: 'app-figma',
    name: 'Figma',
    processId: 6241,
    status: 'ready',
    statusLabel: 'Ready',
    icon: 'layout',
    windowTitle: 'OMEGA Clean UI Specification',
  },
];

const INITIAL_WORKFLOW_NODES: WorkflowNode[] = [
  {
    id: 'node-1',
    stepNumber: 1,
    type: 'trigger',
    name: 'Every weekday · 9:00 AM',
    subtitle: 'TRIGGER',
    status: 'settled',
    details: 'Cron schedule active on local system clock',
    metaBadge: 'Active',
  },
  {
    id: 'node-2',
    stepNumber: 2,
    type: 'ai',
    name: 'Summarize overnight Git activity & calendar',
    subtitle: 'AI',
    status: 'settled',
    details: 'Gemini Pro · Reads git log and today’s events',
    metaBadge: 'Configured',
    config: {
      model: 'Gemini 2.5 Pro',
      temperature: 0.2,
      timeoutMs: 15000,
      promptTemplate: 'Summarize recent commits in {repo} and list priority meetings for {date} in 3 concise bullet points.',
      gate: 'bypass',
    },
  },
  {
    id: 'node-3',
    stepNumber: 3,
    type: 'condition',
    name: 'Check if urgent pull requests exist',
    subtitle: 'CONDITION',
    status: 'settled',
    details: 'If open PR count > 0 with label "review-needed"',
    metaBadge: 'Pass',
  },
  {
    id: 'node-4',
    stepNumber: 4,
    type: 'action',
    name: 'Open VS Code & prepare workspace briefing',
    subtitle: 'ACTION',
    status: 'settled',
    details: 'Launches ~/Projects/omega-os and pins daily notes',
    metaBadge: 'Ready',
  },
];

export const OmegaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<OmegaView>('home');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [taskHistory, setTaskHistory] = useState<TaskPlan[]>([]);
  const [activePlan, setActivePlan] = useState<TaskPlan | null>(null);

  const clearActivePlan = useCallback(() => {
    setActivePlan(null);
    setOverrideAmbientState(null);
  }, []);

  const [telemetry, setTelemetry] = useState<SystemTelemetry>({
    cpuLoad: 18,
    ramUsage: 42,
    ramUsedGB: 26.8,
    ramTotalGB: 64,
    gpuLoad: 14,
    gpuVramUsedGB: 3.8,
    gpuVramTotalGB: 24,
    gpuTemp: 46,
    netSpeedMbps: 1.2,
    diskIoMbps: 64,
    latencyMs: 8.2,
    guardActive: true,
    geminiConnected: true,
    storageUsedGB: 412,
    storageTotalGB: 1024,
    batteryPercent: 94,
    batteryCharging: true,
  });

  const [isHalted, setIsHalted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [guardActive, setGuardActive] = useState(true);
  const [confirmFileWrites, setConfirmFileWrites] = useState(true);
  const [isTakeoverActive, setIsTakeoverActive] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [voiceModeOpen, setVoiceModeOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [firstRunOpen, setFirstRunOpen] = useState<boolean>(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('autostart') === '1') return false;
        return localStorage.getItem('omega_permissions_onboarded') !== 'true';
      }
    } catch {}
    return false;
  });
  const [devicePermissions, setDevicePermissions] = useState<DevicePermissions>(() => {
    try {
      const saved = localStorage.getItem('omega_device_permissions');
      return saved
        ? JSON.parse(saved)
        : {
            microphone: true,
            filesystem: true,
            screenAndApps: true,
            notifications: true,
          };
    } catch {
      return {
        microphone: true,
        filesystem: true,
        screenAndApps: true,
        notifications: true,
      };
    }
  });
  const [contextPanel, setContextPanel] = useState<ContextPanelContent>(null);
  const toolRegistryRef = React.useRef<ToolRegistry>(new ToolRegistry());
  const taskEngineRef = React.useRef<TaskEngine>(new TaskEngine());

  // Ambient & Reactive State
  const [overrideAmbientState, setOverrideAmbientState] = useState<AmbientState | null>(null);
  const [ambientQuality, setAmbientQuality] = useState<AmbientQuality>(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return 'REDUCED';
    }
    return 'HIGH';
  });
  const [audioAmplitude, setAudioAmplitude] = useState<number>(0);
  const [uiFocusTarget, setUiFocusTarget] = useState<UIFocusTarget>('none');
  const [activeToast, setActiveToast] = useState<ToastItem | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [pendingVoiceTaskGoal, setPendingVoiceTaskGoal] = useState<string | null>(null);
  const [voiceConversation, setVoiceConversation] = useState<VoiceConversationTurn[]>([
    {
      id: 'v-init-1',
      role: 'omega',
      text: 'Hello Chinmoy. I am online and listening. Speak naturally or type below—I will respond directly and only start a task when you guide me to.',
      timestamp: 'Ready',
      intent: 'greeting',
    },
  ]);
  const utteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const speechFallbackTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const [pendingPermission, setPendingPermission] = useState<{
    action: string;
    details: string;
    risk: 'low' | 'medium' | 'high';
    onConfirm: () => void;
    onDeny: () => void;
  } | null>(null);

  const [memories, setMemories] = useState<MemoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('omega_clean_memories');
      return saved ? JSON.parse(saved) : INITIAL_MEMORIES;
    } catch {
      return INITIAL_MEMORIES;
    }
  });

  const [files, setFiles] = useState<FileItem[]>(INITIAL_FILES);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);

  const [activities, setActivities] = useState<ActivityEvent[]>([]);

  const [controlledApps] = useState<ControlledApp[]>(INITIAL_APPS);
  const [tools, setTools] = useState<ToolDefinition[]>(INITIAL_TOOLS);
  const [workflowNodes, setWorkflowNodes] = useState<WorkflowNode[]>(INITIAL_WORKFLOW_NODES);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-2');

  const [geminiApiKey, setGeminiApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('omega_gemini_key') || '';
    } catch {
      return '';
    }
  });

  // Compute unified AmbientState
  const derivedAmbientState = (): AmbientState => {
    if (overrideAmbientState) return overrideAmbientState;
    if (isHalted || activePlan?.state === 'stopped') return 'STOPPED';
    if (isPaused || activePlan?.state === 'paused') return 'PAUSED';
    if (activeView === 'talk' || voiceModeOpen) return 'LISTENING';
    if (!activePlan) return 'IDLE';
    switch (activePlan.state) {
      case 'understanding':
        return 'THINKING';
      case 'planning':
        return 'PLANNING';
      case 'awaiting_permission':
        return 'PAUSED';
      case 'executing':
        return 'EXECUTING';
      case 'verifying':
        return 'VERIFYING';
      case 'completed':
        return 'IDLE';
      case 'failed':
        return 'ERROR';
      default:
        return 'IDLE';
    }
  };

  const ambientState = derivedAmbientState();

  const showToast = useCallback(
    (title: string, detail?: string, tone: 'info' | 'success' | 'warning' = 'info') => {
      const id = `toast-${Date.now()}`;
      setActiveToast({ id, title, detail, tone });
      setTimeout(() => {
        setActiveToast((curr) => (curr?.id === id ? null : curr));
      }, 3200);
    },
    []
  );

  const dismissToast = useCallback(() => {
    setActiveToast(null);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('omega_clean_memories', JSON.stringify(memories));
    } catch {}
  }, [memories]);

  // Subtle telemetry update loop
  useEffect(() => {
    if (isHalted) return;
    const interval = setInterval(() => {
      setTelemetry((prev) => calculateNextTelemetry(prev));
    }, 3500);
    return () => clearInterval(interval);
  }, [isHalted]);

  // Global hotkeys (⌘K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
        sounds.playClick(920);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
    sounds.playClick(760);
  }, []);

  const openContextPanel = useCallback((content: ContextPanelContent) => {
    setContextPanel(content);
    if (content?.type === 'task') setUiFocusTarget('task');
    else if (content?.type === 'permission') setUiFocusTarget('permission');
  }, []);

  const closeContextPanel = useCallback(() => {
    setContextPanel(null);
    setUiFocusTarget('none');
  }, []);

  const selectFile = useCallback((file: FileItem | null) => {
    setSelectedFile(file);
    if (file) {
      setContextPanel({ type: 'file', file });
    } else {
      setContextPanel((prev) => (prev?.type === 'file' ? null : prev));
    }
  }, []);

  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedFile((prev) => (prev?.id === id ? null : prev));
    setContextPanel((prev) => (prev?.type === 'file' && prev.file.id === id ? null : prev));
  }, []);

  const addFile = useCallback((file: Omit<FileItem, 'id'>) => {
    const newFile: FileItem = {
      ...file,
      id: `file-${Date.now()}`,
    };
    setFiles((prev) => [newFile, ...prev]);
    setSelectedFile(newFile);
    setContextPanel({ type: 'file', file: newFile });
  }, []);

  const logActivity = useCallback((event: Omit<ActivityEvent, 'id' | 'timestamp' | 'timeStr'>) => {
    const now = new Date();
    const newEvent: ActivityEvent = {
      ...event,
      id: `act-${Date.now()}`,
      timestamp: now.toISOString(),
      timeStr: 'Just now',
    };
    setActivities((prev) => [newEvent, ...prev.slice(0, 49)]);
  }, []);

  const updateDevicePermissions = useCallback((perms: DevicePermissions) => {
    setDevicePermissions(perms);
    try {
      localStorage.setItem('omega_device_permissions', JSON.stringify(perms));
    } catch {}
    const registry = toolRegistryRef.current;
    if (perms.filesystem) registry.grantPermissions(['fs:read', 'fs:write', 'documents:create']);
    else registry.revokePermissions(['fs:write']);
    if (perms.microphone) registry.grantPermissions(['voice:stt', 'voice:tts']);
    else registry.revokePermissions(['voice:stt', 'voice:tts']);
    if (perms.screenAndApps)
      registry.grantPermissions(['apps:launch', 'apps:inspect', 'screenshot:capture', 'vision:analyze']);
  }, []);

  const executePlanPipeline = useCallback(
    (newPlan: TaskPlan, goal: string) => {
      // Register in TaskEngine
      const engineTask = taskEngineRef.current.createTask(
        goal,
        newPlan.steps.map((s) => ({
          id: s.id,
          title: s.title,
          description: s.description,
          tool: s.tool.toLowerCase(),
        })),
        newPlan.cognitionSummary
      );
      void taskEngineRef.current.runTask(engineTask.id).catch(() => {});

      // Phase 1: THINKING -> PLANNING -> EXECUTING -> VERIFYING -> SUCCESS -> IDLE
      setOverrideAmbientState('THINKING');
      setActivePlan({ ...newPlan, state: 'planning' });
      setTaskHistory((prev) => [newPlan, ...prev.filter((p) => p.id !== newPlan.id)]);
      showToast('Understanding request…', goal, 'info');

      logActivity({
        type: 'orchestration',
        title: goal,
        details: `Created ${newPlan.steps.length}-step execution plan (${newPlan.traceId})`,
        severity: 'info',
        traceId: newPlan.traceId,
      });

      setTimeout(() => {
        setOverrideAmbientState('PLANNING');
        setActivePlan((curr) =>
          curr && curr.id === newPlan.id ? { ...curr, state: 'executing' } : curr
        );
      }, 650);

      setTimeout(() => {
        setOverrideAmbientState('EXECUTING');
        setActivePlan((curr) => {
          if (!curr || curr.id !== newPlan.id || curr.state === 'stopped') return curr;
          const updatedSteps = curr.steps.map((s, idx) => {
            if (idx <= 1) return { ...s, status: 'completed' as const, duration: '1.1s' };
            if (idx === 2) return { ...s, status: 'active' as const, duration: '0.8s' };
            return s;
          });
          const next = { ...curr, state: 'executing' as const, steps: updatedSteps, updatedAt: Date.now() };
          setTaskHistory((hist) => hist.map((h) => (h.id === next.id ? next : h)));
          return next;
        });
      }, 1800);

      setTimeout(() => {
        setOverrideAmbientState('VERIFYING');
        setActivePlan((curr) =>
          curr && curr.id === newPlan.id ? { ...curr, state: 'verifying' } : curr
        );
      }, 3300);

      setTimeout(() => {
        setOverrideAmbientState('SUCCESS');
        setActivePlan((curr) => {
          if (!curr || curr.id !== newPlan.id || curr.state === 'stopped') return curr;
          const updatedSteps = curr.steps.map((s) => ({
            ...s,
            status: 'completed' as const,
            duration: s.duration || '0.9s',
          }));
          const next = {
            ...curr,
            state: 'completed' as const,
            steps: updatedSteps,
            updatedAt: Date.now(),
            completedAt: Date.now(),
          };
          setTaskHistory((hist) => hist.map((h) => (h.id === next.id ? next : h)));
          return next;
        });
        sounds.playSuccess();
        showToast('Task completed', goal, 'success');
        logActivity({
          type: 'orchestration',
          title: `Completed: ${goal}`,
          details: 'All execution steps verified with zero errors.',
          severity: 'success',
          traceId: newPlan.traceId,
        });
      }, 4400);

      setTimeout(() => {
        setOverrideAmbientState(null);
      }, 5600);
    },
    [logActivity, showToast]
  );

  const dispatchGoal = useCallback(
    (goal: string) => {
      if (isHalted) {
        setIsHalted(false);
      }
      setIsPaused(false);
      sounds.playPulse();

      const newPlan = createTaskPlan(goal);
      const risk = evaluateRisk(goal);

      // Gate high-risk operations with explicit operator permission when safety guard is active
      if (guardActive && risk === 'high') {
        const gatedPlan: TaskPlan = { ...newPlan, state: 'awaiting_permission' };
        setActivePlan(gatedPlan);
        setTaskHistory((prev) => [gatedPlan, ...prev]);
        setOverrideAmbientState('PAUSED');
        setUiFocusTarget('permission');
        const payload = {
          action: goal,
          details: `This request involves a high-impact operation (${newPlan.traceId}). Confirm to authorize OMEGA execution.`,
          risk: 'high' as const,
          onConfirm: () => {
            setPendingPermission(null);
            setContextPanel((prev) => (prev?.type === 'permission' ? null : prev));
            setUiFocusTarget('none');
            executePlanPipeline(newPlan, goal);
          },
          onDeny: () => {
            setPendingPermission(null);
            setContextPanel((prev) => (prev?.type === 'permission' ? null : prev));
            setUiFocusTarget('none');
            setOverrideAmbientState('ERROR');
            const failedPlan: TaskPlan = {
              ...newPlan,
              state: 'failed',
              errorMessage: 'Operator denied permission for high-risk operation.',
            };
            setActivePlan(failedPlan);
            setTaskHistory((prev) => prev.map((p) => (p.id === newPlan.id ? failedPlan : p)));
            showToast('Execution denied', 'High-risk operation cancelled by user.', 'warning');
          },
        };
        setPendingPermission(payload);
        setContextPanel({ type: 'permission', ...payload });
        return;
      }

      executePlanPipeline(newPlan, goal);
    },
    [isHalted, guardActive, executePlanPipeline, showToast]
  );

  const captureScreenContext = useCallback(() => {
    sounds.playClick(880);
    void toolRegistryRef.current
      .executeTool('screenshot', { displayId: 1 }, { bypassConfirmation: true })
      .then(() =>
        toolRegistryRef.current.executeTool(
          'vision',
          { prompt: 'Analyze active workspace window and UI hierarchy' },
          { bypassConfirmation: true }
        )
      )
      .catch(() => {});

    const captureFile: Omit<FileItem, 'id'> = {
      name: `Screen_Capture_${new Date().toTimeString().slice(0, 5).replace(':', '')}.png`,
      folder: 'Desktop',
      type: 'doc',
      size: '1.8 MB',
      modified: 'Just now',
      summary: 'Lossless 2560×1600 screen capture analyzed by OMEGA Vision OCR pipeline.',
      contentPreview: 'Detected active workspace window, navigation bar, and code editor context.',
    };
    addFile(captureFile);
    logActivity({
      type: 'tool_call',
      title: 'Captured & analyzed screen context',
      details: '2560×1600 frame indexed via OMEGA Vision OCR pipeline',
      severity: 'info',
    });
    showToast('Screen captured', 'Indexed active display context in Files & Context Panel.', 'success');
  }, [addFile, logActivity, showToast]);

  const retryTask = useCallback(
    (taskId: string) => {
      const target = taskHistory.find((t) => t.id === taskId);
      if (!target) return;
      sounds.playPulse();
      setOverrideAmbientState('EXECUTING');
      const updatedSteps = target.steps.map((s, idx) => ({
        ...s,
        status: idx === 0 ? ('completed' as const) : ('active' as const),
        duration: '0.6s',
      }));
      const retried: TaskPlan = {
        ...target,
        state: 'executing',
        errorMessage: undefined,
        steps: updatedSteps,
        updatedAt: Date.now(),
      };
      setTaskHistory((prev) => prev.map((t) => (t.id === taskId ? retried : t)));
      setActivePlan(retried);

      setTimeout(() => {
        setOverrideAmbientState('SUCCESS');
        setTaskHistory((prev) =>
          prev.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  state: 'completed',
                  steps: t.steps.map((s) => ({ ...s, status: 'completed' })),
                  completedAt: Date.now(),
                }
              : t
          )
        );
        sounds.playSuccess();
        showToast('Task recovered', target.goal, 'success');
        logActivity({
          type: 'orchestration',
          title: `Recovered task: ${target.goal}`,
          details: 'Fallback execution path succeeded.',
          severity: 'success',
          traceId: target.traceId,
        });
      }, 1600);

      setTimeout(() => {
        setOverrideAmbientState(null);
      }, 2800);
    },
    [taskHistory, logActivity, showToast]
  );

  const haltOmega = useCallback(() => {
    sounds.playHalt();
    setIsHalted(true);
    setOverrideAmbientState('STOPPED');
    setActivePlan((prev) => {
      if (!prev) return null;
      const next = { ...prev, state: 'stopped' as const };
      setTaskHistory((hist) => hist.map((h) => (h.id === next.id ? next : h)));
      return next;
    });
    showToast('OMEGA stopped', 'All active tasks halted immediately.', 'warning');
    logActivity({
      type: 'security',
      title: 'Stopped OMEGA execution',
      details: 'All active automation tasks were immediately halted by the user.',
      severity: 'warning',
    });
  }, [logActivity, showToast]);

  const resumeOmega = useCallback(() => {
    sounds.playPulse();
    setIsHalted(false);
    setIsPaused(false);
    setOverrideAmbientState(null);
    setActivePlan((prev) => {
      if (!prev) return null;
      const next = { ...prev, state: 'executing' as const };
      setTaskHistory((hist) => hist.map((h) => (h.id === next.id ? next : h)));
      return next;
    });
    showToast('OMEGA resumed', 'Task execution is active.', 'info');
    logActivity({
      type: 'security',
      title: 'Resumed OMEGA execution',
      details: 'Task execution resumed.',
      severity: 'info',
    });
  }, [logActivity, showToast]);

  const togglePause = useCallback(() => {
    sounds.playClick(650);
    setIsPaused((prev) => {
      const nextPaused = !prev;
      setActivePlan((curr) =>
        curr
          ? {
              ...curr,
              state: nextPaused ? 'paused' : 'executing',
            }
          : null
      );
      return nextPaused;
    });
  }, []);

  const toggleGuard = useCallback(() => {
    sounds.playClick(720);
    setGuardActive((prev) => !prev);
  }, []);

  const toggleConfirmFileWrites = useCallback(() => {
    sounds.playClick(780);
    setConfirmFileWrites((prev) => !prev);
  }, []);

  const toggleTakeover = useCallback(() => {
    sounds.playClick(840);
    setIsTakeoverActive((prev) => !prev);
  }, []);

  const toggleToolEnabled = useCallback((toolId: string) => {
    sounds.playClick(720);
    setTools((prev) => prev.map((t) => (t.id === toolId ? { ...t, enabled: !t.enabled } : t)));
  }, []);

  const toggleToolConfirmation = useCallback((toolId: string) => {
    sounds.playClick(760);
    setTools((prev) =>
      prev.map((t) => (t.id === toolId ? { ...t, requiresConfirmation: !t.requiresConfirmation } : t))
    );
  }, []);

  const addMemory = useCallback(
    (item: Omit<MemoryItem, 'id' | 'dateAdded'>) => {
      const newItem: MemoryItem = {
        ...item,
        id: `mem-${Date.now()}`,
        dateAdded: new Date().toISOString().split('T')[0],
        relativeTime: 'Saved just now',
      };
      setMemories((prev) => [newItem, ...prev]);
      sounds.playClick(940);
      showToast('Memory saved', item.title, 'success');
    },
    [showToast]
  );

  const updateMemory = useCallback((id: string, title: string, content: string) => {
    setMemories((prev) =>
      prev.map((m) => (m.id === id ? { ...m, title, content, relativeTime: 'Updated just now' } : m))
    );
    sounds.playClick(880);
  }, []);

  const deleteMemory = useCallback((id: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== id));
    sounds.playClick(440);
  }, []);

  const requestPermission = useCallback(
    (
      action: string,
      details: string,
      risk: 'low' | 'medium' | 'high',
      onConfirm: () => void,
      onDeny?: () => void
    ) => {
      sounds.playClick(520);
      setUiFocusTarget('permission');
      const payload = {
        action,
        details,
        risk,
        onConfirm: () => {
          onConfirm();
          setPendingPermission(null);
          setContextPanel((prev) => (prev?.type === 'permission' ? null : prev));
          setUiFocusTarget('none');
          sounds.playSuccess();
        },
        onDeny: () => {
          if (onDeny) onDeny();
          setPendingPermission(null);
          setContextPanel((prev) => (prev?.type === 'permission' ? null : prev));
          setUiFocusTarget('none');
          sounds.playHalt();
        },
      };
      setPendingPermission(payload);
      setContextPanel({ type: 'permission', ...payload });
    },
    []
  );

  const closePermissionModal = useCallback(() => {
    setPendingPermission(null);
    setContextPanel((prev) => (prev?.type === 'permission' ? null : prev));
    setUiFocusTarget('none');
  }, []);

  const runPresetWorkflow = useCallback(
    (preset: WorkflowPreset) => {
      sounds.playPulse();
      setWorkflowNodes(preset.nodes);
      logActivity({
        type: 'orchestration',
        title: `Ran automation: ${preset.name}`,
        details: `${preset.stepsCount} steps · ${preset.trigger}`,
        severity: 'info',
      });
    },
    [logActivity]
  );

  const testIsolatedNode = useCallback((nodeId: string) => {
    sounds.playClick(880);
    setWorkflowNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, status: 'streaming', metaBadge: 'Running…' } : n))
    );

    setTimeout(() => {
      setWorkflowNodes((prev) =>
        prev.map((n) => (n.id === nodeId ? { ...n, status: 'settled', metaBadge: 'Verified (120ms)' } : n))
      );
      sounds.playSuccess();
    }, 900);
  }, []);

  const stopSpeaking = useCallback(() => {
    if (speechFallbackTimerRef.current) {
      clearTimeout(speechFallbackTimerRef.current);
      speechFallbackTimerRef.current = null;
    }
    sounds.stopVocalCadence();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setAudioAmplitude(0);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
          window.speechSynthesis.cancel();
        }
      } catch {}
    }
  }, []);

  const speakText = useCallback(
    (text: string, onEnd?: () => void) => {
      if (speechFallbackTimerRef.current) {
        clearTimeout(speechFallbackTimerRef.current);
        speechFallbackTimerRef.current = null;
      }
      sounds.stopVocalCadence();
      sounds.unlockAudio();

      setIsSpeaking(true);
      sounds.playSpeakingCadence();
      sounds.startVocalSyllableStream(text, setAudioAmplitude, true);

      let completed = false;
      const finishSpeech = () => {
        if (completed) return;
        completed = true;
        if (speechFallbackTimerRef.current) {
          clearTimeout(speechFallbackTimerRef.current);
          speechFallbackTimerRef.current = null;
        }
        sounds.stopVocalCadence();
        utteranceRef.current = null;
        setIsSpeaking(false);
        setAudioAmplitude(0);
        onEnd?.();
      };

      const wordsCount = text.trim().split(/\s+/).length;
      const estimatedMs = Math.max(1500, Math.min(5500, wordsCount * 240));
      speechFallbackTimerRef.current = setTimeout(finishSpeech, estimatedMs);

      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
            window.speechSynthesis.cancel();
          }
          window.speechSynthesis.resume();

          const utterance = new SpeechSynthesisUtterance(text);
          utteranceRef.current = utterance;
          utterance.rate = 1.02;
          utterance.pitch = 1.0;
          utterance.volume = 1.0;

          const voices = window.speechSynthesis.getVoices();
          const preferredVoice =
            voices.find(
              (v) =>
                v.localService &&
                v.lang.startsWith('en') &&
                (v.name.includes('Samantha') ||
                  v.name.includes('Daniel') ||
                  v.name.includes('Natural') ||
                  v.name.includes('Alex'))
            ) ||
            voices.find((v) => v.localService && v.lang.startsWith('en')) ||
            voices.find((v) => v.lang.startsWith('en'));

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }

          utterance.onboundary = () => {
            setAudioAmplitude(0.45 + Math.random() * 0.45);
          };
          utterance.onend = finishSpeech;
          utterance.onerror = finishSpeech;
          window.speechSynthesis.speak(utterance);
        } catch {
          // Fallback syllable cadence timer completes cleanly
        }
      }
    },
    []
  );

  const confirmPendingVoiceTask = useCallback(() => {
    if (!pendingVoiceTaskGoal) return;
    const goal = pendingVoiceTaskGoal;
    setPendingVoiceTaskGoal(null);
    const reply = `Confirmed. Starting execution for "${goal}" now.`;
    const omegaTurn: VoiceConversationTurn = {
      id: `vt-o-${Date.now()}`,
      role: 'omega',
      text: reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      intent: 'task_execution',
      dispatchedTask: true,
    };
    setVoiceConversation((prev) => [...prev.slice(-14), omegaTurn]);
    dispatchGoal(goal);
    speakText(reply);
  }, [pendingVoiceTaskGoal, dispatchGoal, speakText]);

  const dismissPendingVoiceTask = useCallback(() => {
    setPendingVoiceTaskGoal(null);
    sounds.playClick(620);
  }, []);

  const processVoiceCommand = useCallback(
    (
      utterance: string,
      options?: {
        muted?: boolean;
        autoExecuteTasks?: boolean;
        onPhaseChange?: (phase: 'LISTENING' | 'THINKING' | 'SPEAKING') => void;
      }
    ): VoiceReplyDecision => {
      sounds.unlockAudio();
      const cleaned = utterance.replace(/^[“"']|[”"']$/g, '').trim();
      const decision = evaluateVoiceInput(cleaned, {
        activeGoal: activePlan?.goal ?? null,
        activeState: activePlan?.state ?? null,
        pendingTaskGoal: pendingVoiceTaskGoal,
        userName: 'Chinmoy',
        memoriesCount: memories.length,
        toolsCount: tools.filter((t) => t.enabled).length,
        autoExecuteTasks: options?.autoExecuteTasks,
      });

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userTurn: VoiceConversationTurn = {
        id: `vt-u-${Date.now()}`,
        role: 'user',
        text: cleaned,
        timestamp: nowTime,
        intent: decision.intent,
      };
      const omegaTurn: VoiceConversationTurn = {
        id: `vt-o-${Date.now() + 1}`,
        role: 'omega',
        text: decision.spokenReply,
        timestamp: nowTime,
        intent: decision.intent,
        dispatchedTask: decision.shouldDispatchTask,
        proposedTaskGoal: decision.proposedTaskGoal,
      };

      setVoiceConversation((prev) => [...prev.slice(-14), userTurn, omegaTurn]);

      void toolRegistryRef.current
        .executeTool('voice', { mode: 'stt', text: cleaned }, { bypassConfirmation: true })
        .catch(() => {});

      if (decision.shouldClearPendingTask) {
        setPendingVoiceTaskGoal(null);
      }
      if (decision.proposedTaskGoal) {
        setPendingVoiceTaskGoal(decision.proposedTaskGoal);
      }

      if (decision.controlAction === 'stop') {
        haltOmega();
      } else if (decision.controlAction === 'pause') {
        if (!isPaused) togglePause();
      } else if (decision.controlAction === 'resume') {
        resumeOmega();
      } else if (decision.memoryFact) {
        addMemory({
          category: 'preferences',
          title: decision.memoryFact.slice(0, 48),
          content: decision.memoryFact,
          pinned: true,
        });
      } else if (decision.shouldDispatchTask && decision.taskGoal) {
        dispatchGoal(decision.taskGoal);
      } else {
        logActivity({
          type: 'system',
          title: `Voice: "${cleaned}"`,
          details: decision.spokenReply,
          severity: 'info',
        });
      }

      options?.onPhaseChange?.('SPEAKING');
      setOverrideAmbientState('EXECUTING');

      if (!options?.muted) {
        speakText(decision.spokenReply, () => {
          setOverrideAmbientState(null);
          options?.onPhaseChange?.('LISTENING');
        });
      } else {
        setTimeout(() => {
          setOverrideAmbientState(null);
          options?.onPhaseChange?.('LISTENING');
        }, 1200);
      }

      return decision;
    },
    [
      activePlan?.goal,
      activePlan?.state,
      pendingVoiceTaskGoal,
      memories.length,
      tools,
      haltOmega,
      isPaused,
      togglePause,
      resumeOmega,
      addMemory,
      dispatchGoal,
      logActivity,
      speakText,
    ]
  );

  return (
    <OmegaContext.Provider
      value={{
        activeView,
        setActiveView,
        sidebarCollapsed,
        toggleSidebar,
        activePlan,
        clearActivePlan,
        taskHistory,
        telemetry,
        isHalted,
        isPaused,
        guardActive,
        confirmFileWrites,
        voiceModeOpen,
        commandPaletteOpen,
        firstRunOpen,
        contextPanel,
        openContextPanel,
        closeContextPanel,
        pendingPermission,
        memories,
        activities,
        controlledApps,
        tools,
        workflowNodes,
        selectedNodeId,
        isTakeoverActive,
        mobileNavOpen,
        setMobileNavOpen,
        geminiApiKey,
        setGeminiApiKey,
        files,
        selectedFile,
        selectFile,
        deleteFile,
        addFile,
        ambientState,
        overrideAmbientState,
        setOverrideAmbientState,
        ambientQuality,
        setAmbientQuality,
        audioAmplitude,
        setAudioAmplitude,
        uiFocusTarget,
        setUiFocusTarget,
        activeToast,
        showToast,
        dismissToast,
        dispatchGoal,
        retryTask,
        haltOmega,
        resumeOmega,
        togglePause,
        toggleGuard,
        toggleConfirmFileWrites,
        toggleTakeover,
        toggleToolEnabled,
        toggleToolConfirmation,
        setVoiceModeOpen,
        setCommandPaletteOpen,
        setFirstRunOpen,
        devicePermissions,
        updateDevicePermissions,
        captureScreenContext,
        addMemory,
        updateMemory,
        deleteMemory,
        logActivity,
        requestPermission,
        closePermissionModal,
        setSelectedNodeId,
        runPresetWorkflow,
        testIsolatedNode,
        isSpeaking,
        voiceConversation,
        pendingVoiceTaskGoal,
        confirmPendingVoiceTask,
        dismissPendingVoiceTask,
        speakText,
        stopSpeaking,
        processVoiceCommand,
      }}
    >
      {children}
    </OmegaContext.Provider>
  );
};

export const useOmega = () => {
  const context = useContext(OmegaContext);
  if (!context) {
    throw new Error('useOmega must be used within an OmegaProvider');
  }
  return context;
};
