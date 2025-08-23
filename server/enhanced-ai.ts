import OpenAI from "openai";

// Enhanced AI service supporting multiple advanced models
export class EnhancedAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({ 
      apiKey: process.env.OPENAI_API_KEY 
    });
  }

  // Generate flashcard with superior AI models
  async generateFlashcard(word: string, modelPreference?: 'wan2.2' | 'hailuo2' | 'veo3' | 'dalle3') {
    try {
      // Generate text content with GPT-4o
      const textResponse = await this.openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are an expert educator creating flashcards for sight word learning. Create comprehensive flashcard content that includes:
            1. Clear, age-appropriate definition
            2. Pronunciation guide with phonetic spelling
            3. Example sentence that's engaging for children
            4. Syllable breakdown for reading practice
            5. Detailed visual description for GIF/video generation that would help children understand and remember the word
            
            Respond in JSON format with these exact fields: word, definition, pronunciation, exampleSentence, syllables (array), visualDescription`
          },
          {
            role: "user",
            content: `Create flashcard content for the word: "${word}"`
          }
        ],
        response_format: { type: "json_object" }
      });

      const flashcardData = JSON.parse(textResponse.choices[0].message.content || '{}');

      // Generate multimedia content based on preference
      let gifUrl = null;
      let audioUrl = null;

      switch (modelPreference) {
        case 'wan2.2':
          gifUrl = await this.generateWithWan22(flashcardData.visualDescription);
          break;
        case 'hailuo2':
          gifUrl = await this.generateWithHailuo2(flashcardData.visualDescription);
          break;
        case 'veo3':
          gifUrl = await this.generateWithVeo3(flashcardData.visualDescription);
          break;
        case 'dalle3':
        default:
          gifUrl = await this.generateWithDALLE3(flashcardData.visualDescription);
          break;
      }

      // Generate audio pronunciation
      audioUrl = await this.generateAudio(word, flashcardData.pronunciation);

      return {
        ...flashcardData,
        gifUrl,
        audioUrl,
        modelUsed: modelPreference || 'dalle3',
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error("Enhanced AI generation error:", error);
      
      // Fallback to basic flashcard structure
      return {
        word: word,
        definition: `Definition of ${word}`,
        pronunciation: word,
        exampleSentence: `This is an example sentence using the word ${word}.`,
        syllables: [{ text: word }],
        visualDescription: `A simple, child-friendly illustration of ${word}`,
        gifUrl: null,
        audioUrl: null,
        modelUsed: 'fallback',
        error: error.message
      };
    }
  }

  // Wan 2.2 video generation
  async generateWithWan22(description: string): Promise<string | null> {
    try {
      // Using AI/ML API for Wan 2.2
      const response = await fetch('https://api.aimlapi.com/v2/generate/video/alibaba/generation', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.AIMLAPI_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'wan/v2.2/text-to-video',
          prompt: `Child-friendly educational animation: ${description}. Bright colors, simple shapes, suitable for young learners.`,
          aspect_ratio: '16:9',
          inference_steps: 30,
          guidance_scale: 5,
          video_length: 5
        })
      });

      const result = await response.json();
      
      if (result.video?.url) {
        return result.video.url;
      }
      
      return null;
    } catch (error) {
      console.error("Wan 2.2 generation error:", error);
      return null;
    }
  }

  // Hailuo 2 video generation
  async generateWithHailuo2(description: string): Promise<string | null> {
    try {
      // Using fal.ai for Hailuo 2
      const response = await fetch('https://fal.run/fal-ai/minimax/hailuo-02/standard/text-to-video', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.FAL_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Educational flashcard animation for children: ${description}. Colorful, engaging, age-appropriate for elementary students.`,
          duration: 6,
          resolution: "768p"
        })
      });

      const result = await response.json();
      
      if (result.video?.url) {
        return result.video.url;
      }
      
      return null;
    } catch (error) {
      console.error("Hailuo 2 generation error:", error);
      return null;
    }
  }

  // Google Veo 3 video generation
  async generateWithVeo3(description: string): Promise<string | null> {
    try {
      // Using Google Gemini API for Veo 3
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:generateVideos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GOOGLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: `Child-friendly educational visual: ${description}. Clean animation style, bright colors, suitable for sight word learning.`,
          config: {
            aspectRatio: "16:9",
            resolution: "720p",
            durationSeconds: 6,
            generateAudio: false
          }
        })
      });

      const result = await response.json();
      
      if (result.operation?.name) {
        // Veo 3 is async, would need polling mechanism
        // For now, return placeholder
        return `veo3_operation_${result.operation.name}`;
      }
      
      return null;
    } catch (error) {
      console.error("Veo 3 generation error:", error);
      return null;
    }
  }

  // DALL-E 3 image generation (fallback)
  async generateWithDALLE3(description: string): Promise<string | null> {
    try {
      const response = await this.openai.images.generate({
        model: "dall-e-3",
        prompt: `Educational flashcard illustration for children: ${description}. Simple, colorful, cartoon style, age-appropriate for elementary students learning sight words.`,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      });

      return response.data[0].url || null;
    } catch (error) {
      console.error("DALL-E 3 generation error:", error);
      return null;
    }
  }

  // Generate audio pronunciation
  async generateAudio(word: string, pronunciation: string): Promise<string | null> {
    try {
      const mp3 = await this.openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Child-friendly voice
        input: `${word}. ${pronunciation}. ${word}.`,
        speed: 0.8 // Slower for learning
      });

      // Convert to base64 for storage
      const buffer = Buffer.from(await mp3.arrayBuffer());
      const base64 = buffer.toString('base64');
      return `data:audio/mp3;base64,${base64}`;
    } catch (error) {
      console.error("Audio generation error:", error);
      return null;
    }
  }

  // Batch generate flashcards for a word list
  async batchGenerateFlashcards(words: string[], modelPreference?: 'wan2.2' | 'hailuo2' | 'veo3' | 'dalle3') {
    const results = [];
    
    for (const word of words) {
      try {
        const flashcard = await this.generateFlashcard(word, modelPreference);
        results.push(flashcard);
        
        // Rate limiting - wait between generations
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error generating flashcard for ${word}:`, error);
        results.push({
          word,
          error: error.message,
          modelUsed: 'error'
        });
      }
    }
    
    return results;
  }

  // Analyze and enhance existing flashcard
  async enhanceFlashcard(existingCard: any, modelPreference?: 'wan2.2' | 'hailuo2' | 'veo3' | 'dalle3') {
    try {
      // Generate improved visual content
      const enhancedDescription = `Enhanced educational visualization for the word "${existingCard.word}": ${existingCard.definition}. ${existingCard.exampleSentence}. Create an engaging, memorable visual that helps children learn this sight word.`;
      
      let newGifUrl = null;
      
      switch (modelPreference) {
        case 'wan2.2':
          newGifUrl = await this.generateWithWan22(enhancedDescription);
          break;
        case 'hailuo2':
          newGifUrl = await this.generateWithHailuo2(enhancedDescription);
          break;
        case 'veo3':
          newGifUrl = await this.generateWithVeo3(enhancedDescription);
          break;
        case 'dalle3':
        default:
          newGifUrl = await this.generateWithDALLE3(enhancedDescription);
          break;
      }

      return {
        ...existingCard,
        enhancedGifUrl: newGifUrl,
        enhancedWith: modelPreference || 'dalle3',
        enhancedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error("Enhancement error:", error);
      return {
        ...existingCard,
        enhancementError: error.message
      };
    }
  }
}

export const enhancedAI = new EnhancedAIService();