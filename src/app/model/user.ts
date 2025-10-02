import mongoose, { Schema, Document, models } from "mongoose";
import bcrypt from "bcryptjs";

export interface IUser extends Document {
  _id:mongoose.Types.ObjectId;
  name:string;
  email: string;
  password?: string;                // hashed
  verified: boolean;
  otp?: string;                     // hashed
  otpExpires?: Date;
  resetToken?: string;              // hashed
  resetExpires?: Date;
  otpRequestCount?: number;
  lastOtpRequestAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  role:string;
  phone?:string;
  avatar?:string;
  preference?:{
    language?:string;
    emailAlerts?:boolean;
    theme?:"dark" | "light";
  }
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, trim: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
      index: true,
    },
    avatar:{type : String , required : false},
    phone:{type : String , required:false},
    preference:{
      language:{type : String , default :"en"},
      emailAlerts:{type:Boolean , default : false},
      theme:{type:String , enum :["dark" , "light"] ,default : "dark"},
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 6 characters"],
      select: false,                 // hide by default
    },
    verified: { type: Boolean, default: false },
    otp: { type: String, select: false },
    otpExpires: { type: Date },
    otpRequestCount: { type: Number, default: 0 },
    lastOtpRequestAt: { type: Date },
    resetToken: { type: String, select: false },
    resetExpires: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.otp;
        delete ret.resetToken;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Case‑insensitive unique email at storage level (MongoDB collation)
// userSchema.index({ email: 1 }, { unique: true, collation: { locale: "en", strength: 2 } });

// userSchema.pre("save", async function (next) {
//   if (this.isModified("password") && this.password) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  if (!this.password) return false; // ensure queries use .select('+password') when needed
  return bcrypt.compare(candidate, this.password);
};

const User = models.User || mongoose.model<IUser>("User", userSchema);
export default User;
