// start-wrapper.js
import { exec } from 'child_process';
import { promisify } from 'util';
import fetch from 'node-fetch';

const execAsync = promisify(exec);

async function waitForServer(url, timeout = 60000, interval = 2000) {  // longer timeout for safety
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const res = await fetch(`${url}/server/ping`);
      if (res.ok) return true;
    } catch {}
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error('Directus server did not become ready in time');
}

async function main() {
  try {
    console.log('Bootstrapping Directus...');
    await execAsync('npx directus bootstrap');

    console.log('Applying schema snapshot...');
    await execAsync('npx directus schema apply ./snapshot.yaml --yes');

    console.log('Starting Directus server in background...');
    const directusProcess = exec('npx directus start');

    // Pipe logs so Render shows them
    directusProcess.stdout?.pipe(process.stdout);
    directusProcess.stderr?.pipe(process.stderr);

    console.log('Waiting for Directus API to be ready...');
    await waitForServer('http://localhost:8055');

    console.log('Applying configuration sync...');
    await execAsync('npx directus-sync push');  // or 'import' if that's your alias

    console.log('Startup complete – configuration synced.');

    // Keep alive
    directusProcess.on('exit', (code) => {
      console.log(`Directus exited with code ${code}`);
      process.exit(code);
    });
  } catch (error) {
    console.error('Startup failed:', error.message);
    process.exit(1);
  }
}

main();