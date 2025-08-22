import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// BMR Calculation function
function calculateBMR(weight, height, age, sex, activityLevel) {
  let bmr;
  
  if (sex === 'MALE') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else if (sex === 'FEMALE') {
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  } else {
    const maleBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    const femaleBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    bmr = (maleBmr + femaleBmr) / 2;
  }
  
  const activityMultipliers = {
    SEDENTARY: 1.2,
    LIGHT: 1.375,
    MODERATE: 1.55,
    ACTIVE: 1.725,
    VERY_ACTIVE: 1.9
  };
  
  const multiplier = activityMultipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

export async function POST(req) {
  try {
    // Get the session 
    const session = await getServerSession(authOptions);
    
    console.log("Session:", session ? "Found" : "Not found");
    console.log("User in session:", session?.user);
    
    if (!session || !session.user) {
      console.log("No session or user found, returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Parsing request body...");
    const body = await req.json();
    console.log("Request body:", body);
    
    const {
      height,
      weight,
      sex,
      age,
      allergies,
      dietaryRestrictions,
      preferredCookingTime,
      activityLevel,
      goal
    } = body;

    const userId = session.user.id;
    console.log("User ID from session:", userId);

    if (!height || !weight || !sex || !age || !activityLevel) {
      console.log("Missing required fields");
      return NextResponse.json({ 
        error: "Missing required fields: height, weight, sex, age, and activityLevel are required" 
      }, { status: 400 });
    }

    if (height <= 0 || weight <= 0 || age <= 0) {
      console.log("Invalid numeric values");
      return NextResponse.json({ 
        error: "Height, weight, and age must be positive numbers" 
      }, { status: 400 });
    }

    const bmr = calculateBMR(weight, height, age, sex, activityLevel);
    console.log("Calculated BMR:", bmr);

    console.log("Checking if user exists...");
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!existingUser) {
      console.log("User not found in database");
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Existing user found:", existingUser);
    console.log("Updating user with onboarding data...");
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        height: parseFloat(height),
        weight: parseFloat(weight),
        sex,
        age: parseInt(age),
        allergies: allergies || [],
        dietaryRestrictions: dietaryRestrictions || [],
        preferredCookingTime: preferredCookingTime ? parseInt(preferredCookingTime) : null,
        activityLevel,
        bmr,
        goal: goal,
        isOnboarded: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        height: true,
        weight: true,
        sex: true,
        age: true,
        allergies: true,
        dietaryRestrictions: true,
        preferredCookingTime: true,
        activityLevel: true,
        bmr: true,
        isOnboarded: true,
        goal:true
      }
    });

    console.log("User onboarding completed successfully:", updatedUser);
    console.log(`${goal}`)
    return NextResponse.json({ 
      user: updatedUser,
      message: "Onboarding completed successfully"
    }, { status: 200 });

  } catch (err) {

    // Handle Prisma-specific errors
    if (err.code === 'P2025') {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (err.code === 'P2002') {
      return NextResponse.json({ error: "Duplicate entry" }, { status: 409 });
    }

    if (err.message?.includes('database') || err.message?.includes('connection')) {
      return NextResponse.json({ error: "Database connection error" }, { status: 503 });
    }
    
    return NextResponse.json({ 
      error: "Server error", 
      details: process.env.NODE_ENV === 'development' ? err.message : undefined 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}