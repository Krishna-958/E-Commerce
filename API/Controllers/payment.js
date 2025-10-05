import { Payment } from "../Models/Payment.js";
import Razorpay from "razorpay";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const RZP_KEY_ID = process.env.RAZORPAY_KEY_ID || process.env.RZP_KEY_ID;
const RZP_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || process.env.RZP_KEY_SECRET;
const RZP_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || RZP_KEY_SECRET;

// Lazy initialize Razorpay client so server can boot even if env is missing in some setups.
function getRazorpay() {
  if (!RZP_KEY_ID || !RZP_KEY_SECRET) return null;
  try {
    return new Razorpay({ key_id: RZP_KEY_ID, key_secret: RZP_KEY_SECRET });
  } catch (e) {
    console.warn('Failed to initialize Razorpay client', e?.message || e);
    return null;
  }
}

function calcSignature(orderId, paymentId) {
  return crypto.createHmac('sha256', RZP_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
}

// Create an order (checkout)
export const checkout = async (req, res) => {
  try {
    const { amount, cartItems, userShipping, userId } = req.body || {};

    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount' });
    }

    const razorpay = getRazorpay();
    if (!razorpay) return res.status(500).json({ success: false, message: 'Payment provider not configured' });

    const options = {
      amount: Math.round(Number(amount) * 100), // convert INR to paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      payment_capture: 1,
      notes: {
        userId: userId || null,
        userShipping: userShipping ? JSON.stringify(userShipping) : null,
        cartItems: cartItems ? JSON.stringify(cartItems) : null,
      },
    };

    const order = await razorpay.orders.create(options);

    // Provide convenient fields used by the frontend: orderId and amount (in INR)
    return res.json({
      success: true,
      order,
      orderId: order.id,
      amount: (order.amount || options.amount) / 100,
      currency: order.currency || 'INR',
      key: RZP_KEY_ID,
    });
  } catch (err) {
    console.error('Checkout error', err?.message || err);
    return res.status(500).json({ success: false, message: 'Checkout failed', error: err?.message || err });
  }
};

// Verify payment after client completes payment (client may POST razorpay_ prefixed fields)
export const verify = async (req, res) => {
  try {
    // support both plain names and razorpay_ prefixed names
    const body = req.body || {};
    const orderId = body.orderId || body.order_id || body.razorpay_order_id;
    const paymentId = body.paymentId || body.payment_id || body.razorpay_payment_id;
    const signature = body.signature || body.razorpay_signature;
    const { amount, orderItems, userId, userShipping } = body;

    if (!orderId || !paymentId || !signature) {
      return res.status(400).json({ success: false, message: 'Missing required payment fields' });
    }

    if (!RZP_KEY_SECRET) {
      console.warn('Razorpay key secret missing; cannot verify signature');
      return res.status(500).json({ success: false, message: 'Server not configured for payments' });
    }

    const expected = calcSignature(orderId, paymentId);
    if (expected !== signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Optionally fetch payment details from Razorpay for extra confirmation
    let paymentDetails = null;
    const razorpay = getRazorpay();
    if (razorpay) {
      try {
        paymentDetails = await razorpay.payments.fetch(paymentId);
      } catch (e) {
        console.warn('Could not fetch payment details', e?.message || e);
      }
    }

    const record = await Payment.create({
      orderId,
      paymentId,
      signature,
      amount: amount ? Number(amount) : (paymentDetails?.amount ? paymentDetails.amount / 100 : 0),
      orderItems: orderItems || [],
      userId: userId || (paymentDetails?.notes?.userId) || null,
      userShipping: userShipping || (paymentDetails?.notes?.userShipping ? JSON.parse(paymentDetails.notes.userShipping) : {}),
      payStatus: paymentDetails?.status || 'paid',
    });

    return res.json({ success: true, message: 'Payment verified and saved', record, paymentDetails });
  } catch (err) {
    console.error('Verify error', err?.message || err);
    return res.status(500).json({ success: false, message: 'Verification failed', error: err?.message || err });
  }
};

// Webhook: Razorpay will POST events here. We require raw body to verify signature.
export const webhook = async (req, res) => {
  try {
    // prefer raw body (Buffer) provided by express.raw middleware or server.verify hook
    const raw = req.rawBody || req.body;
    const signature = (req.headers['x-razorpay-signature'] || '').toString();

    if (!raw) return res.status(400).send('missing body');

    // compute expected signature over raw payload
    const payload = Buffer.isBuffer(raw) ? raw : Buffer.from(typeof raw === 'string' ? raw : JSON.stringify(raw));
    if (!RZP_WEBHOOK_SECRET) {
      console.warn('Webhook secret not configured; rejecting webhook');
      return res.status(400).send('webhook secret not configured');
    }

    const expected = crypto.createHmac('sha256', RZP_WEBHOOK_SECRET).update(payload).digest('hex');
    if (!signature || expected !== signature) {
      console.warn('Invalid webhook signature', { expected, signature });
      return res.status(400).send('invalid signature');
    }

    let event = null;
    try { event = JSON.parse(payload.toString()); } catch (e) { event = null; }

    if (event && event.event && event.payload) {
      const ev = event.event;
      // handle payment events
      if (ev === 'payment.captured' || ev === 'payment.authorized' || ev === 'payment.failed') {
        const p = event.payload?.payment?.entity;
        if (p) {
          const existing = await Payment.findOne({ paymentId: p.id });
          if (!existing) {
            await Payment.create({
              orderId: p.order_id,
              paymentId: p.id,
              signature: signature,
              amount: (p.amount || 0) / 100,
              orderItems: [],
              userId: p.notes?.userId || null,
              userShipping: p.notes?.userShipping ? (() => { try { return JSON.parse(p.notes.userShipping); } catch (e) { return {}; } })() : {},
              payStatus: p.status || ev,
            });
          } else {
            existing.payStatus = p.status || existing.payStatus;
            await existing.save();
          }
        }
      }
    }

    return res.json({ status: 'ok' });
  } catch (err) {
    console.error('Webhook error', err?.message || err);
    return res.status(500).send('error');
  }
};

// user specific orders
export const userOrder = async (req, res) => {
  try {
    const userId = req.user?._id?.toString();
    if (!userId) return res.status(400).json({ success: false, message: 'User id missing' });
    const orders = await Payment.find({ userId }).sort({ orderDate: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('userOrder error', err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || err });
  }
};

// all orders (admin)
export const allOrders = async (req, res) => {
  try {
    const orders = await Payment.find().sort({ orderDate: -1 });
    return res.json({ success: true, orders });
  } catch (err) {
    console.error('allOrders error', err?.message || err);
    return res.status(500).json({ success: false, message: err?.message || err });
  }
};