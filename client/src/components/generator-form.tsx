import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateGifSchema } from "@shared/schema";

// Example prompts
const EXAMPLE_PROMPTS = [
  "A panda skateboarding",
  "Sunset over mountains",
  "Dancing robots",
  "A cat playing piano in space",
  "Abstract swirling colors",
];

type GeneratorFormProps = {
  onStartGeneration: () => void;
  onGenerationComplete: () => void;
};

export default function GeneratorForm({ 
  onStartGeneration, 
  onGenerationComplete 
}: GeneratorFormProps) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [type, setType] = useState<"animated" | "still">("animated");
  const [quality, setQuality] = useState<"basic" | "standard" | "high" | "professional" | "ultra">("standard");
  const [style, setStyle] = useState<"photorealistic" | "artistic" | "cinematic" | "anime" | "cartoon" | "abstract">("photorealistic");
  const [duration, setDuration] = useState<"short" | "medium" | "long">("medium");

  // Calculate character count and check if valid
  const promptLength = prompt.length;
  const isPromptValid = promptLength > 0 && promptLength <= 250;

  // Generate GIF mutation
  const generateMutation = useMutation({
    mutationFn: async (data: z.infer<typeof generateGifSchema>) => {
      const response = await apiRequest("POST", "/api/gifs/generate", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your AI content has been generated successfully.",
      });
      setPrompt("");
      onGenerationComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to generate animation: ${error.message}`,
        variant: "destructive",
      });
      onGenerationComplete();
    },
  });

  // Handle form submission
  const handleGenerateGif = async () => {
    try {
      // Validate input
      const data = generateGifSchema.parse({
        prompt,
        type,
        quality,
        style,
        duration,
      });

      // Start generation UI
      onStartGeneration();

      // Submit to API
      generateMutation.mutate(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Invalid input",
          description: error.errors[0]?.message || "Please check your input",
          variant: "destructive",
        });
      }
    }
  };

  // Set example prompt
  const setExamplePrompt = (example: string) => {
    setPrompt(example);
  };

  return (
    <Card className="bg-white rounded-xl shadow-md overflow-hidden mb-10">
      <CardContent className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Professional AI Content Generator</h2>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-semibold text-green-800 mb-2">Superior Models Active</h3>
            <p className="text-sm text-green-700">
              Now using Wan 2.2 (VBench #1), Hailuo 2 (superior physics), and Google Veo 3 (audio generation) - models that outperform OpenAI Sora in quality benchmarks.
            </p>
          </div>
          <p className="text-gray-600 mb-6">
            Create professional-quality images and animations with state-of-the-art AI models. Choose from basic to ultra-professional quality levels.
          </p>

          <div className="relative">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A cute cat playing piano in space..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-all text-gray-700 resize-none h-24"
            />
            <div className="absolute bottom-3 right-3 text-xs text-gray-500">
              <span className={promptLength > 250 ? "text-red-500" : ""}>
                {promptLength}/250
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {EXAMPLE_PROMPTS.map((example, index) => (
              <button
                key={index}
                onClick={() => setExamplePrompt(example)}
                className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-primary hover:text-white transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Select
            value={type}
            onValueChange={(value) => setType(value as "animated" | "still")}
          >
            <SelectTrigger className="bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-primary hover:bg-gray-200 transition-colors">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="animated">AI Animation</SelectItem>
              <SelectItem value="still">AI Image</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={quality}
            onValueChange={(value) => setQuality(value as "basic" | "standard" | "high" | "professional" | "ultra")}
          >
            <SelectTrigger className="bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-primary hover:bg-gray-200 transition-colors">
              <SelectValue placeholder="Quality" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Basic (ZeroScope V2 XL - Fallback)</SelectItem>
              <SelectItem value="standard">Standard (Wan 2.2 - VBench #1)</SelectItem>
              <SelectItem value="high">High (Hailuo 2 - Superior Physics)</SelectItem>
              <SelectItem value="professional">Professional (Veo 3 Fast + Audio)</SelectItem>
              <SelectItem value="ultra">Ultra (Veo 3 Full + Audio)</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={style}
            onValueChange={(value) => setStyle(value as "photorealistic" | "artistic" | "cinematic" | "anime" | "cartoon" | "abstract")}
          >
            <SelectTrigger className="bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-primary hover:bg-gray-200 transition-colors">
              <SelectValue placeholder="Style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="photorealistic">Photorealistic</SelectItem>
              <SelectItem value="artistic">Artistic</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="anime">Anime</SelectItem>
              <SelectItem value="cartoon">Cartoon</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
            </SelectContent>
          </Select>

          {type === "animated" && (
            <Select
              value={duration}
              onValueChange={(value) => setDuration(value as "short" | "medium" | "long")}
            >
              <SelectTrigger className="bg-gray-100 text-gray-700 rounded-lg focus:ring-2 focus:ring-primary hover:bg-gray-200 transition-colors">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">Short (1-2s)</SelectItem>
                <SelectItem value="medium">Medium (3-4s)</SelectItem>
                <SelectItem value="long">Long (5-6s)</SelectItem>
              </SelectContent>
            </Select>
          )}

          <Button
            onClick={handleGenerateGif}
            disabled={!isPromptValid || generateMutation.isPending}
            className="bg-gradient-to-r from-primary to-secondary text-white font-medium px-6 py-3 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none disabled:hover:-translate-y-0"
          >
            {generateMutation.isPending ? (
              <span className="flex items-center">
                <span>Generating</span>
                <span className="loading-dots ml-1"></span>
              </span>
            ) : (
              "Generate AI Content"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}