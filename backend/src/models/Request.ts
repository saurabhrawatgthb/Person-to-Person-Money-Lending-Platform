import mongoose, { Document, Schema } from 'mongoose';

export interface IRequest extends Document {
  user_id: mongoose.Types.ObjectId;
  type: 'Item' | 'Money';
  description: string;
  urgencyLevel: 'Low' | 'Medium' | 'High';
  durationHours: number;
  status: 'Open' | 'Matched' | 'Completed' | 'Cancelled';
  matched_users: {
    user_id: mongoose.Types.ObjectId;
    score: number;
    status: 'Pending' | 'Accepted' | 'Declined';
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const requestSchema = new Schema<IRequest>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['Item', 'Money'], required: true },
    description: { type: String, required: true },
    urgencyLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    durationHours: { type: Number, required: true }, // How long item/money is needed
    status: {
      type: String,
      enum: ['Open', 'Matched', 'Completed', 'Cancelled'],
      default: 'Open'
    },
    matched_users: [
      {
        user_id: { type: Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number },
        status: { type: String, enum: ['Pending', 'Accepted', 'Declined'], default: 'Pending' }
      }
    ]
  },
  { timestamps: true }
);

// Index to quickly find open requests
requestSchema.index({ status: 1 });

const Request = mongoose.model<IRequest>('Request', requestSchema);
export default Request;
