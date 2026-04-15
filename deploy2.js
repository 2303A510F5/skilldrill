const { execSync } = require('child_process');
try {
    console.log('Deploying via surge...');
    const result = execSync('npx.cmd surge ./ skilldrill-live-demo.surge.sh', {
        input: 'skilldrilldemo12345@example.com\nTestingPass123!\n',
        stdio: ['pipe', 'inherit', 'inherit']
    });
    console.log('Success!');
} catch(e) {
    console.error('Failed to deploy');
}
