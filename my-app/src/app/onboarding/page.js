"use client"
import { useState } from "react";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function OnboardingForm() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    height: "",
    weight: "",
    sex: "",
    age: "",
    allergies: [],
    dietaryRestrictions: [],
    preferredCookingTime: "",
    activityLevel: "",
    goal:""
  });

  // Handle authentication check
  useEffect(() => {
    if (status === 'loading') return; 
    
    if (!session) {
      router.push(`/login?callbackUrl=${window.location.pathname}`);
      return;
    }
  }, [session, status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }


  if (!session) {
    return null;
  }

  const totalSteps = 4;

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter(item => item !== value)
        : [...prev[field], value]
    }));
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Use the actual user ID from session
      const userId = session?.user?.id;
      
      if (!userId) {
        throw new Error("User session not found");
      }
      
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...formData }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Onboarding failed");
      }

      // Redirect to dashboard or next page
      window.location.href = "/dashboard";
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

 const isStepComplete = (step) => {
  switch (step) {
    case 1:
      return formData.height && formData.weight && formData.sex && formData.age;
    case 2:
      return formData.activityLevel;
    case 3:
      return formData.preferredCookingTime;
    case 4:
      return formData.goal;
    default:
      return false;
  }
};

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Tell us a bit about yourself</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Height (cm)</label>
                <input
                  type="number"
                  value={formData.height}
                  onChange={(e) => handleInputChange("height", e.target.value)}
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 175"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Weight (kg)</label>
                <input
                  type="number"
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 70"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Age</label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => handleInputChange("age", e.target.value)}
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 25"
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Sex</label>
                <select
                  value={formData.sex}
                  onChange={(e) => handleInputChange("sex", e.target.value)}
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-black ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select...</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Activity Level</h2>
              <p className="text-gray-600">How active are you on a typical day?</p>
            </div>

            <div className="space-y-3">
              {[
                { value: "SEDENTARY", label: "Sedentary", desc: "Little or no exercise" },
                { value: "LIGHT", label: "Light", desc: "Light exercise 1-3 days/week" },
                { value: "MODERATE", label: "Moderate", desc: "Moderate exercise 3-5 days/week" },
                { value: "ACTIVE", label: "Active", desc: "Hard exercise 6-7 days/week" },
                { value: "VERY_ACTIVE", label: "Very Active", desc: "Very hard exercise & physical job" }
              ].map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleInputChange("activityLevel", option.value)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.activityLevel === option.value
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      formData.activityLevel === option.value ? "border-blue-500 bg-blue-500" : "border-gray-300"
                    }`}></div>
                    <div>
                      <div className="font-medium text-gray-900">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.desc}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Dietary Preferences</h2>
              <p className="text-gray-600">Let us know about dietary restrictions and cooking preferences</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Allergies (select all that apply)</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Nuts", "Dairy", "Eggs", "Shellfish", "Soy", "Gluten", "Fish", "Sesame"].map((allergy) => (
                    <div
                      key={allergy}
                      onClick={() => handleArrayToggle("allergies", allergy)}
                      className={`p-3 rounded-xl text-center cursor-pointer transition-all text-sm ${
                        formData.allergies.includes(allergy)
                          ? "bg-red-100 border-2 border-red-300 text-red-800"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {allergy}
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add other allergies (separate with commas)"
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newAllergies = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                      setFormData(prev => ({
                        ...prev,
                        allergies: [...new Set([...prev.allergies, ...newAllergies])]
                      }));
                      e.target.value = '';
                    }
                  }}
                />
                {formData.allergies.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.allergies.map((allergy, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs"
                      >
                        {allergy}
                        <button
                          onClick={() => handleArrayToggle("allergies", allergy)}
                          className="hover:bg-red-200 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Dietary Restrictions</label>
                <div className="grid grid-cols-2 gap-2">
                  {["Vegetarian", "Vegan", "Keto", "Paleo", "Low-carb", "Mediterranean", "Halal", "Kosher"].map((diet) => (
                    <div
                      key={diet}
                      onClick={() => handleArrayToggle("dietaryRestrictions", diet)}
                      className={`p-3 rounded-xl text-center cursor-pointer transition-all text-sm ${
                        formData.dietaryRestrictions.includes(diet)
                          ? "bg-green-100 border-2 border-green-300 text-green-800"
                          : "bg-gray-50 border-2 border-gray-200 text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {diet}
                    </div>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Add other dietary preferences (separate with commas)"
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-sm text-black placeholder-gray-400 ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && e.target.value.trim()) {
                      const newRestrictions = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                      setFormData(prev => ({
                        ...prev,
                        dietaryRestrictions: [...new Set([...prev.dietaryRestrictions, ...newRestrictions])]
                      }));
                      e.target.value = '';
                    }
                  }}
                />
                {formData.dietaryRestrictions.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.dietaryRestrictions.map((restriction, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs"
                      >
                        {restriction}
                        <button
                          onClick={() => handleArrayToggle("dietaryRestrictions", restriction)}
                          className="hover:bg-green-200 rounded-full p-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Cooking Time Preference */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700">Preferred Cooking Time</label>
                <select
                  value={formData.preferredCookingTime}
                  onChange={(e) => handleInputChange("preferredCookingTime", e.target.value)}
                  className="w-full rounded-2xl border-0 bg-gray-50 px-4 py-2.5 text-black ring-1 ring-gray-200 transition-all focus:bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your preferred cooking time...</option>
                  <option value="15">15 minutes or less (Quick meals)</option>
                  <option value="30">30 minutes (Standard meals)</option>
                  <option value="45">45 minutes (More involved cooking)</option>
                  <option value="60">1 hour (Elaborate meals)</option>
                  <option value="90">1.5 hours (Weekend cooking)</option>
                  <option value="120">2+ hours (Special occasions)</option>
                </select>
              </div>
            </div>
          </div>
        );
        case 4:
        return (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Goal</h2>
        <p className="text-gray-600">What do you want to achieve with your meal plan?</p>
      </div>

      <div className="space-y-3">
        {[
          { value: "WEIGHT_LOSS", label: "Weight Loss", desc: "Focus on calorie deficit and balanced nutrition" },
          { value: "WEIGHT_GAIN", label: "Weight Gain", desc: "Increase calorie intake with nutrient-rich meals" },
          { value: "HEALTHY_EATING", label: "Eating Healthy", desc: "Maintain weight with well-balanced meals" },
          { value: "MUSCLE_GAIN", label: "Muscle Gain", desc: "Protein-rich diet with enough calories to support training" }
        ].map((option) => (
          <div
            key={option.value}
            onClick={() => handleInputChange("goal", option.value)}
            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
              formData.goal === option.value
                ? "border-purple-500 bg-purple-50"
                : "border-gray-200 bg-gray-50 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-4 h-4 rounded-full border-2 ${
                formData.goal === option.value ? "border-purple-500 bg-purple-500" : "border-gray-300"
              }`}></div>
              <div>
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-sm text-gray-600">{option.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
      default:
        return null;
    }
  };
  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 p-4 fixed inset-0">
      <div className="w-full max-w-2xl bg-white/95 backdrop-blur-sm p-6 md:p-8 rounded-3xl shadow-2xl border border-white/20">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Error Message */}
        {error && (
          <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className="px-6 py-2.5 rounded-2xl border-2 border-gray-300 text-gray-700 font-medium hover:border-gray-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {currentStep < totalSteps ? (
            <button
              onClick={nextStep}
              disabled={!isStepComplete(currentStep)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !isStepComplete(currentStep)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Completing...
                </span>
              ) : (
                "Complete Onboarding"
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
