const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
env.split('\n').forEach(line => {
  const cleanedLine = line.replace(/\r/g, '').trim();
  const match = cleanedLine.match(/^([^=]+)=(.*)$/);
  if (match && match[1] === 'DATABASE_URL') {
    const url = match[2];
    const masked = url.replace(/:([^:@]+)@/, ':****@');
    console.log('DATABASE_URL:', masked);
  }
});
