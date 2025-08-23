import { db, pool } from "@db";
import { 
  users, 
  roles, 
  flashcardSets, 
  flashcards, 
  userFlashcardProgress, 
  userActivities, 
  setAssignments,
  insertUserSchema,
  insertFlashcardSetSchema,
  insertFlashcardSchema,
  User,
  Role,
  FlashcardSet,
  Flashcard,
  UserFlashcardProgress,
  UserActivity
} from "@shared/schema";
import { eq, and, desc, sql, count, asc } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import session from "express-session";
import { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { ZodError } from "zod";

export interface IStorage {
  // User-related methods
  createUser: (user: any) => Promise<User>;
  getUser: (id: number) => Promise<User | undefined>;
  getUserByUsername: (username: string) => Promise<User | undefined>;
  getUserRole: (userId: number) => Promise<string>;
  getStudents: () => Promise<User[]>;
  
  // Flashcard set methods
  getFlashcardSets: () => Promise<FlashcardSet[]>;
  getFlashcardSetById: (id: number) => Promise<FlashcardSet | undefined>;
  createFlashcardSet: (set: any) => Promise<FlashcardSet>;
  updateFlashcardSetWordCount: (setId: number) => Promise<void>;
  
  // Flashcard methods
  getFlashcardsBySetId: (setId: number) => Promise<Flashcard[]>;
  createFlashcard: (flashcard: any) => Promise<Flashcard>;
  
  // Progress methods
  getUserProgress: (userId: number) => Promise<any>;
  updateFlashcardProgress: (data: any) => Promise<UserFlashcardProgress>;
  getClassOverallProgress: () => Promise<any>;
  
  // Activity methods
  getUserActivities: (userId: number) => Promise<UserActivity[]>;
  createUserActivity: (activity: any) => Promise<UserActivity>;
  
  // Assignment methods
  assignFlashcardSet: (data: any) => Promise<any>;
  getAssignedSets: (userId: number) => Promise<any[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class DatabaseStorage implements IStorage {
  private db: PostgresJsDatabase;
  sessionStore: session.SessionStore;

  constructor() {
    this.db = db;
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({
      pool: pool,
      createTableIfMissing: true 
    });
  }

  async createUser(userData: any): Promise<User> {
    try {
      const validatedData = insertUserSchema.parse(userData);
      const [user] = await this.db.insert(users).values(validatedData).returning();
      return user;
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return user;
  }

  async getUserRole(userId: number): Promise<string> {
    const result = await this.db
      .select({ roleName: roles.name })
      .from(users)
      .innerJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId));
    
    if (result.length === 0) {
      throw new Error("User role not found");
    }
    
    return result[0].roleName;
  }

  async getStudents(): Promise<User[]> {
    // Get the student role ID
    const [studentRole] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.name, "student"));
    
    if (!studentRole) {
      return [];
    }
    
    // Get all users with student role
    const studentUsers = await this.db
      .select()
      .from(users)
      .where(eq(users.roleId, studentRole.id))
      .orderBy(asc(users.displayName));
    
    return studentUsers;
  }

  async getFlashcardSets(): Promise<FlashcardSet[]> {
    const sets = await this.db
      .select()
      .from(flashcardSets)
      .orderBy(desc(flashcardSets.createdAt));
    
    return sets;
  }

  async getFlashcardSetById(id: number): Promise<FlashcardSet | undefined> {
    const [set] = await this.db
      .select()
      .from(flashcardSets)
      .where(eq(flashcardSets.id, id));
    
    return set;
  }

  async createFlashcardSet(setData: any): Promise<FlashcardSet> {
    try {
      const validatedData = insertFlashcardSetSchema.parse(setData);
      const [set] = await this.db.insert(flashcardSets).values(validatedData).returning();
      return set;
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new Error(`Error creating flashcard set: ${error.message}`);
    }
  }

  async updateFlashcardSetWordCount(setId: number): Promise<void> {
    // Count the number of flashcards in the set
    const result = await this.db
      .select({ count: count() })
      .from(flashcards)
      .where(eq(flashcards.setId, setId));
    
    const wordCount = result[0].count;
    
    // Update the set's wordCount
    await this.db
      .update(flashcardSets)
      .set({ wordCount })
      .where(eq(flashcardSets.id, setId));
  }

  async getFlashcardsBySetId(setId: number): Promise<Flashcard[]> {
    const cards = await this.db
      .select()
      .from(flashcards)
      .where(eq(flashcards.setId, setId));
    
    return cards;
  }

  async createFlashcard(flashcardData: any): Promise<Flashcard> {
    try {
      const validatedData = insertFlashcardSchema.parse(flashcardData);
      const [flashcard] = await this.db.insert(flashcards).values(validatedData).returning();
      return flashcard;
    } catch (error) {
      if (error instanceof ZodError) {
        throw error;
      }
      throw new Error(`Error creating flashcard: ${error.message}`);
    }
  }

  async getUserProgress(userId: number): Promise<any> {
    // Get all user's flashcard progress
    const progressData = await this.db
      .select({
        id: userFlashcardProgress.id,
        flashcardId: userFlashcardProgress.flashcardId,
        status: userFlashcardProgress.status,
        correctCount: userFlashcardProgress.correctCount,
        incorrectCount: userFlashcardProgress.incorrectCount,
        lastPracticed: userFlashcardProgress.lastPracticed,
        pronunciationAccuracy: userFlashcardProgress.pronunciationAccuracy,
        setId: flashcards.setId
      })
      .from(userFlashcardProgress)
      .innerJoin(flashcards, eq(userFlashcardProgress.flashcardId, flashcards.id))
      .where(eq(userFlashcardProgress.userId, userId));
    
    // Get assigned sets
    const assignedSets = await this.getAssignedSets(userId);
    
    // Calculate overall statistics
    const totalFlashcards = progressData.length;
    const masteredFlashcards = progressData.filter(p => p.status === 'mastered').length;
    const masteredPercentage = totalFlashcards > 0 ? Math.round((masteredFlashcards / totalFlashcards) * 100) : 0;
    
    const progressBySet = assignedSets.map(set => {
      const setProgress = progressData.filter(p => p.setId === set.id);
      const totalInSet = setProgress.length;
      const masteredInSet = setProgress.filter(p => p.status === 'mastered').length;
      const progressPercentage = totalInSet > 0 ? Math.round((masteredInSet / totalInSet) * 100) : 0;
      
      return {
        setId: set.id,
        title: set.title,
        totalWords: set.wordCount,
        masteredWords: masteredInSet,
        progressPercentage
      };
    });
    
    return {
      overall: {
        totalFlashcards,
        masteredFlashcards,
        masteredPercentage
      },
      progressBySet,
      assignedSets
    };
  }

  async getFlashcardById(id: number): Promise<Flashcard | undefined> {
    const [flashcard] = await this.db
      .select()
      .from(flashcards)
      .where(eq(flashcards.id, id));
    
    return flashcard;
  }

  async updateFlashcardProgress(data: any): Promise<UserFlashcardProgress> {
    const { userId, flashcardId, status, pronunciationAccuracy } = data;
    
    // Check if progress record exists
    const [existingProgress] = await this.db
      .select()
      .from(userFlashcardProgress)
      .where(
        and(
          eq(userFlashcardProgress.userId, userId),
          eq(userFlashcardProgress.flashcardId, flashcardId)
        )
      );
    
    let updatedProgress;
    
    if (existingProgress) {
      // Update existing record
      const updateData: any = {
        status: status || existingProgress.status,
        updatedAt: new Date()
      };
      
      // Update correct/incorrect count based on status
      if (status === 'mastered') {
        updateData.correctCount = existingProgress.correctCount + 1;
      } else if (status === 'difficult') {
        updateData.incorrectCount = existingProgress.incorrectCount + 1;
      }
      
      if (pronunciationAccuracy !== undefined) {
        updateData.pronunciationAccuracy = pronunciationAccuracy;
      }
      
      const [result] = await this.db
        .update(userFlashcardProgress)
        .set(updateData)
        .where(eq(userFlashcardProgress.id, existingProgress.id))
        .returning();
      
      updatedProgress = result;
    } else {
      // Create new progress record
      const insertData: any = {
        userId,
        flashcardId,
        status: status || 'new',
        lastPracticed: new Date()
      };
      
      if (pronunciationAccuracy !== undefined) {
        insertData.pronunciationAccuracy = pronunciationAccuracy;
      }
      
      if (status === 'mastered') {
        insertData.correctCount = 1;
      } else if (status === 'difficult') {
        insertData.incorrectCount = 1;
      }
      
      const [result] = await this.db
        .insert(userFlashcardProgress)
        .values(insertData)
        .returning();
      
      updatedProgress = result;
    }
    
    return updatedProgress;
  }

  async getClassOverallProgress(): Promise<any> {
    // Get student role ID
    const [studentRole] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.name, "student"));
    
    if (!studentRole) {
      return { totalStudents: 0, averageProgress: 0 };
    }
    
    // Get count of students
    const studentCountResult = await this.db
      .select({ count: count() })
      .from(users)
      .where(eq(users.roleId, studentRole.id));
    
    const totalStudents = studentCountResult[0].count;
    
    if (totalStudents === 0) {
      return { totalStudents: 0, averageProgress: 0 };
    }
    
    // Get mastered flashcards per student
    const progressPerStudent = await this.db
      .select({
        userId: userFlashcardProgress.userId,
        mastered: count(userFlashcardProgress.id)
      })
      .from(userFlashcardProgress)
      .where(eq(userFlashcardProgress.status, 'mastered'))
      .groupBy(userFlashcardProgress.userId);
    
    // Get total flashcards
    const flashcardCountResult = await this.db
      .select({ count: count() })
      .from(flashcards);
    
    const totalFlashcards = flashcardCountResult[0].count;
    
    if (totalFlashcards === 0) {
      return { totalStudents, averageProgress: 0 };
    }
    
    // Calculate average progress
    let totalProgressPercentage = 0;
    progressPerStudent.forEach(student => {
      const studentPercentage = Math.round((student.mastered / totalFlashcards) * 100);
      totalProgressPercentage += studentPercentage;
    });
    
    const averageProgress = Math.round(totalProgressPercentage / totalStudents);
    
    return { totalStudents, averageProgress };
  }

  async getUserActivities(userId: number): Promise<UserActivity[]> {
    const activities = await this.db
      .select()
      .from(userActivities)
      .where(eq(userActivities.userId, userId))
      .orderBy(desc(userActivities.createdAt))
      .limit(10);
    
    return activities;
  }

  async createUserActivity(activityData: any): Promise<UserActivity> {
    const [activity] = await this.db
      .insert(userActivities)
      .values(activityData)
      .returning();
    
    return activity;
  }

  async assignFlashcardSet(data: any): Promise<any> {
    const { setId, assignedById, assignedToId } = data;
    
    // Check if assignment already exists
    const [existingAssignment] = await this.db
      .select()
      .from(setAssignments)
      .where(
        and(
          eq(setAssignments.setId, setId),
          eq(setAssignments.assignedToId, assignedToId)
        )
      );
    
    if (existingAssignment) {
      return existingAssignment;
    }
    
    // Create new assignment
    const [assignment] = await this.db
      .insert(setAssignments)
      .values({
        setId,
        assignedById,
        assignedToId
      })
      .returning();
    
    return assignment;
  }

  async getAssignedSets(userId: number): Promise<any[]> {
    const assignedSets = await this.db
      .select({
        id: flashcardSets.id,
        title: flashcardSets.title,
        description: flashcardSets.description,
        coverImage: flashcardSets.coverImage,
        wordCount: flashcardSets.wordCount,
        isPreloaded: flashcardSets.isPreloaded,
        assignedAt: setAssignments.assignedAt
      })
      .from(setAssignments)
      .innerJoin(flashcardSets, eq(setAssignments.setId, flashcardSets.id))
      .where(eq(setAssignments.assignedToId, userId))
      .orderBy(desc(setAssignments.assignedAt));
    
    return assignedSets;
  }
}

export const storage = new DatabaseStorage();
