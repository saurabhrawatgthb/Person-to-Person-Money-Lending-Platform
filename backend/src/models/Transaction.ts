import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  lender_id: mongoose.Types.ObjectId;
  borrower_id: mongoose.Types.ObjectId;
  request_id: mongoose.Types.ObjectId;
  status: 'Pending' | 'Active' | 'Returned' | 'Disputed';
  ratingByLender?: number;
  ratingByBorrower?: number;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>(
  {
    lender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    borrower_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    request_id: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    status: {
      type: String,
      enum: ['Pending', 'Active', 'Returned', 'Disputed'],
      default: 'Pending'
    },
    ratingByLender: { type: Number, min: 1, max: 5 },
    ratingByBorrower: { type: Number, min: 1, max: 5 }
  },
  { timestamps: true }
);

const Transaction = mongoose.model<ITransaction>('Transaction', transactionSchema);
export default Transaction;
