import mongoose, { Schema, Document } from 'mongoose';

export interface IRequest extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId | string;
  type: string;
  requestType: string;
  amount: number;
  interestRate: number;
  repaymentAmount: number;
  description: string;
  urgencyLevel: string;
  durationHours: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const RequestSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, required: true },
    requestType: { type: String, default: 'Borrow' },
    amount: { type: Number, default: 0 },
    interestRate: { type: Number, default: 0 },
    repaymentAmount: { type: Number, default: 0 },
    description: { type: String, required: true },
    urgencyLevel: { type: String, default: 'Medium' },
    durationHours: { type: Number, required: true },
    status: { type: String, default: 'Open' }
  },
  {
    timestamps: true
  }
);

RequestSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

RequestSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

RequestSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<IRequest>('Request', RequestSchema);
