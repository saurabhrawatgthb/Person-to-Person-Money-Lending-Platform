import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import User from '../models/User';
import Request from '../models/Request';
import Transaction from '../models/Transaction';

async function seed() {
  await connectDB();
  try {
    const users = [
      { name: 'Demo Lender', email: 'demo_lender@example.com', password: 'password123', phone: '1234567890' },
      { name: 'Demo Borrower', email: 'demo_borrower@example.com', password: 'password123', phone: '0987654321' }
    ];

    const createdUsers: any[] = [];
    for (const u of users) {
      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = new User(u);
        await user.save();
        console.log('Created user', user.email);
      } else {
        console.log('User exists', user.email);
      }
      createdUsers.push(user);
    }

    const borrower = createdUsers.find(x => x.email === 'demo_borrower@example.com');
    const lender = createdUsers.find(x => x.email === 'demo_lender@example.com');

    let request = await Request.findOne({ user_id: borrower._id, description: /groceries/i as any });
    if (!request) {
      request = await Request.create({
        user_id: borrower._id,
        type: 'Money',
        description: 'Need $50 for groceries',
        urgencyLevel: 'High',
        durationHours: 48
      });
      console.log('Created request', request._id.toString());
    } else {
      console.log('Request exists', request._id.toString());
    }

    let txn = await Transaction.findOne({ request_id: request._id });
    if (!txn) {
      txn = await Transaction.create({
        lender_id: lender._id,
        borrower_id: borrower._id,
        request_id: request._id,
        status: 'Pending'
      });
      console.log('Created transaction', txn._id.toString());
    } else {
      console.log('Transaction exists', txn._id.toString());
    }
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

seed();
