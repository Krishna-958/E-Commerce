const https = require('http');
const data = JSON.stringify({ amount: 100, cartItems: [], userShipping: { address: 'Test Address' }, userId: 'testuser' });
const options = { hostname: 'localhost', port: 1000, path: '/api/payment/checkout', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } };
const req = https.request(options, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => { console.log('STATUS', res.statusCode); try { console.log(JSON.parse(body)); } catch(e){ console.log(body); } });
});
req.on('error', err => { console.error('REQUEST ERROR', err.message); process.exit(1); });
req.write(data);
req.end();
