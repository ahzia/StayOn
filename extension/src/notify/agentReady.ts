import { execFile } from 'child_process';
import * as fs from 'fs';
import * as vscode from 'vscode';

const MAC_SOUNDS = [
  '/System/Library/Sounds/Glass.aiff',
  '/System/Library/Sounds/Ping.aiff',
];

const LINUX_SOUNDS = [
  '/usr/share/sounds/freedesktop/stereo/complete.oga',
  '/usr/share/sounds/freedesktop/stereo/message-new-instant.oga',
];

const WIN_SOUND = 'C:\\Windows\\Media\\Windows Notify System Generic.wav';

export function playReadySound(log: (msg: string) => void): void {
  if (process.platform === 'darwin') {
    const sound = MAC_SOUNDS.find((p) => fs.existsSync(p));
    if (sound) {
      execFile('afplay', [sound], (err) => {
        if (err) {
          log(`Ready sound failed: ${String(err)}`);
        }
      });
    }
    return;
  }

  if (process.platform === 'win32' && fs.existsSync(WIN_SOUND)) {
    execFile(
      'powershell',
      [
        '-NoProfile',
        '-Command',
        `(New-Object System.Media.SoundPlayer '${WIN_SOUND.replace(/'/g, "''")}').Play()`,
      ],
      (err) => {
        if (err) {
          log(`Ready sound failed: ${String(err)}`);
        }
      }
    );
    return;
  }

  if (process.platform === 'linux') {
    const sound = LINUX_SOUNDS.find((p) => fs.existsSync(p));
    if (!sound) {
      return;
    }
    execFile('paplay', [sound], (err) => {
      if (err) {
        execFile('aplay', [sound], () => {});
      }
    });
  }
}

export async function focusHostWindow(log: (msg: string) => void): Promise<void> {
  try {
    await vscode.commands.executeCommand('workbench.action.focusActiveEditorGroup');
  } catch {
    // ignore
  }

  if (process.platform === 'win32') {
    const appName = vscode.env.appName;
    if (appName) {
      await new Promise<void>((resolve) => {
        execFile(
          'powershell',
          [
            '-NoProfile',
            '-Command',
            `(New-Object -ComObject WScript.Shell).AppActivate('${appName.replace(/'/g, "''")}')`,
          ],
          (err) => {
            if (err) {
              log(`Focus window failed: ${String(err)}`);
            }
            resolve();
          }
        );
      });
    }
    return;
  }

  if (process.platform !== 'darwin') {
    return;
  }

  const appName = vscode.env.appName;
  if (!appName) {
    return;
  }

  await new Promise<void>((resolve) => {
    execFile('osascript', ['-e', `tell application "${appName}" to activate`], (err) => {
      if (err) {
        log(`Focus window failed: ${String(err)}`);
      }
      resolve();
    });
  });
}

export async function alertAgentReady(
  log: (msg: string) => void,
  options: { surveyPersist: boolean; contextNote?: string }
): Promise<void> {
  const cfg = vscode.workspace.getConfiguration('stayon');
  const sound = cfg.get<boolean>('alertSoundOnReady') ?? true;
  const focus = cfg.get<boolean>('alertFocusOnReady') ?? true;

  if (!sound && !focus) {
    return;
  }

  const context = options.contextNote?.trim();
  const message = options.surveyPersist
    ? context
      ? `Agent finished — return to: "${truncate(context, 72)}" (survey still open in browser)`
      : 'Agent finished — back to your code (survey still open in browser)'
    : context
      ? `Agent finished — return to: "${truncate(context, 72)}"`
      : 'Agent finished — back to your code';

  void vscode.window
    .showInformationMessage(`StayOn: ${message}`, 'Open panel')
    .then((choice) => {
      if (choice === 'Open panel') {
        void vscode.commands.executeCommand('stayon.openPanel');
      }
    });

  if (focus) {
    await focusHostWindow(log);
  }
  if (sound) {
    playReadySound(log);
  }
}

function truncate(text: string, max: number): string {
  if (text.length <= max) {
    return text;
  }
  return `${text.slice(0, max - 1)}…`;
}
