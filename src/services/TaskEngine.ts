/**
 * OMEGA OS - Core Task Execution Engine
 * Defines Task interfaces, TaskState lifecycle, state transition rules,
 * permission gating, step verification, and error recovery.
 */

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

export type StepStatus =
  | 'standby'
  | 'queued'
  | 'awaiting_permission'
  | 'executing'
  | 'verifying'
  | 'completed'
  | 'failed'
  | 'paused'
  | 'skipped';

export type PermissionState = 'not_required' | 'pending' | 'granted' | 'denied';

export interface EngineTaskStep {
  id: string;
  index: number;
  title?: string;
  description: string;
  tool: string;
  arguments: Record<string, unknown>;
  status: StepStatus;
  permission: PermissionState;
  result?: unknown;
  error?: string;
  timestamp: number;
  durationMs?: number;
  retryCount?: number;
  maxRetries?: number;
  isSafeRetry?: boolean;
}

export interface Task {
  id: string;
  traceId: string;
  goal: string;
  cognitionSummary?: string;
  steps: EngineTaskStep[];
  status: TaskState;
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  error?: string;
}

export type ToolExecutor = (
  tool: string,
  args: Record<string, unknown>,
  step: EngineTaskStep
) => Promise<{ result: unknown; verified?: boolean }>;

export type StepVerifier = (
  step: EngineTaskStep,
  executionResult: unknown
) => Promise<{ verified: boolean; reason?: string }>;

export type TaskEventListener = (task: Task, event: { type: string; stepId?: string; message?: string }) => void;

/**
 * Valid state transition map for the Task lifecycle.
 */
const VALID_TRANSITIONS: Record<TaskState, TaskState[]> = {
  idle: ['understanding', 'planning', 'stopped'],
  understanding: ['planning', 'failed', 'paused', 'stopped'],
  planning: ['awaiting_permission', 'executing', 'failed', 'paused', 'stopped'],
  awaiting_permission: ['executing', 'failed', 'paused', 'stopped'],
  executing: ['verifying', 'awaiting_permission', 'completed', 'failed', 'paused', 'stopped'],
  verifying: ['executing', 'completed', 'failed', 'paused', 'stopped'],
  paused: ['understanding', 'planning', 'awaiting_permission', 'executing', 'verifying', 'stopped'],
  completed: ['idle'],
  failed: ['idle', 'planning', 'executing', 'stopped'],
  stopped: ['idle', 'planning', 'executing'],
};

export class TaskEngine {
  private tasks: Map<string, Task> = new Map();
  private listeners: Set<TaskEventListener> = new Set();
  private executor: ToolExecutor;
  private verifier: StepVerifier;
  private permissionResolvers: Map<string, (granted: boolean) => void> = new Map();

  constructor(options?: { executor?: ToolExecutor; verifier?: StepVerifier }) {
    this.executor =
      options?.executor ||
      (async (_tool, args) => {
        return { result: { status: 'ok', executedArgs: args }, verified: true };
      });

    this.verifier =
      options?.verifier ||
      (async (_step, result) => {
        return { verified: result !== undefined && result !== null };
      });
  }

  /**
   * Subscribe to task lifecycle and step events.
   */
  public subscribe(listener: TaskEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(task: Task, type: string, stepId?: string, message?: string): void {
    const snapshot: Task = {
      ...task,
      steps: task.steps.map((s) => ({ ...s })),
    };
    for (const listener of this.listeners) {
      listener(snapshot, { type, stepId, message });
    }
  }

  /**
   * Validates and performs a state transition on a task.
   */
  public transitionState(taskId: string, nextState: TaskState, errorMsg?: string): Task {
    const task = this.getTaskOrThrow(taskId);
    const current = task.status;

    if (current === nextState) {
      return task;
    }

    const allowed = VALID_TRANSITIONS[current] || [];
    if (!allowed.includes(nextState)) {
      throw new Error(`Invalid task state transition from "${current}" to "${nextState}" for task ${taskId}`);
    }

    task.status = nextState;
    task.updatedAt = Date.now();
    if (errorMsg) {
      task.error = errorMsg;
    }
    if (nextState === 'completed') {
      task.completedAt = Date.now();
    }

    this.emit(task, `state:${nextState}`, undefined, errorMsg);
    return task;
  }

  /**
   * Creates and registers a new Task in the engine.
   */
  public createTask(
    goal: string,
    rawSteps: Array<{
      id?: string;
      title?: string;
      description: string;
      tool: string;
      arguments?: Record<string, unknown>;
      requiresPermission?: boolean;
      maxRetries?: number;
      isSafeRetry?: boolean;
    }>,
    cognitionSummary?: string
  ): Task {
    const now = Date.now();
    const id = `task-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const traceId = `#${Math.floor(1000 + Math.random() * 9000)}-${['XF', 'AL', 'OM', 'NX'][Math.floor(Math.random() * 4)]}`;

    const steps: EngineTaskStep[] = rawSteps.map((s, idx) => ({
      id: s.id || `step-${idx + 1}`,
      index: idx + 1,
      title: s.title || `0${idx + 1} — ${s.description.slice(0, 38)}`,
      description: s.description,
      tool: s.tool,
      arguments: s.arguments || {},
      status: idx === 0 ? 'queued' : 'standby',
      permission: s.requiresPermission ? 'pending' : 'not_required',
      timestamp: now,
      retryCount: 0,
      maxRetries: s.maxRetries ?? 1,
      isSafeRetry: s.isSafeRetry ?? true,
    }));

    const task: Task = {
      id,
      traceId,
      goal,
      cognitionSummary:
        cognitionSummary ||
        `Deconstructing goal "${goal}" across ${steps.length} execution vectors.`,
      steps,
      status: 'idle',
      createdAt: now,
      updatedAt: now,
    };

    this.tasks.set(id, task);
    this.emit(task, 'task:created');
    return task;
  }

  public getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  public getAllTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  private getTaskOrThrow(taskId: string): Task {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`Task not found: ${taskId}`);
    }
    return task;
  }

  private isTaskHaltedOrPaused(task: Task): boolean {
    return task.status === 'stopped' || task.status === 'paused';
  }

  /**
   * Runs a task through its full lifecycle:
   * understanding -> planning -> (awaiting_permission <-> executing <-> verifying) -> completed / failed
   */
  public async runTask(taskId: string): Promise<Task> {
    const task = this.getTaskOrThrow(taskId);

    if (task.status === 'idle') {
      this.transitionState(taskId, 'understanding');
      this.transitionState(taskId, 'planning');
    }

    for (let i = 0; i < task.steps.length; i++) {
      // Check if paused or stopped before starting next step
      if (this.isTaskHaltedOrPaused(task)) {
        return task;
      }

      const step = task.steps[i];
      if (step.status === 'completed' || step.status === 'skipped') {
        continue;
      }

      // Queue next step indicator
      if (task.steps[i + 1] && task.steps[i + 1].status === 'standby') {
        task.steps[i + 1].status = 'queued';
      }

      // 1. Permission Check
      if (step.permission === 'pending') {
        step.status = 'awaiting_permission';
        this.transitionState(taskId, 'awaiting_permission');
        this.emit(task, 'step:permission_required', step.id, `Permission required for ${step.tool}: ${step.description}`);

        const granted = await this.waitForPermission(taskId, step.id);
        if (this.isTaskHaltedOrPaused(task)) {
          return task;
        }

        if (!granted) {
          step.permission = 'denied';
          step.status = 'failed';
          step.error = 'Operator denied permission for sensitive operation.';
          this.transitionState(taskId, 'failed', step.error);
          return task;
        }

        step.permission = 'granted';
      } else if (step.permission === 'denied') {
        step.status = 'failed';
        step.error = 'Permission previously denied.';
        this.transitionState(taskId, 'failed', step.error);
        return task;
      }

      // 2. Execute Step with Safe Error Recovery
      const stepSuccess = await this.executeStepWithRecovery(task, step);
      if (!stepSuccess) {
        return task;
      }
    }

    // All steps completed and verified
    if (!this.isTaskHaltedOrPaused(task) && task.status !== 'failed') {
      this.transitionState(taskId, 'completed');
    }

    return task;
  }

  /**
   * Executes a single step, verifies its output, and retries safe errors if configured.
   */
  private async executeStepWithRecovery(task: Task, step: EngineTaskStep): Promise<boolean> {
    const maxAttempts = (step.maxRetries ?? 1) + 1;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (this.isTaskHaltedOrPaused(task)) {
        return false;
      }

      const startTime = Date.now();
      step.status = 'executing';
      step.timestamp = startTime;
      if (task.status !== 'executing') {
        this.transitionState(task.id, 'executing');
      }
      this.emit(task, 'step:executing', step.id);

      try {
        const execOutput = await this.executor(step.tool, step.arguments, step);

        if (this.isTaskHaltedOrPaused(task)) {
          return false;
        }

        // 3. Verify Step
        step.status = 'verifying';
        this.transitionState(task.id, 'verifying');
        this.emit(task, 'step:verifying', step.id);

        const verification = await this.verifier(step, execOutput.result);
        if (!verification.verified) {
          throw new Error(verification.reason || `Verification failed for step "${step.description}"`);
        }

        step.result = execOutput.result;
        step.error = undefined;
        step.status = 'completed';
        step.durationMs = Date.now() - startTime;
        task.updatedAt = Date.now();
        this.emit(task, 'step:completed', step.id);
        return true;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        step.error = message;
        step.durationMs = Date.now() - startTime;

        const canRetry = step.isSafeRetry !== false && attempt < maxAttempts;
        if (canRetry) {
          step.retryCount = (step.retryCount || 0) + 1;
          this.emit(
            task,
            'step:retrying',
            step.id,
            `Attempt ${attempt} failed (${message}). Retrying safe operation...`
          );
          continue;
        }

        // Unrecoverable or unsafe failure
        step.status = 'failed';
        this.transitionState(task.id, 'failed', `Step ${step.index} failed: ${message}`);
        this.emit(task, 'step:failed', step.id, message);
        return false;
      }
    }

    return false;
  }

  private waitForPermission(taskId: string, stepId: string): Promise<boolean> {
    const key = `${taskId}:${stepId}`;
    return new Promise<boolean>((resolve) => {
      this.permissionResolvers.set(key, resolve);
    });
  }

  /**
   * Grants or denies permission for a step awaiting authorization.
   */
  public resolvePermission(taskId: string, stepId: string, granted: boolean): void {
    const key = `${taskId}:${stepId}`;
    const resolver = this.permissionResolvers.get(key);
    if (resolver) {
      this.permissionResolvers.delete(key);
      resolver(granted);
    }
  }

  /**
   * Pauses an active task.
   */
  public pauseTask(taskId: string): Task {
    const task = this.getTaskOrThrow(taskId);
    if (task.status === 'completed' || task.status === 'stopped' || task.status === 'failed') {
      return task;
    }
    task.steps.forEach((s) => {
      if (s.status === 'executing' || s.status === 'verifying') {
        s.status = 'paused';
      }
    });
    return this.transitionState(taskId, 'paused');
  }

  /**
   * Resumes a paused task.
   */
  public async resumeTask(taskId: string): Promise<Task> {
    const task = this.getTaskOrThrow(taskId);
    if (task.status !== 'paused') {
      return task;
    }
    task.steps.forEach((s) => {
      if (s.status === 'paused') {
        s.status = 'queued';
      }
    });
    this.transitionState(taskId, 'executing');
    return this.runTask(taskId);
  }

  /**
   * Immediately halts a single task (Emergency Stop).
   */
  public stopTask(taskId: string, reason = 'Emergency stop triggered by operator'): Task {
    const task = this.getTaskOrThrow(taskId);
    if (task.status === 'stopped') {
      return task;
    }

    // Cancel any pending permission promises for this task
    for (const [key, resolver] of this.permissionResolvers.entries()) {
      if (key.startsWith(`${taskId}:`)) {
        this.permissionResolvers.delete(key);
        resolver(false);
      }
    }

    task.steps.forEach((s) => {
      if (s.status === 'executing' || s.status === 'verifying' || s.status === 'awaiting_permission') {
        s.status = 'paused';
      }
    });

    return this.transitionState(taskId, 'stopped', reason);
  }

  /**
   * Global Emergency Control: stops all active tasks in the engine immediately.
   */
  public stopAll(reason = 'GLOBAL STOP OMEGA TRIGGERED'): Task[] {
    const stopped: Task[] = [];
    for (const task of this.tasks.values()) {
      if (
        task.status !== 'completed' &&
        task.status !== 'stopped' &&
        task.status !== 'failed'
      ) {
        stopped.push(this.stopTask(task.id, reason));
      }
    }
    return stopped;
  }
}
