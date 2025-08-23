import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Loader2, Sparkles, Image, Plus, Wand2, Upload, Download, Video, Cpu, Zap, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import Header from "@/components/layout/header";
import { FileManager } from "@/components/FileManager";

interface AIModel {
  id: 'wan2.2' | 'hailuo2' | 'veo3' | 'dalle3';
  name: string;
  description: string;
  icon: any;
  badge: string;
  features: string[];
}

const AI_MODELS: AIModel[] = [
  {
    id: 'wan2.2',
    name: 'Wan 2.2',
    description: 'Alibaba\'s latest video generation model with cinematic quality',
    icon: Crown,
    badge: 'PREMIUM',
    features: ['8K Video', 'Cinematic Quality', 'Advanced Motion']
  },
  {
    id: 'hailuo2',
    name: 'Hailuo 2',
    description: 'MiniMax model ranked #2 globally with physics simulation',
    icon: Zap,
    badge: 'TOP RATED',
    features: ['1080p Video', 'Physics Sim', 'Director Controls']
  },
  {
    id: 'veo3',
    name: 'Google Veo 3',
    description: 'Google\'s state-of-the-art model with native audio',
    icon: Cpu,
    badge: 'AUDIO',
    features: ['Native Audio', 'Sync Sound', '8-sec Duration']
  },
  {
    id: 'dalle3',
    name: 'DALL-E 3',
    description: 'OpenAI\'s image generation for quick prototypes',
    icon: Image,
    badge: 'FAST',
    features: ['High Quality', 'Quick Gen', 'Reliable']
  }
];

export default function FlashcardCreator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Enhanced state management
  const [activeTab, setActiveTab] = useState<'single' | 'batch' | 'files'>('single');
  const [modelPreference, setModelPreference] = useState<'wan2.2' | 'hailuo2' | 'veo3' | 'dalle3'>('dalle3');
  
  // Single card creation
  const [word, setWord] = useState("");
  const [setTitle, setSetTitle] = useState("");
  const [setDescription, setSetDescription] = useState("");
  const [generatedCard, setGeneratedCard] = useState<any>(null);
  const [createNewSet, setCreateNewSet] = useState(false);
  const [selectedSetId, setSelectedSetId] = useState<string>("");
  
  // Batch creation
  const [batchWords, setBatchWords] = useState("");
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<any[]>([]);

  // Check user permissions
  const canUseAI = user && (user.roleId === 2 || user.roleId === 3); // teacher or admin

  // Fetch existing flashcard sets
  const { data: flashcardSets, isLoading: setsLoading } = useQuery({
    queryKey: ["/api/flashcard-sets"],
    enabled: !!user,
  });

  // Enhanced AI flashcard generation
  const generateCardMutation = useMutation({
    mutationFn: async ({ word, modelPreference }: { word: string; modelPreference: string }) => {
      const response = await apiRequest("POST", "/api/ai/generate-flashcard", { 
        word, 
        modelPreference 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCard(data);
      toast({
        title: "Enhanced AI Generation Complete!",
        description: `Generated flashcard for "${word}" using ${AI_MODELS.find(m => m.id === modelPreference)?.name}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate flashcard with AI",
        variant: "destructive",
      });
    },
  });

  // Batch generation mutation
  const batchGenerateMutation = useMutation({
    mutationFn: async ({ words, modelPreference, setId }: { words: string[]; modelPreference: string; setId?: string }) => {
      const response = await apiRequest("POST", "/api/ai/batch-generate", { 
        words, 
        modelPreference,
        setId 
      });
      return response.json();
    },
    onSuccess: (data) => {
      setBatchResults(data.results);
      toast({
        title: "Batch Generation Complete!",
        description: `Generated ${data.saved || data.results?.length || 0} flashcards`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-sets"] });
    },
    onError: (error: any) => {
      toast({
        title: "Batch Generation Failed",
        description: error.message || "Failed to batch generate flashcards",
        variant: "destructive",
      });
    },
  });

  // Create flashcard set mutation
  const createSetMutation = useMutation({
    mutationFn: async (setData: any) => {
      const response = await apiRequest("POST", "/api/flashcard-sets", setData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Set Created!",
        description: `Flashcard set "${data.title}" has been created.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/flashcard-sets"] });
      setSetTitle("");
      setSetDescription("");
      setCreateNewSet(false);
      setSelectedSetId(data.id.toString());
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create flashcard set",
        variant: "destructive",
      });
    },
  });

  // Export flashcard set
  const exportSetMutation = useMutation({
    mutationFn: async (setId: string) => {
      const response = await apiRequest("POST", `/api/flashcard-sets/${setId}/export`);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Export Complete!",
        description: "Flashcard set exported successfully",
      });
      // Auto-download the exported file
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
      }
    },
    onError: (error: any) => {
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export flashcard set",
        variant: "destructive",
      });
    },
  });

  const handleGenerateCard = () => {
    if (!word.trim()) {
      toast({
        title: "Word Required",
        description: "Please enter a word to generate a flashcard.",
        variant: "destructive",
      });
      return;
    }
    
    generateCardMutation.mutate({ word: word.trim(), modelPreference });
  };

  const handleBatchGenerate = () => {
    const words = batchWords.split('\n')
      .map(w => w.trim())
      .filter(w => w.length > 0);
    
    if (words.length === 0) {
      toast({
        title: "Words Required",
        description: "Please enter words to generate flashcards.",
        variant: "destructive",
      });
      return;
    }

    if (words.length > 20) {
      toast({
        title: "Too Many Words",
        description: "Maximum 20 words per batch generation.",
        variant: "destructive",
      });
      return;
    }

    const targetSetId = selectedSetId || (createNewSet ? undefined : selectedSetId);
    batchGenerateMutation.mutate({ 
      words, 
      modelPreference, 
      setId: targetSetId 
    });
  };

  const handleCreateSet = () => {
    if (!setTitle.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for the flashcard set.",
        variant: "destructive",
      });
      return;
    }

    createSetMutation.mutate({
      title: setTitle.trim(),
      description: setDescription.trim() || `Generated flashcard set using ${AI_MODELS.find(m => m.id === modelPreference)?.name}`,
    });
  };

  const getModelBadgeColor = (badge: string) => {
    switch (badge) {
      case 'PREMIUM': return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'TOP RATED': return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'AUDIO': return 'bg-gradient-to-r from-green-500 to-emerald-500';
      case 'FAST': return 'bg-gradient-to-r from-orange-500 to-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (!canUseAI) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
              <p className="text-muted-foreground">
                Only teachers and administrators can access the AI flashcard creator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-2">
            Enhanced AI Flashcard Creator
          </h1>
          <p className="text-center text-muted-foreground">
            Create engaging flashcards using superior AI models like Wan 2.2, Hailuo 2, and Google Veo 3
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="single" className="flex items-center gap-2">
              <Wand2 className="h-4 w-4" />
              Single Card
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Batch Generate
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              File Manager
            </TabsTrigger>
          </TabsList>

          {/* AI Model Selection */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Select AI Model
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {AI_MODELS.map((model) => (
                  <div
                    key={model.id}
                    className={`relative p-4 border rounded-lg cursor-pointer transition-all ${
                      modelPreference === model.id 
                        ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setModelPreference(model.id)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <model.icon className="h-6 w-6 text-primary" />
                      <Badge className={`text-white text-xs px-2 py-1 ${getModelBadgeColor(model.badge)}`}>
                        {model.badge}
                      </Badge>
                    </div>
                    <h3 className="font-semibold mb-1">{model.name}</h3>
                    <p className="text-sm text-muted-foreground mb-3">{model.description}</p>
                    <div className="space-y-1">
                      {model.features.map((feature, index) => (
                        <div key={index} className="flex items-center gap-1 text-xs text-muted-foreground">
                          <div className="w-1 h-1 bg-primary rounded-full" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <TabsContent value="single">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Input Section */}
              <Card>
                <CardHeader>
                  <CardTitle>Create Single Flashcard</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="word">Word</Label>
                    <Input
                      id="word"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      placeholder="Enter a sight word..."
                      className="mt-1"
                    />
                  </div>

                  <Separator />

                  <div>
                    <Label>Target Flashcard Set</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="existing-set"
                          name="set-option"
                          checked={!createNewSet}
                          onChange={() => setCreateNewSet(false)}
                        />
                        <Label htmlFor="existing-set">Add to existing set</Label>
                      </div>
                      {!createNewSet && (
                        <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a flashcard set" />
                          </SelectTrigger>
                          <SelectContent>
                            {flashcardSets?.map((set: any) => (
                              <SelectItem key={set.id} value={set.id.toString()}>
                                {set.title} ({set.wordCount} words)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="new-set"
                          name="set-option"
                          checked={createNewSet}
                          onChange={() => setCreateNewSet(true)}
                        />
                        <Label htmlFor="new-set">Create new set</Label>
                      </div>
                      {createNewSet && (
                        <div className="space-y-2 ml-6">
                          <Input
                            value={setTitle}
                            onChange={(e) => setSetTitle(e.target.value)}
                            placeholder="Set title..."
                          />
                          <Textarea
                            value={setDescription}
                            onChange={(e) => setSetDescription(e.target.value)}
                            placeholder="Set description..."
                            rows={2}
                          />
                          <Button
                            onClick={handleCreateSet}
                            disabled={createSetMutation.isPending}
                            size="sm"
                          >
                            {createSetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Set
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleGenerateCard}
                    disabled={generateCardMutation.isPending || !word.trim()}
                    className="w-full"
                  >
                    {generateCardMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate with {AI_MODELS.find(m => m.id === modelPreference)?.name}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview Section */}
              <Card>
                <CardHeader>
                  <CardTitle>AI Generated Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {generatedCard ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <h3 className="text-2xl font-bold text-primary">{generatedCard.word}</h3>
                        <p className="text-muted-foreground">/{generatedCard.pronunciation}/</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Definition</Label>
                        <p className="text-sm mt-1">{generatedCard.definition}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Example</Label>
                        <p className="text-sm mt-1 italic">"{generatedCard.exampleSentence}"</p>
                      </div>
                      
                      {generatedCard.gifUrl && (
                        <div>
                          <Label className="text-sm font-medium">Generated Visual</Label>
                          <div className="mt-2 border rounded-lg p-4 bg-muted/50">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Video className="h-4 w-4" />
                              Generated with {AI_MODELS.find(m => m.id === generatedCard.modelUsed)?.name}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline">
                          {generatedCard.modelUsed?.toUpperCase() || 'AI Generated'}
                        </Badge>
                        <span>•</span>
                        <span>{new Date(generatedCard.generatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Generated flashcard preview will appear here
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="batch">
            <Card>
              <CardHeader>
                <CardTitle>Batch Generate Flashcards</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="batch-words">Words (one per line, max 20)</Label>
                  <Textarea
                    id="batch-words"
                    value={batchWords}
                    onChange={(e) => setBatchWords(e.target.value)}
                    placeholder="cat&#10;dog&#10;bird&#10;fish&#10;..."
                    rows={8}
                    className="mt-1 font-mono"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    {batchWords.split('\n').filter(w => w.trim().length > 0).length} words entered
                  </p>
                </div>

                <div>
                  <Label>Target Set</Label>
                  <Select value={selectedSetId} onValueChange={setSelectedSetId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select target flashcard set" />
                    </SelectTrigger>
                    <SelectContent>
                      {flashcardSets?.map((set: any) => (
                        <SelectItem key={set.id} value={set.id.toString()}>
                          {set.title} ({set.wordCount} words)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleBatchGenerate}
                  disabled={batchGenerateMutation.isPending || !batchWords.trim() || !selectedSetId}
                  className="w-full"
                >
                  {batchGenerateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Sparkles className="mr-2 h-4 w-4" />
                  Batch Generate with {AI_MODELS.find(m => m.id === modelPreference)?.name}
                </Button>

                {batchResults.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Batch Results</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {batchResults.map((result, index) => (
                        <div key={index} className="flex items-center justify-between p-3 border rounded">
                          <div>
                            <span className="font-medium">{result.word}</span>
                            {result.error && (
                              <span className="text-destructive text-sm ml-2">({result.error})</span>
                            )}
                          </div>
                          <Badge variant={result.error ? "destructive" : "default"}>
                            {result.error ? "Failed" : "Success"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Download className="h-5 w-5" />
                    Export Flashcard Sets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashcardSets?.map((set: any) => (
                      <div key={set.id} className="p-4 border rounded-lg">
                        <h3 className="font-semibold mb-2">{set.title}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{set.wordCount} words</p>
                        <Button
                          onClick={() => exportSetMutation.mutate(set.id.toString())}
                          disabled={exportSetMutation.isPending}
                          size="sm"
                          variant="outline"
                          className="w-full"
                        >
                          {exportSetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          <Download className="mr-2 h-4 w-4" />
                          Export
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <FileManager />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}