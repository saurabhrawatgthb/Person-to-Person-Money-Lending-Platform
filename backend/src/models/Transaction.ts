import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  id: string;
  lender_id: mongoose.Types.ObjectId | string;
  borrower_id: mongoose.Types.ObjectId | string;
  request_id: mongoose.Types.ObjectId | string;
  amount: number;
  interestRate: number;
  repaymentAmount: number;
  dueDate: Date;
  returnedDate?: Date;
  status: string;
  ratingByLender?: number;
  ratingByBorrower?: number;
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema: Schema = new Schema(
  {
    lender_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    borrower_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    request_id: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    amount: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    repaymentAmount: { type: Number, default: 0 },
    dueDate: { type: Date, required: true },
    returnedDate: { type: Date },
    status: { type: String, default: 'Pending' },
    ratingByLender: { type: Number },
    ratingByBorrower: { type: Number }
  },
  {
    timestamps: true
  }
);

TransactionSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

TransactionSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

TransactionSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<ITransaction>('Transaction', TransactionSchema);
