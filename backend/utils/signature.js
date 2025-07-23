import crypto from 'crypto';

export function generateSignature(params, secretKey) {
  const data = Object.keys(params)
    .map(k => `${k}=${params[k]}`)
    .join(',');
  return crypto.createHmac('sha256', secretKey).update(data).digest('base64');
}
