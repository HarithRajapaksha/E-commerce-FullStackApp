import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/database";
import User from "@/models/userModel";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string;
      role: "user" | "admin" | "super_admin";
      darkMode: boolean;
      isVerified: boolean;
    };
  }

  interface User {
    id: string;
    email: string;
    name: string;
    image?: string;
    role: "user" | "admin" | "super_admin";
    darkMode: boolean;
    isVerified: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "user" | "admin" | "super_admin";
    darkMode: boolean;
    isVerified: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID || process.env.Client_ID || "",
      clientSecret: process.env.AUTH_GOOGLE_SECRET || process.env.Client_Secret || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        await connectDB();

        // Find user by email (credentials provider only)
        const user = await User.findOne({ 
          email: credentials.email.toLowerCase(),
          provider: "credentials" 
        });

        if (!user || !user.password) {
          throw new Error("No user found with this email");
        }

        // Check if password matches
        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image || "",
          role: user.role || "user",
          darkMode: user.darkMode ?? false,
          isVerified: user.isVerified ?? false,
        };
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        await connectDB();

        // Check if user already exists
        let existingUser = await User.findOne({ email: user.email.toLowerCase() });

        if (!existingUser) {
          // Auto-register google users
          existingUser = await User.create({
            name: user.name || "Google User",
            email: user.email.toLowerCase(),
            image: user.image || "",
            provider: "google",
            providerId: account.providerAccountId,
            role: "user", // default role
            darkMode: false,
            isVerified: true, // Google logins are pre-verified
          });
        }

        // Attach custom properties to next-auth user object so they flow into jwt callback
        user.id = existingUser._id.toString();
        user.role = existingUser.role;
        user.darkMode = existingUser.darkMode ?? false;
        user.isVerified = existingUser.isVerified ?? true;
      }
      return true;
    },

    async jwt({ token, user, trigger, session }) {
      // If session update triggered (e.g. settings change)
      if (trigger === "update" && session) {
        if (typeof session.darkMode === "boolean") {
          token.darkMode = session.darkMode;
        }
        if (session.name) {
          token.name = session.name;
        }
        if (session.image !== undefined) {
          token.picture = session.image;
        }
        if (typeof session.isVerified === "boolean") {
          token.isVerified = session.isVerified;
        }
      }

      // Initial token generation
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.darkMode = user.darkMode;
        token.isVerified = user.isVerified;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.darkMode = token.darkMode;
        session.user.isVerified = token.isVerified;
        if (token.name) {
          session.user.name = token.name;
        }
        if (token.picture) {
          session.user.image = token.picture;
        }
      }
      return session;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  session: {
    strategy: "jwt",
  },
  secret: process.env.AUTH_SECRET,
};
