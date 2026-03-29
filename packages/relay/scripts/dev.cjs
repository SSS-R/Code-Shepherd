const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const relayRoot = path.resolve(__dirname, '..');
const npmCommand = 'npm';
const distRoot = path.join(relayRoot, 'dist');

function spawnProcess(command, args, extraOptions = {}) {
  return spawn(command, args, {
    cwd: relayRoot,
    stdio: 'inherit',
    ...extraOptions,
  });
}

function runBuild() {
  return new Promise((resolve, reject) => {
    const build = spawnProcess(npmCommand, ['run', 'build'], {
      shell: process.platform === 'win32',
    });

    build.on('error', reject);
    build.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Initial relay build failed with exit code ${code ?? 'unknown'}`));
    });
  });
}

async function main() {
  await runBuild();

  let isShuttingDown = false;
  let isRestartingServer = false;
  let restartTimer = null;
  let serverProcess = null;

  const compilerProcess = spawnProcess(npmCommand, ['run', 'build', '--', '--watch', '--preserveWatchOutput'], {
    shell: process.platform === 'win32',
  });

  const watchHandle = fs.watch(distRoot, { recursive: true }, (_eventType, fileName) => {
    if (!fileName || !String(fileName).endsWith('.js')) {
      return;
    }

    if (restartTimer) {
      clearTimeout(restartTimer);
    }

    restartTimer = setTimeout(() => {
      restartServer();
    }, 150);
  });

  const shutdown = (signal) => {
    isShuttingDown = true;
    watchHandle.close();

    if (restartTimer) {
      clearTimeout(restartTimer);
      restartTimer = null;
    }

    for (const child of [compilerProcess, serverProcess]) {
      if (child && !child.killed) {
        child.kill(signal);
      }
    }
  };

  const startServer = () => {
    serverProcess = spawnProcess(process.execPath, ['dist/index.js']);
    serverProcess.on('exit', (code) => {
      if (isShuttingDown || isRestartingServer) {
        return;
      }

      if (code && code !== 0) {
        shutdown('SIGTERM');
        process.exit(code);
      }
    });
  };

  const restartServer = () => {
    if (!serverProcess || serverProcess.killed) {
      startServer();
      return;
    }

    isRestartingServer = true;
    serverProcess.once('exit', () => {
      isRestartingServer = false;
      startServer();
    });
    serverProcess.kill('SIGTERM');
  };

  startServer();

  process.on('SIGINT', () => {
    shutdown('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM');
    process.exit(0);
  });

  compilerProcess.on('exit', (code) => {
    if (isShuttingDown) {
      return;
    }

    if (code && code !== 0) {
      shutdown('SIGTERM');
      process.exit(code);
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
