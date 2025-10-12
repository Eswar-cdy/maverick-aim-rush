// Recipe Database with 50+ Entries
// Comprehensive recipe collection for meal planning

class RecipeDatabase {
    constructor() {
        this.recipes = this.initializeRecipes();
        this.categories = ['breakfast', 'lunch', 'dinner', 'snack', 'dessert'];
        this.cuisines = ['mediterranean', 'asian', 'mexican', 'italian', 'american', 'indian', 'thai'];
        this.dietaryTags = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein'];
    }

    initializeRecipes() {
        return [
            // BREAKFAST RECIPES
            {
                id: 1,
                name: "Protein Pancakes",
                category: "breakfast",
                cuisine: "american",
                dietary: ["high-protein", "gluten-free"],
                prepTime: 10,
                cookTime: 15,
                servings: 2,
                calories: 320,
                protein: 25,
                carbs: 20,
                fat: 15,
                ingredients: [
                    "1 cup oat flour",
                    "2 scoops vanilla protein powder",
                    "2 eggs",
                    "1/2 cup almond milk",
                    "1 tsp baking powder",
                    "1 tbsp honey"
                ],
                instructions: [
                    "Mix dry ingredients in a bowl",
                    "Whisk eggs and almond milk together",
                    "Combine wet and dry ingredients",
                    "Cook on griddle for 2-3 minutes per side"
                ],
                tags: ["quick", "high-protein", "gluten-free"]
            },
            {
                id: 2,
                name: "Greek Yogurt Parfait",
                category: "breakfast",
                cuisine: "mediterranean",
                dietary: ["high-protein", "vegetarian"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 280,
                protein: 20,
                carbs: 35,
                fat: 8,
                ingredients: [
                    "1 cup Greek yogurt",
                    "1/2 cup mixed berries",
                    "2 tbsp granola",
                    "1 tbsp honey",
                    "1 tbsp chia seeds"
                ],
                instructions: [
                    "Layer yogurt in a glass",
                    "Add berries and granola",
                    "Drizzle with honey",
                    "Top with chia seeds"
                ],
                tags: ["quick", "healthy", "no-cook"]
            },
            {
                id: 3,
                name: "Avocado Toast with Eggs",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 5,
                cookTime: 10,
                servings: 2,
                calories: 350,
                protein: 18,
                carbs: 25,
                fat: 22,
                ingredients: [
                    "2 slices whole grain bread",
                    "1 avocado",
                    "2 eggs",
                    "1 tbsp olive oil",
                    "Salt and pepper to taste",
                    "Red pepper flakes"
                ],
                instructions: [
                    "Toast bread slices",
                    "Mash avocado with salt and pepper",
                    "Fry eggs in olive oil",
                    "Spread avocado on toast",
                    "Top with eggs and red pepper flakes"
                ],
                tags: ["healthy", "satisfying", "quick"]
            },
            {
                id: 4,
                name: "Overnight Oats",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "vegan"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 300,
                protein: 12,
                carbs: 45,
                fat: 8,
                ingredients: [
                    "1/2 cup rolled oats",
                    "1/2 cup almond milk",
                    "1 tbsp chia seeds",
                    "1 tbsp maple syrup",
                    "1/2 banana, sliced",
                    "1 tbsp almond butter"
                ],
                instructions: [
                    "Mix oats, milk, and chia seeds",
                    "Add maple syrup and banana",
                    "Refrigerate overnight",
                    "Top with almond butter before serving"
                ],
                tags: ["meal-prep", "vegan", "fiber-rich"]
            },
            {
                id: 5,
                name: "Spinach and Feta Omelet",
                category: "breakfast",
                cuisine: "mediterranean",
                dietary: ["vegetarian", "gluten-free", "keto"],
                prepTime: 5,
                cookTime: 8,
                servings: 1,
                calories: 280,
                protein: 22,
                carbs: 6,
                fat: 20,
                ingredients: [
                    "3 eggs",
                    "1 cup fresh spinach",
                    "2 tbsp feta cheese",
                    "1 tbsp olive oil",
                    "Salt and pepper to taste"
                ],
                instructions: [
                    "Whisk eggs with salt and pepper",
                    "Heat oil in pan",
                    "Add spinach and cook until wilted",
                    "Pour eggs over spinach",
                    "Add feta and fold omelet"
                ],
                tags: ["keto", "high-protein", "quick"]
            },

            // LUNCH RECIPES
            {
                id: 6,
                name: "Quinoa Buddha Bowl",
                category: "lunch",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 15,
                cookTime: 20,
                servings: 2,
                calories: 420,
                protein: 18,
                carbs: 55,
                fat: 16,
                ingredients: [
                    "1 cup quinoa",
                    "1 cup chickpeas",
                    "1 avocado, sliced",
                    "1 cup roasted vegetables",
                    "2 tbsp tahini",
                    "1 tbsp lemon juice",
                    "Mixed greens"
                ],
                instructions: [
                    "Cook quinoa according to package directions",
                    "Roast vegetables until tender",
                    "Mix tahini with lemon juice",
                    "Assemble bowl with all ingredients",
                    "Drizzle with tahini dressing"
                ],
                tags: ["vegan", "nutritious", "colorful"]
            },
            {
                id: 7,
                name: "Grilled Chicken Salad",
                category: "lunch",
                cuisine: "american",
                dietary: ["gluten-free", "high-protein"],
                prepTime: 10,
                cookTime: 15,
                servings: 1,
                calories: 380,
                protein: 35,
                carbs: 15,
                fat: 22,
                ingredients: [
                    "6 oz chicken breast",
                    "Mixed greens",
                    "Cherry tomatoes",
                    "Cucumber",
                    "1/4 avocado",
                    "2 tbsp olive oil",
                    "1 tbsp balsamic vinegar"
                ],
                instructions: [
                    "Season and grill chicken breast",
                    "Chop vegetables",
                    "Slice avocado",
                    "Toss greens with oil and vinegar",
                    "Top with chicken and vegetables"
                ],
                tags: ["high-protein", "low-carb", "fresh"]
            },
            {
                id: 8,
                name: "Mediterranean Wrap",
                category: "lunch",
                cuisine: "mediterranean",
                dietary: ["vegetarian"],
                prepTime: 10,
                cookTime: 0,
                servings: 1,
                calories: 450,
                protein: 20,
                carbs: 55,
                fat: 18,
                ingredients: [
                    "1 whole wheat tortilla",
                    "Hummus",
                    "Cucumber slices",
                    "Tomato slices",
                    "Red onion",
                    "Feta cheese",
                    "Kalamata olives",
                    "Fresh herbs"
                ],
                instructions: [
                    "Spread hummus on tortilla",
                    "Layer vegetables and cheese",
                    "Add olives and herbs",
                    "Roll tightly and slice"
                ],
                tags: ["portable", "fresh", "mediterranean"]
            },
            {
                id: 9,
                name: "Lentil Soup",
                category: "lunch",
                cuisine: "mediterranean",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 30,
                servings: 4,
                calories: 280,
                protein: 18,
                carbs: 45,
                fat: 6,
                ingredients: [
                    "1 cup red lentils",
                    "1 onion, diced",
                    "2 carrots, diced",
                    "2 celery stalks, diced",
                    "3 cloves garlic",
                    "4 cups vegetable broth",
                    "1 tsp cumin",
                    "Salt and pepper"
                ],
                instructions: [
                    "Sauté onion, carrots, and celery",
                    "Add garlic and spices",
                    "Add lentils and broth",
                    "Simmer for 25 minutes",
                    "Season with salt and pepper"
                ],
                tags: ["comforting", "fiber-rich", "budget-friendly"]
            },
            {
                id: 10,
                name: "Tuna Salad Lettuce Wraps",
                category: "lunch",
                cuisine: "american",
                dietary: ["gluten-free", "high-protein", "low-carb"],
                prepTime: 10,
                cookTime: 0,
                servings: 2,
                calories: 320,
                protein: 28,
                carbs: 12,
                fat: 18,
                ingredients: [
                    "2 cans tuna in water",
                    "2 tbsp Greek yogurt",
                    "1 tbsp Dijon mustard",
                    "Celery, diced",
                    "Red onion, diced",
                    "Lettuce leaves",
                    "Salt and pepper"
                ],
                instructions: [
                    "Drain and flake tuna",
                    "Mix with yogurt and mustard",
                    "Add vegetables",
                    "Season with salt and pepper",
                    "Serve in lettuce leaves"
                ],
                tags: ["low-carb", "high-protein", "quick"]
            },

            // DINNER RECIPES
            {
                id: 11,
                name: "Baked Salmon with Vegetables",
                category: "dinner",
                cuisine: "american",
                dietary: ["gluten-free", "high-protein", "keto"],
                prepTime: 10,
                cookTime: 25,
                servings: 2,
                calories: 420,
                protein: 35,
                carbs: 15,
                fat: 25,
                ingredients: [
                    "2 salmon fillets",
                    "Asparagus",
                    "Broccoli",
                    "2 tbsp olive oil",
                    "Lemon juice",
                    "Garlic powder",
                    "Salt and pepper"
                ],
                instructions: [
                    "Preheat oven to 400°F",
                    "Season salmon with spices",
                    "Toss vegetables with oil",
                    "Bake for 20-25 minutes",
                    "Drizzle with lemon juice"
                ],
                tags: ["omega-3", "one-pan", "nutritious"]
            },
            {
                id: 12,
                name: "Vegetarian Stir-Fry",
                category: "dinner",
                cuisine: "asian",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 15,
                cookTime: 10,
                servings: 2,
                calories: 280,
                protein: 12,
                carbs: 35,
                fat: 12,
                ingredients: [
                    "Mixed vegetables",
                    "Tofu, cubed",
                    "2 tbsp soy sauce",
                    "1 tbsp sesame oil",
                    "Ginger, minced",
                    "Garlic, minced",
                    "Brown rice"
                ],
                instructions: [
                    "Cook rice according to package",
                    "Sauté tofu until golden",
                    "Add vegetables and stir-fry",
                    "Add sauce and seasonings",
                    "Serve over rice"
                ],
                tags: ["quick", "colorful", "vegan"]
            },
            {
                id: 13,
                name: "Turkey Meatballs with Zoodles",
                category: "dinner",
                cuisine: "italian",
                dietary: ["gluten-free", "high-protein", "low-carb"],
                prepTime: 15,
                cookTime: 20,
                servings: 3,
                calories: 350,
                protein: 32,
                carbs: 18,
                fat: 18,
                ingredients: [
                    "1 lb ground turkey",
                    "Zucchini noodles",
                    "Marinara sauce",
                    "1 egg",
                    "Almond flour",
                    "Italian herbs",
                    "Parmesan cheese"
                ],
                instructions: [
                    "Mix turkey with egg and herbs",
                    "Form into meatballs",
                    "Bake at 400°F for 15 minutes",
                    "Sauté zoodles",
                    "Serve with sauce and cheese"
                ],
                tags: ["low-carb", "high-protein", "comforting"]
            },
            {
                id: 14,
                name: "Chicken and Vegetable Curry",
                category: "dinner",
                cuisine: "indian",
                dietary: ["gluten-free", "high-protein"],
                prepTime: 15,
                cookTime: 30,
                servings: 4,
                calories: 380,
                protein: 28,
                carbs: 25,
                fat: 20,
                ingredients: [
                    "1 lb chicken breast, cubed",
                    "Mixed vegetables",
                    "Coconut milk",
                    "Curry powder",
                    "Ginger and garlic",
                    "Onion",
                    "Brown rice"
                ],
                instructions: [
                    "Sauté onion, ginger, and garlic",
                    "Add chicken and brown",
                    "Add vegetables and spices",
                    "Pour in coconut milk",
                    "Simmer for 20 minutes"
                ],
                tags: ["spicy", "aromatic", "satisfying"]
            },
            {
                id: 15,
                name: "Stuffed Bell Peppers",
                category: "dinner",
                cuisine: "mediterranean",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 20,
                cookTime: 45,
                servings: 4,
                calories: 320,
                protein: 18,
                carbs: 35,
                fat: 12,
                ingredients: [
                    "4 bell peppers",
                    "Quinoa",
                    "Black beans",
                    "Corn",
                    "Tomatoes",
                    "Cheese",
                    "Mexican spices"
                ],
                instructions: [
                    "Hollow out peppers",
                    "Cook quinoa",
                    "Mix with beans and vegetables",
                    "Stuff peppers",
                    "Bake at 375°F for 30 minutes"
                ],
                tags: ["colorful", "fiber-rich", "vegetarian"]
            },

            // SNACK RECIPES
            {
                id: 16,
                name: "Greek Yogurt with Berries",
                category: "snack",
                cuisine: "mediterranean",
                dietary: ["vegetarian", "high-protein"],
                prepTime: 2,
                cookTime: 0,
                servings: 1,
                calories: 150,
                protein: 15,
                carbs: 20,
                fat: 2,
                ingredients: [
                    "1 cup Greek yogurt",
                    "1/2 cup mixed berries",
                    "1 tbsp honey"
                ],
                instructions: [
                    "Scoop yogurt into bowl",
                    "Top with berries",
                    "Drizzle with honey"
                ],
                tags: ["quick", "high-protein", "antioxidants"]
            },
            {
                id: 17,
                name: "Hummus with Vegetables",
                category: "snack",
                cuisine: "mediterranean",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                calories: 180,
                protein: 8,
                carbs: 20,
                fat: 8,
                ingredients: [
                    "1/2 cup hummus",
                    "Carrot sticks",
                    "Cucumber slices",
                    "Bell pepper strips",
                    "Cherry tomatoes"
                ],
                instructions: [
                    "Arrange vegetables on plate",
                    "Serve with hummus",
                    "Enjoy immediately"
                ],
                tags: ["crunchy", "fiber-rich", "portable"]
            },
            {
                id: 18,
                name: "Apple with Almond Butter",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 2,
                cookTime: 0,
                servings: 1,
                calories: 200,
                protein: 6,
                carbs: 25,
                fat: 12,
                ingredients: [
                    "1 medium apple",
                    "2 tbsp almond butter"
                ],
                instructions: [
                    "Slice apple",
                    "Serve with almond butter",
                    "Enjoy"
                ],
                tags: ["sweet", "fiber-rich", "satisfying"]
            },
            {
                id: 19,
                name: "Hard-Boiled Eggs",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free", "high-protein"],
                prepTime: 2,
                cookTime: 12,
                servings: 2,
                calories: 140,
                protein: 12,
                carbs: 1,
                fat: 10,
                ingredients: [
                    "2 eggs",
                    "Salt and pepper"
                ],
                instructions: [
                    "Boil water",
                    "Add eggs and cook 12 minutes",
                    "Cool and peel",
                    "Season with salt and pepper"
                ],
                tags: ["high-protein", "portable", "filling"]
            },
            {
                id: 20,
                name: "Trail Mix",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 4,
                calories: 200,
                protein: 6,
                carbs: 15,
                fat: 15,
                ingredients: [
                    "Mixed nuts",
                    "Dried fruit",
                    "Dark chocolate chips",
                    "Seeds"
                ],
                instructions: [
                    "Mix all ingredients",
                    "Store in airtight container",
                    "Serve in small portions"
                ],
                tags: ["portable", "energy-boosting", "customizable"]
            },

            // DESSERT RECIPES
            {
                id: 21,
                name: "Chocolate Avocado Mousse",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 0,
                servings: 2,
                calories: 220,
                protein: 6,
                carbs: 18,
                fat: 16,
                ingredients: [
                    "1 ripe avocado",
                    "2 tbsp cocoa powder",
                    "2 tbsp maple syrup",
                    "1 tsp vanilla extract",
                    "Pinch of salt"
                ],
                instructions: [
                    "Blend avocado until smooth",
                    "Add cocoa powder and syrup",
                    "Add vanilla and salt",
                    "Chill before serving"
                ],
                tags: ["healthy", "creamy", "chocolate"]
            },
            {
                id: 22,
                name: "Berry Chia Pudding",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                calories: 180,
                protein: 8,
                carbs: 25,
                fat: 6,
                ingredients: [
                    "1/4 cup chia seeds",
                    "1 cup almond milk",
                    "1 tbsp honey",
                    "Mixed berries",
                    "Vanilla extract"
                ],
                instructions: [
                    "Mix chia seeds with milk",
                    "Add honey and vanilla",
                    "Refrigerate for 4 hours",
                    "Top with berries"
                ],
                tags: ["make-ahead", "fiber-rich", "antioxidants"]
            },
            {
                id: 23,
                name: "Banana Nice Cream",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 2,
                calories: 120,
                protein: 2,
                carbs: 30,
                fat: 1,
                ingredients: [
                    "2 frozen bananas",
                    "1 tbsp almond milk",
                    "1 tsp vanilla extract"
                ],
                instructions: [
                    "Blend frozen bananas",
                    "Add milk and vanilla",
                    "Blend until creamy",
                    "Serve immediately"
                ],
                tags: ["natural", "creamy", "sweet"]
            },
            {
                id: 24,
                name: "Dark Chocolate Bark",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 5,
                servings: 8,
                calories: 150,
                protein: 3,
                carbs: 12,
                fat: 12,
                ingredients: [
                    "4 oz dark chocolate",
                    "Mixed nuts",
                    "Dried fruit",
                    "Sea salt"
                ],
                instructions: [
                    "Melt chocolate",
                    "Pour onto parchment paper",
                    "Top with nuts and fruit",
                    "Sprinkle with sea salt",
                    "Chill until set"
                ],
                tags: ["indulgent", "antioxidants", "customizable"]
            },
            {
                id: 25,
                name: "Protein Smoothie Bowl",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "high-protein"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 280,
                protein: 25,
                carbs: 30,
                fat: 8,
                ingredients: [
                    "1 scoop protein powder",
                    "1 frozen banana",
                    "1/2 cup berries",
                    "1/2 cup almond milk",
                    "Granola",
                    "Coconut flakes"
                ],
                instructions: [
                    "Blend protein powder with fruit",
                    "Add milk and blend",
                    "Pour into bowl",
                    "Top with granola and coconut"
                ],
                tags: ["high-protein", "colorful", "satisfying"]
            },

            // ADDITIONAL RECIPES TO REACH 50+
            {
                id: 26,
                name: "Egg Muffins",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free", "high-protein"],
                prepTime: 10,
                cookTime: 20,
                servings: 6,
                calories: 120,
                protein: 10,
                carbs: 3,
                fat: 8,
                ingredients: ["6 eggs", "Spinach", "Cheese", "Bell peppers", "Salt and pepper"],
                instructions: ["Preheat oven to 350°F", "Whisk eggs", "Add vegetables and cheese", "Pour into muffin tin", "Bake for 20 minutes"],
                tags: ["meal-prep", "portable", "high-protein"]
            },
            {
                id: 27,
                name: "Sweet Potato Hash",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 10,
                cookTime: 20,
                servings: 2,
                calories: 250,
                protein: 8,
                carbs: 35,
                fat: 10,
                ingredients: ["Sweet potatoes", "Onion", "Bell peppers", "Olive oil", "Spices"],
                instructions: ["Dice vegetables", "Heat oil in pan", "Cook until tender", "Season with spices"],
                tags: ["colorful", "fiber-rich", "satisfying"]
            },
            {
                id: 28,
                name: "Chia Seed Pudding",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 200,
                protein: 8,
                carbs: 25,
                fat: 8,
                ingredients: ["3 tbsp chia seeds", "1 cup almond milk", "1 tbsp honey", "Vanilla extract"],
                instructions: ["Mix all ingredients", "Refrigerate overnight", "Stir before serving"],
                tags: ["make-ahead", "fiber-rich", "vegan"]
            },
            {
                id: 29,
                name: "Breakfast Burrito",
                category: "breakfast",
                cuisine: "mexican",
                dietary: ["vegetarian"],
                prepTime: 10,
                cookTime: 15,
                servings: 2,
                calories: 400,
                protein: 20,
                carbs: 45,
                fat: 16,
                ingredients: ["Tortillas", "Eggs", "Black beans", "Cheese", "Salsa", "Avocado"],
                instructions: ["Scramble eggs", "Warm tortillas", "Add fillings", "Roll and serve"],
                tags: ["portable", "satisfying", "protein-rich"]
            },
            {
                id: 30,
                name: "Green Smoothie",
                category: "breakfast",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 180,
                protein: 8,
                carbs: 30,
                fat: 4,
                ingredients: ["Spinach", "Banana", "Mango", "Almond milk", "Chia seeds"],
                instructions: ["Add all ingredients to blender", "Blend until smooth", "Serve immediately"],
                tags: ["nutrient-dense", "quick", "green"]
            },
            {
                id: 31,
                name: "Caesar Salad",
                category: "lunch",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 10,
                cookTime: 0,
                servings: 2,
                calories: 320,
                protein: 15,
                carbs: 12,
                fat: 25,
                ingredients: ["Romaine lettuce", "Parmesan cheese", "Croutons", "Caesar dressing", "Lemon juice"],
                instructions: ["Wash and chop lettuce", "Add cheese and croutons", "Toss with dressing", "Drizzle with lemon"],
                tags: ["classic", "creamy", "satisfying"]
            },
            {
                id: 32,
                name: "Veggie Burger",
                category: "lunch",
                cuisine: "american",
                dietary: ["vegetarian", "vegan"],
                prepTime: 15,
                cookTime: 20,
                servings: 4,
                calories: 280,
                protein: 12,
                carbs: 35,
                fat: 10,
                ingredients: ["Black beans", "Quinoa", "Vegetables", "Breadcrumbs", "Spices", "Bun"],
                instructions: ["Mash beans", "Mix with quinoa and vegetables", "Form patties", "Cook until golden"],
                tags: ["plant-based", "fiber-rich", "satisfying"]
            },
            {
                id: 33,
                name: "Cobb Salad",
                category: "lunch",
                cuisine: "american",
                dietary: ["gluten-free", "high-protein"],
                prepTime: 15,
                cookTime: 0,
                servings: 2,
                calories: 450,
                protein: 35,
                carbs: 15,
                fat: 30,
                ingredients: ["Mixed greens", "Chicken breast", "Bacon", "Hard-boiled eggs", "Avocado", "Blue cheese"],
                instructions: ["Arrange greens on plate", "Top with protein and vegetables", "Drizzle with dressing"],
                tags: ["high-protein", "colorful", "satisfying"]
            },
            {
                id: 34,
                name: "Caprese Sandwich",
                category: "lunch",
                cuisine: "italian",
                dietary: ["vegetarian"],
                prepTime: 5,
                cookTime: 0,
                servings: 1,
                calories: 380,
                protein: 18,
                carbs: 35,
                fat: 20,
                ingredients: ["Ciabatta bread", "Fresh mozzarella", "Tomatoes", "Basil", "Balsamic glaze"],
                instructions: ["Slice bread", "Layer cheese and tomatoes", "Add basil", "Drizzle with balsamic"],
                tags: ["fresh", "simple", "italian"]
            },
            {
                id: 35,
                name: "Asian Noodle Bowl",
                category: "lunch",
                cuisine: "asian",
                dietary: ["vegetarian", "vegan"],
                prepTime: 10,
                cookTime: 15,
                servings: 2,
                calories: 350,
                protein: 12,
                carbs: 45,
                fat: 12,
                ingredients: ["Rice noodles", "Vegetables", "Tofu", "Soy sauce", "Sesame oil", "Ginger"],
                instructions: ["Cook noodles", "Sauté vegetables and tofu", "Add sauce", "Combine and serve"],
                tags: ["aromatic", "colorful", "vegan"]
            },
            {
                id: 36,
                name: "Beef Stir-Fry",
                category: "dinner",
                cuisine: "asian",
                dietary: ["gluten-free", "high-protein"],
                prepTime: 15,
                cookTime: 15,
                servings: 3,
                calories: 420,
                protein: 35,
                carbs: 25,
                fat: 20,
                ingredients: ["Beef strips", "Mixed vegetables", "Soy sauce", "Ginger", "Garlic", "Brown rice"],
                instructions: ["Cook rice", "Sear beef", "Add vegetables", "Stir-fry with sauce"],
                tags: ["high-protein", "quick", "aromatic"]
            },
            {
                id: 37,
                name: "Pasta Primavera",
                category: "dinner",
                cuisine: "italian",
                dietary: ["vegetarian"],
                prepTime: 10,
                cookTime: 20,
                servings: 4,
                calories: 380,
                protein: 15,
                carbs: 55,
                fat: 12,
                ingredients: ["Whole wheat pasta", "Mixed vegetables", "Olive oil", "Parmesan cheese", "Herbs"],
                instructions: ["Cook pasta", "Sauté vegetables", "Combine with pasta", "Add cheese and herbs"],
                tags: ["colorful", "vegetarian", "comforting"]
            },
            {
                id: 38,
                name: "Fish Tacos",
                category: "dinner",
                cuisine: "mexican",
                dietary: ["gluten-free"],
                prepTime: 15,
                cookTime: 10,
                servings: 3,
                calories: 350,
                protein: 25,
                carbs: 30,
                fat: 15,
                ingredients: ["White fish", "Corn tortillas", "Cabbage slaw", "Lime", "Cilantro", "Avocado"],
                instructions: ["Season and cook fish", "Warm tortillas", "Make slaw", "Assemble tacos"],
                tags: ["fresh", "light", "mexican"]
            },
            {
                id: 39,
                name: "Vegetable Lasagna",
                category: "dinner",
                cuisine: "italian",
                dietary: ["vegetarian"],
                prepTime: 20,
                cookTime: 45,
                servings: 6,
                calories: 320,
                protein: 18,
                carbs: 35,
                fat: 12,
                ingredients: ["Lasagna noodles", "Ricotta cheese", "Vegetables", "Marinara sauce", "Mozzarella"],
                instructions: ["Layer noodles and fillings", "Bake at 375°F", "Let rest before serving"],
                tags: ["comforting", "vegetarian", "layered"]
            },
            {
                id: 40,
                name: "Shrimp Scampi",
                category: "dinner",
                cuisine: "italian",
                dietary: ["gluten-free", "high-protein"],
                prepTime: 10,
                cookTime: 15,
                servings: 3,
                calories: 380,
                protein: 30,
                carbs: 25,
                fat: 18,
                ingredients: ["Shrimp", "Linguine", "Garlic", "White wine", "Lemon", "Parsley"],
                instructions: ["Cook pasta", "Sauté shrimp", "Add wine and lemon", "Combine and serve"],
                tags: ["elegant", "high-protein", "aromatic"]
            },
            {
                id: 41,
                name: "Energy Balls",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 0,
                servings: 12,
                calories: 120,
                protein: 4,
                carbs: 15,
                fat: 6,
                ingredients: ["Dates", "Nuts", "Cocoa powder", "Coconut", "Vanilla extract"],
                instructions: ["Process dates and nuts", "Add cocoa and vanilla", "Form into balls", "Roll in coconut"],
                tags: ["no-bake", "energy-boosting", "portable"]
            },
            {
                id: 42,
                name: "Cottage Cheese Bowl",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "high-protein"],
                prepTime: 3,
                cookTime: 0,
                servings: 1,
                calories: 160,
                protein: 20,
                carbs: 12,
                fat: 4,
                ingredients: ["Cottage cheese", "Berries", "Honey", "Nuts"],
                instructions: ["Scoop cottage cheese", "Top with berries", "Drizzle with honey", "Add nuts"],
                tags: ["high-protein", "quick", "satisfying"]
            },
            {
                id: 43,
                name: "Veggie Chips",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 20,
                servings: 4,
                calories: 80,
                protein: 2,
                carbs: 15,
                fat: 2,
                ingredients: ["Sweet potatoes", "Beets", "Zucchini", "Olive oil", "Salt"],
                instructions: ["Slice vegetables thinly", "Toss with oil and salt", "Bake at 400°F", "Cool before serving"],
                tags: ["crunchy", "colorful", "healthy"]
            },
            {
                id: 44,
                name: "Protein Shake",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "high-protein"],
                prepTime: 3,
                cookTime: 0,
                servings: 1,
                calories: 200,
                protein: 25,
                carbs: 15,
                fat: 4,
                ingredients: ["Protein powder", "Banana", "Almond milk", "Peanut butter", "Ice"],
                instructions: ["Add all ingredients to blender", "Blend until smooth", "Serve immediately"],
                tags: ["high-protein", "quick", "satisfying"]
            },
            {
                id: 45,
                name: "Rice Cakes with Toppings",
                category: "snack",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 2,
                cookTime: 0,
                servings: 2,
                calories: 140,
                protein: 6,
                carbs: 20,
                fat: 4,
                ingredients: ["Rice cakes", "Avocado", "Tomato", "Salt and pepper"],
                instructions: ["Top rice cakes", "Add avocado and tomato", "Season with salt and pepper"],
                tags: ["crunchy", "quick", "satisfying"]
            },
            {
                id: 46,
                name: "Frozen Yogurt Bark",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian"],
                prepTime: 5,
                cookTime: 0,
                servings: 6,
                calories: 100,
                protein: 4,
                carbs: 15,
                fat: 3,
                ingredients: ["Greek yogurt", "Honey", "Berries", "Nuts"],
                instructions: ["Mix yogurt with honey", "Spread on parchment", "Top with berries and nuts", "Freeze until firm"],
                tags: ["frozen", "healthy", "colorful"]
            },
            {
                id: 47,
                name: "Baked Apples",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 30,
                servings: 4,
                calories: 120,
                protein: 1,
                carbs: 25,
                fat: 3,
                ingredients: ["Apples", "Cinnamon", "Oats", "Honey", "Nuts"],
                instructions: ["Core apples", "Fill with oats and nuts", "Bake at 375°F", "Drizzle with honey"],
                tags: ["warm", "comforting", "natural"]
            },
            {
                id: 48,
                name: "Pumpkin Spice Latte",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan"],
                prepTime: 5,
                cookTime: 5,
                servings: 1,
                calories: 150,
                protein: 6,
                carbs: 20,
                fat: 6,
                ingredients: ["Coffee", "Pumpkin puree", "Almond milk", "Spices", "Maple syrup"],
                instructions: ["Brew coffee", "Heat milk with pumpkin", "Add spices", "Combine and serve"],
                tags: ["seasonal", "warming", "aromatic"]
            },
            {
                id: 49,
                name: "Fruit Sorbet",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "vegan", "gluten-free"],
                prepTime: 10,
                cookTime: 0,
                servings: 4,
                calories: 80,
                protein: 1,
                carbs: 20,
                fat: 0,
                ingredients: ["Frozen fruit", "Honey", "Lemon juice"],
                instructions: ["Blend frozen fruit", "Add honey and lemon", "Freeze until firm"],
                tags: ["refreshing", "natural", "light"]
            },
            {
                id: 50,
                name: "Chocolate Covered Strawberries",
                category: "dessert",
                cuisine: "american",
                dietary: ["vegetarian", "gluten-free"],
                prepTime: 15,
                cookTime: 0,
                servings: 6,
                calories: 90,
                protein: 2,
                carbs: 12,
                fat: 5,
                ingredients: ["Strawberries", "Dark chocolate", "Coconut oil"],
                instructions: ["Melt chocolate", "Dip strawberries", "Chill until set"],
                tags: ["elegant", "romantic", "antioxidants"]
            }
        ];
    }

    // Search and filter methods
    searchRecipes(query) {
        const searchTerm = query.toLowerCase();
        return this.recipes.filter(recipe => 
            recipe.name.toLowerCase().includes(searchTerm) ||
            recipe.ingredients.some(ingredient => ingredient.toLowerCase().includes(searchTerm)) ||
            recipe.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
    }

    filterByCategory(category) {
        return this.recipes.filter(recipe => recipe.category === category);
    }

    filterByCuisine(cuisine) {
        return this.recipes.filter(recipe => recipe.cuisine === cuisine);
    }

    filterByDietary(dietary) {
        return this.recipes.filter(recipe => recipe.dietary.includes(dietary));
    }

    filterByCalories(maxCalories) {
        return this.recipes.filter(recipe => recipe.calories <= maxCalories);
    }

    filterByProtein(minProtein) {
        return this.recipes.filter(recipe => recipe.protein >= minProtein);
    }

    getRandomRecipes(count = 5) {
        const shuffled = [...this.recipes].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, count);
    }

    getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === id);
    }

    // Advanced filtering
    advancedFilter(filters) {
        let results = [...this.recipes];

        if (filters.category) {
            results = results.filter(recipe => recipe.category === filters.category);
        }

        if (filters.cuisine) {
            results = results.filter(recipe => recipe.cuisine === filters.cuisine);
        }

        if (filters.dietary && filters.dietary.length > 0) {
            results = results.filter(recipe => 
                filters.dietary.some(diet => recipe.dietary.includes(diet))
            );
        }

        if (filters.maxCalories) {
            results = results.filter(recipe => recipe.calories <= filters.maxCalories);
        }

        if (filters.minProtein) {
            results = results.filter(recipe => recipe.protein >= filters.minProtein);
        }

        if (filters.maxPrepTime) {
            results = results.filter(recipe => recipe.prepTime <= filters.maxPrepTime);
        }

        if (filters.maxCookTime) {
            results = results.filter(recipe => recipe.cookTime <= filters.maxCookTime);
        }

        return results;
    }

    // Get recipe statistics
    getStats() {
        return {
            totalRecipes: this.recipes.length,
            categories: this.categories.length,
            cuisines: this.cuisines.length,
            dietaryOptions: this.dietaryTags.length,
            averageCalories: Math.round(this.recipes.reduce((sum, recipe) => sum + recipe.calories, 0) / this.recipes.length),
            averageProtein: Math.round(this.recipes.reduce((sum, recipe) => sum + recipe.protein, 0) / this.recipes.length)
        };
    }
}

// Export for use in other modules
window.RecipeDatabase = RecipeDatabase;
