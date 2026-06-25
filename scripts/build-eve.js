const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const agentDir = path.join(process.cwd(), 'src', 'agent');

try {
  console.log('Running npx eve build...');
  execSync('npx eve build', { stdio: 'inherit', cwd: agentDir });

  const funcDir = path.join(agentDir, '.vercel', 'output', 'functions', '__server.func');
  if (fs.existsSync(funcDir)) {
    const vcConfigPath = path.join(funcDir, '.vc-config.json');
    if (!fs.existsSync(vcConfigPath)) {
      console.log('Writing missing .vc-config.json for Eve Vercel deployment...');
      fs.writeFileSync(vcConfigPath, JSON.stringify({
        runtime: "nodejs20.x",
        handler: "index.mjs",
        launcherType: "Nodejs"
      }, null, 2));
    }
  }
} catch (error) {
  console.error('Eve build failed:', error);
  process.exit(1);
}
