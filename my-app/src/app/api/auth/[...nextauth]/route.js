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
          select: { 
            id: true, 
            email: true, 
            name: true, 
            passwordHash: true,
            height: true,
            weight: true,
            sex: true,
            age: true,
            allergies: true,
            dietaryRestrictions: true,
            preferredCookingTime: true,
            activityLevel: true,
            bmr: true,
            goal: true,
            isOnboarded: true
          }
        });
        
        if (!user?.passwordHash) return null;
        
        const ok = await bcrypt.compare(creds.password, user.passwordHash);
        if (!ok) return null;
        
        // Return all user data (except passwordHash)
        const { passwordHash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      }
    })
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, add user data to token
      if (user) {
        token.id = user.id;
        token.isOnboarded = user.isOnboarded;
        token.height = user.height;
        token.weight = user.weight;
        token.sex = user.sex;
        token.age = user.age;
        token.allergies = user.allergies;
        token.dietaryRestrictions = user.dietaryRestrictions;
        token.preferredCookingTime = user.preferredCookingTime;
        token.activityLevel = user.activityLevel;
        token.bmr = user.bmr;
        token.goal = user.goal;
      }

      // If session is updated (like after onboarding), refresh the token
      if (trigger === "update" && session) {
        console.log('Updating token with session:', session);
        return { ...token, ...session };
      }

      console.log('JWT token:', token); // Debug log
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (token) {
        session.user.id = token.id;
        session.user.isOnboarded = token.isOnboarded;
        session.user.height = token.height;
        session.user.weight = token.weight;
        session.user.sex = token.sex;
        session.user.age = token.age;
        session.user.allergies = token.allergies;
        session.user.dietaryRestrictions = token.dietaryRestrictions;
        session.user.preferredCookingTime = token.preferredCookingTime;
        session.user.activityLevel = token.activityLevel;
        session.user.bmr = token.bmr;
        session.user.goal = token.goal;
      }

      console.log('Session being returned:', session); // Debug log
      return session;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};


const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };