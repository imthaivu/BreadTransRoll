/* eslint-disable @typescript-eslint/no-explicit-any */
import { adminDb } from "@/lib/firebase/admin";
import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || clientId.length === 0) {
    throw new Error("Missing GOOGLE_CLIENT_ID");
  }

  if (!clientSecret || clientSecret.length === 0) {
    throw new Error("Missing GOOGLE_CLIENT_SECRET");
  }

  return { clientId, clientSecret };
}

// Shared NextAuth configuration used by API route handlers
export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  jwt: {
    maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
  },
  providers: [
    GoogleProvider({
      clientId: getGoogleCredentials().clientId,
      clientSecret: getGoogleCredentials().clientSecret,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      // On initial sign-in, enrich token and de-dup by email
      if (account && profile) {
        const email = ((profile as any)?.email || token.email || null) as
          | string
          | null;
        let uid =
          ((profile as any)?.sub as string) || (token.sub as string) || "";

        try {
          // If an existing user doc matches this email, reuse its doc ID to avoid duplicates
          if (email) {
            const q = await adminDb()
              .collection("users")
              .where("email", "==", email)
              .limit(1)
              .get();
            if (!q.empty) {
              uid = q.docs[0].id;
            }
          }

          token.uid = uid;
          const ref = adminDb().collection("users").doc(uid);
          const snap = await ref.get();
          if (!snap.exists) {
            await ref.set({
              uid,
              displayName: (profile as any)?.name ?? null,
              email,
              avatarUrl: (profile as any)?.picture ?? null,
              role: "guest",
              isActive: true,
              classIds: [],
              createdAt: new Date(),
              updatedAt: new Date(),
            });
            token.role = "guest";
          } else {
            token.role = (snap.data() as any)?.role ?? "guest";
          }
        } catch {
          token.uid = uid;
          token.role = (token as any).role ?? "guest";
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose uid and role on session.user
      (session.user as any).id = (token as any).uid || token.sub || null;

      const userRef = await adminDb()
        .collection("users")
        .doc((session.user as any).id)
        .get();
      if (userRef.exists) {
        session.user.name = userRef.data()?.displayName || session.user.name;
        session.user.email = userRef.data()?.email || session.user.email;
        session.user.image = userRef.data()?.avatarUrl || session.user.image;
        (session.user as any).role = (userRef.data() as any)?.role || "guest";
        session.user.isActive = userRef.data()?.isActive ?? true;
      }

      (session.user as any).role = (userRef.data() as any)?.role || "guest";

      return session;
    },
  },
};

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

// jwt() {
//   token: {
//     name: 'Huy Ngô',
//     email: 'ngonhuthuy1234@gmail.com',
//     picture: 'https://lh3.googleusercontent.com/a/ACg8ocK6vUhQRH5wFN-rddTHzXndTAIt9wq0tYyssKs_2g5Iu5fGwE59yQ=s96-c',
//     sub: '109218159715665464390',
//     uid: '109218159715665464390',
//     role: 'guest',
//     iat: 1758562249,
//     exp: 1761154249,
//     jti: 'a2bb8b30-562d-4d02-ad15-f9092f39ba0e'
//   },
//   account: undefined,
//   profile: undefined
// }
// session() {
//   session: {
//     user: {
//       name: 'Huy Ngô',
//       email: 'ngonhuthuy1234@gmail.com',
//       image: 'https://lh3.googleusercontent.com/a/ACg8ocK6vUhQRH5wFN-rddTHzXndTAIt9wq0tYyssKs_2g5Iu5fGwE59yQ=s96-c'
//     },
//     expires: '2025-10-22T17:31:02.716Z'
//   },
//   token: {
//     name: 'Huy Ngô',
//     email: 'ngonhuthuy1234@gmail.com',
//     picture: 'https://lh3.googleusercontent.com/a/ACg8ocK6vUhQRH5wFN-rddTHzXndTAIt9wq0tYyssKs_2g5Iu5fGwE59yQ=s96-c',
//     sub: '109218159715665464390',
//     uid: '109218159715665464390',
//     role: 'guest',
//     iat: 1758562249,
//     exp: 1761154249,
//     jti: 'a2bb8b30-562d-4d02-ad15-f9092f39ba0e'
//   }
// }
