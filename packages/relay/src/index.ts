/**
 * AgentOps Relay Server
 * Express + TypeScript server with SQLite and Temporal.io integration
 */

import express, { Request, Response } from 'express';
import Database from 'better-sqlite3';
import { Connection, Worker } from '@temporalio';

const app = express();
const PORT = process.env.PORT || 3000;

// SQLite Database
const db = new Database('./relay.db');

// Initialize database tables
db.exec(`
  CREATE TABLE IF NOT EXISTS agents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'inactive',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Temporal.io connection
let temporalWorker: Worker | null = null;

async function initializeTemporal() {
  try {
    const connection = await Connection.connect({
      address: 'localhost:7233'
    });
    
    temporalWorker = await Worker.create({
      connection,
      namespace: 'default',
      taskQueue: 'agentops-queue',
      workflowsPath: require.resolve('./workflows'),
      activitiesPath: require.resolve('./activities')
    });
    
    console.log('Temporal worker connected');
  } catch (error) {
    console.error('Temporal connection failed (expected in dev):', error);
  }
}

// Routes
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', temporal: temporalWorker ? 'connected' : 'disconnected' });
});

app.get('/agents', (req: Request, res: Response) => {
  const agents = db.prepare('SELECT * FROM agents').all();
  res.json(agents);
});

app.post('/agents', (req: Request, res: Response) => {
  const { name } = req.body;
  const stmt = db.prepare('INSERT INTO agents (name) VALUES (?)');
  const result = stmt.run(name);
  res.json({ id: result.lastInsertRowid, name });
});

// Start server
async function start() {
  await initializeTemporal();
  
  app.listen(PORT, () => {
    console.log(`Relay server running on http://localhost:${PORT}`);
  });
}

start().catch(console.error);
