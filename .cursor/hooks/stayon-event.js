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
const LOG_FILE = path.join(STAYON_DIR, 'hook.log');

function logHook(msg) {
  try {
    fs.mkdirSync(STAYON_DIR, { recursive: true });
    fs.appendFileSync(LOG_FILE, `${new Date().toISOString()} ${msg}\n`);
  } catch {
    // ignore
  }
}

function readPort() {
  try {
    const raw = fs.readFileSync(path.join(STAYON_DIR, 'port'), 'utf8').trim();
    return raw || '3847';
  } catch {
    return '3847';
  }
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
        timeout: 2000,
      },
      (res) => {
        res.resume();
        resolve(res.statusCode === 204 || res.statusCode === 200);
      }
    );
    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
    req.write(data);
    req.end();
  });
}

async function main() {
  let input = {};
  try {
    const raw = fs.readFileSync(0, 'utf8');
    input = JSON.parse(raw || '{}');
  } catch {
    logHook('ERROR invalid JSON on stdin');
    process.exit(0);
  }

  const event = String(input.hook_event_name || '');
  const port = readPort();
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
        logHook(`skip event=${event} port=${port}`);
      }
      process.exit(0);
  }

  if (body) {
    const ok = await postEvent(port, body);
    logHook(
      ok ? `ok event=${event} port=${port}` : `post failed event=${event} port=${port}`
    );
  }

  process.exit(0);
}

main().catch((err) => {
  logHook(`ERROR ${String(err)}`);
  process.exit(0);
});
