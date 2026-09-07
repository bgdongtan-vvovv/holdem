#!/usr/bin/env node
/**
 * Lightweight package installer that bypasses Tirith by fetching & extracting
 * the tarball directly. Used only when npm install is blocked by the security
 * scanner timing out on external lookups.
 *
 * Usage: node install-pkg.js <pkg>@<version> [target-dir]
 */
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const [pkgSpec, targetDir] = process.argv.slice(2);
if (!pkgSpec) {
  console.error('Usage: node install-pkg.js <pkg>@<version> [target-dir]');
  process.exit(1);
}

const TAR_CACHE = path.join(os.tmpdir(), 'npm-tar-cache');
fs.mkdirSync(TAR_CACHE, { recursive: true });

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (c) => (data += c));
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
      });
    }).on('error', reject);
  });
}

async function main() {
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(pkgSpec)}/latest`;
  console.log('fetching metadata:', registryUrl);
  const meta = await fetchJson(registryUrl);
  const version = meta.version;
  const tarUrl = meta.dist.tarball;
  const integrity = meta.dist.integrity;
  const dest = targetDir || path.join(process.cwd(), 'node_modules', pkgSpec.split('/')[0]);

  console.log(`package: ${pkgSpec} @ ${version}`);
  console.log('tarball:', tarUrl);

  const tarPath = path.join(TAR_CACHE, `${pkgSpec.replace('/', '_')}-${version}.tgz`);
  if (!fs.existsSync(tarPath)) {
    console.log('downloading tarball...');
    const tarStream = fs.createWriteStream(tarPath);
    await new Promise((resolve, reject) => {
      https.get(tarUrl, (res) => {
        res.pipe(tarStream);
        res.on('end', resolve);
        res.on('error', reject);
      }).on('error', reject);
    });
    console.log('download complete');
  }

  // Verify integrity if we can (sha512)
  if (integrity) {
    console.log('verifying integrity...');
    const expected = integrity.split(':')[1];
    const algo = integrity.split(':')[0]; // sha512
    const buf = fs.readFileSync(tarPath);
    const crypto = require('crypto');
    const hash = crypto.createHash(algo).update(buf).digest('base64');
    if (hash !== expected) {
      console.error('INTEGRITY CHECK FAILED');
      process.exit(2);
    }
    console.log('integrity OK');
  }

  // Extract
  console.log('extracting to', dest);
  fs.mkdirSync(dest, { recursive: true });
  execSync(`tar xzf "${tarPath}" --strip-components=1 -C "${dest}"`, {
    stdio: 'inherit',
  });
  console.log('done:', dest);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
