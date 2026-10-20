import test from 'node:test';
import assert from 'node:assert/strict';
import { TaskEngine } from './TaskEngine.ts';

test('TaskEngine creates a structured multi-step task in idle state', () => {
  const engine = new TaskEngine();
  const task = engine.createTask('Open VS Code and create TestProject', [
    { description: 'Create folder ~/Developer/TestProject', tool: 'filesystem', arguments: { path: '~/Developer/TestProject' } },
    { description: 'Launch VS Code', tool: 'applications', arguments: { app: 'VS Code' } },
  ]);

  assert.equal(task.goal, 'Open VS Code and create TestProject');
  assert.equal(task.status, 'idle');
  assert.equal(task.steps.length, 2);
  assert.equal(task.steps[0].status, 'queued');
  assert.equal(task.steps[1].status, 'standby');
});

test('TaskEngine executes and verifies multi-step tasks through completion', async () => {
  const statesObserved: string[] = [];
  const engine = new TaskEngine({
    executor: async (tool, args) => {
      return { result: { executed: tool, args } };
    },
    verifier: async (_step, result) => {
      return { verified: Boolean(result) };
    },
  });

  engine.subscribe((_task, event) => {
    if (event.type.startsWith('state:')) {
      statesObserved.push(event.type);
    }
  });

  const task = engine.createTask('Build React Portfolio', [
    { description: 'Scaffold files', tool: 'filesystem' },
    { description: 'Verify server', tool: 'browser' },
  ]);

  const finished = await engine.runTask(task.id);

  assert.equal(finished.status, 'completed');
  assert.ok(finished.completedAt);
  assert.equal(finished.steps[0].status, 'completed');
  assert.equal(finished.steps[1].status, 'completed');
  assert.ok(statesObserved.includes('state:understanding'));
  assert.ok(statesObserved.includes('state:planning'));
  assert.ok(statesObserved.includes('state:executing'));
  assert.ok(statesObserved.includes('state:verifying'));
  assert.ok(statesObserved.includes('state:completed'));
});

test('TaskEngine pauses at awaiting_permission and completes when permission is granted', async () => {
  const engine = new TaskEngine();
  const task = engine.createTask('Delete temp logs', [
    {
      id: 'step-del',
      description: 'Remove ~/Downloads/temp.log',
      tool: 'filesystem',
      requiresPermission: true,
    },
  ]);

  engine.subscribe((t, event) => {
    if (event.type === 'step:permission_required' && event.stepId) {
      assert.equal(t.status, 'awaiting_permission');
      setTimeout(() => {
        engine.resolvePermission(t.id, event.stepId!, true);
      }, 10);
    }
  });

  const completedTask = await engine.runTask(task.id);
  assert.equal(completedTask.status, 'completed');
  assert.equal(completedTask.steps[0].permission, 'granted');
  assert.equal(completedTask.steps[0].status, 'completed');
});

test('TaskEngine fails task when required permission is denied', async () => {
  const engine = new TaskEngine();
  const task = engine.createTask('Run destructive script', [
    {
      id: 'step-danger',
      description: 'Execute rm -rf',
      tool: 'terminal',
      requiresPermission: true,
    },
  ]);

  engine.subscribe((t, event) => {
    if (event.type === 'step:permission_required' && event.stepId) {
      setTimeout(() => {
        engine.resolvePermission(t.id, event.stepId!, false);
      }, 10);
    }
  });

  const failedTask = await engine.runTask(task.id);
  assert.equal(failedTask.status, 'failed');
  assert.equal(failedTask.steps[0].permission, 'denied');
  assert.equal(failedTask.steps[0].status, 'failed');
});

test('TaskEngine recovers from safe transient errors via automatic retry', async () => {
  let attempts = 0;
  const engine = new TaskEngine({
    executor: async () => {
      attempts++;
      if (attempts === 1) {
        throw new Error('Application did not start on first attempt');
      }
      return { result: { pid: 4920 } };
    },
  });

  const task = engine.createTask('Open VS Code with retry', [
    {
      description: 'Launch VS Code',
      tool: 'applications',
      maxRetries: 2,
      isSafeRetry: true,
    },
  ]);

  const result = await engine.runTask(task.id);
  assert.equal(result.status, 'completed');
  assert.equal(attempts, 2);
  assert.equal(result.steps[0].retryCount, 1);
  assert.equal(result.steps[0].status, 'completed');
});

test('TaskEngine rejects invalid state transitions', () => {
  const engine = new TaskEngine();
  const task = engine.createTask('Test transition validation', [
    { description: 'Step 1', tool: 'system' },
  ]);

  assert.throws(() => {
    engine.transitionState(task.id, 'completed');
  }, /Invalid task state transition/);
});

test('TaskEngine stopAll halts active tasks immediately', async () => {
  const engine = new TaskEngine();
  const task = engine.createTask('Long running automation', [
    {
      id: 's1',
      description: 'Await operator confirmation',
      tool: 'computer',
      requiresPermission: true,
    },
  ]);

  engine.subscribe((t, event) => {
    if (event.type === 'step:permission_required') {
      setTimeout(() => {
        engine.stopAll('Operator clicked STOP OMEGA');
      }, 10);
    }
  });

  const stoppedTask = await engine.runTask(task.id);
  assert.equal(stoppedTask.status, 'stopped');
  assert.equal(stoppedTask.error, 'Operator clicked STOP OMEGA');
});
