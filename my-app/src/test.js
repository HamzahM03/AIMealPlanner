

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