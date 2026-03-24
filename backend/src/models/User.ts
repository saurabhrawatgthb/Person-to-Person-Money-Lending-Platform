import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  trustScore: number;
  location: {
    type: string;
    coordinates: number[]; // [longitude, latitude]
  };
  rating: number;
  history: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String },
    trustScore: { type: Number, default: 100 }, // Starting trust score
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    },
    rating: { type: Number, default: 5.0 },
    history: [{ type: Schema.Types.ObjectId, ref: 'Transaction' }]
  },
  { timestamps: true }
);

// 2dsphere index for geospatial queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ trustScore: -1 });

userSchema.methods.matchPassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }
  const salt = await bcrypt.genSalt(10);
  if (this.password) {
    this.password = await bcrypt.hash(this.password, salt);
  }
});

const User = mongoose.model<IUser>('User', userSchema);
export default User;
