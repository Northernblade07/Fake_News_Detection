// auth.ts (root of your repo, next to package.json)
import NextAuth, { type NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import GitHub from "next-auth/providers/github";
import bcrypt from "bcrypt";

import UserModel, { IUser } from "@/app/models/user";        // ✅ your Mongoose User schema
import { connectToDatabase } from "@/app/lib/db"; // ✅ MongoDB connection helper

const config: NextAuthConfig = {
  // Optional: ensure these routes exist
  pages: {
    signIn: "/login",
    error: "/login",
  },

  // JWT-based sessions
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Authentication providers
  providers: [
    // Credentials (email/password)
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const email = raw?.email?.toString().toLowerCase().trim();
        const password = raw?.password?.toString() ?? "";
        if (!email || !password) return null;

        await connectToDatabase();
        const user = await UserModel.findOne({ email }).select("+password");
        if (!user) return null;

        if (!user.verified) return null;

        const ok = await bcrypt.compare(password, user.password ?? "");
        if (!ok) return null;

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name ?? user.email.split("@")[0],
          verified: user.verified ?? false,
        };
      },
    }),

    Google,
    GitHub,
  ],

  callbacks: {
    async jwt({ token, user, account, profile }) {
      // When user logs in via Credentials
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name ?? null;
        token.verified = user.verified;
      }

      // First-time OAuth login → upsert in MongoDB
      if (account && profile) {
        const email = profile?.email?.toString().toLowerCase().trim();
        if (email) {
          await connectToDatabase();
          const doc = await UserModel.findOneAndUpdate(
  { email },
  {
    $setOnInsert: {
      email,
      verified: true,
      name: (profile as { name?: string })?.name ?? undefined,
    },
  },
  { upsert: true, new: true }
).lean<IUser | null>(); // ✅ force correct type


          if (doc) {
            token.id = doc._id.toString();
            token.email = doc.email;
            token.name = doc.name ?? null;
            token.verified = doc.verified;
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.name = token.name ?? null;
        session.user.verified = token.verified;
      }
      return session;
    },
  },
};

// v5 exports for App Router
export const {
  handlers, // { GET, POST } for /api/auth
  auth,     // server helper: await auth()
  signIn,   // server action
  signOut,  // server action
} = NextAuth(config);
