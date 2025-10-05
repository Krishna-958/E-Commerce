const fetch = globalThis.fetch || (await import('node-fetch')).default;
const res = await fetch('http://localhost:1000/api/payment/checkout', {
  method: 'POST',
  headers: {'Content-Type':'application/json'},
  body: JSON.stringify({ amount: 100, cartItems: [], userShipping: { address: 'Test Address' }, userId: 'testuser' })
});
const body = await res.text();
console.log('STATUS', res.status);
try { console.log(JSON.parse(body)); } catch(e) { console.log(body); }
