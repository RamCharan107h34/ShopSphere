import mongoose from "mongoose";
import dns from "node:dns";
import dotenv from "dotenv";
dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch {
  // Ignore
}

const DB_URL = process.env.DB_URL?.trim() || "mongodb://127.0.0.1:27017/shopsphere_db";

const initialCategories = [
  {
    name: "Electronics",
    slug: "electronics",
    description: "Smartphones, audio, laptops, gaming gear & smart accessories",
    image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Fashion",
    slug: "fashion",
    description: "Men's, women's apparel, footwear, bags & fashion accessories",
    image: "https://images.unsplash.com/photo-1445205170230-053b83016050?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Home & Kitchen",
    slug: "home-kitchen",
    description: "Home appliances, kitchenware, modern decor & lighting",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty",
    description: "Organic skincare, haircare, cosmetics & fragrances",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Sports & Fitness",
    slug: "sports",
    description: "Workout equipment, yoga gear, athletic wear & sports hydration",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Books & Stationery",
    slug: "books",
    description: "Bestsellers, creative notebooks, art supplies & office essentials",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
  {
    name: "Toys & Games",
    slug: "toys-games",
    description: "Board games, puzzles, collectibles & learning kits",
    image: "https://images.unsplash.com/photo-1558060370-d644479cb6f7?auto=format&fit=crop&w=800&q=80",
    isActive: true,
  },
];

async function run() {
  console.log("Connecting to database...");
  await mongoose.connect(DB_URL);
  const db = mongoose.connection.db;

  console.log("Upserting categories...");
  for (const cat of initialCategories) {
    await db.collection("categories").updateOne(
      { slug: cat.slug },
      { $set: { ...cat, updatedAt: new Date() }, $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
  }

  const allCategories = await db.collection("categories").find({}).toArray();
  console.log(`Successfully seeded ${allCategories.length} categories:`);
  allCategories.forEach((c) => console.log(` - ${c.name} (${c.slug}) [${c._id}]`));

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch((err) => {
  console.error("Seeding categories failed:", err);
  process.exit(1);
});
