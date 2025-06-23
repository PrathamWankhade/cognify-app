// cognify/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth";

// This declares a new module for next-auth, allowing us to extend its original types.
declare module "next-auth" {
  /**
   * The Session object returned by `useSession`, `getSession`, etc.
   */
  interface Session {
    // We are adding a new property to the `user` object on the session.
    user: {
      /** The user's unique database ID. */
      id: string;
    } & DefaultSession["user"]; // ...and keeping all the default properties like name, email, image
  }
}