import { CPX_POSTBACK_IPS } from './cpx';

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() ?? '';
  }
  return request.headers.get('x-real-ip') ?? '';
}

export function isAllowedPostbackIp(ip: string, skipCheck: boolean): boolean {
  if (skipCheck || process.env.NODE_ENV === 'development') {
    return true;
  }
  if (!ip) {
    return false;
  }
  return CPX_POSTBACK_IPS.has(ip);
}
