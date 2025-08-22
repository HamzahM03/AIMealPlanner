import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { generateMealPlan, enhanceMealPlanWithNutrition } from "../services/mealplanner";

export async function POST(req) {
  console.log('API route hit: /api/generate-meal-plan');
  
  try {
    // Get the session to ensure user is authenticated
    const session = await getServerSession(authOptions);
    
    console.log('Session check:', {
      exists: !!session,
      userId: session?.user?.id,
      isOnboarded: session?.user?.isOnboarded
    });
    
    if (!session || !session.user) {
      console.log('Unauthorized: No session or user');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!session.user.isOnboarded) {
      console.log('User not onboarded');
      return NextResponse.json({ error: "Please complete onboarding first" }, { status: 400 });
    }

    // Parse request body
    const body = await req.json();
    console.log('Request body:', body);
    const { planType } = body; 

    // Prepare user preferences using session data
    const userPreferences = {
      BMR: session.user.bmr?.toString() || '2000',
      goal: session.user.goal || 'maintain',
      dietaryRestrictions: [
        ...(session.user.allergies || []), 
        ...(session.user.dietaryRestrictions || [])
      ].join(', ') || 'none',
      preferredCuisine: 'Middle Eastern', 
      cookingTime: `${session.user.preferredCookingTime || 30} minutes`,
      daily: planType === 'daily',
      mealsPerDay: 3
    };

    console.log('User preferences for meal generation:', userPreferences);

    // Generate the basic meal plan 
    console.log('Calling generateMealPlan function...');
    const basicMealPlan = await generateMealPlan(userPreferences);
    
    console.log('Basic meal plan generated successfully');
    
    // Enhance with nutrition data from Edamam API
    console.log('Enhancing meal plan with nutrition data...');
    const enhancedMealPlan = await enhanceMealPlanWithNutrition(basicMealPlan);
    
    console.log('Meal plan enhanced with nutrition data successfully');

    return NextResponse.json({ 
      success: true,
      mealPlan: enhancedMealPlan,
      debug: {
        planType,
        userId: session.user.id,
        userPreferences,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Error generating meal plan:', error);
    
    // Handle specific OpenAI errors
    if (error.message?.includes('OpenAI')) {
      return NextResponse.json({ 
        error: "AI service temporarily unavailable. Please try again." 
      }, { status: 503 });
    }

    // Handle rate limiting
    if (error.status === 429) {
      return NextResponse.json({ 
        error: "Too many requests. Please wait a moment and try again." 
      }, { status: 429 });
    }

    return NextResponse.json({ 
      error: "Failed to generate meal plan. Please try again.",
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    }, { status: 500 });
  }
}

export async function GET(req) {
  console.log('GET request to /api/generate-meal-plan');
  return NextResponse.json({ 
    message: "Meal Plan API is working",
    method: "GET",
    timestamp: new Date().toISOString()
  });
}