const { spawn } = require('child_process');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const forwardedArgs = process.argv[1] && process.argv[1].startsWith('--')
  ? process.argv.slice(1)
  : process.argv.slice(2);

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32' && command === npmCommand,
    ...options,
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Process exited with code ${code ?? 'unknown'}`));
    });
  });
}

async function main() {
  if (forwardedArgs.includes('--help')) {
    console.log('Usage: npm run start:gateway -- --pairing-code <CODE> --relay-url <URL>');
    console.log('If a local session is already paired, you can simply run: npm run start:gateway');
    return;
  }

  await waitForExit(run(npmCommand, ['run', 'build', '--workspace=@code-shepherd/universal-mcp-gateway']));

  const gatewayEntry = path.join(repoRoot, 'packages', 'universal-mcp-gateway', 'dist', 'index.js');
  const gateway = run(process.execPath, [gatewayEntry, ...forwardedArgs]);

  gateway.on('exit', (code) => {
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
