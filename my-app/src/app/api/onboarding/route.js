import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  const data = await req.json();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { ...data, onboarded: true },
  });

  return NextResponse.json({ ok: true });
}
