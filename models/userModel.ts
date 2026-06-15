import mongoose, { Schema, Document, Model } from "mongoose";

// 1. Define the TypeScript interface for the User document
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional because Google users won't have a password
  image?: string;    // Profile picture (useful for Google login)
  role: "user" | "admin" | "super_admin"; // The 3 user types
  provider: "credentials" | "google";     // Login methods
  providerId?: string; // Storing the Google account ID if logged in via Google
  darkMode: boolean;   // Preference for dark mode theme
  isVerified: boolean; // Verification flag (default true)
  createdAt: Date;
  updatedAt: Date;
}

// 2. Create the Mongoose Schema
const UserSchema = new Schema<IUser>(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { 
      type: String,
      // We don't make it strictly required: true in the schema because 
      // Google users sign in without a password.
      required: function (this: IUser) {
        return this.provider === "credentials"; // Required ONLY for credentials provider
      }
    },
    image: { 
      type: String, 
      default: "" 
    },
    role: { 
      type: String, 
      enum: ["user", "admin", "super_admin"], 
      default: "user" // Default type is normal user
    },
    provider: { 
      type: String, 
      enum: ["credentials", "google"], 
      default: "credentials" 
    },
    providerId: { 
      type: String 
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    isVerified: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true // Automatically creates and manages createdAt and updatedAt
  }
);

// 3. Prevent model compile errors during Next.js Hot Module Replacement (HMR)
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
