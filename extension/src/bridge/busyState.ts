import type { AgentStatus, BridgeEvent, BusyEndPayload } from '../types';

export type BusyListener = (payload?: BusyEndPayload) => void;
export type StateListener = (status: AgentStatus, contextNote?: string, tool?: string) => void;

export class BusyState {
  private ref = 0;
  private contextNote = '';
  private status: AgentStatus = 'idle';
  private readyTimer: ReturnType<typeof setTimeout> | undefined;
  private lastTool = '';

  private onBusyStart: BusyListener[] = [];
  private onBusyEnd: BusyListener[] = [];
  private onStateChange: StateListener[] = [];

  on(event: 'busyStart', fn: BusyListener): void;
  on(event: 'busyEnd', fn: BusyListener): void;
  on(event: 'stateChange', fn: StateListener): void;
  on(event: string, fn: BusyListener | StateListener): void {
    if (event === 'busyStart') {
      this.onBusyStart.push(fn as BusyListener);
    } else if (event === 'busyEnd') {
      this.onBusyEnd.push(fn as BusyListener);
    } else if (event === 'stateChange') {
      this.onStateChange.push(fn as StateListener);
    }
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getRef(): number {
    return this.ref;
  }

  getContextNote(): string {
    return this.contextNote;
  }

  isBusy(): boolean {
    return this.status === 'busy';
  }

  snapshot() {
    return {
      status: this.status,
      busy_ref: this.ref,
      context_note: this.contextNote,
      last_tool: this.lastTool,
    };
  }

  handle(event: BridgeEvent, log?: (msg: string) => void): void {
    log?.(`bridge event: ${event.event}${'tool' in event && event.tool ? ` tool=${event.tool}` : ''}`);

    switch (event.event) {
      case 'busy_start':
        this.clearReadyTimer();
        const wasIdle = this.ref === 0;
        this.ref = Math.max(1, this.ref);
        this.contextNote = event.context_note ?? '';
        this.setStatus('busy');
        if (wasIdle) {
          for (const fn of this.onBusyStart) {
            fn();
          }
        }
        break;

      case 'busy_heartbeat':
        if (this.status !== 'idle') {
          this.ref = Math.max(1, this.ref);
          if ('tool' in event && event.tool && event.tool !== this.lastTool) {
            this.lastTool = event.tool;
            this.notifyState();
          }
        }
        break;

      case 'busy_ref':
        this.ref = Math.max(0, this.ref + event.delta);
        if (this.ref > 0) {
          this.setStatus('busy');
        }
        break;

      case 'busy_end':
        this.ref = 0;
        this.setStatus('ready');
        {
          const payload: BusyEndPayload = {
            status: event.status,
            contextNote: this.contextNote,
          };
          for (const fn of this.onBusyEnd) {
            fn(payload);
          }
        }
        this.clearReadyTimer();
        this.readyTimer = setTimeout(() => {
          if (this.ref === 0) {
            this.setStatus('idle');
          }
        }, 8000);
        break;

      case 'session_end':
        this.ref = 0;
        this.clearReadyTimer();
        this.setStatus('idle');
        break;
    }
  }

  private setStatus(status: AgentStatus): void {
    this.status = status;
    this.notifyState();
  }

  private notifyState(): void {
    for (const fn of this.onStateChange) {
      fn(this.status, this.contextNote, this.lastTool);
    }
  }

  private clearReadyTimer(): void {
    if (this.readyTimer) {
      clearTimeout(this.readyTimer);
      this.readyTimer = undefined;
    }
  }
}
