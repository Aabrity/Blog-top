import fs from 'fs';
import path from 'path';

// export const logActivity = async (userId, action, details = {}) => {
//   const log = {
//     timestamp: new Date().toISOString(),
//     userId,
//     action,
//     details,
//   };

//   const logLine = JSON.stringify(log) + '\n';
//   const logFilePath = path.join(process.cwd(), 'logs', 'activity.log');

//   fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
//   fs.appendFileSync(logFilePath, logLine, 'utf8');
// };
export const logActivity = async (userId, action, details = {}, req = null) => {
  const log = {
    timestamp: new Date().toISOString(),
    userId,
    action,
    details,
  };

  // Add request-based details if provided
  if (req) {
    log.ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    log.userAgent = req.headers['user-agent'];
  }

  const logLine = JSON.stringify(log) + '\n';
  const logFilePath = path.join(process.cwd(), 'logs', 'activity.log');

  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  fs.appendFileSync(logFilePath, logLine, 'utf8');
};
