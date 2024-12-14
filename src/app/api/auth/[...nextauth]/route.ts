'use server'
import NextAuth, { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authConfig";

const handler = NextAuth(authOptions);

/**
 * The getServerSession call avoids unnecessary fetch calls on the
 * server.
 * @returns session
 */
export const fetchSession = async (): Promise<any> => {
  const session = await getServerSession(authOptions);
  return session;
};

export { handler as GET, handler as POST };