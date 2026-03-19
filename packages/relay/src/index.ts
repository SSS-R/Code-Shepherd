/**
 * AgentOps Relay Server
 * Express + TypeScript server with SQLite and Temporal.io integration
 */

import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { NativeConnection, Worker } from '@temporalio/worker';
import { Connection, WorkflowClient } from '@temporalio/client';
import { createAgentRoutes } from './routes/agents';
import { createApprovalRoutes } from './routes/approvals';
import { createNotificationRoutes } from './routes/notifications';
import { createAuditRoutes } from './routes/audit';
import { createWorkflowRoutes } from './routes/workflows';
import { getVapidKeys } from './utils/vapidKeys';
import * as activities from './activities';

const app = express();
const PORT = process.env.PORT || 3000;
const DATABASE_PATH = process.env.DATABASE_PATH || './relay.db';
const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'localhost:7233';
const TEMPORAL_NAMESPACE = process.env.TEMPORAL_NAMESPACE || 'default';
const TEMPORAL_TASK_QUEUE = process.env.TEMPORAL_TASK_QUEUE || 'agentops-queue';

// Get VAPID keys for Web Push
const vapidKeys = getVapidKeys();

// Middleware
app.use(express.json());
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
app.use('/approvals', createApprovalRoutes(db));

// Audit Logs API
app.use('/audit-logs', createAuditRoutes(db));

// Push Notifications API
app.use('/notifications', createNotificationRoutes(db, vapidKeys));

// Workflows API
app.use('/workflows', createWorkflowRoutes(workflowClient));

// Start server
async function start() {
  await initializeTemporal();

  app.listen(PORT, () => {
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
  });
}

start().catch(console.error);
