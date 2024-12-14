import { PROD_ENDPOINT } from "@/app/endpoints";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  debug: process.env.NODE_ENV === 'development',
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/auth/sign-in'
  },
  session: {
    strategy: "jwt",
    maxAge: 1 * 60 * 60 * 24 * 30, /** max age can be signed in */
  },
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        await fetch(`${PROD_ENDPOINT}/signup`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            name: user.name,
            provider: account?.provider,
          }),
        });
      } catch (error) {
        console.error('Error saving into db: ', error);
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        return {
          ...token,
          id: user.id,
        }
      }
      return token;
    },
    async session({ session, token }) {
      console.log('session callback ', { session, token });
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      }
    }
  }
};