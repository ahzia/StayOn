import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import type { BridgeEvent } from '../types';
import { BusyState } from './busyState';

const STAYON_DIR = path.join(os.homedir(), '.stayon');
const INBOX_DIR = path.join(STAYON_DIR, 'inbox');

/** Process hook events dropped into ~/.stayon/inbox when HTTP POST from hooks is blocked. */
export function startInboxPoller(state: BusyState, log: (msg: string) => void): () => void {
  fs.mkdirSync(INBOX_DIR, { recursive: true });

  const tick = () => {
    let names: string[] = [];
    try {
      names = fs
        .readdirSync(INBOX_DIR)
        .filter((name) => name.endsWith('.json'))
        .sort();
    } catch {
      return;
    }

    for (const name of names) {
      const filePath = path.join(INBOX_DIR, name);
      try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const event = JSON.parse(raw) as BridgeEvent;
        state.handle(event, log);
        fs.unlinkSync(filePath);
      } catch (err) {
        log(`inbox event error (${name}): ${String(err)}`);
        try {
          fs.unlinkSync(filePath);
        } catch {
          // ignore
        }
      }
    }
  };

  tick();
  const timer = setInterval(tick, 250);
  return () => clearInterval(timer);
}
