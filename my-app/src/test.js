
async function getNutritionAnalysis(ingredientsList, options = {}) {
  const appId = process.env.APPID
  const appKey = process.env.APPKEY;  //api keys for Edamam api
  
  const url = 'https://api.edamam.com/api/nutrition-details';
  
  const requestBody = {
    ingr: ingredientsList // Array of ingredient strings
  };
  
  // Prepare query parameters
  const queryParams = new URLSearchParams({
    app_id: appId,
    app_key: appKey
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
    throw error;
  }
}
async function example() {
  try {
    const ingredients = [
          "White fish fillet (cod or tilapia) 150 g",
          "Shirataki noodles 200 g, drained and rinsed",
          "Baby bok choy 150 g, halved lengthwise",
          "Fresh ginger 10 g, julienned",
          "Garlic 1 clove, thinly sliced",
          "Low-sodium soy sauce 1 tbsp",
          "Rice vinegar 1 tsp",
          "Sesame oil 1 tsp",
          "Scallion 1, sliced for garnish",
          "Lemon wedge (optional)"
        ]
    
    const nutritionData = await getNutritionAnalysis(ingredients, {
    });
    
    console.log('Nutrition Analysis:', nutritionData);
    
  } catch (error) {
    console.error('Failed to get nutrition analysis:', error);
  }
}

example();