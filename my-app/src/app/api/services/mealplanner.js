import OpenAI from 'openai';


const client = new OpenAI({
    apiKey:process.env.OPENAI_API_KEY
})

const userPref = {
    'goal' : 'weight loss',
    'dietaryRestricitons' : 'peanuts, pork',
    'preferredCuisine' : 'Chinese',
    'cookingTime' : '30 minutes',
    'daily' : true,

}

// height, weight, gender (maybe), dietary restrictions: allegies, exclusions, preferred cuisine, activity level, goal (weight loss, weight gain, maintain) (calculate tdee), cooking time?
export async function generateMealPlan(userPref){
    try{
        const prompt = makePrompt(userPref);

        const response = await client.responses.create({
            model: "gpt-5-mini",
            input:[
                {"role": "system", "content": "You are a professional nutritionist and meal planning expert. Always respond with valid JSON format only and do not include text before or after JSON output"},
                {"role": "user", "content": prompt}
            ]
        })
        const content = response.output_text;
        const mealPlan = JSON.parse(content)


        return mealPlan
    } catch (error){
        console.error('Error generating meal plan:', error)
    }

}


function makePrompt(userPref){
    const {
        goal,
        dietaryRestrictions,
        preferredCuisine,
        cookingTime,
        daily, // boolean yes for daily no for weekly
        mealsPerDay = 3,
    } = userPref;
    let temp = '';
    if (daily){
        temp = 'daily'
    }

    else{
        temp = 'weekly'
    }

    return `Create a ${temp} meal plan with the following requirements:
    
    Goal: ${goal}
    Dietary Restrictions/ Allergies: ${dietaryRestrictions}
    cooking time preference: ${cookingTime}
    and Preferred Cuisine: ${preferredCuisine}

    Provide exactly ${mealsPerDay} meals, include a realistic preperation and cook time and estimated cost of meal based on ingredients. Align the meal with the goal ${goal} while avoiding any and all mentioned 
    dietary restrictions and allergies. Keep the cooking times at or below the ${cookingTime} preference and include ingredients list with quantities along with simple cooking instructions

    Return ONLY this JSON format and no other texts, you can change the value to accurately define each meal:
    Make sure the macros for each meal and estimatedPrice in USD are accurate
    {
    "planType": "daily",
    "mealPlan": {
    "day1": [
    {
    "name": "Dish Name",
    "ingredients": [
    "ingredient 1",
    "ingredient 2",
    "ingredient 3"
    ],
    "prepTime": "X minutes",
    "cookTime": "X minutes",
    "macros": {
    "calories": 000,
    "protein": "00g",
    "carbs": "00g",
    "fat": "00g"
    },
    "instructions": [
    "Step 1: Clear instruction",
    "Step 2: Clear instruction",
    "Step 3: Clear instruction"
    ],
    "estimatedPrice": "$X.XX"
    }
    ]
    }
    }
    `

}



console.log(generateMealPlan(userPref));