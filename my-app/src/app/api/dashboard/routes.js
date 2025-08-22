import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateMealPlan } from "../../../api/services/mealplanner"

export async function POST(req) {
  try {
    // Get the session to ensure user is authenticated
    const session = await getServerSession(authOptions);
    
    console.log('Session in API route:', session); // Debug log
    
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('User data:', {
      id: session.user.id,
      isOnboarded: session.user.isOnboarded,
      bmr: session.user.bmr
    }); // Debug log

    if (!session.user.isOnboarded) {
      return NextResponse.json({ error: "Please complete onboarding first" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    const { planType } = body; // 'daily' or 'weekly'

    // Prepare user preferences using session data
    const userPreferences = {
      BMR: session.user.bmr?.toString() || '2000', // Fallback BMR
      goal: session.user.goal || 'maintain',
      dietaryRestrictions: [
        ...(session.user.allergies || []), 
        ...(session.user.dietaryRestrictions || [])
      ].join(', ') || 'none',
      preferredCuisine: 'Middle Eastern', // You might want to add this to onboarding
      cookingTime: `${session.user.preferredCookingTime || 30} minutes`,
      daily: planType === 'daily',
      mealsPerDay: 3
    };

    console.log('Generating meal plan for user:', session.user.id);
    console.log('User preferences:', userPreferences);

    // Generate the basic meal plan
    const basicMealPlan = await generateMealPlan(userPreferences);
    const enhancedMealPlan = await enhanceMealPlanWithNutrition(basicMealPlan);

    return NextResponse.json({ 
      success: true,
      mealPlan: basicMealPlan // or enhancedMealPlan
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    // Handle specific OpenAI errors
    if (error.message?.includes('OpenAI')) {
      return NextResponse.json({ 
        error: "AI service temporarily unavailable. Please try again." 
      }, { status: 503 });
    }

    return NextResponse.json({ 
      error: "Failed to generate meal plan. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}

import { useSession } from 'next-auth/react';

const { data: session, update } = useSession();

// After successful onboarding completion
const completeOnboarding = async (userData) => {
  try {
    // Save to database
    const response = await fetch('/api/onboarding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      // Update the session with new user data
      await update({
        ...session.user,
        ...userData,
        isOnboarded: true
      });
      
      // Redirect to dashboard
      router.push('/dashboard');
    }
  } catch (error) {
    console.error('Onboarding error:', error);
  }
};