import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema({
    orderDate:{type:Date,default:Date.now},
    orderId:{type:String, required:true},
    paymentId:{type:String},
    signature:{type:String},
    amount:{type:Number, required:true},
    orderItems:{type:Array, default:[]},
    userId:{type:String},
    userShipping:{type:Object, default:{}},
    payStatus:{type:String, default:'created'}
})

export const Payment = mongoose.model('Payment',paymentSchema);