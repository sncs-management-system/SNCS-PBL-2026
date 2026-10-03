import type { IncomingMessage, ServerResponse } from 'node:http';
import { ConfigurationError, configuredApp } from './runtime.js';

export function createVercelHandler() {
  let app: ReturnType<typeof configuredApp> | undefined;
  return (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Initialize on invocation so deployment builds do not need runtime secrets.
      app ??= configuredApp(process.env, 'vercel');
    } catch (error) {
      // Report only setting names to deployment logs, never credential values.
      console.error(error instanceof ConfigurationError ? error.message : 'Enrollment API initialization failed');
      res.statusCode = 503;
      res.setHeader('Cache-Control', 'no-store');
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ message: 'Enrollment service is temporarily unavailable. Keep this page open and try again.' }));
      return;
    }
    app(req, res);
  };
}

export default createVercelHandler();
