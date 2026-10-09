const { execFileSync } = require('child_process');
const { readFileSync, existsSync } = require('fs');

// Report filenames only, so CI logs never expose the matched credentials.
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0').filter(Boolean);
const exposedFiles = files.filter(file => existsSync(file) &&
  /AIza[0-9A-Za-z_-]{35}/.test(readFileSync(file, 'utf8')));

if (exposedFiles.length) {
  console.error('Google API keys found in tracked files:\n' + exposedFiles.join('\n'));
  process.exitCode = 1;
} else {
  console.log('No literal Google API keys found in tracked files. Git history must be audited separately.');
}
