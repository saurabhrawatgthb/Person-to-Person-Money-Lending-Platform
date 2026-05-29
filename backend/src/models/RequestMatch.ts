import mongoose, { Schema, Document } from 'mongoose';

export interface IRequestMatch extends Document {
  id: string;
  request_id: mongoose.Types.ObjectId | string;
  user_id: mongoose.Types.ObjectId | string;
  score: number;
  status: string;
}

const RequestMatchSchema: Schema = new Schema(
  {
    request_id: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true },
    status: { type: String, default: 'Pending' }
  },
  {
    timestamps: true
  }
);

// Compound index to guarantee uniqueness
RequestMatchSchema.index({ request_id: 1, user_id: 1 }, { unique: true });

RequestMatchSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

RequestMatchSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

RequestMatchSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<IRequestMatch>('RequestMatch', RequestMatchSchema);
