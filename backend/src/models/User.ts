import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password?: string;
  phone?: string;
  trustScore: number;
  location?: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, required: true },
    phone: { type: String },
    trustScore: { type: Number, default: 100 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }
    },
    rating: { type: Number, default: 5.0 }
  },
  {
    timestamps: true
  }
);

// Geospatial index
UserSchema.index({ location: '2dsphere' });

// Ensure virtual id is returned
UserSchema.virtual('id').get(function (this: any) {
  return this._id.toHexString();
});

UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

UserSchema.set('toObject', {
  virtuals: true,
  transform: (doc: any, ret: any) => {
    ret.id = ret._id.toString();
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model<IUser>('User', UserSchema);
