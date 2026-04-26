import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Stores
  const stores = await Promise.all([
    prisma.store.upsert({ where: { id: 1 }, update: {}, create: { name: "Brew & Bean", icon: "☕", color: "brown", points: 5, tier: "Bronze" } }),
    prisma.store.upsert({ where: { id: 2 }, update: {}, create: { name: "FreshMart Grocery", icon: "🛒", color: "green", points: 10, tier: "Silver" } }),
    prisma.store.upsert({ where: { id: 3 }, update: {}, create: { name: "City Pharmacy", icon: "💊", color: "blue", points: 8, tier: "Bronze" } }),
    prisma.store.upsert({ where: { id: 4 }, update: {}, create: { name: "StyleHub Clothing", icon: "👗", color: "pink", points: 15, tier: "Gold" } }),
    prisma.store.upsert({ where: { id: 5 }, update: {}, create: { name: "PageTurner Books", icon: "📚", color: "indigo", points: 10, tier: "Silver" } }),
    prisma.store.upsert({ where: { id: 6 }, update: {}, create: { name: "FitLife Sports", icon: "🏋️", color: "orange", points: 12, tier: "Silver" } }),
  ]);

  // Restaurants
  const restaurants = await Promise.all([
    prisma.restaurant.upsert({ where: { id: 1 }, update: {}, create: { name: "Bella Italia", icon: "🍝", color: "red", cuisine: "Italian", points: 10, tier: "Bronze" } }),
    prisma.restaurant.upsert({ where: { id: 2 }, update: {}, create: { name: "Sakura Sushi", icon: "🍱", color: "pink", cuisine: "Japanese", points: 15, tier: "Silver" } }),
    prisma.restaurant.upsert({ where: { id: 3 }, update: {}, create: { name: "Spice Route", icon: "🍛", color: "orange", cuisine: "Indian", points: 10, tier: "Bronze" } }),
    prisma.restaurant.upsert({ where: { id: 4 }, update: {}, create: { name: "El Rancho", icon: "🌮", color: "yellow", cuisine: "Mexican", points: 8, tier: "Bronze" } }),
    prisma.restaurant.upsert({ where: { id: 5 }, update: {}, create: { name: "The Athenian", icon: "🥙", color: "blue", cuisine: "Greek", points: 12, tier: "Silver" } }),
    prisma.restaurant.upsert({ where: { id: 6 }, update: {}, create: { name: "Golden Dragon", icon: "🥡", color: "green", cuisine: "Chinese", points: 10, tier: "Bronze" } }),
  ]);

  // Store Offers
  await prisma.storeOffer.createMany({
    data: [
      { storeId: stores[0].id, title: "Free Coffee", description: "Get a free coffee with any pastry purchase", discount: "100% off coffee", expiry: "2026-12-31", category: "Food & Drink" },
      { storeId: stores[0].id, title: "Morning Deal", description: "20% off all drinks before 9am", discount: "20% off", expiry: "2026-09-30", category: "Food & Drink" },
      { storeId: stores[1].id, title: "Weekend Special", description: "10% off your entire grocery haul on weekends", discount: "10% off", expiry: "2026-12-31", category: "Groceries" },
      { storeId: stores[1].id, title: "Fresh Produce", description: "Buy 2 get 1 free on all fruits & vegetables", discount: "Buy 2 Get 1", expiry: "2026-07-31", category: "Groceries" },
      { storeId: stores[2].id, title: "Wellness Bonus", description: "Double points on vitamins and supplements", discount: "2x Points", expiry: "2026-08-31", category: "Health" },
      { storeId: stores[3].id, title: "Style Reward", description: "$15 off any purchase over $75", discount: "$15 off $75+", expiry: "2026-10-31", category: "Fashion" },
      { storeId: stores[4].id, title: "Book Club Discount", description: "15% off any 3+ books", discount: "15% off", expiry: "2026-12-31", category: "Books" },
      { storeId: stores[5].id, title: "New Member Offer", description: "25% off your first purchase", discount: "25% off", expiry: "2026-06-30", category: "Sports" },
    ],
  });

  // Restaurant Offers
  await prisma.restaurantOffer.createMany({
    data: [
      { restaurantId: restaurants[0].id, title: "Pasta Night", description: "Half price pasta every Tuesday evening", discount: "50% off pasta", expiry: "2026-12-31", category: "Dining" },
      { restaurantId: restaurants[0].id, title: "Lunch Special", description: "Free dessert with any lunch entrée", discount: "Free dessert", expiry: "2026-09-30", category: "Dining" },
      { restaurantId: restaurants[1].id, title: "Happy Hour", description: "20% off sushi rolls 3–5pm daily", discount: "20% off rolls", expiry: "2026-12-31", category: "Dining" },
      { restaurantId: restaurants[2].id, title: "Curry Feast", description: "Free naan with any curry order", discount: "Free naan", expiry: "2026-11-30", category: "Dining" },
      { restaurantId: restaurants[3].id, title: "Taco Tuesday", description: "$1 tacos every Tuesday", discount: "$1 tacos", expiry: "2026-12-31", category: "Dining" },
      { restaurantId: restaurants[4].id, title: "Family Meal", description: "10% off orders for 4 or more", discount: "10% off", expiry: "2026-10-31", category: "Dining" },
      { restaurantId: restaurants[5].id, title: "Dim Sum Deal", description: "Free pot of tea with any dim sum order", discount: "Free tea", expiry: "2026-12-31", category: "Dining" },
    ],
  });

  console.log(`✓ Seeded ${stores.length} stores, ${restaurants.length} restaurants, and their offers.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
