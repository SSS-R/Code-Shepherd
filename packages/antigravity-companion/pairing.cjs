const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const { URL } = require('url');

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next && !next.startsWith('--')) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = 'true';
    }
  }
  return parsed;
}

function resolveSessionFile() {
  return path.join(os.homedir(), '.code-shepherd', 'antigravity-companion-session.json');
}

function requestJson(urlString, body) {
  const url = new URL(urlString);
  const transport = url.protocol === 'https:' ? https : http;
  const payload = JSON.stringify(body);

  return new Promise((resolve, reject) => {
    const request = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port,
        path: `${url.pathname}${url.search}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      },
      (response) => {
        let raw = '';

        response.on('data', (chunk) => {
          raw += chunk.toString();
        });

        response.on('end', () => {
          if ((response.statusCode || 500) >= 400) {
            reject(new Error(`Pairing failed (${response.statusCode}): ${raw}`));
            return;
          }

          try {
            resolve(JSON.parse(raw));
          } catch (error) {
            reject(new Error(`Pairing returned invalid JSON: ${error.message}`));
          }
        });
      },
    );

    request.on('error', reject);
    request.write(payload);
    request.end();
  });
}

async function main() {
  const cli = parseArgs(process.argv.slice(2));
  const pairingCode = cli['pairing-code'];
  const relayUrl = (cli['relay-url'] || 'http://localhost:3000').replace(/\/$/, '');
  const machineLabel = cli['machine-label'] || os.hostname();
  const sessionFile = cli['session-file'] || resolveSessionFile();

  if (!pairingCode) {
    console.error('Usage: npm run pair:antigravity-companion -- --pairing-code <CODE> --relay-url <URL>');
    process.exit(1);
  }

  const pairing = await requestJson(`${relayUrl}/connectors/pair/exchange`, {
    pairing_code: pairingCode,
    machine_label: machineLabel,
  });
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
    sessionFilePath: sessionFile,
  };

  fs.mkdirSync(path.dirname(sessionFile), { recursive: true });
  fs.writeFileSync(sessionFile, JSON.stringify(session, null, 2), 'utf8');

  console.log(`Antigravity companion paired successfully.`);
  console.log(`Session file: ${sessionFile}`);
  console.log(`Next step: open Antigravity and run "Code Shepherd: Connect Antigravity Companion".`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
