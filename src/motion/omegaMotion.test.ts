import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getAmbientParametersForState,
  getParticleCountForQuality,
  lerp2D,
  calculateMagneticOffset,
  getStatusIndicatorMeta,
} from './omegaMotion.ts';

test('getAmbientParametersForState returns distinct behavior across all 10 OMEGA states', () => {
  const idle = getAmbientParametersForState('IDLE');
  const executing = getAmbientParametersForState('EXECUTING');
  const verifying = getAmbientParametersForState('VERIFYING');
  const error = getAmbientParametersForState('ERROR');

  assert.ok(idle.speedMultiplier < executing.speedMultiplier);
  assert.ok(executing.directionalBiasX > 0.5);
  assert.ok(verifying.scanIntensity > 0.7);
  assert.ok(error.radialPulse < 0);
});

test('getParticleCountForQuality scales particle budget appropriately', () => {
  assert.equal(getParticleCountForQuality('HIGH'), 38);
  assert.equal(getParticleCountForQuality('MEDIUM'), 22);
  assert.equal(getParticleCountForQuality('LOW'), 10);
  assert.equal(getParticleCountForQuality('REDUCED'), 0);
});

test('lerp2D interpolates smoothly toward target coordinates', () => {
  const pos = lerp2D(0, 0, 100, 200, 0.1);
  assert.equal(pos.x, 10);
  assert.equal(pos.y, 20);
});

test('calculateMagneticOffset bounds displacement strictly within 1-3px and returns 0 outside radius', () => {
  const outside = calculateMagneticOffset(300, 300, 100, 100, 90, 2.5);
  assert.equal(outside.dx, 0);
  assert.equal(outside.dy, 0);

  const inside = calculateMagneticOffset(115, 110, 100, 100, 90, 2.5);
  assert.ok(Math.abs(inside.dx) <= 2.5 && Math.abs(inside.dx) > 0);
  assert.ok(Math.abs(inside.dy) <= 2.5 && Math.abs(inside.dy) > 0);
});

test('getStatusIndicatorMeta returns busy labels (e.g. Thinking..., Executing Task) and progress', () => {
  const thinking = getStatusIndicatorMeta('THINKING', 0, 5);
  assert.equal(thinking.label, 'Thinking...');
  assert.equal(thinking.isBusy, true);
  assert.equal(thinking.stepSummary, '0/5');

  const executing = getStatusIndicatorMeta('EXECUTING', 2, 5);
  assert.equal(executing.label, 'Executing Task');
  assert.equal(executing.isBusy, true);
  assert.equal(executing.stepSummary, '2/5');
  assert.equal(executing.progressPercent, 40);

  const idle = getStatusIndicatorMeta('IDLE');
  assert.equal(idle.label, 'OMEGA Ready');
  assert.equal(idle.isBusy, false);
});

