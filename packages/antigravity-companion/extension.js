const vscode = require('vscode');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { URL } = require('url');

const SESSION_FILE_PATH = path.join(os.homedir(), '.code-shepherd', 'antigravity-companion-session.json');
const PENDING_TASKS_KEY = 'code-shepherd.pendingTasks';

function formatError(error) {
  if (typeof AggregateError !== 'undefined' && error instanceof AggregateError) {
    const nested = Array.from(error.errors || []).map((item) => formatError(item)).filter(Boolean);
    return nested.length ? `AggregateError: ${nested.join(' | ')}` : 'AggregateError';
  }

  if (error instanceof Error) {
    return error.message || error.toString();
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error === null || error === undefined) {
    return '(no error details returned)';
  }

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function createRelayClient(session) {
  const relayBaseUrl = String(session.relayUrl || '').replace(/\/$/, '');

  function performRequest(url, relayPath, init = {}) {
    const payload = init.body || null;
    const transport = url.protocol === 'https:' ? https : http;
    const headers = {
      'Content-Type': 'application/json',
      'x-connector-access-token': session.connectorAccessToken,
      ...(init.headers || {}),
    };

    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }

    return new Promise((resolve, reject) => {
      const request = transport.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port,
          path: `${url.pathname}${url.search}`,
          method: init.method || 'GET',
          headers,
        },
        (response) => {
          let raw = '';

          response.on('data', (chunk) => {
            raw += chunk.toString();
          });

          response.on('end', () => {
            if ((response.statusCode || 500) >= 400) {
              reject(new Error(`Relay request failed (${response.statusCode}) on ${relayPath}: ${raw}`));
              return;
            }

            if (response.statusCode === 204 || !raw.trim()) {
              resolve(undefined);
              return;
            }

            try {
              resolve(JSON.parse(raw));
            } catch (error) {
              reject(new Error(`Relay returned invalid JSON on ${relayPath}: ${error.message}`));
            }
          });
        },
      );

      request.on('error', (error) => {
        reject(new Error(`Transport error on ${relayPath}: ${formatError(error)}`));
      });
      if (payload) {
        request.write(payload);
      }
      request.end();
    });
  }

  async function request(relayPath, init = {}) {
    const primaryUrl = new URL(`${relayBaseUrl}${relayPath}`);

    try {
      return await performRequest(primaryUrl, relayPath, init);
    } catch (error) {
      const shouldRetryLoopback = primaryUrl.hostname === 'localhost';
      if (!shouldRetryLoopback) {
        throw error;
      }

      const fallbackUrl = new URL(primaryUrl.toString());
      fallbackUrl.hostname = '127.0.0.1';
      return performRequest(fallbackUrl, relayPath, init);
    }
  }

  return {
    registerAgent() {
      return request('/agents/register', {
        method: 'POST',
        body: JSON.stringify({
          id: session.agent.id,
          name: session.agent.name,
          capabilities: session.agent.capabilities || ['mcp', 'antigravity', 'chat', 'bridge', 'companion'],
          connector_id: session.connectorId,
          adapter_id: session.agent.adapterId || 'antigravity-companion',
          runtime_transport: session.agent.transport || 'mcp',
        }),
      });
    },
    heartbeat() {
      return request(`/agents/${encodeURIComponent(session.agent.id)}/heartbeat`, {
        method: 'POST',
      });
    },
    pollCommands() {
      return request(`/conversations/commands/poll?agent_id=${encodeURIComponent(session.agent.id)}`, {
        method: 'GET',
      });
    },
    ackCommand(commandId) {
      return request(`/conversations/commands/${encodeURIComponent(commandId)}/ack`, {
        method: 'POST',
      });
    },
    sendReply(conversationId, commandId, payload) {
      return request(`/conversations/${encodeURIComponent(conversationId)}/replies`, {
        method: 'POST',
        body: JSON.stringify({
          agent_id: session.agent.id,
          command_id: commandId,
          message_type: payload.messageType || 'text',
          content: payload.content,
          metadata: payload.metadata,
        }),
      });
    },
    async exchangePairingCode(pairingCode, machineLabel) {
      return request('/connectors/pair/exchange', {
        method: 'POST',
        body: JSON.stringify({
          pairing_code: pairingCode,
          machine_label: machineLabel,
        }),
      });
    },
  };
}

function readSessionFile() {
  try {
    if (!fs.existsSync(SESSION_FILE_PATH)) {
      return null;
    }

    return JSON.parse(fs.readFileSync(SESSION_FILE_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function writeSessionFile(session) {
  fs.mkdirSync(path.dirname(SESSION_FILE_PATH), { recursive: true });
  fs.writeFileSync(SESSION_FILE_PATH, JSON.stringify(session, null, 2), 'utf8');
}

class CompanionTaskItem extends vscode.TreeItem {
  constructor(task) {
    super(task.preview || task.agentLabel || task.id, vscode.TreeItemCollapsibleState.None);
    this.task = task;
    this.id = task.id;
    this.description = task.modelHint || task.createdLabel;
    this.tooltip = `${task.agentLabel}\n\n${task.content}`;
    this.command = {
      command: 'codeShepherdCompanion.openTask',
      title: 'Open Companion Task',
      arguments: [task],
    };
    this.contextValue = 'codeShepherdCompanionTask';
  }
}

class CompanionTaskProvider {
  constructor() {
    this.tasks = [];
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }

  setTasks(tasks) {
    this.tasks = tasks;
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(item) {
    return item;
  }

  getChildren() {
    return this.tasks.map((task) => new CompanionTaskItem(task));
  }
}

class CompanionController {
  constructor(context) {
    this.context = context;
    this.session = null;
    this.connected = false;
    this.heartbeatTimer = null;
    this.pollTimer = null;
    this.taskProvider = new CompanionTaskProvider();
    this.output = vscode.window.createOutputChannel('Code Shepherd Companion');
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.statusBar.command = 'codeShepherdCompanion.connect';
    this.statusBar.show();
    this.pendingTasks = context.globalState.get(PENDING_TASKS_KEY, []);
    this.taskProvider.setTasks(this.pendingTasks);
    this.refreshStatusBar();
  }

  dispose() {
    this.stop();
    this.output.dispose();
    this.statusBar.dispose();
  }

  log(message) {
    this.output.appendLine(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  refreshStatusBar() {
    if (this.connected && this.session) {
      this.statusBar.text = `$(radio-tower) Shepherd: ${this.pendingTasks.length} pending`;
      this.statusBar.tooltip = `Connected as ${this.session.agent.name}`;
      return;
    }

    this.statusBar.text = '$(plug) Shepherd: offline';
    this.statusBar.tooltip = 'Connect the Code Shepherd Antigravity Companion';
  }

  async persistTasks() {
    await this.context.globalState.update(PENDING_TASKS_KEY, this.pendingTasks);
    this.taskProvider.setTasks(this.pendingTasks);
    this.refreshStatusBar();
  }

  async loadSession() {
    this.session = readSessionFile();
    return this.session;
  }

  async pairInteractive() {
    const pairingCode = await vscode.window.showInputBox({
      title: 'Pair Antigravity Companion',
      prompt: 'Enter the one-time pairing code from Code Shepherd',
      ignoreFocusOut: true,
      placeHolder: 'ABCD-EFGH',
    });

    if (!pairingCode) {
      return;
    }

    const relayUrl = await vscode.window.showInputBox({
      title: 'Relay URL',
      prompt: 'Enter the relay URL',
      value: 'http://localhost:3000',
      ignoreFocusOut: true,
    });

    if (!relayUrl) {
      return;
    }

    const machineLabel = os.hostname();
    const pairingRelay = createRelayClient({ relayUrl, connectorAccessToken: '', agent: {} });
    this.log(`Pairing companion against ${relayUrl}`);
    const pairing = await pairingRelay.exchangePairingCode(pairingCode.trim().toUpperCase(), machineLabel);

    const session = {
      relayUrl: pairing.relay_url,
      connectorId: pairing.connector_id,
      connectorAccessToken: pairing.connector_access_token,
      connectorAccessTokenExpiresAt: pairing.connector_access_token_expires_at,
      machineLabel,
      agent: {
        id: pairing.agent.id,
        name: pairing.agent.name,
        adapterId: pairing.agent.adapter_id,
        capabilities: pairing.agent.capabilities,
        transport: pairing.agent.transport,
        adapterKind: pairing.agent.adapter_kind,
      },
      pairedAt: new Date().toISOString(),
      sessionFilePath: SESSION_FILE_PATH,
    };

    writeSessionFile(session);
    this.session = session;
    this.log(`Pairing complete for ${session.agent.name}`);
    vscode.window.showInformationMessage('Antigravity Companion paired successfully.');
    await this.connect();
  }

  async connect() {
    try {
      const session = this.session || await this.loadSession();
      if (!session) {
        vscode.window.showWarningMessage('No Antigravity companion session found yet. Pair it first from Code Shepherd.');
        return;
      }

      this.stop();
      this.session = session;
      this.client = createRelayClient(session);
      this.log(`Connecting as ${session.agent.name} to ${session.relayUrl}`);

      await this.client.registerAgent();
      await this.client.heartbeat();
      this.connected = true;
      this.refreshStatusBar();
      this.log('Connected successfully');

      this.heartbeatTimer = setInterval(() => {
        void this.client.heartbeat().catch((error) => {
          const message = formatError(error);
          this.log(`Heartbeat failed: ${message}`);
          void vscode.window.showWarningMessage(`Code Shepherd heartbeat failed: ${message}`);
        });
      }, 30000);

      this.pollTimer = setInterval(() => {
        void this.pollOnce();
      }, 4000);

      await this.pollOnce();
      vscode.window.showInformationMessage(`Connected to Code Shepherd as ${session.agent.name}.`);
    } catch (error) {
      const message = formatError(error);
      this.connected = false;
      this.refreshStatusBar();
      this.log(`Connect failed: ${message}`);
      this.output.show(true);
      vscode.window.showErrorMessage(`Code Shepherd companion could not connect: ${message}`);
    }
  }

  stop() {
    this.connected = false;
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.refreshStatusBar();
  }

  async pollOnce() {
    if (!this.connected || !this.client || !this.session) {
      return;
    }

    try {
      const commands = await this.client.pollCommands();
      for (const command of commands) {
        const alreadyPending = this.pendingTasks.some((task) => task.id === command.id);
        if (alreadyPending) {
          continue;
        }

        this.log(`Received command ${command.id}`);
        await this.client.ackCommand(command.id);
        const task = {
          id: command.id,
          conversationId: command.conversation_id,
          content: command.content,
          metadata: command.metadata || {},
          agentLabel: this.session.agent.name,
          createdAt: command.created_at,
          createdLabel: new Date(command.created_at).toLocaleTimeString(),
          preview: command.content.trim().slice(0, 80) || '(empty task)',
          modelHint: typeof command.metadata?.selected_model === 'string' ? command.metadata.selected_model : undefined,
        };

        this.pendingTasks = [task, ...this.pendingTasks];
        await this.persistTasks();

        await this.client.sendReply(command.conversation_id, command.id, {
          content: 'Task received inside Antigravity Companion. Review it in the Companion panel and reply from Antigravity.',
          messageType: 'status',
          metadata: {
            source: 'antigravity-companion',
            handoff: 'queued',
            selected_model: task.modelHint,
          },
        });

        void vscode.window.showInformationMessage(
          `New Code Shepherd task: ${task.preview}`,
          'Reply with Input',
          'Reply with Selection',
        ).then(async (choice) => {
          if (choice === 'Reply with Input') {
            await this.replyWithInput(task);
          } else if (choice === 'Reply with Selection') {
            await this.replyWithSelection(task);
          }
        });
      }
    } catch (error) {
      this.log(`Polling failed: ${formatError(error)}`);
    }
  }

  async chooseTask(explicitTask) {
    if (explicitTask) {
      return explicitTask;
    }

    if (this.pendingTasks.length === 0) {
      vscode.window.showInformationMessage('No pending Code Shepherd tasks inside Antigravity Companion.');
      return null;
    }

    if (this.pendingTasks.length === 1) {
      return this.pendingTasks[0];
    }

    const pick = await vscode.window.showQuickPick(
      this.pendingTasks.map((task) => ({
        label: task.preview,
        description: task.modelHint || task.createdLabel,
        task,
      })),
      {
        title: 'Choose a Code Shepherd task',
        ignoreFocusOut: true,
      },
    );

    return pick ? pick.task : null;
  }

  async replyWithInput(explicitTask) {
    const task = await this.chooseTask(explicitTask);
    if (!task || !this.client) {
      return;
    }

    const reply = await vscode.window.showInputBox({
      title: 'Reply to Code Shepherd task',
      prompt: task.preview,
      ignoreFocusOut: true,
    });

    if (!reply || !reply.trim()) {
      return;
    }

    await this.client.sendReply(task.conversationId, task.id, {
      content: reply.trim(),
      messageType: 'text',
      metadata: {
        source: 'antigravity-companion',
        reply_mode: 'input-box',
      },
    });

    this.pendingTasks = this.pendingTasks.filter((item) => item.id !== task.id);
    await this.persistTasks();
    this.log(`Sent typed reply for task ${task.id}`);
    vscode.window.showInformationMessage('Reply sent to Code Shepherd.');
  }

  async replyWithSelection(explicitTask) {
    const task = await this.chooseTask(explicitTask);
    if (!task || !this.client) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    const selection = editor ? editor.document.getText(editor.selection).trim() : '';
    if (!selection) {
      vscode.window.showWarningMessage('Select some text in the active editor first, then retry.');
      return;
    }

    await this.client.sendReply(task.conversationId, task.id, {
      content: selection,
      messageType: 'text',
      metadata: {
        source: 'antigravity-companion',
        reply_mode: 'active-selection',
        file_path: editor.document.uri.fsPath,
      },
    });

    this.pendingTasks = this.pendingTasks.filter((item) => item.id !== task.id);
    await this.persistTasks();
    this.log(`Sent selection reply for task ${task.id}`);
    vscode.window.showInformationMessage('Selected text sent back to Code Shepherd.');
  }

  async openTask(task) {
    const action = await vscode.window.showInformationMessage(
      task.content,
      { modal: true, detail: `Task ID: ${task.id}${task.modelHint ? `\nModel hint: ${task.modelHint}` : ''}` },
      'Reply with Input',
      'Reply with Selection',
    );

    if (action === 'Reply with Input') {
      await this.replyWithInput(task);
    } else if (action === 'Reply with Selection') {
      await this.replyWithSelection(task);
    }
  }
}

function activate(context) {
  const controller = new CompanionController(context);

  context.subscriptions.push(
    controller,
    vscode.window.registerTreeDataProvider('codeShepherdCompanion.tasks', controller.taskProvider),
    vscode.commands.registerCommand('codeShepherdCompanion.pair', () => controller.pairInteractive()),
    vscode.commands.registerCommand('codeShepherdCompanion.connect', () => controller.connect()),
    vscode.commands.registerCommand('codeShepherdCompanion.disconnect', () => controller.stop()),
    vscode.commands.registerCommand('codeShepherdCompanion.replyWithInput', (task) => controller.replyWithInput(task)),
    vscode.commands.registerCommand('codeShepherdCompanion.replyWithSelection', (task) => controller.replyWithSelection(task)),
    vscode.commands.registerCommand('codeShepherdCompanion.openTask', (task) => controller.openTask(task)),
  );

  void controller.loadSession().then((session) => {
    if (session) {
      void controller.connect();
    }
  });
}

function deactivate() {
  return undefined;
}

module.exports = {
  activate,
  deactivate,
};
