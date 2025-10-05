import crypto from 'crypto';

(async function(){
  try{
    const checkoutRes = await fetch('http://127.0.0.1:1000/api/payment/checkout',{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ amount:100, cartItems:[], userShipping:{address:'Test Address'}, userId:'testuser' })
    });
    console.log('checkout status', checkoutRes.status);
    const body = await checkoutRes.json();
    console.log('checkout body', body);
    const orderId = body.orderId;
    if(!orderId){ console.error('no orderId'); process.exit(1); }
    const paymentId = 'pay_' + Math.random().toString(36).slice(2,12);
    const eventObj = { event: 'payment.captured', payload: { payment: { entity: { id: paymentId, order_id: orderId, amount: 100*100, status: 'captured', notes: { userId: 'testuser', userShipping: JSON.stringify({address:'Test Address'}) } } } } };
    const event = JSON.stringify(eventObj);
    const secret = 'gcixoU7lP1YLP8YPCfZldPoG';
    const hmac = crypto.createHmac('sha256', secret).update(event).digest('hex');
    console.log('sending webhook to localtunnel...');
    const whRes = await fetch('https://purple-eyes-glow.loca.lt/api/payment/webhook', { method:'POST', headers:{'Content-Type':'application/json', 'x-razorpay-signature': hmac}, body: event });
    console.log('webhook status', whRes.status);
    console.log('webhook body', await whRes.text());
    const toSign = orderId + '|' + paymentId;
    const sig = crypto.createHmac('sha256', secret).update(toSign).digest('hex');
    const verifyRes = await fetch('http://127.0.0.1:1000/api/payment/verify-payment',{ method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ orderId, paymentId, signature: sig, amount: 100, orderItems: [], userId: 'testuser', userShipping: { address: 'Test Address' } }) });
    console.log('verify status', verifyRes.status);
    console.log('verify body', await verifyRes.json());
  }catch(err){ console.error('error', err); process.exit(1); }
})();
