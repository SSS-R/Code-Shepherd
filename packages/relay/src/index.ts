/**
 * CodeShepherd Relay Server
 * Express + TypeScript server with SQLite and Temporal.io integration
 */

import express, { Request, Response } from 'express';
import { createServer } from 'http';
import Database from 'better-sqlite3';
import { NativeConnection, Worker } from '@temporalio/worker';
import { Connection, WorkflowClient } from '@temporalio/client';
import { createAgentRoutes } from './routes/agents';
import { createApprovalRoutes } from './routes/approvals';
import { createNotificationRoutes } from './routes/notifications';
import { createAuditRoutes } from './routes/audit';
import { createWorkflowRoutes } from './routes/workflows';
import { createTaskRoutes } from './routes/tasks';
import { createOperationsRoutes } from './routes/operations';
import { createAuthRoutes } from './routes/auth';
import { createDemoRoutes } from './routes/demo';
import { createConversationRoutes } from './routes/conversations';
import { createConnectorRoutes } from './routes/connectors';
import { getVapidKeys } from './utils/vapidKeys';
import * as activities from './activities';
import { initializeRealtime } from './realtime';
import { ensureShepherdGuideAgent } from './guide/shepherdGuide';
import { createRateLimiter } from './middleware/rateLimit';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || './relay.db';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'code-shepherd-queue';
const UI_ORIGIN = process.env.UI_ORIGIN || 'http://localhost:5173';

// Get VAPID keys for Web Push
const vapidKeys = getVapidKeys();

// Middleware
app.disable('x-powered-by');
app.use((req: Request, res: Response, next: Function) => {
  const origin = req.header('origin');

  if (origin && origin === UI_ORIGIN) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Connector-Id, X-Connector-Secret');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  }

  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      `connect-src 'self' ${UI_ORIGIN} ws://localhost:3000 http://localhost:3000 ws://localhost:5173 http://localhost:5173`,
    ].join('; ')
  );

  if (req.method === 'OPTIONS') {
    return res.status(204).send();
  }

  return next();
});
app.use(createRateLimiter({
  windowMs: 60 * 1000,
  max: 240,
  message: 'Too many requests. Please slow down.',
}));
app.use(express.json({ limit: '256kb' }));
app.use((req: Request, res: Response, next: Function) => {
  // Log all requests to audit trail
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// SQLite Database
const db = new Database(DATABASE_PATH);

// Temporal.io connections
let temporalWorker: Worker | null = null;
let workflowClient: WorkflowClient | null = null;

async function initializeTemporal() {
  try {
    const connection = await NativeConnection.connect({
      address: TEMPORAL_ADDRESS
    });

    temporalWorker = await Worker.create({
      connection,
      namespace: TEMPORAL_NAMESPACE,
      taskQueue: TEMPORAL_TASK_QUEUE,
      workflowsPath: require.resolve('./workflows'),
      activities
    });

    // Create client for querying
    const clientConnection = await Connection.connect({
      address: TEMPORAL_ADDRESS
    });
    workflowClient = new WorkflowClient({
      connection: clientConnection,
      namespace: TEMPORAL_NAMESPACE,
    });

    console.log('Temporal worker and client connected');
  } catch (error) {
    console.error('Temporal connection failed (expected in dev):', error);
  }
}

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    temporal: temporalWorker ? 'connected' : 'disconnected',
    agents: db.prepare('SELECT COUNT(*) as count FROM agents').get()
  });
});

// Agent Registry API
app.use('/agents', createAgentRoutes(db));

// Approval Queue API
app.use('/approvals', createApprovalRoutes(db, workflowClient));

// Audit Logs API
app.use('/audit-logs', createAuditRoutes(db));

// Push Notifications API
app.use('/notifications', createNotificationRoutes(db, vapidKeys));

// Auth / Teams API
app.use('/auth', createAuthRoutes(db));

// Demo seed API
app.use('/demo', createDemoRoutes(db));

// Workflows API
app.use('/workflows', createWorkflowRoutes(workflowClient));

// Conversations API
app.use('/conversations', createConversationRoutes(db));

// Tasks API
app.use('/tasks', createTaskRoutes(db));

// Operational runtime scaffolding
app.use('/operations', createOperationsRoutes(db));

// Connector trust and governance API
app.use('/connectors', createConnectorRoutes(db));

// Start server
async function start() {
  await initializeTemporal();

  ensureShepherdGuideAgent(db);

  initializeRealtime(server);

  server.listen(PORT, () => {
    console.log(`Relay server running on http://localhost:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/health`);
    console.log(`Agent API: http://localhost:${PORT}/agents`);
    console.log(`Agent Timeline: http://localhost:${PORT}/agents/:id/timeline`);
    console.log(`Approval API: http://localhost:${PORT}/approvals`);
    console.log(`Audit Log API: http://localhost:${PORT}/audit-logs`);
    console.log(`Workflows API: http://localhost:${PORT}/workflows`);
    console.log(`Notifications API: http://localhost:${PORT}/notifications`);
    console.log(`VAPID Public Key: ${vapidKeys.publicKey}`);
    console.log(`Database Path: ${DATABASE_PATH}`);
    console.log(`Temporal Address: ${TEMPORAL_ADDRESS}`);
    console.log(`Realtime WS: ws://localhost:${PORT}/realtime`);
  });
}

start().catch(console.error);
