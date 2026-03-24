import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  user_id: mongoose.Types.ObjectId;
  message: string;
  type: 'RequestAlert' | 'MatchFound' | 'Accepted' | 'System';
  readStatus: boolean;
  link?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['RequestAlert', 'MatchFound', 'Accepted', 'System'],
      default: 'System'
    },
    readStatus: { type: Boolean, default: false },
    link: { type: String }
  },
  { timestamps: true }
);

const Notification = mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
