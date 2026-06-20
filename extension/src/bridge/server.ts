import * as http from 'http';
import type { BridgeEvent } from '../types';
import { BusyState } from './busyState';

export class BridgeServer {
  private server: http.Server | undefined;

  constructor(
    private readonly state: BusyState,
    private readonly log: (msg: string) => void
  ) {}

  start(port: number): Promise<number> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        const url = req.url?.split('?')[0];

        if (req.method === 'GET' && url === '/health') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              ok: true,
              busy: this.state.isBusy(),
              busy_ref: this.state.getRef(),
              status: this.state.getStatus(),
            })
          );
          return;
        }

        if (req.method === 'GET' && url === '/state') {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(this.state.snapshot()));
          return;
        }

        if (req.method === 'POST' && url === '/event') {
          let body = '';
          req.on('data', (chunk) => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const event = JSON.parse(body) as BridgeEvent;
              this.state.handle(event, this.log);
              res.writeHead(204);
              res.end();
            } catch {
              res.writeHead(400);
              res.end();
            }
          });
          return;
        }

        res.writeHead(404);
        res.end();
      });

      this.server.on('error', reject);

      this.server.listen(port, '127.0.0.1', () => {
        const addr = this.server?.address();
        const actualPort = typeof addr === 'object' && addr ? addr.port : port;
        this.log(`Bridge listening on 127.0.0.1:${actualPort}`);
        resolve(actualPort);
      });
    });
  }

  stop(): void {
    this.server?.close();
    this.server = undefined;
  }
}

export async function findAvailablePort(preferred: number, maxAttempts = 10): Promise<number> {
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferred + i;
    try {
      await new Promise<void>((resolve, reject) => {
        const s = http.createServer();
        s.once('error', reject);
        s.listen(port, '127.0.0.1', () => {
          s.close(() => resolve());
        });
      });
      return port;
    } catch {
      continue;
    }
  }
  throw new Error(`No available port near ${preferred}`);
}
