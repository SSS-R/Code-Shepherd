const fs = require('fs');
const path = require('path');
const os = require('os');

const repoRoot = path.resolve(__dirname, '..');
const extensionRoot = path.join(repoRoot, 'packages', 'antigravity-companion');
const manifestPath = path.join(extensionRoot, 'package.json');
const antigravityExtensionsRoot = path.join(os.homedir(), '.antigravity', 'extensions');
const extensionsRegistryPath = path.join(antigravityExtensionsRoot, 'extensions.json');

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function removeDirIfExists(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
  }
}

function copyDir(sourceDir, targetDir) {
  ensureDir(targetDir);

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist') {
        continue;
      }
      copyDir(sourcePath, targetPath);
      continue;
    }

    fs.copyFileSync(sourcePath, targetPath);
  }
}

function buildRegistryEntry(manifest, installDir) {
  const identifier = `${manifest.publisher}.${manifest.name}`;

  return {
    identifier: { id: identifier },
    version: manifest.version,
    location: {
      $mid: 1,
      fsPath: installDir,
      _sep: 1,
      external: `file:///${installDir.replace(/\\/g, '/')}`,
      path: `/${installDir.replace(/\\/g, '/')}`,
      scheme: 'file',
    },
    relativeLocation: path.basename(installDir),
    metadata: {
      isApplicationScoped: false,
      isMachineScoped: false,
      isBuiltin: false,
      installedTimestamp: Date.now(),
      pinned: false,
      source: 'local',
      publisherDisplayName: manifest.publisher,
      targetPlatform: 'universal',
      updated: false,
      private: true,
      isPreReleaseVersion: false,
      hasPreReleaseVersion: false,
      preRelease: false,
    },
  };
}

function main() {
  const manifest = readJson(manifestPath, null);
  if (!manifest) {
    throw new Error(`Could not read companion manifest at ${manifestPath}`);
  }

  const extensionDirName = `${manifest.publisher}.${manifest.name}-${manifest.version}-universal`;
  const installDir = path.join(antigravityExtensionsRoot, extensionDirName);

  ensureDir(antigravityExtensionsRoot);

  for (const entry of fs.readdirSync(antigravityExtensionsRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith(`${manifest.publisher}.${manifest.name}-`)) {
      removeDirIfExists(path.join(antigravityExtensionsRoot, entry.name));
    }
  }

  copyDir(extensionRoot, installDir);

  const currentRegistry = readJson(extensionsRegistryPath, []);
  const filtered = Array.isArray(currentRegistry)
    ? currentRegistry.filter((entry) => entry?.identifier?.id !== `${manifest.publisher}.${manifest.name}`)
    : [];
  filtered.push(buildRegistryEntry(manifest, installDir));
  fs.writeFileSync(extensionsRegistryPath, JSON.stringify(filtered, null, 2), 'utf8');

  console.log('Installed Code Shepherd Antigravity Companion.');
  console.log(`Extension directory: ${installDir}`);
  console.log('Restart Antigravity, then run "Code Shepherd: Connect Antigravity Companion".');
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
