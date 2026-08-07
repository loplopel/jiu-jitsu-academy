import crypto from 'crypto';
export const QR_TTL_SECONDS=30;
export function createQrToken(){return crypto.randomBytes(32).toString('hex')}
export function hashQrToken(token:string){return crypto.createHash('sha256').update(token).digest('hex')}
export function isExpired(expiresAt:string,now=new Date()){return new Date(expiresAt).getTime()<=now.getTime()}
