// /app/lib/auth.ts
import { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import bcrypt from "bcrypt";

import UserModel, { IUser } from "@/app/models/user";
import { connectToDatabase } from "@/app/lib/db";

// ---------------------------
// Helper types
// ---------------------------
interface Credentials {
  email: string;
  password: string;
}

// ---------------------------
// Auth configuration
// ---------------------------
export const authOptions: NextAuthConfig = {
  providers: [
    // Local credentials
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "you@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const credentials = rawCredentials as Credentials | null;

        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        try {
          await connectToDatabase();

          const user = await UserModel.findOne<IUser>({
            email: credentials.email.toLowerCase().trim(),
          }).select("+password");

          if (!user) {
            console.warn(`User not found: ${credentials.email}`);
            return null;
          }

          const isValid = await bcrypt.compare(
            credentials.password,
            user.password!,
          );

          if (!isValid) {
            console.warn(`Invalid password for user: ${credentials.email}`);
            return null;
          }

          return {
            id: user._id.toString(),
            email: user.email,
            verified: user.verified,
          };
        } catch (err) {
          console.error("Authorize error:", err);
          return null;
        }
      },
    }),

    // Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),

    // GitHub OAuth
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: false,
    }),
  ],

  // ---------------------------
  // Callbacks
  // ---------------------------
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user).id ?? token.id;
        token.email = (user).email ?? token.email;
        token.verified = (user).verified ?? token.verified ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        (session.user).verified = token.verified ?? false;
      }
      return session;
    },
  },

  // ---------------------------
  // Pages
  // ---------------------------
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },

  // ---------------------------
  // Session
  // ---------------------------
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // ---------------------------
  // Security
  // ---------------------------
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
  debug: process.env.NODE_ENV === "development",
};
