const { spawn } = require('child_process');

const surge = spawn('npx.cmd', ['--yes', 'surge', './', 'skilldrill-12345.surge.sh'], {
    cwd: 'cwd'
    // Actually the cwd needs to be replaced
});
