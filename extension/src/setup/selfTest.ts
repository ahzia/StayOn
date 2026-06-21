/** When armed, the next busy_start from hook self-test must not open the panel. */
let skipNextBusyStart = false;

export function armSelfTestSkipPanel(): void {
  skipNextBusyStart = true;
}

export function consumeSelfTestSkipPanel(): boolean {
  if (!skipNextBusyStart) {
    return false;
  }
  skipNextBusyStart = false;
  return true;
}
