import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import OnboardingForm from "./OnboardingForm";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);

  // not logged in → middleware should catch, but just in case
  if (!session?.user?.id) redirect("/login");

  // check user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  if (user?.onboarded) redirect("/");

  // if not onboarded, render the form
  return <OnboardingForm />;
}
