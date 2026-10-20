/**
 * OMEGA Voice Intelligence Engine
 * Pure logic for spoken intent classification, active conversational replies,
 * and guided task confirmation, decoupled from DOM/browser APIs for unit testing.
 */

export type VoiceIntentType =
  | 'greeting'
  | 'status_query'
  | 'identity_query'
  | 'conversation'
  | 'control_stop'
  | 'control_pause'
  | 'control_resume'
  | 'memory_save'
  | 'task_proposal'
  | 'task_execution'
  | 'task_cancel';

export interface VoiceContextInfo {
  activeGoal?: string | null;
  activeState?: string | null;
  pendingTaskGoal?: string | null;
  userName?: string;
  memoriesCount?: number;
  toolsCount?: number;
  autoExecuteTasks?: boolean;
}

export interface VoiceReplyDecision {
  intent: VoiceIntentType;
  spokenReply: string;
  shouldDispatchTask: boolean;
  taskGoal?: string;
  proposedTaskGoal?: string;
  shouldClearPendingTask?: boolean;
  controlAction?: 'stop' | 'pause' | 'resume';
  memoryFact?: string;
}

export interface VoiceConversationTurn {
  id: string;
  role: 'user' | 'omega';
  text: string;
  timestamp: string;
  intent?: VoiceIntentType;
  dispatchedTask?: boolean;
  proposedTaskGoal?: string;
}

const ACTION_TASK_VERBS =
  /^(create|build|make|generate|organize|clean|sort|open|launch|start|run|execute|deploy|schedule|automate|prepare|summarize|analyze|research|export|compile|write|setup|set up|configure|install|test|debug|refactor|find|search)\b/i;

const EXPLICIT_IMMEDIATE_EXECUTION =
  /^(run task|execute task|start task|dispatch task|execute now|run now)\s*[:,-]?\s*(.+)$/i;

/**
 * Classifies spoken user input and synthesizes an active, natural spoken response.
 * Tasks are NEVER automatically dispatched without user guidance: actionable requests
 * create a guided task proposal first (which the user can confirm by saying "go ahead"
 * or clicking "Run Task"), unless explicitly prefixed with "run task" / "execute now".
 */
export function evaluateVoiceInput(
  rawInput: string,
  context: VoiceContextInfo = {}
): VoiceReplyDecision {
  const cleaned = rawInput.replace(/^[“"']|[”"']$/g, '').trim();
  const lower = cleaned.toLowerCase();
  const user = context.userName || 'Chinmoy';

  if (!cleaned) {
    return {
      intent: 'greeting',
      spokenReply: `I’m listening, ${user}. How can I help you right now?`,
      shouldDispatchTask: false,
    };
  }

  // 1. Immediate voice control commands (stop / pause / resume)
  if (
    /^(stop|halt|abort|stop execution|stop task|emergency stop)$/i.test(lower) ||
    lower.startsWith('stop omega')
  ) {
    return {
      intent: 'control_stop',
      spokenReply: 'Stopping all active execution pipelines immediately.',
      shouldDispatchTask: false,
      shouldClearPendingTask: true,
      controlAction: 'stop',
    };
  }

  if (/^(pause|pause task|hold on|wait a second)$/i.test(lower)) {
    return {
      intent: 'control_pause',
      spokenReply: 'Execution paused. Let me know when you are ready to resume.',
      shouldDispatchTask: false,
      controlAction: 'pause',
    };
  }

  if (/^(resume|continue|keep going|resume task)$/i.test(lower)) {
    return {
      intent: 'control_resume',
      spokenReply: 'Resuming task execution now.',
      shouldDispatchTask: false,
      controlAction: 'resume',
    };
  }

  // 2. Guided task confirmation ("go ahead", "yes", "do it", "run it", "confirm")
  if (
    /^(yes|yeah|yep|go ahead|do it|run it|start it|execute|execute it|confirm|proceed|yes please|sure|run task)$/i.test(
      lower
    )
  ) {
    if (context.pendingTaskGoal) {
      return {
        intent: 'task_execution',
        spokenReply: `Confirmed. Starting execution for "${context.pendingTaskGoal}" now.`,
        shouldDispatchTask: true,
        taskGoal: context.pendingTaskGoal,
        shouldClearPendingTask: true,
      };
    }
    return {
      intent: 'conversation',
      spokenReply: `I’m ready, ${user}. Tell me what task you’d like me to prepare and execute.`,
      shouldDispatchTask: false,
    };
  }

  // 3. Guided task cancellation ("no", "cancel", "never mind", "dismiss")
  if (/^(no|nope|cancel|never mind|nevermind|don't do it|do not run|dismiss)$/i.test(lower)) {
    if (context.pendingTaskGoal) {
      return {
        intent: 'task_cancel',
        spokenReply: `Understood. I’ve cancelled the pending task "${context.pendingTaskGoal}". What else can I help with?`,
        shouldDispatchTask: false,
        shouldClearPendingTask: true,
      };
    }
    return {
      intent: 'task_cancel',
      spokenReply: 'Okay, standing by. Let me know if you need anything.',
      shouldDispatchTask: false,
      shouldClearPendingTask: true,
    };
  }

  // 4. Greetings & microphone checks
  if (
    /^(hi|hello|hey|good morning|good evening|good afternoon|hey omega|hi omega|hello omega|can you hear me|are you listening|are you there|mic check|testing|test|is this working)(\s+omega)?[?.!]*$/i.test(
      lower
    )
  ) {
    const toolsCount = context.toolsCount ?? 9;
    return {
      intent: 'greeting',
      spokenReply: `Hello ${user}, I can hear you loud and clear. All ${toolsCount} workspace tools are ready. What would you like to talk about or work on?`,
      shouldDispatchTask: false,
    };
  }

  // 5. Identity, capability & polite conversational turns
  if (
    lower.includes('who are you') ||
    lower.includes('what can you do') ||
    lower.includes('how are you') ||
    lower.includes('what are your capabilities') ||
    lower === 'help'
  ) {
    return {
      intent: 'identity_query',
      spokenReply:
        'I am OMEGA, your personal AI operating companion. We can talk through ideas, check your system and files, save notes to memory, or run guided multi-step tasks whenever you confirm them.',
      shouldDispatchTask: false,
    };
  }

  if (/^(thanks|thank you|appreciate it|awesome|great|good job|nice)(\s+omega)?[!.?]*$/i.test(lower)) {
    return {
      intent: 'conversation',
      spokenReply: `You’re welcome, ${user}. I’m right here whenever you need me.`,
      shouldDispatchTask: false,
    };
  }

  // 6. Status queries
  if (
    lower === 'status' ||
    lower.includes('what are you doing') ||
    lower.includes('what is your status') ||
    lower.includes('current status') ||
    lower.includes('status report') ||
    lower.includes('current task') ||
    lower.includes('any active task')
  ) {
    if (context.activeGoal && context.activeState && context.activeState !== 'idle') {
      return {
        intent: 'status_query',
        spokenReply: `Currently ${context.activeState} on task: "${context.activeGoal}".`,
        shouldDispatchTask: false,
      };
    }
    return {
      intent: 'status_query',
      spokenReply: 'Your workspace is clear with no background tasks running. I am standing by and ready.',
      shouldDispatchTask: false,
    };
  }

  // 7. Time / Date conversational queries
  if (lower.includes('what time') || lower.includes('current time') || lower.includes('what day is it') || lower.includes('today’s date')) {
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      intent: 'conversation',
      spokenReply: `It is currently ${nowStr}, ${user}.`,
      shouldDispatchTask: false,
    };
  }

  // 8. Memory save command ("remember that...")
  const rememberMatch = cleaned.match(/^remember\s+(?:that\s+)?(.+)$/i);
  if (rememberMatch) {
    const fact = rememberMatch[1].trim();
    return {
      intent: 'memory_save',
      spokenReply: `Got it. I’ve saved "${fact}" to your persistent memory.`,
      shouldDispatchTask: false,
      memoryFact: fact,
    };
  }

  // 9. Explicit immediate task execution ("Run task: ...", "Execute now: ...")
  const explicitMatch = cleaned.match(EXPLICIT_IMMEDIATE_EXECUTION);
  if (explicitMatch) {
    const goal = explicitMatch[2].trim();
    return {
      intent: 'task_execution',
      spokenReply: `Executing task "${goal}" now and verifying each step.`,
      shouldDispatchTask: true,
      taskGoal: goal,
      shouldClearPendingTask: true,
    };
  }

  // 10. Actionable Task Proposal (Guided by default unless autoExecuteTasks is explicitly enabled)
  if (ACTION_TASK_VERBS.test(cleaned) || context.autoExecuteTasks) {
    if (context.autoExecuteTasks) {
      return {
        intent: 'task_execution',
        spokenReply: `Understood. Starting "${cleaned}" now.`,
        shouldDispatchTask: true,
        taskGoal: cleaned,
        shouldClearPendingTask: true,
      };
    }

    return {
      intent: 'task_proposal',
      spokenReply: `I’ve prepared a plan for "${cleaned}". Say "go ahead" or tap Run Task whenever you want me to start.`,
      shouldDispatchTask: false,
      proposedTaskGoal: cleaned,
    };
  }

  // 11. General Conversational Questions & Discussion (Never dispatches unguided tasks)
  return {
    intent: 'conversation',
    spokenReply: buildConversationalReply(cleaned, user),
    shouldDispatchTask: false,
  };
}

function buildConversationalReply(input: string, user: string): string {
  const lower = input.toLowerCase();
  if (lower.endsWith('?') || /^(what|how|why|when|where|can|could|should|do|does|is|are|explain|tell me)\b/i.test(lower)) {
    return `Here is my take on "${input}": I can analyze that directly in our conversation, or if you want me to run a workspace task for it, just say "run task" or guide me on the steps you want executed.`;
  }
  return `I heard you, ${user}: "${input}". I’m keeping this in our conversation without starting any background task. Tell me if you’d like to turn it into an action plan.`;
}

/**
 * Splits a phrase into progressive word chunks for live speech-to-text streaming.
 */
export function buildProgressiveTranscriptFrames(phrase: string): string[] {
  const cleaned = phrase.trim();
  if (!cleaned) return [];
  const words = cleaned.split(/\s+/);
  const frames: string[] = [];
  for (let i = 1; i <= words.length; i++) {
    frames.push(words.slice(0, i).join(' '));
  }
  return frames;
}
