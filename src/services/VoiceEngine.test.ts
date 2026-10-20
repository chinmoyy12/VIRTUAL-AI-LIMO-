import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateVoiceInput,
  buildProgressiveTranscriptFrames,
} from './VoiceEngine.ts';

test('evaluateVoiceInput responds conversationally to greetings and mic checks without dispatching tasks', () => {
  const res = evaluateVoiceInput('Can you hear me?', {
    userName: 'Chinmoy',
    toolsCount: 9,
  });
  assert.equal(res.intent, 'greeting');
  assert.equal(res.shouldDispatchTask, false);
  assert.ok(res.spokenReply.includes('Chinmoy'));
  assert.ok(res.spokenReply.includes('hear you'));
});

test('evaluateVoiceInput handles voice control commands (stop, pause, resume)', () => {
  const stopRes = evaluateVoiceInput('Stop execution');
  assert.equal(stopRes.intent, 'control_stop');
  assert.equal(stopRes.controlAction, 'stop');
  assert.equal(stopRes.shouldDispatchTask, false);

  const pauseRes = evaluateVoiceInput('Pause task');
  assert.equal(pauseRes.intent, 'control_pause');
  assert.equal(pauseRes.controlAction, 'pause');

  const resumeRes = evaluateVoiceInput('Resume');
  assert.equal(resumeRes.intent, 'control_resume');
  assert.equal(resumeRes.controlAction, 'resume');
});

test('evaluateVoiceInput saves facts to memory when user says Remember that...', () => {
  const memRes = evaluateVoiceInput('Remember that I prefer dark mode in all IDEs');
  assert.equal(memRes.intent, 'memory_save');
  assert.equal(memRes.shouldDispatchTask, false);
  assert.equal(memRes.memoryFact, 'I prefer dark mode in all IDEs');
});

test('evaluateVoiceInput proposes tasks without auto-dispatching unless guided or confirmed', () => {
  const proposal = evaluateVoiceInput('Prepare my laptop for tomorrow’s presentation');
  assert.equal(proposal.intent, 'task_proposal');
  assert.equal(proposal.shouldDispatchTask, false);
  assert.equal(proposal.proposedTaskGoal, 'Prepare my laptop for tomorrow’s presentation');
  assert.ok(proposal.spokenReply.includes('go ahead'));

  // Confirming the pending task dispatches it
  const confirmed = evaluateVoiceInput('Go ahead', {
    pendingTaskGoal: proposal.proposedTaskGoal,
  });
  assert.equal(confirmed.intent, 'task_execution');
  assert.equal(confirmed.shouldDispatchTask, true);
  assert.equal(confirmed.taskGoal, 'Prepare my laptop for tomorrow’s presentation');
});

test('evaluateVoiceInput never dispatches tasks for general conversational input', () => {
  const conv = evaluateVoiceInput('How does the memory system work?');
  assert.equal(conv.intent, 'conversation');
  assert.equal(conv.shouldDispatchTask, false);
});

test('buildProgressiveTranscriptFrames generates cumulative word frames', () => {
  const frames = buildProgressiveTranscriptFrames('Open VS Code now');
  assert.deepEqual(frames, [
    'Open',
    'Open VS',
    'Open VS Code',
    'Open VS Code now',
  ]);
});
