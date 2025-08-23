import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { eq, and, desc, sql, count } from "drizzle-orm";
import { 
  flashcards, 
  flashcardSets, 
  userFlashcardProgress, 
  userActivities, 
  setAssignments,
  users
} from "@shared/schema";
import { AIHelper } from "./ai";
import { ZodError } from "zod";

// Type for authenticated user with required id field
interface AuthUser {
  id: number;
  username: string;
  [key: string]: any;
}

// Helper function to safely cast req.user to AuthUser
function getAuthUser(req: Request): AuthUser {
  if (!req.user || typeof req.user !== 'object' || !('id' in req.user)) {
    throw new Error('User not properly authenticated');
  }
  return req.user as AuthUser;
}

// Helper for handling errors in route handlers
function handleRouteError(error: unknown, res: Response, defaultMessage: string) {
  console.error(`${defaultMessage}:`, error);
  
  if (error instanceof ZodError) {
    return res.status(400).json({ 
      message: "Invalid input", 
      errors: error.errors 
    });
  }
  
  if (error instanceof Error) {
    return res.status(500).json({ 
      message: error.message || defaultMessage 
    });
  }
  
  return res.status(500).json({ message: defaultMessage });
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes
  setupAuth(app);
  
  const httpServer = createServer(app);

  // API prefix
  const apiPrefix = "/api";

  // Flashcard Sets
  app.get(`${apiPrefix}/flashcard-sets`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const sets = await storage.getFlashcardSets();
      return res.json(sets);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching flashcard sets");
    }
  });

  app.get(`${apiPrefix}/flashcard-sets/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const { id } = req.params;
      const set = await storage.getFlashcardSetById(parseInt(id));
      
      if (!set) {
        return res.status(404).json({ message: "Flashcard set not found" });
      }
      
      return res.json(set);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching flashcard set");
    }
  });

  app.post(`${apiPrefix}/flashcard-sets`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can create flashcard sets
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can create flashcard sets" });
      }

      const newSet = {
        ...req.body,
        createdById: user.id
      };
      
      const set = await storage.createFlashcardSet(newSet);
      return res.status(201).json(set);
    } catch (error) {
      return handleRouteError(error, res, "Error creating flashcard set");
    }
  });

  // Flashcards
  app.get(`${apiPrefix}/flashcard-sets/:setId/flashcards`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const { setId } = req.params;
      const cards = await storage.getFlashcardsBySetId(parseInt(setId));
      return res.json(cards);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching flashcards");
    }
  });

  app.post(`${apiPrefix}/flashcard-sets/:setId/flashcards`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can create flashcards
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can create flashcards" });
      }

      const { setId } = req.params;
      const newFlashcard = {
        ...req.body,
        setId: parseInt(setId),
        createdById: user.id
      };
      
      const flashcard = await storage.createFlashcard(newFlashcard);
      
      // Update the word count in the set
      await storage.updateFlashcardSetWordCount(parseInt(setId));
      
      return res.status(201).json(flashcard);
    } catch (error) {
      return handleRouteError(error, res, "Error creating flashcard");
    }
  });

  // Student Progress
  app.get(`${apiPrefix}/progress`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const progress = await storage.getUserProgress(user.id);
      return res.json(progress);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching progress");
    }
  });

  app.post(`${apiPrefix}/progress/flashcard/:flashcardId`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const { flashcardId } = req.params;
      const { status, pronunciationAccuracy } = req.body;
      
      const progress = await storage.updateFlashcardProgress({
        userId: user.id,
        flashcardId: parseInt(flashcardId),
        status,
        pronunciationAccuracy
      });
      
      return res.json(progress);
    } catch (error) {
      return handleRouteError(error, res, "Error updating flashcard progress");
    }
  });

  // User role endpoint
  app.get(`${apiPrefix}/user/role`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const role = await storage.getUserRole(user.id);
      return res.json({ role });
    } catch (error) {
      return handleRouteError(error, res, "Error fetching user role");
    }
  });

  // Activities
  app.get(`${apiPrefix}/activities`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const activities = await storage.getUserActivities(user.id);
      return res.json(activities);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching activities");
    }
  });

  // Create a new flashcard set
  app.post(`${apiPrefix}/flashcard-sets`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const setData = {
        ...req.body,
        createdById: user.id
      };
      
      const newSet = await storage.createFlashcardSet(setData);
      return res.status(201).json(newSet);
    } catch (error) {
      return handleRouteError(error, res, "Error creating flashcard set");
    }
  });

  // Enhanced AI-powered flashcard generation with superior models
  app.post(`${apiPrefix}/ai/generate-flashcard`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can generate AI flashcards" });
      }

      const { word, modelPreference } = req.body;
      
      if (!word || typeof word !== 'string') {
        return res.status(400).json({ error: "Word is required" });
      }

      // Use enhanced AI service with superior models
      const { enhancedAI } = await import("./enhanced-ai");
      const generatedCard = await enhancedAI.generateFlashcard(
        word.trim().toLowerCase(), 
        modelPreference
      );
      
      return res.json(generatedCard);
    } catch (error) {
      console.error("Enhanced AI flashcard generation error:", error);
      return handleRouteError(error, res, "Error generating flashcard with enhanced AI");
    }
  });

  // Batch generate flashcards with AI
  app.post(`${apiPrefix}/ai/batch-generate`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can batch generate flashcards" });
      }

      const { words, modelPreference, setId } = req.body;
      
      if (!Array.isArray(words) || words.length === 0) {
        return res.status(400).json({ error: "Words array is required" });
      }

      if (words.length > 20) {
        return res.status(400).json({ error: "Maximum 20 words per batch" });
      }

      const { enhancedAI } = await import("./enhanced-ai");
      const results = await enhancedAI.batchGenerateFlashcards(words, modelPreference);
      
      // If setId provided, save successful cards to the set
      if (setId) {
        const savedCards = [];
        for (const result of results) {
          if (!result.error && result.word) {
            try {
              const newFlashcard = {
                setId: parseInt(setId),
                word: result.word,
                pronunciation: result.pronunciation,
                definition: result.definition,
                exampleSentence: result.exampleSentence,
                gifUrl: result.gifUrl,
                audioUrl: result.audioUrl,
                syllables: JSON.stringify(result.syllables || []),
                createdById: user.id,
                aiGenerated: true
              };
              
              const savedCard = await storage.createFlashcard(newFlashcard);
              savedCards.push(savedCard);
            } catch (saveError) {
              console.error(`Error saving flashcard for ${result.word}:`, saveError);
            }
          }
        }
        
        if (savedCards.length > 0) {
          await storage.updateFlashcardSetWordCount(parseInt(setId));
        }
        
        return res.json({ 
          results, 
          saved: savedCards.length,
          total: words.length 
        });
      }
      
      return res.json({ results });
    } catch (error) {
      console.error("Batch AI generation error:", error);
      return handleRouteError(error, res, "Error with batch AI generation");
    }
  });

  // Enhance existing flashcard with superior AI models
  app.post(`${apiPrefix}/ai/enhance-flashcard/:id`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can enhance flashcards" });
      }

      const { id } = req.params;
      const { modelPreference } = req.body;
      
      // Get existing flashcard
      const existingCard = await storage.getFlashcardById(parseInt(id));
      if (!existingCard) {
        return res.status(404).json({ error: "Flashcard not found" });
      }

      const { enhancedAI } = await import("./enhanced-ai");
      const enhancedCard = await enhancedAI.enhanceFlashcard(existingCard, modelPreference);
      
      return res.json(enhancedCard);
    } catch (error) {
      console.error("Flashcard enhancement error:", error);
      return handleRouteError(error, res, "Error enhancing flashcard");
    }
  });

  app.post(`${apiPrefix}/activities`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const newActivity = {
        ...req.body,
        userId: user.id
      };
      
      const activity = await storage.createUserActivity(newActivity);
      return res.status(201).json(activity);
    } catch (error) {
      return handleRouteError(error, res, "Error creating activity");
    }
  });

  // Teacher specific routes
  app.get(`${apiPrefix}/teacher/students`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can access student data
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can access student data" });
      }

      const students = await storage.getStudents();
      return res.json(students);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching students");
    }
  });

  app.get(`${apiPrefix}/teacher/students/:studentId/progress`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can access student progress
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can access student progress" });
      }

      const { studentId } = req.params;
      const progress = await storage.getUserProgress(parseInt(studentId));
      return res.json(progress);
    } catch (error) {
      return handleRouteError(error, res, "Error fetching student progress");
    }
  });

  app.post(`${apiPrefix}/teacher/assign-set`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can assign sets
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can assign sets" });
      }

      const { setId, assignedToId } = req.body;
      
      const assignment = await storage.assignFlashcardSet({
        setId,
        assignedById: user.id,
        assignedToId
      });
      
      return res.status(201).json(assignment);
    } catch (error) {
      return handleRouteError(error, res, "Error assigning flashcard set");
    }
  });

  // Class overview for teachers
  app.get(`${apiPrefix}/teacher/class-overview`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can access class data
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can access class data" });
      }

      const students = await storage.getStudents();
      const overallProgress = await storage.getClassOverallProgress();
      
      return res.json({
        students,
        overallProgress,
        studentCount: students.length
      });
    } catch (error) {
      return handleRouteError(error, res, "Error fetching class overview");
    }
  });

  // Object Storage routes for file upload/download
  const { ObjectStorageService } = await import("./objectStorage");

  // Serve public objects
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

  // Serve private objects with authentication
  app.get("/objects/:objectPath(*)", async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const objectStorageService = new ObjectStorageService();
      
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: user.id.toString(),
        requestedPermission: "read" as any,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing private object:", error);
      return res.status(500).json({ error: "Access denied" });
    }
  });

  // Get upload URL for files
  app.post(`${apiPrefix}/objects/upload`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const { fileType } = req.body;
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL(fileType);
      
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      return res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // List user files
  app.get(`${apiPrefix}/files`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const { type } = req.query;
      const objectStorageService = new ObjectStorageService();
      
      const files = await objectStorageService.listUserFiles(
        user.id.toString(), 
        type as 'gifs' | 'exports' | 'all'
      );
      
      res.json(files);
    } catch (error) {
      console.error("Error listing files:", error);
      return res.status(500).json({ error: "Failed to list files" });
    }
  });

  // Delete user file
  app.delete(`${apiPrefix}/files/objects/*`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const objectPath = req.path.replace(`${apiPrefix}/files`, '');
      const objectStorageService = new ObjectStorageService();
      
      const success = await objectStorageService.deleteUserFile(
        user.id.toString(), 
        objectPath
      );
      
      if (success) {
        res.json({ message: "File deleted successfully" });
      } else {
        res.status(403).json({ error: "Cannot delete file" });
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      return res.status(500).json({ error: "Failed to delete file" });
    }
  });

  // Export flashcard set
  app.post(`${apiPrefix}/flashcard-sets/:setId/export`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const { setId } = req.params;
      
      // Get flashcard set with cards
      const set = await storage.getFlashcardSetById(parseInt(setId));
      const cards = await storage.getFlashcardsBySetId(parseInt(setId));
      
      if (!set) {
        return res.status(404).json({ error: "Flashcard set not found" });
      }

      const exportData = {
        set,
        cards,
        exportedBy: user.id,
        exportedAt: new Date().toISOString(),
        version: "1.0",
        totalCards: cards.length
      };

      const objectStorageService = new ObjectStorageService();
      const exportPath = await objectStorageService.uploadFlashcardSet(
        exportData, 
        user.id.toString()
      );
      
      res.json({ 
        message: "Flashcard set exported successfully",
        exportPath,
        downloadUrl: await objectStorageService.getFlashcardDownloadURL(exportPath)
      });
    } catch (error) {
      console.error("Error exporting flashcard set:", error);
      return res.status(500).json({ error: "Failed to export flashcard set" });
    }
  });

  // AI-powered routes
  
  // Generate an AI flashcard
  app.post(`${apiPrefix}/ai/generate-flashcard`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      // Only teachers and admins can generate AI flashcards
      const user = getAuthUser(req);
      const userRole = await storage.getUserRole(user.id);
      
      if (userRole !== "teacher" && userRole !== "admin") {
        return res.status(403).json({ message: "Only teachers and admins can generate AI flashcards" });
      }

      const { word, setId } = req.body;
      
      if (!word || typeof word !== 'string') {
        return res.status(400).json({ message: "Word is required" });
      }

      // Generate the flashcard content
      const flashcardData = await AIHelper.generateFlashcard(word);
      
      // If setId is provided, save to the database
      if (setId) {
        const newFlashcard = {
          setId: parseInt(setId),
          word: flashcardData.word,
          pronunciation: flashcardData.pronunciation,
          definition: flashcardData.definition,
          exampleSentence: flashcardData.exampleSentence,
          gifUrl: flashcardData.gifUrl,
          audioUrl: flashcardData.audioUrl,
          syllables: flashcardData.syllables,
          createdById: user.id,
          aiGenerated: true
        };
        
        const savedFlashcard = await storage.createFlashcard(newFlashcard);
        // Update the word count in the set
        await storage.updateFlashcardSetWordCount(parseInt(setId));
        
        return res.status(201).json(savedFlashcard);
      } else {
        // Just return the generated content without saving
        return res.json(flashcardData);
      }
    } catch (error) {
      return handleRouteError(error, res, "Error generating AI flashcard");
    }
  });
  
  // Generate pronunciation feedback using AI
  app.post(`${apiPrefix}/ai/pronunciation-feedback`, async (req, res) => {
    try {
      if (!req.isAuthenticated()) return res.status(401).json({ message: "Unauthorized" });

      const user = getAuthUser(req);
      const { flashcardId, recordedAudio, correctPronunciation } = req.body;
      
      if (!flashcardId || !recordedAudio) {
        return res.status(400).json({ message: "Missing required parameters" });
      }

      // In a real implementation, we would analyze the audio
      // Here we'll use a simulated accuracy score
      const accuracy = await AIHelper.analyzePronunciation(recordedAudio, correctPronunciation || '');
      
      // Generate feedback based on the accuracy
      const feedback = await AIHelper.generatePronunciationFeedback(correctPronunciation || '', accuracy);
      
      // Update the user's progress
      await storage.updateFlashcardProgress({
        userId: user.id,
        flashcardId: parseInt(flashcardId),
        pronunciationAccuracy: accuracy,
        status: accuracy >= 90 ? 'mastered' : (accuracy >= 75 ? 'learning' : 'difficult')
      });
      
      return res.json({
        accuracy,
        feedback,
        status: accuracy >= 90 ? 'mastered' : (accuracy >= 75 ? 'learning' : 'difficult')
      });
    } catch (error) {
      return handleRouteError(error, res, "Error processing pronunciation");
    }
  });

  return httpServer;
}
