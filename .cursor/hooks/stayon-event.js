#!/usr/bin/env node
'use strict';
/** StayOn hook router — Node only (no bash/jq/curl). Fail-open always. */
const fs = require('fs');
const http = require('http');
const path = require('path');

const STAYON_DIR = path.join(
  process.env.HOME || process.env.USERPROFILE || process.env.HOMEPATH || '',
  '.stayon'
);
const INBOX_DIR = path.join(STAYON_DIR, 'inbox');
const LOG_FILE = path.join(STAYON_DIR, 'hook.log');
const DEFAULT_PORTS = [3847, 3848, 3849, 3850, 3851, 3852];

function logHook(msg) {
  try {
    fs.mkdirSync(STAYON_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // ignore
  }
}

function readPortCandidates() {
  const ports = [];
  const add = (value) => {
    const n = Number(String(value || '').trim());
    if (Number.isFinite(n) && n > 0 && !ports.includes(n)) {
      ports.push(n);
    }
  };

  try {
    add(fs.readFileSync(path.join(STAYON_DIR, 'port'), 'utf8'));
  } catch {
    // ignore
  }

  try {
    add(fs.readFileSync(path.join(__dirname, '..', 'stayon-port'), 'utf8'));
  } catch {
    // ignore
  }

  for (const p of DEFAULT_PORTS) {
    add(p);
  }

  return ports;
}

function postEvent(port, body) {
  return new Promise((resolve) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: Number(port),
        path: '/event',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
        timeout: 1200,
      },
      (res) => {
        res.resume();
        resolve({ ok: res.statusCode === 204 || res.statusCode === 200, port });
      }
    );
    req.on('error', (err) =>
      resolve({ ok: false, port, err: String(err && err.message ? err.message : err) })
    );
    req.on('timeout', () => {
      req.destroy();
      resolve({ ok: false, port, err: 'timeout' });
    });
    req.write(data);
    req.end();
  });
}

async function postWithFallback(body) {
  const ports = readPortCandidates();
  let lastErr = 'no ports';
  for (const port of ports) {
    const result = await postEvent(port, body);
    if (result.ok) {
      return { ok: true, port: result.port, via: 'http' };
    }
    lastErr = result.err || lastErr;
  }
  return { ok: false, err: lastErr };
}

function writeInbox(body) {
  try {
    fs.mkdirSync(INBOX_DIR, { recursive: true });
    const name = `${Date.now()}-${body.event || 'event'}.json`;
    fs.writeFileSync(path.join(INBOX_DIR, name), JSON.stringify(body));
    return true;
  } catch {
    return false;
  }
}

async function deliver(body, event) {
  const httpResult = await postWithFallback(body);
  if (httpResult.ok) {
    logHook(`ok event=${event} port=${httpResult.port}`);
    return;
  }

  if (writeInbox(body)) {
    logHook(`inbox event=${event} (http blocked: ${httpResult.err || 'unknown'})`);
    return;
  }

  logHook(`post failed event=${event} err=${httpResult.err || 'unknown'}`);
}

async function main() {
  let raw = '';
  try {
    raw = fs.readFileSync(0, 'utf8').trim();
  } catch {
    process.exit(0);
  }

  if (!raw) {
    process.exit(0);
  }

  let input = {};
  try {
    input = JSON.parse(raw);
  } catch {
    logHook(`ERROR invalid JSON on stdin len=${raw.length}`);
    process.exit(0);
  }

  const event = String(input.hook_event_name || '');
  const ts = new Date().toISOString();

  if (event === 'beforeSubmitPrompt') {
    process.stdout.write(JSON.stringify({ continue: true }));
  }

  let body = null;
  switch (event) {
    case 'beforeSubmitPrompt':
      body = {
        event: 'busy_start',
        context_note: String(input.prompt || '').slice(0, 120),
        ts,
      };
      break;
    case 'preToolUse':
    case 'postToolUse':
      body = {
        event: 'busy_heartbeat',
        tool: String(input.tool_name || ''),
        ts,
      };
      break;
    case 'afterAgentThought':
      body = { event: 'busy_heartbeat', phase: 'thinking', ts };
      break;
    case 'subagentStart':
      body = { event: 'busy_ref', delta: 1, ts };
      break;
    case 'subagentStop':
      body = { event: 'busy_ref', delta: -1, ts };
      break;
    case 'stop':
      body = {
        event: 'busy_end',
        status: String(input.status || 'completed'),
        ts,
      };
      break;
    case 'sessionEnd':
      body = { event: 'session_end', ts };
      break;
    default:
      if (event) {
        logHook(`skip event=${event}`);
      }
      process.exit(0);
  }

  if (body) {
    await deliver(body, event);
  }

  process.exit(0);
}

main().catch((err) => {
  logHook(`ERROR ${String(err)}`);
  process.exit(0);
});
