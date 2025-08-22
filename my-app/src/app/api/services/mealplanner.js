import OpenAI from 'openai';

const EDAMAM_APP_ID = process.env.APPID
const EDAMAM_APP_KEY = process.env.APPKEY

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const userPref = {
    'RMR' : '1719',
    'goal': 'weight loss',
    'dietaryRestrictions': 'peanuts, pork', 
    'preferredCuisine': 'Middle Eastern',
    'cookingTime': '30 minutes',
    'daily': false,
};

async function getNutritionAnalysis(ingredientsList) {
    const url = 'https://api.edamam.com/api/nutrition-details';
    
    const requestBody = {
        ingr: ingredientsList
    };
    
    const queryParams = new URLSearchParams({
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY
    });
    
    try {
        const response = await fetch(`${url}?${queryParams}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const nutritionData = await response.json();
        return nutritionData;
        
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
        return null; 
    }
}

function extractMacros(nutritionData) {
    if (!nutritionData || !nutritionData.totalNutrients) {
        return {
            calories: 0,
            protein: "0g",
            carbs: "0g",
            fat: "0g"
        };
    }
    
    const nutrients = nutritionData.totalNutrients;
    
    return {
        calories: Math.round(nutritionData.calories || 0),
        protein: `${Math.round(nutrients.PROCNT?.quantity || 0)}g`,
        carbs: `${Math.round(nutrients.CHOCDF?.quantity || 0)}g`,
        fat: `${Math.round(nutrients.FAT?.quantity || 0)}g`
    };
}

export async function generateMealPlan(userPref) {
    try {
        const prompt = makePrompt(userPref);

        const response = await client.chat.completions.create({
            model: "gpt-5-mini",
            messages: [
                {
                    "role": "system", 
                    "content": "You are a professional nutritionist and meal planning expert. Always respond with valid JSON format only and do not include text before or after JSON output"
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ]
        });

        const content = response.choices[0].message.content;
        const mealPlan = JSON.parse(content);
        
        return mealPlan;
    } catch (error) {
        console.error('Error generating meal plan:', error);
        throw error;
    }
}

async function enhanceMealPlanWithNutrition(mealPlan) {
    const enhancedMealPlan = { ...mealPlan };
    
    // Process each day in the meal plan
    for (const dayKey in enhancedMealPlan.mealPlan) {
        const dayMeals = enhancedMealPlan.mealPlan[dayKey];
        
        // Process each meal in the day
        for (let i = 0; i < dayMeals.length; i++) {
            const meal = dayMeals[i];
            
            try {
                console.log(`Fetching nutrition data for: ${meal.name}`);
                
                // Get nutrition data from Edamam API
                const nutritionData = await getNutritionAnalysis(meal.ingredients);
                
                if (nutritionData) {
                    meal.macros = extractMacros(nutritionData);
                    
                    meal.nutritionDetails = {
                        fiber: `${Math.round(nutritionData.totalNutrients?.FIBTG?.quantity || 0)}g`,
                        sodium: `${Math.round(nutritionData.totalNutrients?.NA?.quantity || 0)}mg`,
                        sugar: `${Math.round(nutritionData.totalNutrients?.SUGAR?.quantity || 0)}g`,
                        cholesterol: `${Math.round(nutritionData.totalNutrients?.CHOLE?.quantity || 0)}mg`,
                        apiYield: nutritionData.yield || 1, 
                        totalWeight: `${Math.round(nutritionData.totalWeight || 0)}g`
                    };
                    
                    // Add nutrition source 
                    meal.nutritionSource = "Edamam Nutrition Analysis API";
                } else {
                    console.warn(`Failed to get nutrition data for ${meal.name}, skipping nutrition info`);
                    meal.macros = null;
                    meal.nutritionError = "Nutrition data unavailable - please check ingredient formatting";
                }
                
                // Add a small delay for API rate limits
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.error(`Error enhancing nutrition for ${meal.name}:`, error);
                meal.macros = null;
                meal.nutritionError = error.message;
            }
        }
    }
    
    return enhancedMealPlan;
}

function makePrompt(userPref) {
    const {
        bmr,
        activity_level,
        goal,
        dietaryRestrictions,
        preferredCuisine,
        cookingTime,
        daily,
        mealsPerDay = 3,
    } = userPref;
    
    let temp = daily ? 'daily' : 'weekly';
    
    // Create the appropriate JSON template based on plan type
    let jsonTemplate;
    
    if (daily) {
        jsonTemplate = `{
        "planType": "daily",
        "mealPlan": {
            "day1": [
                {
                    "name": "Dish Name",
                    "ingredients": [
                        "ingredient 1 with quantity",
                        "ingredient 2 with quantity",
                        "ingredient 3 with quantity"
                    ],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": [
                        "Step 1: Detailed preparation instruction with specific timing and technique",
                        "Step 2: Cooking instruction with temperature and visual cues", 
                        "Step 3: Assembly or finishing instruction with serving details",
                        "Step 4: Additional steps as needed for clarity"
                    ],
                    "estimatedPrice": "$X.XX"
                }
            ]
        }
    }`;
    } else {
        jsonTemplate = `{
        "planType": "weekly",
        "mealPlan": {
            "day1": [
                {
                    "name": "Monday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes", 
                    "instructions": ["Detailed step 1 with timing", "Detailed step 2 with technique", "More steps as needed"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day2": [
                {
                    "name": "Tuesday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day3": [
                {
                    "name": "Wednesday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day4": [
                {
                    "name": "Thursday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day5": [
                {
                    "name": "Friday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day6": [
                {
                    "name": "Saturday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ],
            "day7": [
                {
                    "name": "Sunday Dish Name",
                    "ingredients": ["ingredient 1 with quantity", "ingredient 2 with quantity"],
                    "prepTime": "X minutes",
                    "cookTime": "X minutes",
                    "instructions": ["Step 1", "Step 2"],
                    "estimatedPrice": "$X.XX"
                }
            ]
        }
    }`;
    }

    return `Create a ${temp} meal plan with the following requirements:
    
    Goal: ${goal} for a person with a Basal metabolic weight of: ${bmr} calories per day and an activity level of {activity_level} moderate
    Dietary Restrictions/Allergies: ${dietaryRestrictions}
    Cooking time preference: ${cookingTime}
    Preferred Cuisine: ${preferredCuisine}
    
    ${daily ? 
        `Provide exactly ${mealsPerDay} meals for one day.` : 
        `Provide exactly ${mealsPerDay} meals for EACH of the 7 days (Monday through Sunday). Each day should have completely different and unique dishes. Create a total of ${mealsPerDay * 7} meals across the 7 days.`
    }
    
    Requirements:
    - Align meals with the goal: ${goal}
    - Avoid all dietary restrictions/allergies: ${dietaryRestrictions}
    - Keep cooking times at or below: ${cookingTime}
    - Use specific quantities and measurements (e.g., "chicken breast 150g", "broccoli 200g", "olive oil 1 tbsp")
    - Provide realistic preparation time, cook time, and estimated cost
    ${!daily ? '- Ensure variety across all 7 days - no repeated dishes' : ''}
    
    IMPORTANT INSTRUCTIONS REQUIREMENTS:
    - Write cooking instructions that are detailed, step-by-step, and beginner-friendly
    - Include specific cooking techniques (e.g., "sauté over medium heat", "simmer for 10 minutes", "stir frequently")
    - Mention when to add each ingredient and in what order
    - Include temperature settings, timing for each step, and visual cues for doneness
    - Add food safety tips where relevant (e.g., "cook chicken until internal temperature reaches 165°F")
    - Include serving suggestions and garnishing details
    - Make instructions clear enough that someone with basic cooking skills can follow successfully
    - Each instruction step should be a complete sentence with specific actions and timing
    - Include preparation steps (e.g., "rinse rice until water runs clear", "pat chicken dry with paper towels")
    
    Return ONLY the following JSON format with no additional text:
    
    ${jsonTemplate}`;
}

async function example() {
    try {
        console.log('Generating enhanced meal plan...');
        const basicMealPlan = await generateMealPlan(userPref);
        console.log('Basic meal plan generated:', JSON.stringify(basicMealPlan, null, 2));
        
        console.log('Enhancing with nutrition data...');
        const enhancedMealPlan = await enhanceMealPlanWithNutrition(basicMealPlan);
        
        console.log('Final Enhanced Meal Plan:');
        console.log(JSON.stringify(enhancedMealPlan, null, 2));
        
        const mealPlanData = enhancedMealPlan.mealPlan;
        const planType = enhancedMealPlan.planType;
        
        console.log(`\n--- ${planType.toUpperCase()} Meal Plan Summary ---`);
        
        if (planType === 'daily') {
            const dayMeals = mealPlanData.day1;
            dayMeals.forEach((meal, index) => {
                console.log(`Meal ${index + 1}: ${meal.name}`);
                if (meal.macros) {
                    console.log(`  Nutrition: ${meal.macros.calories} cal, ${meal.macros.protein} protein, ${meal.macros.carbs} carbs, ${meal.macros.fat} fat`);
                } else {
                    console.log(`  Nutrition: ${meal.nutritionError || 'Data unavailable'}`);
                }
                console.log(`  Cook time: ${meal.prepTime} prep + ${meal.cookTime} cook`);
                console.log(`  Instructions: ${meal.instructions.join(' ')}`);
                console.log('---');
            });
        } else if (planType === 'weekly') {
            Object.keys(mealPlanData).forEach(dayKey => {
                console.log(`\n📅 ${dayKey.toUpperCase()}:`);
                const dayMeals = mealPlanData[dayKey];
                
                dayMeals.forEach((meal, mealIndex) => {
                    console.log(`  Meal ${mealIndex + 1}: ${meal.name}`);
                    if (meal.macros) {
                        console.log(`    Nutrition: ${meal.macros.calories} cal, ${meal.macros.protein} protein, ${meal.macros.carbs} carbs, ${meal.macros.fat} fat`);
                    } else {
                        console.log(`    Nutrition: ${meal.nutritionError || 'Data unavailable'}`);
                    }
                    console.log(`    Cook time: ${meal.prepTime} prep + ${meal.cookTime} cook`);
                    console.log(`    Instructions: ${meal.instructions.join(' ')}`);
                    console.log('  ---');
                });
                
                // Calculate daily totals
                const dayTotals = calculateDayTotals(dayMeals);
                console.log(`Daily Totals: ${dayTotals.calories} cal, ${dayTotals.protein}g protein, ${dayTotals.carbs}g carbs, ${dayTotals.fat}g fat`);
                console.log('═══════════════════════════════════════');
            });
            
            // Calculate weekly totals
            const weeklyTotals = calculateWeeklyTotals(mealPlanData);
            console.log(`\n🗓️  WEEKLY TOTALS:`);
            console.log(`   Average per day: ${Math.round(weeklyTotals.totalCalories / weeklyTotals.days)} cal, ${Math.round(weeklyTotals.totalProtein / weeklyTotals.days)}g protein`);
            console.log(`   Total for week: ${weeklyTotals.totalCalories} cal, ${weeklyTotals.totalProtein}g protein`);
        }

    } catch (error) {
        console.error('Failed to generate meal plan:', error);
    }
}

function calculateDayTotals(dayMeals) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    
    dayMeals.forEach(meal => {
        if (meal.macros) {
            totalCalories += meal.macros.calories || 0;
            totalProtein += parseInt(meal.macros.protein) || 0;
            totalCarbs += parseInt(meal.macros.carbs) || 0;
            totalFat += parseInt(meal.macros.fat) || 0;
        }
    });
    
    return {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fat: totalFat
    };
}

// Helper function to calculate weekly nutrition totals
function calculateWeeklyTotals(mealPlanData) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFat = 0;
    let days = 0;
    
    Object.keys(mealPlanData).forEach(dayKey => {
        days++;
        const dayTotals = calculateDayTotals(mealPlanData[dayKey]);
        totalCalories += dayTotals.calories;
        totalProtein += dayTotals.protein;
        totalCarbs += dayTotals.carbs;
        totalFat += dayTotals.fat;
    });
    
    return {
        totalCalories,
        totalProtein,
        totalCarbs,
        totalFat,
        days
    };
}


example();