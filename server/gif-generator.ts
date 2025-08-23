import fs from "fs";
import path from "path";
import { promises as fsPromises } from "fs";
import { nanoid } from "nanoid";
import Replicate from "replicate";

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(import.meta.dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function enhancePromptWithStyle(prompt: string, style: string, quality: string): string {
  const styleModifiers: Record<string, string> = {
    photorealistic: "photorealistic, hyperrealistic, natural lighting, detailed",
    artistic: "artistic masterpiece, painterly style, harmonious colors",
    cinematic: "cinematic composition, professional lighting, film quality",
    anime: "anime style, consistent character design, clean animation",
    cartoon: "cartoon style, smooth motion, clean backgrounds",
    abstract: "abstract art, fluid motion, harmonious transitions"
  };
  
  const qualityModifiers: Record<string, string> = {
    basic: "good quality",
    standard: "high quality, detailed",
    high: "high quality, very detailed, sharp",
    professional: "professional quality, masterpiece",
    ultra: "ultra high quality, award winning, perfect"
  };
  
  return `${prompt}, ${styleModifiers[style] || styleModifiers.photorealistic}, ${qualityModifiers[quality] || qualityModifiers.standard}`;
}

function getImageSize(quality: string): { width: number; height: number } {
  const sizes: Record<string, { width: number; height: number }> = {
    basic: { width: 512, height: 512 },
    standard: { width: 768, height: 768 },
    high: { width: 1024, height: 1024 },
    professional: { width: 1024, height: 1024 },
    ultra: { width: 1536, height: 1536 }
  };
  
  return sizes[quality] || sizes.standard;
}

// Professional AI generation using available models
export async function generateGif(
  prompt: string,
  type: "animated" | "still" = "animated",
  quality: "basic" | "standard" | "high" | "professional" | "ultra" = "standard",
  style: "photorealistic" | "artistic" | "cinematic" | "anime" | "cartoon" | "abstract" = "photorealistic",
  duration: "short" | "medium" | "long" = "medium"
): Promise<{ fileUrl: string; previewUrl: string }> {
  const fileId = nanoid();
  
  console.log(`Generating ${type} content: "${prompt}" (${quality} quality, ${style} style)`);
  
  // Enhanced prompt with style modifiers
  const styledPrompt = enhancePromptWithStyle(prompt, style, quality);
  
  try {
    if (type === "still") {
      console.log(`Generating AI image with SDXL...`);
      
      const output = await replicate.run(
        "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc",
        {
          input: {
            prompt: styledPrompt,
            width: getImageSize(quality).width,
            height: getImageSize(quality).height,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            negative_prompt: "blurry, low quality, distorted, deformed, ugly"
          }
        }
      );
      
      const imageUrl = Array.isArray(output) ? output[0] : output;
      if (!imageUrl) {
        throw new Error('No image generated');
      }
      
      const response = await fetch(imageUrl as string);
      const buffer = await response.arrayBuffer();
      const filePath = path.join(uploadsDir, `${fileId}.png`);
      await fsPromises.writeFile(filePath, Buffer.from(buffer));
      
      console.log(`AI image generated: ${fileId}.png`);
      return {
        fileUrl: `/uploads/${fileId}.png`,
        previewUrl: `/uploads/${fileId}.png`
      };
    } else {
      console.log(`Generating AI video...`);
      
      // Use ZeroScope V2 XL for video generation
      console.log(`Generating AI video with ZeroScope V2 XL...`);
      
      const output = await replicate.run(
        "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
        {
          input: {
            prompt: styledPrompt.substring(0, 120),
            negative_prompt: "blurry, bad quality, distorted, deformed, warped, morphing, ugly, inconsistent motion",
            width: 1024,
            height: 576,
            num_frames: duration === "short" ? 14 : duration === "medium" ? 20 : 24,
            num_inference_steps: 20,
            guidance_scale: 7.5,
            fps: 8,
            batch_size: 1,
            init_weight: 0.2,
            remove_watermark: false
          }
        }
      );
      
      const videoUrl = Array.isArray(output) ? output[0] : output;
      if (!videoUrl) {
        throw new Error('No video generated');
      }
      
      const response = await fetch(videoUrl as string);
      const buffer = await response.arrayBuffer();
      const filePath = path.join(uploadsDir, `${fileId}.mp4`);
      await fsPromises.writeFile(filePath, Buffer.from(buffer));
      
      console.log(`AI video generated: ${fileId}.mp4`);
      return {
        fileUrl: `/uploads/${fileId}.mp4`,
        previewUrl: `/uploads/${fileId}.mp4`
      };
    }
  } catch (error: any) {
    console.error('AI generation failed:', error.message);
    
    // Check for specific error types
    if (error.message?.includes('422') || error.message?.includes('Invalid version')) {
      throw new Error('The AI models are currently having issues. This may be due to model updates on the Replicate platform. Please try again in a few minutes.');
    }
    
    if (error.message?.includes('401') || error.message?.includes('authentication')) {
      throw new Error('AI service authentication failed. Please verify your Replicate API token is correctly configured.');
    }
    
    if (error.message?.includes('429')) {
      throw new Error('AI service rate limit exceeded. Please wait a moment and try again.');
    }
    
    throw new Error(`AI generation failed: ${error.message}`);
  }
}