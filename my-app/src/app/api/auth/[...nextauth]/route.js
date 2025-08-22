import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: { 
        email: { label: "Email" }, 
        password: { label: "Password", type: "password" } 
      },
      async authorize(creds) {
        if (!creds?.email || !creds?.password) return null;
        
        const user = await prisma.user.findUnique({
          where: { email: creds.email },
          select: { id: true, email: true, name: true, passwordHash: true }
        });
        
        if (!user?.passwordHash) return null;
        
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) { 
      if (user) token.userId = user.id; 
      return token; 
    },
    async session({ session, token }) { 
      if (token?.userId) {
        session.user = { 
          ...(session.user || {}), 
          id: token.userId 
        }; 
      }
      return session; 
    }
  },
  // Add this for better security
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };