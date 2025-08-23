import { db } from "./index";
import * as schema from "@shared/schema";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { eq, and } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function seed() {
  try {
    console.log("Starting database seed...");

    // Create roles
    const roleData = [
      { name: "admin" },
      { name: "teacher" },
      { name: "student" }
    ];

    // Check if roles already exist
    const existingRoles = await db.select().from(schema.roles);
    
    if (existingRoles.length === 0) {
      console.log("Creating roles...");
      await db.insert(schema.roles).values(roleData);
    } else {
      console.log("Roles already exist, skipping creation...");
    }

    // Get role IDs
    const allRoles = await db.select().from(schema.roles);
    const adminRoleId = allRoles.find(r => r.name === "admin")?.id;
    const teacherRoleId = allRoles.find(r => r.name === "teacher")?.id;
    const studentRoleId = allRoles.find(r => r.name === "student")?.id;

    if (!adminRoleId || !teacherRoleId || !studentRoleId) {
      throw new Error("Unable to retrieve role IDs");
    }

    // Check if admin account exists
    const adminExists = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "admin"));

    if (adminExists.length === 0) {
      console.log("Creating admin user...");
      // Create admin user
      await db.insert(schema.users).values({
        username: "admin",
        password: await hashPassword("admin123"),
        displayName: "System Admin",
        roleId: adminRoleId
      });
    } else {
      console.log("Admin user already exists, skipping creation...");
    }

    // Check if teacher account exists
    const teacherExists = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "teacher"));

    if (teacherExists.length === 0) {
      console.log("Creating teacher user...");
      // Create teacher user
      await db.insert(schema.users).values({
        username: "teacher",
        password: await hashPassword("teacher123"),
        displayName: "Ms. Johnson",
        roleId: teacherRoleId
      });
    } else {
      console.log("Teacher user already exists, skipping creation...");
    }

    // Check if student account exists
    const studentExists = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "student"));

    if (studentExists.length === 0) {
      console.log("Creating student user...");
      // Create student user
      await db.insert(schema.users).values({
        username: "student",
        password: await hashPassword("student123"),
        displayName: "Jake Smith",
        grade: "Grade 2",
        roleId: studentRoleId
      });
    } else {
      console.log("Student user already exists, skipping creation...");
    }

    // Check if we need to create the sample flashcard sets
    const setsExist = await db.select().from(schema.flashcardSets);
    
    if (setsExist.length === 0) {
      console.log("Creating sample flashcard sets...");
      
      // Get the admin user for flashcard creation
      const adminUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "admin"))
        .then(users => users[0]);
      
      if (!adminUser) {
        throw new Error("Admin user not found for flashcard creation");
      }
      
      // Create sample flashcard sets
      const basicWordsSet = await db.insert(schema.flashcardSets).values({
        title: "Basic Words",
        description: "A collection of basic Fry sight words (1-100)",
        coverImage: "https://images.unsplash.com/photo-1629196914168-29bf030d5b2a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
        createdById: adminUser.id,
        isPreloaded: true
      }).returning();
      
      const sightWordsSet = await db.insert(schema.flashcardSets).values({
        title: "Sight Words",
        description: "Essential sight words for early readers",
        coverImage: "https://images.unsplash.com/photo-1555431189-0fabf2667795?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
        createdById: adminUser.id,
        isPreloaded: true
      }).returning();
      
      const phrasesSet = await db.insert(schema.flashcardSets).values({
        title: "Common Phrases",
        description: "Frequently used phrases for early readers",
        coverImage: "https://images.unsplash.com/photo-1629202087503-91bb7da40fa7?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80",
        createdById: adminUser.id,
        isPreloaded: true
      }).returning();
      
      // Create Fry's first 100 sight words (part of the 1000 word list)
      const fryWords1to100 = [
        // First 25 (common words - highest frequency)
        "the", "of", "and", "a", "to", "in", "is", "you", "that", "it", 
        "he", "was", "for", "on", "are", "as", "with", "his", "they", "I", 
        "at", "be", "this", "have", "from",
        
        // 26-50
        "or", "one", "had", "by", "word", "but", "not", "what", "all", "were",
        "we", "when", "your", "can", "said", "there", "use", "an", "each", "which",
        "she", "do", "how", "their", "if",
        
        // 51-75
        "will", "up", "other", "about", "out", "many", "then", "them", "these", "so",
        "some", "her", "would", "make", "like", "him", "into", "time", "has", "look",
        "two", "more", "write", "go", "see",
        
        // 76-100
        "number", "no", "way", "could", "people", "my", "than", "first", "water", "been",
        "call", "who", "oil", "its", "now", "find", "long", "down", "day", "did",
        "get", "come", "made", "may", "part"
      ];
      
      // Create definitions and example sentences for each word
      const wordDefinitions: Record<string, string> = {
        "the": "Used to point to a specific person or thing",
        "of": "Belonging to or connected with something",
        "and": "Used to join words or groups of words",
        "a": "One or any",
        "to": "Moving toward something",
        "in": "Inside or within",
        "is": "A form of the verb 'to be'",
        "you": "The person being spoken to",
        "that": "Used to point to a specific thing",
        "it": "Used to refer to a thing previously mentioned",
        "he": "Used to refer to a male person",
        "was": "Past tense of the verb 'to be'",
        "for": "Intended to be given to",
        "on": "Positioned above and touching",
        "are": "A form of the verb 'to be'",
        "as": "To the same degree",
        "with": "Accompanied by",
        "his": "Belonging to a male person",
        "they": "Used to refer to people, animals, or things",
        "I": "Used to refer to oneself",
        "at": "In, on, or near",
        "be": "To exist",
        "this": "Used to identify a specific person or thing close at hand",
        "have": "To own, possess, or hold",
        "from": "Starting at"
      };
      
      const exampleSentences: Record<string, string> = {
        "the": "The book is on the table.",
        "of": "This is a friend of mine.",
        "and": "She likes apples and oranges.",
        "a": "I saw a bird in the tree.",
        "to": "We are going to the park.",
        "in": "The toys are in the box.",
        "is": "The sky is blue today.",
        "you": "You are my best friend.",
        "that": "That ball is red.",
        "it": "It is time for lunch.",
        "he": "He likes to play soccer.",
        "was": "She was happy to see you.",
        "for": "This gift is for you.",
        "on": "The cat is on the chair.",
        "are": "They are going to school.",
        "as": "She is as tall as her mother.",
        "with": "I'm going with my family.",
        "his": "That is his backpack.",
        "they": "They are playing outside.",
        "I": "I love to read books.",
        "at": "We meet at the library.",
        "be": "Be careful on the stairs.",
        "this": "This cookie tastes good.",
        "have": "I have two brothers.",
        "from": "The letter is from my friend."
      };
      
      // Helper functions for syllables and word info
      const breakIntoSyllables = (word: string): { text: string }[] => {
        if (word.length <= 3) {
          return [{ text: word }];
        }
        
        // Simple syllable division rules
        const vowels = ['a', 'e', 'i', 'o', 'u', 'y'];
        let inVowelGroup = false;
        let syllables: string[] = [];
        let currentSyllable = '';
        
        for (let i = 0; i < word.length; i++) {
          const char = word[i].toLowerCase();
          const isVowel = vowels.includes(char);
          
          currentSyllable += word[i];
          
          if (!isVowel && inVowelGroup) {
            inVowelGroup = false;
            
            // Don't split on the last consonant
            if (i < word.length - 1) {
              syllables.push(currentSyllable);
              currentSyllable = '';
            }
          } else if (isVowel) {
            inVowelGroup = true;
          }
        }
        
        // Add any remaining characters
        if (currentSyllable) {
          syllables.push(currentSyllable);
        }
        
        // If no syllables were found, return the whole word
        if (syllables.length === 0) {
          return [{ text: word }];
        }
        
        return syllables.map(syllable => ({ text: syllable }));
      };
      
      // Helper function to get example and definition
      const getExample = (word: string): string => {
        return exampleSentences[word] || `I can read the word "${word}" in my book.`;
      };
      
      const getDefinition = (word: string): string => {
        return wordDefinitions[word] || `The word "${word}" is a common sight word.`;
      };
      
      // Insert the first 100 Fry sight words
      for (const word of fryWords1to100) {
        await db.insert(schema.flashcards).values({
          setId: basicWordsSet[0].id,
          word,
          pronunciation: word,
          definition: getDefinition(word),
          exampleSentence: getExample(word),
          createdById: adminUser.id,
          syllables: breakIntoSyllables(word)
        });
      }
      
      // Create another set with additional sight words (words 101-200)
      const fryWords101to200 = [
        // 101-125
        "number", "no", "way", "could", "people", "my", "than", "first", "water", "been",
        "called", "who", "am", "its", "now", "find", "long", "down", "day", "did",
        "get", "come", "made", "may", "part",
        
        // 126-150
        "over", "new", "sound", "take", "only", "little", "work", "know", "place", "years",
        "live", "me", "back", "give", "most", "very", "after", "things", "our", "just",
        "name", "good", "sentence", "man", "think",
        
        // 151-175
        "say", "great", "where", "help", "through", "much", "before", "line", "right", "too",
        "means", "old", "any", "same", "tell", "boy", "follow", "came", "want", "show",
        "also", "around", "form", "three", "small",
        
        // 176-200
        "set", "put", "end", "does", "another", "well", "large", "must", "big", "even",
        "such", "because", "turn", "here", "why", "ask", "went", "men", "read", "need",
        "land", "different", "home", "us", "move"
      ];
      
      // Insert the next 100 Fry sight words
      for (const word of fryWords101to200) {
        await db.insert(schema.flashcards).values({
          setId: sightWordsSet[0].id,
          word,
          pronunciation: word,
          definition: getDefinition(word) || `The word "${word}" is a common sight word.`,
          exampleSentence: getExample(word) || `Can you use "${word}" in a sentence?`,
          createdById: adminUser.id,
          syllables: breakIntoSyllables(word)
        });
      }
      
      // Create some sample flashcards for the phrases set
      const phrases = ["thank you", "excuse me", "how are you", "I'm sorry", "you're welcome"];
      
      for (const phrase of phrases) {
        await db.insert(schema.flashcards).values({
          setId: phrasesSet[0].id,
          word: phrase,
          pronunciation: phrase,
          definition: `Common phrase: '${phrase}'`,
          exampleSentence: `"${phrase}" is used when...`,
          createdById: adminUser.id,
          syllables: phrase.split(" ").map(word => ({ text: word }))
        });
      }
      
      // Update word counts
      await db.update(schema.flashcardSets)
        .set({ wordCount: fryWords1to100.length })
        .where(eq(schema.flashcardSets.id, basicWordsSet[0].id));
      
      await db.update(schema.flashcardSets)
        .set({ wordCount: fryWords101to200.length })
        .where(eq(schema.flashcardSets.id, sightWordsSet[0].id));
      
      await db.update(schema.flashcardSets)
        .set({ wordCount: phrases.length })
        .where(eq(schema.flashcardSets.id, phrasesSet[0].id));
      
      // Assign sets to the student
      const studentUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "student"))
        .then(users => users[0]);
      
      const teacherUser = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.username, "teacher"))
        .then(users => users[0]);
      
      if (studentUser && teacherUser) {
        await db.insert(schema.setAssignments).values([
          {
            setId: basicWordsSet[0].id,
            assignedById: teacherUser.id,
            assignedToId: studentUser.id
          },
          {
            setId: sightWordsSet[0].id,
            assignedById: teacherUser.id,
            assignedToId: studentUser.id
          },
          {
            setId: phrasesSet[0].id,
            assignedById: teacherUser.id,
            assignedToId: studentUser.id
          }
        ]);
        
        // Create some progress data for the student
        const basicWordsFlashcards = await db
          .select()
          .from(schema.flashcards)
          .where(eq(schema.flashcards.setId, basicWordsSet[0].id));
        
        // Mark first 3 words as mastered
        for (let i = 0; i < 3 && i < basicWordsFlashcards.length; i++) {
          await db.insert(schema.userFlashcardProgress).values({
            userId: studentUser.id,
            flashcardId: basicWordsFlashcards[i].id,
            status: 'mastered',
            correctCount: 3,
            pronunciationAccuracy: 90,
            lastPracticed: new Date()
          });
        }
        
        // Mark next 4 words as learning
        for (let i = 3; i < 7 && i < basicWordsFlashcards.length; i++) {
          await db.insert(schema.userFlashcardProgress).values({
            userId: studentUser.id,
            flashcardId: basicWordsFlashcards[i].id,
            status: 'learning',
            correctCount: 1,
            incorrectCount: 1,
            pronunciationAccuracy: 75,
            lastPracticed: new Date()
          });
        }
        
        // Create some recent activities
        await db.insert(schema.userActivities).values([
          {
            userId: studentUser.id,
            activityType: 'practice_session',
            description: 'Practice Session - Pronunciation',
            pointsEarned: 15,
            accuracy: 85,
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000) // yesterday
          },
          {
            userId: studentUser.id,
            activityType: 'completed_set',
            description: 'Completed "Common Words" Set',
            pointsEarned: 25,
            createdAt: new Date()
          }
        ]);
      }
    } else {
      console.log("Flashcard sets already exist, skipping creation...");
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
