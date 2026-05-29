import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './config/db';
import User from './models/User';
import Request from './models/Request';
import RequestMatch from './models/RequestMatch';
import Transaction from './models/Transaction';
import Notification from './models/Notification';

async function runIntegrationTest() {
  console.log('🚀 Starting P2P Money Lending Platform Integration Test (MongoDB/Mongoose)...');

  // 1. Connect to Database
  await connectDB();

  // 2. Clear Existing Test Data
  console.log('🧹 Cleaning test data...');
  const testUsers = await User.find({
    email: { $in: ['borrower@test.com', 'lender@test.com'] }
  });
  const testUserIds = testUsers.map((u: any) => u._id);

  if (testUserIds.length > 0) {
    await Transaction.deleteMany({
      $or: [
        { borrower_id: { $in: testUserIds } },
        { lender_id: { $in: testUserIds } }
      ]
    });

    await RequestMatch.deleteMany({
      user_id: { $in: testUserIds }
    });

    await Request.deleteMany({ user_id: { $in: testUserIds } });
    await Notification.deleteMany({ user_id: { $in: testUserIds } });
    await User.deleteMany({ _id: { $in: testUserIds } });
  }

  // 3. Create Seed Users
  console.log('🌱 Seeding test users...');
  const borrower = await User.create({
    name: 'Alice Borrower',
    email: 'borrower@test.com',
    password: 'password123',
    trustScore: 80,
    rating: 4.5,
    location: {
      type: 'Point',
      coordinates: [77.2090, 28.6139] // Delhi
    }
  });

  const lender = await User.create({
    name: 'Bob Lender',
    email: 'lender@test.com',
    password: 'password123',
    trustScore: 95,
    rating: 4.8,
    location: {
      type: 'Point',
      coordinates: [77.2200, 28.6150]
    }
  });

  console.log(`✅ Seeded Borrower: ${borrower.name} (Trust: ${borrower.trustScore})`);
  console.log(`✅ Seeded Lender: ${lender.name} (Trust: ${lender.trustScore})`);

  // 4. Create Money Borrow Request
  console.log('✍️ Creating money borrow request for Alice...');
  const amount = 200;
  const interestRate = 10; // 10%
  const repaymentAmount = amount * (1 + interestRate / 100);

  const request = await Request.create({
    user_id: borrower.id,
    type: 'Money',
    requestType: 'Borrow',
    amount,
    interestRate,
    repaymentAmount,
    description: 'Need $200 for textbook purchase',
    urgencyLevel: 'High',
    durationHours: 24,
    status: 'Open'
  });

  console.log(`✅ Request Created: "${request.description}"`);
  console.log(`   - Principal: $${request.amount}`);
  console.log(`   - Interest Rate: ${request.interestRate}%`);
  console.log(`   - Total Repayment Expected: $${request.repaymentAmount}`);

  // 5. Lender Accepts Request
  console.log('🤝 Lender (Bob) accepting match and creating transaction...');
  
  // Set Request status to Active
  const updatedReq = await Request.findByIdAndUpdate(
    request.id,
    { status: 'Active' },
    { new: true }
  );

  // Create Active Transaction
  const dueDate = new Date();
  dueDate.setHours(dueDate.getHours() + request.durationHours);

  const transaction = await Transaction.create({
    lender_id: lender.id,
    borrower_id: borrower.id,
    request_id: request.id,
    amount: request.amount,
    interestRate: request.interestRate,
    repaymentAmount: request.repaymentAmount,
    dueDate,
    status: 'Active'
  });

  console.log(`✅ Transaction Activated:`);
  console.log(`   - Lender ID: ${transaction.lender_id}`);
  console.log(`   - Borrower ID: ${transaction.borrower_id}`);
  console.log(`   - Status: ${transaction.status}`);
  console.log(`   - Due Date: ${transaction.dueDate}`);

  // 6. Timely Repayment Flow
  console.log('💰 Repaying loan timely...');
  
  const now = new Date();
  const repaidTx = await Transaction.findByIdAndUpdate(
    transaction.id,
    { status: 'Returned', returnedDate: now },
    { new: true }
  );

  await Request.findByIdAndUpdate(request.id, { status: 'Completed' });

  // Timely return score adjustment check
  const isTimely = now.getTime() <= transaction.dueDate.getTime();
  console.log(`   - Repayment is timely: ${isTimely}`);

  let finalTrustScore = borrower.trustScore;
  if (isTimely) {
    const updatedBorrower = await User.findByIdAndUpdate(
      borrower.id,
      { trustScore: Math.min(100, borrower.trustScore + 10) },
      { new: true }
    );
    if (updatedBorrower) finalTrustScore = updatedBorrower.trustScore;
  }

  console.log(`✅ Repayment finalized!`);
  console.log(`   - Transaction Status: ${repaidTx?.status}`);
  console.log(`   - Updated Borrower Trust Score: ${finalTrustScore} (Expected: 90)`);

  // 7. Verify Results
  if (finalTrustScore === 90 && repaidTx?.status === 'Returned') {
    console.log('\n🎉 INTEGRATION TEST PASSED PERFECTLY!');
  } else {
    console.error('\n❌ INTEGRATION TEST FAILED! Unexpected values.');
  }

  // Cleanup
  await mongoose.connection.close();
  console.log('🚪 DB connection closed.');
}

runIntegrationTest().catch(async err => {
  console.error('❌ Error during integration testing:', err);
  await mongoose.connection.close();
});
