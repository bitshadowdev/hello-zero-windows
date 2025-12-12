#!/usr/bin/env node
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

function parseEnvFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    let key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

(async () => {
  const envPath = path.join(process.cwd(), '.env');
  const env = fs.existsSync(envPath) ? parseEnvFile(envPath) : {};
  const replicaFile = env.ZERO_REPLICA_FILE || 'sync-replica.db';

  try {
    console.log('Removing Docker volume: docker_zstart_pgdata (if exists)');
    execSync('docker volume rm -f docker_zstart_pgdata', { stdio: 'inherit' });
  } catch (e) {
    console.log('docker volume rm failed or volume does not exist.');
  }

  try {
    if (fs.existsSync(replicaFile)) {
      console.log(`Removing replica file ${replicaFile}`);
      fs.rmSync(replicaFile, { recursive: true, force: true });
    } else {
      console.log(`Replica file ${replicaFile} not found; nothing to remove`);
    }
  } catch (e) {
    console.error('Failed to remove replica file', e.message);
  }
})();
