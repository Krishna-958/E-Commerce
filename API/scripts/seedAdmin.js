import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../Models/User.js';
import dotenv from 'dotenv'

dotenv.config()

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://krishna42971_db_user:iGHtP8vHyB282IXU@cluster0.b2lgqxf.mongodb.net/";
const DB_NAME = process.env.DB_NAME || 'E_Commerce';

const seed = async () => {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    const email = 'krishna@gmail.com';
    const password = '123456';
    const name = 'krishna';

    const hashed = await bcrypt.hash(password, 10);

    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.password = hashed;
      existing.isAdmin = true;
      await existing.save();
      console.log('Admin user updated');
    } else {
      await User.create({ name, email, password: hashed, isAdmin: true });
      console.log('Admin user created');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seed();
