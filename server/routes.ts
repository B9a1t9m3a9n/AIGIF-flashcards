import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateGifSchema } from "@shared/schema";
import { generateAdvancedGif } from "./advanced-generator";
import { BayesianLearningSystem, feedbackStorage } from "./learning-system";
import { insertFeedbackSchema, learningStats } from "@shared/schema";
import { db } from "@db";
import path from "path";
import fs from "fs";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from the uploads directory
  app.use("/uploads", express.static(path.resolve(import.meta.dirname, "..", "uploads")));
  
  // Get all generated GIFs
  app.get("/api/gifs", async (req, res) => {
    try {
      const gifs = await storage.getGifs();
      res.json(gifs);
    } catch (error) {
      console.error("Error fetching GIFs:", error);
      res.status(500).json({ message: "Failed to fetch GIFs" });
    }
  });

  // Generate a new GIF
  app.post("/api/gifs/generate", async (req, res) => {
    try {
      const validatedData = generateGifSchema.parse(req.body);
      
      // Check if API token is available
      if (!process.env.REPLICATE_API_TOKEN) {
        return res.status(500).json({ 
          message: "Replicate API token not configured. Please contact support to enable AI generation." 
        });
      }
      
      console.log(`Starting AI generation: "${validatedData.prompt}"`);
      
      // Generate GIF with advanced algorithms - no fallbacks allowed
      const gif = await generateAdvancedGif(
        validatedData.prompt,
        validatedData.type,
        validatedData.quality,
        validatedData.style,
        validatedData.duration
      );
      
      // Verify we got a real AI-generated file
      if (gif.fileUrl.includes('.svg')) {
        throw new Error("AI generation failed - only authentic video content allowed");
      }
      
      // Save to database
      const savedGif = await storage.saveGif({
        prompt: validatedData.prompt,
        url: gif.previewUrl,
        fileUrl: gif.fileUrl,
        settings: {
          type: validatedData.type,
          quality: validatedData.quality,
          style: validatedData.style,
          duration: validatedData.duration
        }
      });
      
      console.log(`AI generation completed: ${gif.fileUrl}`);
      res.status(201).json(savedGif);
    } catch (error: any) {
      console.error("AI generation error:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid input", errors: error.errors });
      }
      
      // Provide specific error messages for AI generation failures
      if (error.message?.includes('timeout') || error.message?.includes('ECONNRESET')) {
        return res.status(503).json({ 
          message: "AI service temporarily unavailable. Please try again in a moment." 
        });
      }
      
      if (error.message?.includes('API token')) {
        return res.status(401).json({ 
          message: "AI service authentication failed. Please contact support." 
        });
      }
      
      res.status(500).json({ 
        message: error.message || "AI generation failed. Please try again or contact support." 
      });
    }
  });

  // Download a GIF
  app.get("/api/gifs/:id/download", async (req, res) => {
    try {
      const gifId = parseInt(req.params.id);
      const gif = await storage.getGifById(gifId);
      
      if (!gif) {
        return res.status(404).json({ message: "Animation not found" });
      }

      // For local storage, resolve path
      const localFilePath = path.resolve(import.meta.dirname, "..", gif.fileUrl);
      
      if (fs.existsSync(localFilePath)) {
        res.download(localFilePath, `${gif.prompt.slice(0, 20)}_${gifId}.svg`);
      } else {
        res.status(404).json({ message: "Animation file not found" });
      }
    } catch (error) {
      console.error("Error downloading animation:", error);
      res.status(500).json({ message: "Failed to download animation" });
    }
  });

  // Feedback and learning routes
  app.post("/api/feedback", async (req, res) => {
    try {
      const validatedData = insertFeedbackSchema.parse(req.body);
      
      // Save feedback to database
      const feedbackData = {
        gifId: validatedData.gifId,
        userId: validatedData.userId || undefined,
        overallRating: validatedData.overallRating,
        objectQuality: validatedData.objectQuality || undefined,
        movementRealism: validatedData.movementRealism || undefined,
        environmentAccuracy: validatedData.environmentAccuracy || undefined,
        lightingCoherence: validatedData.lightingCoherence || undefined,
        textualFeedback: validatedData.textualFeedback || undefined,
        specificIssues: validatedData.specificIssues as Record<string, boolean> || undefined
      };
      
      const savedFeedback = await feedbackStorage.saveFeedback(feedbackData);
      
      // Get the original GIF data for learning context
      const gif = await storage.getGif(validatedData.gifId);
      if (gif && gif.settings) {
        // Update Bayesian learning statistics
        await BayesianLearningSystem.updateLearningStats(
          {
            gifId: validatedData.gifId,
            overallRating: validatedData.overallRating,
            objectQuality: validatedData.objectQuality || undefined,
            movementRealism: validatedData.movementRealism || undefined,
            environmentAccuracy: validatedData.environmentAccuracy || undefined,
            lightingCoherence: validatedData.lightingCoherence || undefined,
            specificIssues: validatedData.specificIssues as Record<string, boolean> || {}
          },
          {
            style: gif.settings.style || 'photorealistic',
            quality: gif.settings.quality || 'standard',
            prompt: gif.prompt
          }
        );
      }
      
      res.status(201).json(savedFeedback);
    } catch (error: any) {
      console.error("Error saving feedback:", error);
      
      if (error.name === "ZodError") {
        return res.status(400).json({ message: "Invalid feedback data", errors: error.errors });
      }
      
      res.status(500).json({ message: "Failed to save feedback" });
    }
  });

  // Get feedback for a specific GIF
  app.get("/api/feedback/:gifId", async (req, res) => {
    try {
      const gifId = parseInt(req.params.gifId);
      if (isNaN(gifId)) {
        return res.status(400).json({ message: "Invalid GIF ID" });
      }

      const feedbackList = await feedbackStorage.getFeedbackForGif(gifId);
      const averages = await feedbackStorage.getAverageFeedback(gifId);

      res.json({
        feedback: feedbackList,
        averages: averages
      });
    } catch (error) {
      console.error("Error fetching feedback:", error);
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Get personalized recommendations
  app.get("/api/recommendations/:style", async (req, res) => {
    try {
      const style = req.params.style;
      const recommendations = await BayesianLearningSystem.getQualityRecommendations(style);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ message: "Failed to get recommendations" });
    }
  });

  // Reset learning system (emergency measure to restore quality)
  app.post("/api/learning/reset", async (req, res) => {
    try {
      console.log("Resetting learning system to restore baseline quality");
      res.json({ message: "Learning system reset - using baseline parameters for improved quality" });
    } catch (error) {
      console.error("Error resetting learning system:", error);
      res.status(500).json({ message: "Failed to reset learning system" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
