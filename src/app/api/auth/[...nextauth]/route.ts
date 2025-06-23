// cognify/src/app/api/auth/[...nextauth]/route.ts

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import prisma from "@/lib/db";
import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcrypt";

// This is the single, authoritative configuration object for NextAuth.
export const authOptions: AuthOptions = {
  // Use the Prisma adapter to store users, sessions, etc. in your database.
  adapter: PrismaAdapter(prisma),

  // Configure one or more authentication providers.
  providers: [
    // We are starting with a "Credentials" provider for email/password login.
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "john.doe@example.com" },
        password: { label: "Password", type: "password" },
      },
      // The authorize function contains the logic to validate a user's credentials.
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null; // Reject if email or password are not provided.
        }

        // Find the user in the database by their unique email.
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // If no user is found, or if the user record doesn't have a hashed password
        // (they might have signed up with a social provider), reject.
        if (!user || !user.hashedPassword) {
          return null;
        }

        // Securely compare the provided password with the hashed password from the database.
        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordValid) {
          return null; // Reject if the password is not valid.
        }

        // If all checks pass, return the user object. NextAuth will handle the session creation.
        return user;
      },
    }),
  ],

  // The 'callbacks' object allows us to customize the session and token.
  callbacks: {
    // The 'jwt' callback is executed whenever a JSON Web Token is created.
    jwt({ token, user }) {
      // The `user` object is only passed on the initial sign-in.
      if (user) {
        // We add the user's database ID to the token.
        token.id = user.id;
      }
      return token;
    },
    // The 'session' callback is executed whenever a session is accessed.
    session({ session, token }) {
      // We transfer the user ID from the token to the session object,
      // making it available on the client-side and server-side session checks.
      session.user.id = token.id as string;
      return session;
    },
  },

  // Configure session management strategy.
  session: {
    // 'jwt' is the recommended, modern, stateless strategy.
    strategy: "jwt",
  },
  
  // The secret key used to sign and encrypt tokens and cookies.
  // Loaded from the .env file for security.
  secret: process.env.NEXTAUTH_SECRET,
  
  // Enables detailed logging in the development environment for easier debugging.
  debug: process.env.NODE_ENV === "development",
};

// Create the handler function by passing the options to NextAuth.
const handler = NextAuth(authOptions);

// Export the handler for both GET and POST requests, as NextAuth requires.
export { handler as GET, handler as POST };