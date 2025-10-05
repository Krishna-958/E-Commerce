import express from 'express'
import mongoose from 'mongoose';
import dotenv from 'dotenv'

dotenv.config()
// Prevent mongoose from buffering model calls when no DB connection is available.
mongoose.set('bufferCommands', false);
import userRouter from './Routes/user.js'
import productRouter from './Routes/product.js'
import adminRouter from './Routes/admin.js'
import cartRouter from './Routes/cart.js'
import addressRouter from './Routes/address.js'
import paymentRouter from './Routes/payment.js'
import cors from 'cors';

const app = express();
// Use express.json with a verify hook to capture raw body for webhook route.
// This keeps normal JSON parsing for other routes and preserves a raw buffer
// at req.rawBody for '/api/payment/webhook' so signature verification works.
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl === '/api/payment/webhook') {
      req.rawBody = buf;
    }
  }
}));

// Also parse urlencoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin:true,
  methods:[ "GET","POST","PUT","DELETE"],
  credentials:true
}))

// home testing route
app.get('/',(req,res)=>res.json({messge:'This is home route'}))

// user Router
app.use('/api/user',userRouter)

// product Router
app.use('/api/product',productRouter)

// cart Router
app.use('/api/cart',cartRouter)

// address Router
app.use('/api/address',addressRouter)

// payment Router
app.use('/api/payment',paymentRouter)

// admin Router
app.use('/api/admin', adminRouter)

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = process.env.DB_NAME;

if (MONGO_URI) {
  mongoose.connect(
    MONGO_URI,
    { dbName: DB_NAME }
  ).then(() => console.log('MongoDB Connected Successfully...!')).catch((err) => console.log('MongoDB connection error', err));
} else {
  console.warn('MONGO_URI not set in environment; skipping MongoDB connection.');
}

const port = 1000;
app.listen(port,()=>console.log(`Server is running on port ${port}`))