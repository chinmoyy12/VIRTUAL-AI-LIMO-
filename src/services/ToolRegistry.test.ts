import test from 'node:test';
import assert from 'node:assert/strict';
import { ToolRegistry, validateSchema } from './ToolRegistry.ts';

test('ToolRegistry registers all 12 core architectural tools by default', () => {
  const registry = new ToolRegistry();
  const tools = registry.getAllTools();
  assert.equal(tools.length, 12);

  const expectedNames = [
    'filesystem',
    'browser',
    'computer',
    'terminal',
    'applications',
    'web',
    'screenshot',
    'vision',
    'voice',
    'documents',
    'creative',
    'system',
  ];

  for (const name of expectedNames) {
    assert.ok(registry.getTool(name), `Expected tool "${name}" to be registered`);
  }
});

test('validateSchema enforces required fields, property types, and enums', () => {
  const schema = {
    type: 'object' as const,
    properties: {
      operation: { type: 'string' as const, enum: ['read', 'write'] },
      count: { type: 'number' as const },
    },
    required: ['operation'],
  };

  assert.equal(validateSchema(schema, { operation: 'read', count: 3 }).valid, true);
  assert.equal(validateSchema(schema, { count: 3 }).valid, false);
  assert.equal(validateSchema(schema, { operation: 'delete' }).valid, false);
  assert.equal(validateSchema(schema, { operation: 'read', count: 'three' }).valid, false);
});

test('ToolRegistry executes permitted low-risk tools and verifies output', async () => {
  const registry = new ToolRegistry();
  const outcome = await registry.executeTool('web', {
    query: 'NVIDIA RTX 5090 Blackwell architecture',
    maxSources: 14,
  });

  assert.equal(outcome.toolName, 'web');
  assert.equal(outcome.verified, true);
  assert.equal(outcome.permissionGranted, true);
  assert.equal(outcome.output.citationsCount, 14);
});

test('ToolRegistry blocks high-risk or unpermitted tools unless approved by permissionHandler', async () => {
  const registry = new ToolRegistry();

  // Without a permissionHandler, computer control (high risk, ungranted permission) throws
  await assert.rejects(
    async () => {
      await registry.executeTool('computer', { action: 'click', x: 640, y: 230 });
    },
    /Permission denied/
  );

  // With a permissionHandler that approves the request, it succeeds
  let requestedRisk = '';
  registry.setPermissionHandler(async (req) => {
    requestedRisk = req.riskLevel;
    return true;
  });

  const outcome = await registry.executeTool('computer', { action: 'click', x: 640, y: 230 });
  assert.equal(requestedRisk, 'high');
  assert.equal(outcome.verified, true);
  assert.equal(outcome.permissionGranted, true);
});

test('ToolRegistry dynamically escalates risk for destructive terminal commands', async () => {
  let capturedReason = '';
  const registry = new ToolRegistry({
    initialPermissions: ['shell:exec'],
    permissionHandler: async (req) => {
      capturedReason = req.reason;
      return false; // Operator denies destructive command
    },
  });

  // Safe command runs without triggering high-risk confirmation
  const safeRes = await registry.executeTool('terminal', { command: 'git status' });
  assert.equal(safeRes.verified, true);
  assert.equal(safeRes.riskLevel, 'low');

  // Destructive command escalates to high risk and triggers permission gate
  await assert.rejects(
    async () => {
      await registry.executeTool('terminal', { command: 'rm -rf /tmp/build' });
    },
    /Operator denied execution permission/
  );
  assert.ok(capturedReason.includes('High-risk operation'));
});
