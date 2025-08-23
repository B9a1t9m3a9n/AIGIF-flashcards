import { db } from "./index";
import * as schema from "@shared/schema";

async function seed() {
  try {
    console.log("🌱 Starting database seed...");

    // Check existing GIFs
    const existingGifs = await db.query.gifs.findMany();
    console.log(`📋 Found ${existingGifs.length} existing GIFs in database`);

    console.log("🎉 Database seed completed - ready for AI generation!");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

seed();