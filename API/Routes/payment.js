import express from 'express'
import {
  checkout,
  verify,
  webhook,
  userOrder,
  allOrders,
} from "../Controllers/payment.js";
import {Authenticated} from '../Middlewares/auth.js'
import { isAdmin } from '../Middlewares/admin.js'

const router = express.Router();

// checkout
router.post('/checkout',checkout);

// verify-payment & save to db
router.post('/verify-payment',verify)

// webhook (Razorpay will POST events here). Use express.raw to provide the raw body for signature verification.
// Razorpay expects the raw payload bytes when calculating the HMAC signature.
router.post('/webhook', express.raw({ type: '*/*' }), webhook)

// user order
router.get("/userorder",Authenticated, userOrder);

// All orders (admin only)
router.get("/orders", Authenticated, isAdmin, allOrders);




export default router