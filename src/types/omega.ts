/**
 * OMEGA OS - Types and Schema Definitions
 */

export type OmegaView =
  | 'home'
  | 'talk'
  | 'tasks'
  | 'projects'
  | 'automations'
  | 'files'
  | 'creative-studio'
  | 'memory'
  | 'activity'
  | 'tools-and-apis'
  | 'computer-control'
  | 'preferences';

export type TaskState =
  | 'idle'
  | 'understanding'
  | 'planning'
  | 'awaiting_permission'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'stopped';

export type RiskLevel = 'low' | 'medium' | 'high';

export interface TaskStep {
  id: string;
  index: number;
  title: string;
  tool: string;
  description: string;
  status: 'standby' | 'queued' | 'active' | 'completed' | 'failed' | 'paused';
  duration?: string;
  metadata?: {
    url?: string;
    parser?: string;
    payload?: string;
    progress?: number;
    tokensStreamed?: number;
    tokensTotal?: number;
    logText?: string;
  };
  permissionRequired?: boolean;
  permissionGranted?: boolean;
}

export interface TaskPlan {
  id: string;
  traceId: string;
  goal: string;
  state: TaskState;
  cognitionSummary: string;
  steps: TaskStep[];
  startedAt: number;
  updatedAt: number;
  completedAt?: number;
  errorMessage?: string;
  scheduledFor?: string;
}

export interface SystemTelemetry {
  cpuLoad: number; // 0 - 100%
  ramUsage: number; // 0 - 100%
  ramUsedGB: number;
  ramTotalGB: number;
  gpuLoad: number; // 0 - 100%
  gpuVramUsedGB: number;
  gpuVramTotalGB: number;
  gpuTemp: number; // °C
  netSpeedMbps: number;
  diskIoMbps: number;
  latencyMs: number;
  guardActive: boolean;
  geminiConnected: boolean;
  storageUsedGB?: number;
  storageTotalGB?: number;
  batteryPercent?: number;
  batteryCharging?: boolean;
}

export type MemoryCategory =
  | 'personal'
  | 'projects'
  | 'preferences'
  | 'conversations'
  | 'saved_knowledge'
  | 'doc'
  | 'slack'
  | 'code'
  | 'preference'
  | 'project';

export interface MemoryItem {
  id: string;
  category: MemoryCategory;
  title: string;
  content: string;
  similarity?: string;
  dateAdded: string;
  relativeTime?: string;
  pinned?: boolean;
}

export interface WorkflowNode {
  id: string;
  stepNumber: number;
  type: 'trigger' | 'system' | 'ai' | 'condition' | 'action' | 'audio' | 'output' | 'browser' | 'filesystem';
  name: string;
  subtitle: string;
  status: 'settled' | 'streaming' | 'running' | 'queued' | 'standby';
  details?: string;
  metaBadge?: string;
  config?: {
    model?: string;
    temperature?: number;
    timeoutMs?: number;
    promptTemplate?: string;
    gate?: 'bypass' | 'require_approval';
  };
}

export interface WorkflowPreset {
  id: string;
  name: string;
  stepsCount: number;
  category: string;
  description: string;
  trigger: string;
  scheduleLabel?: string;
  enabled?: boolean;
  nodes: WorkflowNode[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  timeStr: string;
  type: 'orchestration' | 'tool_call' | 'security' | 'memory' | 'system';
  title: string;
  details: string;
  severity: 'info' | 'success' | 'warning' | 'error';
  traceId?: string;
}

export interface ControlledApp {
  id: string;
  name: string;
  processId: number;
  status: 'active' | 'idle' | 'running' | 'ready';
  statusLabel: string;
  icon: string;
  windowTitle: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  category: 'filesystem' | 'browser' | 'computer' | 'terminal' | 'applications' | 'web' | 'vision' | 'voice' | 'documents' | 'creative';
  riskLevel: RiskLevel;
  enabled: boolean;
  requiresConfirmation: boolean;
}

export interface FileItem {
  id: string;
  name: string;
  folder: 'Home' | 'Desktop' | 'Documents' | 'Downloads' | 'Projects';
  type: 'pdf' | 'code' | 'doc' | 'image' | 'archive' | 'folder';
  size: string;
  modified: string;
  pages?: number;
  summary: string;
  contentPreview?: string;
}

export type ContextPanelContent =
  | { type: 'file'; file: FileItem }
  | { type: 'task'; plan: TaskPlan }
  | {
      type: 'permission';
      action: string;
      details: string;
      risk: RiskLevel;
      onConfirm: () => void;
      onDeny: () => void;
    }
  | null;
