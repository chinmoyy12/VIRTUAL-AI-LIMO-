/**
 * OMEGA OS - Modular Tool Registry & Permission Layer
 * Implements the Tool interface, input/output schema validation,
 * least-privilege permission checks, execution, and post-action verification.
 */

import { evaluateRisk } from '../utils/omegaLogic.ts';
import type { RiskLevel } from '../types/omega.ts';

export type ToolCategory =
  | 'filesystem'
  | 'browser'
  | 'computer'
  | 'terminal'
  | 'applications'
  | 'web'
  | 'screenshot'
  | 'vision'
  | 'voice'
  | 'documents'
  | 'creative'
  | 'system';

export type SchemaPropertyType = 'string' | 'number' | 'boolean' | 'object' | 'array';

export interface SchemaProperty {
  type: SchemaPropertyType;
  description?: string;
  enum?: Array<string | number>;
}

export interface SchemaDefinition {
  type: 'object';
  properties: Record<string, SchemaProperty>;
  required?: string[];
}

export interface ToolExecutionContext {
  callerId?: string;
  traceId?: string;
  approvedPermissions?: string[];
  bypassConfirmation?: boolean;
}

export interface VerificationResult {
  verified: boolean;
  reason?: string;
}

export interface Tool {
  name: string;
  category: ToolCategory;
  description: string;
  permissions: string[];
  inputSchema: SchemaDefinition;
  outputSchema: SchemaDefinition;
  riskLevel: RiskLevel;
  enabled?: boolean;
  execute: (
    input: Record<string, unknown>,
    context?: ToolExecutionContext
  ) => Promise<Record<string, unknown>>;
  verify: (
    input: Record<string, unknown>,
    output: Record<string, unknown>
  ) => Promise<VerificationResult>;
}

export interface PermissionRequest {
  toolName: string;
  category: ToolCategory;
  permissions: string[];
  riskLevel: RiskLevel;
  input: Record<string, unknown>;
  reason: string;
}

export type PermissionHandler = (request: PermissionRequest) => Promise<boolean>;

export interface ToolExecutionOutcome {
  toolName: string;
  output: Record<string, unknown>;
  verified: boolean;
  verificationReason?: string;
  riskLevel: RiskLevel;
  permissionGranted: boolean;
  durationMs: number;
}

/**
 * Validates a data object against a SchemaDefinition.
 */
export function validateSchema(
  schema: SchemaDefinition,
  data: Record<string, unknown>,
  label = 'Payload'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, errors: [`${label} must be a non-null object.`] };
  }

  // Check required fields
  for (const reqField of schema.required || []) {
    if (data[reqField] === undefined || data[reqField] === null) {
      errors.push(`${label} is missing required field "${reqField}".`);
    }
  }

  // Check property types and enums
  for (const [key, propSchema] of Object.entries(schema.properties)) {
    const val = data[key];
    if (val === undefined || val === null) {
      continue;
    }

    const actualType = Array.isArray(val) ? 'array' : typeof val;
    if (actualType !== propSchema.type) {
      errors.push(
        `${label} field "${key}" expected type "${propSchema.type}", but got "${actualType}".`
      );
      continue;
    }

    if (propSchema.enum && !propSchema.enum.includes(val as string | number)) {
      errors.push(
        `${label} field "${key}" value "${String(val)}" is not in allowed enum [${propSchema.enum.join(', ')}].`
      );
    }
  }

  return { valid: errors.length === 0, errors };
}

export class ToolRegistry {
  private tools: Map<string, Tool> = new Map();
  private grantedPermissions: Set<string> = new Set([
    'fs:read',
    'browser:navigate',
    'browser:read',
    'apps:inspect',
    'apps:launch',
    'web:search',
    'screenshot:capture',
    'vision:analyze',
    'voice:stt',
    'voice:tts',
    'documents:create',
    'creative:generate',
    'system:telemetry',
  ]);
  private permissionHandler?: PermissionHandler;
  private requireConfirmationForRisk: Set<RiskLevel> = new Set(['high']);

  constructor(options?: {
    registerDefaults?: boolean;
    permissionHandler?: PermissionHandler;
    initialPermissions?: string[];
  }) {
    if (options?.initialPermissions) {
      this.grantedPermissions = new Set(options.initialPermissions);
    }
    this.permissionHandler = options?.permissionHandler;

    if (options?.registerDefaults !== false) {
      this.registerDefaultTools();
    }
  }

  /**
   * Registers a new Tool into the registry.
   */
  public registerTool(tool: Tool): void {
    if (!tool.name || !tool.name.trim()) {
      throw new Error('Tool name cannot be empty.');
    }
    this.tools.set(tool.name, {
      ...tool,
      enabled: tool.enabled ?? true,
    });
  }

  public unregisterTool(name: string): boolean {
    return this.tools.delete(name);
  }

  public getTool(name: string): Tool | undefined {
    return this.tools.get(name);
  }

  public getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  public getToolsByCategory(category: ToolCategory): Tool[] {
    return this.getAllTools().filter((t) => t.category === category);
  }

  public setToolEnabled(name: string, enabled: boolean): void {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`Tool "${name}" is not registered.`);
    }
    tool.enabled = enabled;
  }

  /**
   * Permission management methods.
   */
  public setPermissionHandler(handler: PermissionHandler): void {
    this.permissionHandler = handler;
  }

  public grantPermissions(permissions: string[]): void {
    for (const perm of permissions) {
      this.grantedPermissions.add(perm);
    }
  }

  public revokePermissions(permissions: string[]): void {
    for (const perm of permissions) {
      this.grantedPermissions.delete(perm);
    }
  }

  public hasPermissions(requiredPermissions: string[], contextPermissions?: string[]): boolean {
    const combined = new Set([...this.grantedPermissions, ...(contextPermissions || [])]);
    return requiredPermissions.every((p) => combined.has(p));
  }

  /**
   * Evaluates effective risk level for a tool invocation (escalating dynamically if input is dangerous).
   */
  public evaluateEffectiveRisk(tool: Tool, input: Record<string, unknown>): RiskLevel {
    if (tool.category === 'terminal' && typeof input.command === 'string') {
      return evaluateRisk(input.command);
    }

    if (tool.category === 'filesystem' && input.operation === 'delete') {
      return 'high';
    }

    return tool.riskLevel;
  }

  /**
   * Executes a registered tool through the full security & verification pipeline:
   * AI Request -> Schema Validation -> Permission & Risk Layer -> Tool Execution -> Output Validation -> Verification
   */
  public async executeTool(
    name: string,
    input: Record<string, unknown>,
    context?: ToolExecutionContext
  ): Promise<ToolExecutionOutcome> {
    const startTime = Date.now();
    const tool = this.tools.get(name);

    if (!tool) {
      throw new Error(`Tool "${name}" not found in ToolRegistry.`);
    }

    if (tool.enabled === false) {
      throw new Error(`Tool "${name}" is currently disabled by security policy.`);
    }

    // 1. Validate Input Schema
    const inputValidation = validateSchema(tool.inputSchema, input, `Input for tool "${name}"`);
    if (!inputValidation.valid) {
      throw new Error(`Schema validation failed: ${inputValidation.errors.join(' ')}`);
    }

    // 2. Evaluate Risk & Permission Layer
    const effectiveRisk = this.evaluateEffectiveRisk(tool, input);
    const hasStaticPerms = this.hasPermissions(tool.permissions, context?.approvedPermissions);
    const needsRiskConfirmation =
      !context?.bypassConfirmation && this.requireConfirmationForRisk.has(effectiveRisk);

    let permissionGranted = hasStaticPerms && !needsRiskConfirmation;

    if (!permissionGranted) {
      if (!this.permissionHandler) {
        const missing = tool.permissions.filter((p) => !this.grantedPermissions.has(p));
        throw new Error(
          `Permission denied for tool "${name}" (risk: ${effectiveRisk}, missing permissions: [${missing.join(', ')}]).`
        );
      }

      const approvedByOperator = await this.permissionHandler({
        toolName: tool.name,
        category: tool.category,
        permissions: tool.permissions,
        riskLevel: effectiveRisk,
        input,
        reason: !hasStaticPerms
          ? `Requires elevated permissions: ${tool.permissions.join(', ')}`
          : `High-risk operation (${effectiveRisk}) requires explicit operator confirmation.`,
      });

      if (!approvedByOperator) {
        throw new Error(`Operator denied execution permission for tool "${name}".`);
      }

      permissionGranted = true;
    }

    // 3. Execute Tool
    const output = await tool.execute(input, context);

    // 4. Validate Output Schema
    const outputValidation = validateSchema(
      tool.outputSchema,
      output,
      `Output from tool "${name}"`
    );
    if (!outputValidation.valid) {
      throw new Error(`Output schema validation failed: ${outputValidation.errors.join(' ')}`);
    }

    // 5. Post-Action Verification
    const verification = await tool.verify(input, output);
    if (!verification.verified) {
      throw new Error(
        verification.reason || `Verification failed after executing tool "${name}".`
      );
    }

    return {
      toolName: tool.name,
      output,
      verified: verification.verified,
      verificationReason: verification.reason,
      riskLevel: effectiveRisk,
      permissionGranted,
      durationMs: Date.now() - startTime,
    };
  }

  /**
   * Registers the 12 core OMEGA tools across all architectural categories.
   */
  private registerDefaultTools(): void {
    // 1. Filesystem
    this.registerTool({
      name: 'filesystem',
      category: 'filesystem',
      description: 'Secure sandboxed file operations (list, read, write, mkdir, delete).',
      permissions: ['fs:read'],
      riskLevel: 'medium',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            enum: ['list', 'read', 'write', 'mkdir', 'delete'],
            description: 'Filesystem operation to perform',
          },
          path: { type: 'string', description: 'Target file or directory path' },
          content: { type: 'string', description: 'Content to write when operation is write' },
        },
        required: ['operation', 'path'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          path: { type: 'string' },
          data: { type: 'string' },
        },
        required: ['success', 'path'],
      },
      execute: async (input) => {
        return {
          success: true,
          path: String(input.path),
          data:
            input.operation === 'read'
              ? `Content of ${String(input.path)}`
              : `Completed ${String(input.operation)} on ${String(input.path)}`,
        };
      },
      verify: async (_input, output) => ({
        verified: output.success === true && typeof output.path === 'string',
      }),
    });

    // 2. Browser
    this.registerTool({
      name: 'browser',
      category: 'browser',
      description: 'Automates Chromium sandbox navigation, DOM inspection, and structured data extraction.',
      permissions: ['browser:navigate', 'browser:read'],
      riskLevel: 'medium',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['navigate', 'extract', 'click', 'scroll'],
          },
          url: { type: 'string' },
          selector: { type: 'string' },
        },
        required: ['action'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'number' },
          nodesCaptured: { type: 'number' },
          extractedData: { type: 'string' },
        },
        required: ['status'],
      },
      execute: async (input) => ({
        status: 200,
        nodesCaptured: 24,
        extractedData: `DOM payload from ${String(input.url || input.selector || 'active tab')}`,
      }),
      verify: async (_input, output) => ({
        verified: output.status === 200,
      }),
    });

    // 3. Computer Control
    this.registerTool({
      name: 'computer',
      category: 'computer',
      description: 'Controlled OS pointer movement, clicks, keyboard input, and window management.',
      permissions: ['computer:control'],
      riskLevel: 'high',
      inputSchema: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['moveMouse', 'click', 'doubleClick', 'typeText', 'pressKey', 'hotkey'],
          },
          x: { type: 'number' },
          y: { type: 'number' },
          text: { type: 'string' },
        },
        required: ['action'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          executed: { type: 'boolean' },
          action: { type: 'string' },
        },
        required: ['executed', 'action'],
      },
      execute: async (input) => ({
        executed: true,
        action: String(input.action),
      }),
      verify: async (_input, output) => ({
        verified: output.executed === true,
      }),
    });

    // 4. Terminal
    this.registerTool({
      name: 'terminal',
      category: 'terminal',
      description: 'Executes shell commands through safety risk classification.',
      permissions: ['shell:exec'],
      riskLevel: 'medium',
      inputSchema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command string' },
          cwd: { type: 'string', description: 'Working directory' },
        },
        required: ['command'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          exitCode: { type: 'number' },
          stdout: { type: 'string' },
        },
        required: ['exitCode', 'stdout'],
      },
      execute: async (input) => ({
        exitCode: 0,
        stdout: `Executed: ${String(input.command)}`,
      }),
      verify: async (_input, output) => ({
        verified: output.exitCode === 0,
        reason: output.exitCode === 0 ? undefined : `Non-zero exit code: ${String(output.exitCode)}`,
      }),
    });

    // 5. Applications
    this.registerTool({
      name: 'applications',
      category: 'applications',
      description: 'Detects, launches, focuses, and closes desktop applications.',
      permissions: ['apps:launch', 'apps:inspect'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['launch', 'focus', 'close', 'list'] },
          appName: { type: 'string' },
        },
        required: ['action', 'appName'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          running: { type: 'boolean' },
          pid: { type: 'number' },
        },
        required: ['running', 'pid'],
      },
      execute: async () => ({
        running: true,
        pid: 48291,
      }),
      verify: async (_input, output) => ({
        verified: output.running === true && Number(output.pid) > 0,
      }),
    });

    // 6. Web Research
    this.registerTool({
      name: 'web',
      category: 'web',
      description: 'Multi-source web search, citation gathering, and synthesis.',
      permissions: ['web:search'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          maxSources: { type: 'number' },
        },
        required: ['query'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          citationsCount: { type: 'number' },
          summary: { type: 'string' },
        },
        required: ['citationsCount', 'summary'],
      },
      execute: async (input) => ({
        citationsCount: Number(input.maxSources || 5),
        summary: `Synthesized research findings for "${String(input.query)}".`,
      }),
      verify: async (_input, output) => ({
        verified: Number(output.citationsCount) > 0,
      }),
    });

    // 7. Screenshot
    this.registerTool({
      name: 'screenshot',
      category: 'screenshot',
      description: 'Captures lossless viewport or window frames for inspection.',
      permissions: ['screenshot:capture'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          displayId: { type: 'number' },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          width: { type: 'number' },
          height: { type: 'number' },
          captured: { type: 'boolean' },
        },
        required: ['width', 'height', 'captured'],
      },
      execute: async () => ({
        width: 2560,
        height: 1600,
        captured: true,
      }),
      verify: async (_input, output) => ({
        verified: output.captured === true,
      }),
    });

    // 8. Vision
    this.registerTool({
      name: 'vision',
      category: 'vision',
      description: 'Analyzes screen captures with OCR and UI bounding-box detection.',
      permissions: ['vision:analyze'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
        },
        required: ['prompt'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          regionsDetected: { type: 'number' },
          analysis: { type: 'string' },
        },
        required: ['regionsDetected', 'analysis'],
      },
      execute: async (input) => ({
        regionsDetected: 4,
        analysis: `Identified UI regions matching "${String(input.prompt)}".`,
      }),
      verify: async (_input, output) => ({
        verified: typeof output.analysis === 'string',
      }),
    });

    // 9. Voice
    this.registerTool({
      name: 'voice',
      category: 'voice',
      description: 'Speech-to-text command recognition and neural text-to-speech synthesis.',
      permissions: ['voice:tts'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          voiceModel: { type: 'string' },
        },
        required: ['text'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          spoken: { type: 'boolean' },
        },
        required: ['spoken'],
      },
      execute: async () => ({
        spoken: true,
      }),
      verify: async (_input, output) => ({
        verified: output.spoken === true,
      }),
    });

    // 10. Documents
    this.registerTool({
      name: 'documents',
      category: 'documents',
      description: 'Generates structured documents, reports, and presentation outlines.',
      permissions: ['documents:create'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          format: { type: 'string', enum: ['markdown', 'pdf', 'keynote', 'html'] },
        },
        required: ['title', 'format'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          documentId: { type: 'string' },
          created: { type: 'boolean' },
        },
        required: ['documentId', 'created'],
      },
      execute: async (input) => ({
        documentId: `doc-${Date.now()}`,
        created: true,
        title: String(input.title),
      }),
      verify: async (_input, output) => ({
        verified: output.created === true,
      }),
    });

    // 11. Creative Studio
    this.registerTool({
      name: 'creative',
      category: 'creative',
      description: 'Synthesizes vector graphics, kinetic posters, UI layouts, and 3D renders.',
      permissions: ['creative:generate'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          prompt: { type: 'string' },
          modality: { type: 'string', enum: ['image', 'vector', '3d', 'ui'] },
        },
        required: ['prompt', 'modality'],
      },
      outputSchema: {
        type: 'object',
        properties: {
          assetUri: { type: 'string' },
          seed: { type: 'number' },
        },
        required: ['assetUri', 'seed'],
      },
      execute: async () => ({
        assetUri: 'VAR_04.svg',
        seed: 88291,
      }),
      verify: async (_input, output) => ({
        verified: Boolean(output.assetUri),
      }),
    });

    // 12. System Monitor
    this.registerTool({
      name: 'system',
      category: 'system',
      description: 'Monitors CPU, RAM, GPU, network throughput, and active processes.',
      permissions: ['system:telemetry'],
      riskLevel: 'low',
      inputSchema: {
        type: 'object',
        properties: {
          metric: { type: 'string', enum: ['all', 'cpu', 'ram', 'gpu', 'network'] },
        },
      },
      outputSchema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          cpuLoad: { type: 'number' },
        },
        required: ['status', 'cpuLoad'],
      },
      execute: async () => ({
        status: 'nominal',
        cpuLoad: 24,
      }),
      verify: async (_input, output) => ({
        verified: output.status === 'nominal',
      }),
    });
  }
}

export const INITIAL_TOOLS: Array<{
  id: string;
  name: string;
  description: string;
  category:
    | 'filesystem'
    | 'browser'
    | 'computer'
    | 'terminal'
    | 'applications'
    | 'web'
    | 'vision'
    | 'voice'
    | 'documents'
    | 'creative';
  riskLevel: RiskLevel;
  enabled: boolean;
  requiresConfirmation: boolean;
}> = [
  {
    id: 'tool-fs',
    name: 'Filesystem Storage Gateway',
    category: 'filesystem',
    description: 'Read, create, write, search, and manage project files inside approved sandbox directories.',
    riskLevel: 'medium',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-browser',
    name: 'Chromium Sandbox CDP Bridge',
    category: 'browser',
    description: 'Automate browser navigation, read DOM nodes, extract structured JSON specs, and capture lossless frames.',
    riskLevel: 'medium',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-computer',
    name: 'Synthetic Hardware Driver (OS Control)',
    category: 'computer',
    description: 'Move virtual pointer, click elements, send keyboard chords, and inspect OS window tables.',
    riskLevel: 'high',
    enabled: true,
    requiresConfirmation: true,
  },
  {
    id: 'tool-terminal',
    name: 'Controlled Shell Execution Unit',
    category: 'terminal',
    description: 'Run commands through safety evaluation filter with automatic blockage of destructive operations.',
    riskLevel: 'high',
    enabled: true,
    requiresConfirmation: true,
  },
  {
    id: 'tool-apps',
    name: 'Application Matrix Manager',
    category: 'applications',
    description: 'Launch, focus, inspect, and gracefully manage desktop applications (VS Code, Chrome, Spotify, Figma).',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-web',
    name: 'Web Research & Citations Engine',
    category: 'web',
    description: 'Multi-source search, whitepaper retrieval, factual comparison, and Markdown report synthesis.',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-vision',
    name: 'Screen Understanding & OCR Pipeline',
    category: 'vision',
    description: 'Real-time multi-modal screenshot analysis, OCR text extraction, and bounding box locator detection.',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-voice',
    name: 'Neural Voice & Speech Synthesizer',
    category: 'voice',
    description: 'Speech-to-text recognition and text-to-speech audio streaming with voice interrupt support.',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-creative',
    name: 'Generative Design & Vector Engine',
    category: 'creative',
    description: 'Kinetic typography, SVG generative geometry, 3D raytracing, and multi-modal creative workflows.',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
  {
    id: 'tool-documents',
    name: 'Structured Document & Slide Formatter',
    category: 'documents',
    description: 'Compiles technical whitepapers, slide decks (Keynote/HTML), and presentation outlines.',
    riskLevel: 'low',
    enabled: true,
    requiresConfirmation: false,
  },
];

