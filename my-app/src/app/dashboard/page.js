"use client"
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Target, Clock, ChefHat, Calendar, Plus, Zap, Activity, Heart, AlertCircle } from 'lucide-react';



const MealPlannerDashboard = () => {
  const { data: session, status } = useSession();
  const [userData, setUserData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [planType, setPlanType] = useState('daily');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Get real user data from session
  useEffect(() => {
    if (status === 'loading') {
      return; // Still loading session
    }

    if (!session?.user) {
      setError('Please log in to access your meal planner');
      setLoading(false);
      return;
    }

    // Check if user has completed onboarding
    if (!session.user.isOnboarded) {
      setError('Please complete your profile setup first');
      setLoading(false);
      return;
    }

    // Set user data from session
    setUserData({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      height: session.user.height,
      weight: session.user.weight,
      sex: session.user.sex,
      age: session.user.age,
      allergies: session.user.allergies || [],
      dietaryRestrictions: session.user.dietaryRestrictions || [],
      preferredCookingTime: session.user.preferredCookingTime,
      activityLevel: session.user.activityLevel,
      bmr: session.user.bmr,
      goal: session.user.goal,
      isOnboarded: session.user.isOnboarded
    });

    setLoading(false);
  }, [session, status]);

const generateMealPlan = async () => {
  if (!userData) return;
  
  setIsGenerating(true);
  setError('');
  
  try {
    console.log('Making API call to /api/generate-meal-plan');
    console.log('Plan type:', planType);
    
    const response = await fetch('/api/generate-meal-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planType })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response ok:', response.ok);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    if (!contentType || !contentType.includes('application/json')) {
      // If it's not JSON, get the text to see what's being returned
      const text = await response.text();
      console.log('Non-JSON response:', text.substring(0, 500)); // First 500 chars
      throw new Error('Server returned HTML instead of JSON. Check if API route exists.');
    }

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate meal plan');
    }

    const data = await response.json();
    console.log('Successful response:', data);
    setMealPlan(data.mealPlan);
    
  } catch (err) {
    console.error('Full error:', err);
    setError(err.message || 'Failed to generate meal plan. Please try again.');
  } finally {
    setIsGenerating(false);
  }
}

  const calculateDailyTotals = (meals) => {
    return meals.reduce((totals, meal) => {
      if (meal.macros) {
        totals.calories += meal.macros.calories || 0;
        totals.protein += parseInt(meal.macros.protein) || 0;
        totals.carbs += parseInt(meal.macros.carbs) || 0;
        totals.fat += parseInt(meal.macros.fat) || 0;
      }
      return totals;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Authentication Required</h2>
          <p className="text-slate-300 mb-4">Please log in to access your meal planner dashboard.</p>
          <button 
            onClick={() => window.location.href = '/api/auth/signin'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (!userData || !userData.isOnboarded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-8">
          <User className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Profile Setup Required</h2>
          <p className="text-slate-300 mb-4">Please complete your profile setup to access the meal planner.</p>
          <button 
            onClick={() => window.location.href = '/onboarding'}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-2 rounded-lg transition-all duration-300"
          >
            Complete Setup
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center">
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Meal Planner
                </h1>
                <p className="text-slate-400 text-sm">Your personalized nutrition companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-300">
              <User className="h-4 w-4" />
              <span>Welcome, {userData.name}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* User Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 hover:border-purple-400/40 transition-all duration-300">
              <div className="flex items-center space-x-3 mb-6">
                <div className="h-12 w-12 rounded-full bg-gradient-to-r from-blue-400 to-purple-400 flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{userData.name}</h2>
                  <p className="text-slate-400 text-sm">{userData.email}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Height</p>
                    <p className="text-white font-semibold">{userData.height} cm</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Weight</p>
                    <p className="text-white font-semibold">{userData.weight} kg</p>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Zap className="h-4 w-4 text-purple-400" />
                    <p className="text-purple-300 text-sm font-medium">Daily BMR</p>
                  </div>
                  <p className="text-2xl font-bold text-white">{userData.bmr} <span className="text-sm text-slate-400">calories</span></p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-green-400" />
                    <span className="text-sm text-slate-300">Goal: <span className="text-green-400 capitalize">{userData.goal}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-blue-400" />
                    <span className="text-sm text-slate-300">Activity: <span className="text-blue-400 capitalize">{userData.activityLevel.toLowerCase().replace('_', ' ')}</span></span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span className="text-sm text-slate-300">Cook Time: <span className="text-orange-400">{userData.preferredCookingTime} min</span></span>
                  </div>
                </div>

                {(userData.allergies.length > 0 || userData.dietaryRestrictions.length > 0) && (
                  <div className="bg-red-500/10 rounded-lg p-3 border border-red-500/20">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <p className="text-red-300 text-sm font-medium">Restrictions</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {[...userData.allergies, ...userData.dietaryRestrictions].map((item, index) => (
                        <span key={index} className="bg-red-500/20 text-red-300 text-xs px-2 py-1 rounded-full">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Meal Plan Generation */}
          <div className="lg:col-span-2">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl border border-purple-500/20 p-6 hover:border-purple-400/40 transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-6 w-6 text-purple-400" />
                  <h2 className="text-xl font-semibold text-white">Meal Plan Generator</h2>
                </div>
              </div>

              {/* Plan Type Selector */}
              <div className="mb-6">
                <div className="flex space-x-2 p-1 bg-slate-800/50 rounded-lg border border-slate-700/50">
                  <button
                    onClick={() => setPlanType('daily')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      planType === 'daily'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Daily Plan
                  </button>
                  <button
                    onClick={() => setPlanType('weekly')}
                    className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                      planType === 'weekly'
                        ? 'bg-purple-500 text-white shadow-lg'
                        : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    Weekly Plan
                  </button>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={generateMealPlan}
                disabled={isGenerating}
                className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
                  isGenerating
                    ? 'bg-slate-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25'
                }`}
              >
                {isGenerating ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Generating {planType} meal plan...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Generate {planType.charAt(0).toUpperCase() + planType.slice(1)} Meal Plan</span>
                  </div>
                )}
              </button>

              {error && (
                <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Meal Plan Display */}
              {mealPlan && (
                <div className="mt-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-white">Your {planType.charAt(0).toUpperCase() + planType.slice(1)} Meal Plan</h3>
                    {planType === 'daily' && mealPlan.mealPlan.day1 && (
                      <div className="text-sm text-slate-400">
                        Daily Total: <span className="text-purple-400 font-semibold">
                          {calculateDailyTotals(mealPlan.mealPlan.day1).calories} cal
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {Object.entries(mealPlan.mealPlan).map(([dayKey, meals]) => (
                      <div key={dayKey} className="space-y-3">
                        {planType === 'weekly' && (
                          <h4 className="text-purple-400 font-medium capitalize">
                            {dayKey.replace('day', 'Day ')}
                          </h4>
                        )}
                        {meals.map((meal, index) => (
                          <div key={index} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/30 hover:border-purple-500/30 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <h4 className="font-semibold text-white mb-1">{meal.name}</h4>
                                <div className="flex items-center space-x-4 text-sm text-slate-400">
                                  <span>Prep: {meal.prepTime}</span>
                                  <span>Cook: {meal.cookTime}</span>
                                  <span className="text-green-400">{meal.estimatedPrice}</span>
                                </div>
                              </div>
                              {meal.macros && (
                                <div className="text-right text-sm">
                                  <div className="text-purple-400 font-semibold">{meal.macros.calories} cal</div>
                                  <div className="text-slate-400">
                                    P:{meal.macros.protein} C:{meal.macros.carbs} F:{meal.macros.fat}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Ingredients</p>
                                <div className="flex flex-wrap gap-1">
                                  {meal.ingredients.map((ingredient, idx) => (
                                    <span key={idx} className="bg-slate-700/50 text-slate-300 text-xs px-2 py-1 rounded">
                                      {ingredient}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              
                              <div>
                                <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">Instructions</p>
                                <ol className="text-sm text-slate-300 space-y-1">
                                  {meal.instructions.map((instruction, idx) => (
                                    <li key={idx} className="flex">
                                      <span className="text-purple-400 mr-2">{idx + 1}.</span>
                                      <span>{instruction}</span>
                                    </li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MealPlannerDashboard;