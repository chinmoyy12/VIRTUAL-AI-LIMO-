import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clamp,
  interpolatePrompt,
  evaluateRisk,
  formatDuration,
  calculateNextTelemetry,
  createTaskPlan,
  verifyStepSuccess,
} from './omegaLogic.ts';
import type { SystemTelemetry, TaskStep } from '../types/omega.ts';

test('clamp restricts values to min and max boundaries', () => {
  assert.equal(clamp(5, 0, 10), 5);
  assert.equal(clamp(-5, 0, 10), 0);
  assert.equal(clamp(15, 0, 10), 10);
});

test('interpolatePrompt replaces variables correctly', () => {
  const template = 'Role: OMEGA. Review diff: {git_diff} and logs: {pr_logs}.';
  const vars = {
    git_diff: 'index.ts +2 -1',
    pr_logs: 'approved by Kai',
  };
  const result = interpolatePrompt(template, vars);
  assert.equal(result, 'Role: OMEGA. Review diff: index.ts +2 -1 and logs: approved by Kai.');
});

test('evaluateRisk identifies high, medium, and low risk commands', () => {
  assert.equal(evaluateRisk('rm -rf /'), 'high');
  assert.equal(evaluateRisk('sudo reboot'), 'high');
  assert.equal(evaluateRisk('dd if=/dev/zero of=/dev/sda'), 'high');
  assert.equal(evaluateRisk('chmod 777 /etc/hosts'), 'high');
  assert.equal(evaluateRisk('cat .env'), 'high');

  assert.equal(evaluateRisk('npm install motion'), 'medium');
  assert.equal(evaluateRisk('pip install torch'), 'medium');
  assert.equal(evaluateRisk('git clone https://github.com/example/repo'), 'medium');

  assert.equal(evaluateRisk('ls -la'), 'low');
  assert.equal(evaluateRisk('pwd'), 'low');
  assert.equal(evaluateRisk('git status'), 'low');
  assert.equal(evaluateRisk('echo "hello"'), 'low');
});

test('formatDuration converts milliseconds properly', () => {
  assert.equal(formatDuration(420), '420ms');
  assert.equal(formatDuration(1800), '1.8s');
  assert.equal(formatDuration(30000), '30.0s');
});

test('calculateNextTelemetry keeps values within bounds', () => {
  const initial: SystemTelemetry = {
    cpuLoad: 24,
    ramUsage: 42,
    ramUsedGB: 26.8,
    ramTotalGB: 64,
    gpuLoad: 18,
    gpuVramUsedGB: 4.3,
    gpuVramTotalGB: 24,
    gpuTemp: 48,
    netSpeedMbps: 1.2,
    diskIoMbps: 84,
    latencyMs: 8.2,
    guardActive: true,
    geminiConnected: true,
  };

  const next = calculateNextTelemetry(initial);
  assert.ok(next.cpuLoad >= 10 && next.cpuLoad <= 90);
  assert.ok(next.ramUsage >= 30 && next.ramUsage <= 80);
  assert.ok(next.latencyMs > 0);
});

test('createTaskPlan parses natural language goals into structured steps', () => {
  const plan = createTaskPlan('Analyze latest NVIDIA RTX 5090 architecture');
  assert.ok(plan.id.startsWith('plan-'));
  assert.equal(plan.state, 'executing');
  assert.equal(plan.steps.length, 4);
  assert.equal(plan.steps[0].status, 'completed');
  assert.equal(plan.steps[1].status, 'active');
});

test('verifyStepSuccess properly checks completion status', () => {
  const completedStep: TaskStep = {
    id: 's1',
    index: 1,
    title: 'Query Web',
    tool: 'web',
    description: 'Success',
    status: 'completed',
  };
  const activeStep: TaskStep = {
    id: 's2',
    index: 2,
    title: 'Download file',
    tool: 'browser',
    description: 'In progress',
    status: 'active',
  };

  assert.equal(verifyStepSuccess(completedStep).verified, true);
  assert.equal(verifyStepSuccess(activeStep).verified, false);
});
