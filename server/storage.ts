import { db } from "@db";
import { gifs, type Gif, type InsertGif } from "@shared/schema";
import { eq } from "drizzle-orm";

export const storage = {
  /**
   * Get all GIFs, ordered by creation date (newest first)
   */
  getGifs: async (): Promise<Gif[]> => {
    return await db.query.gifs.findMany({
      orderBy: (gifs, { desc }) => [desc(gifs.createdAt)],
    });
  },

  /**
   * Get a specific GIF by ID
   */
  getGifById: async (id: number): Promise<Gif | undefined> => {
    return await db.query.gifs.findFirst({
      where: eq(gifs.id, id),
    });
  },

  getGif: async (id: number): Promise<Gif | undefined> => {
    return await db.query.gifs.findFirst({
      where: eq(gifs.id, id),
    });
  },

  /**
   * Save a new GIF to the database
   */
  saveGif: async (gifData: {
    prompt: string;
    url: string;
    fileUrl: string;
    userId?: number;
    settings?: {
      type: "animated" | "still";
      quality: "basic" | "standard" | "high" | "professional" | "ultra";
      style?: "photorealistic" | "artistic" | "cinematic" | "anime" | "cartoon" | "abstract";
      duration?: "short" | "medium" | "long";
    };
  }): Promise<Gif> => {
    const [newGif] = await db.insert(gifs).values({
      prompt: gifData.prompt,
      url: gifData.url,
      fileUrl: gifData.fileUrl,
      userId: gifData.userId,
      settings: gifData.settings,
    }).returning();
    
    return newGif;
  },

  /**
   * Delete a GIF by ID
   */
  deleteGif: async (id: number): Promise<boolean> => {
    const deleted = await db.delete(gifs).where(eq(gifs.id, id)).returning();
    return deleted.length > 0;
  }
};
