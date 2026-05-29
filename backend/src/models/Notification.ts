import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId | string;
  message: string;
  type: string;
  readStatus: boolean;
  link?: string;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, default: 'System' },
    readStatus: { type: Boolean, default: false },
    link: { type: String }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

NotificationSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

NotificationSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

NotificationSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<INotification>('Notification', NotificationSchema);
