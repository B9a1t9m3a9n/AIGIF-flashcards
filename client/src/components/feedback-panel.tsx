import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, MessageSquare, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Gif } from "@shared/schema";

interface FeedbackPanelProps {
  gif: Gif;
  onFeedbackSubmitted?: () => void;
}

export default function FeedbackPanel({ gif, onFeedbackSubmitted }: FeedbackPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [ratings, setRatings] = useState({
    overall: 0,
    object: 0,
    movement: 0,
    environment: 0,
    lighting: 0
  });
  const [textualFeedback, setTextualFeedback] = useState("");
  const [specificIssues, setSpecificIssues] = useState({
    morphing: false,
    unnatural_motion: false,
    wrong_environment: false,
    lighting_issues: false,
    object_distortion: false,
    temporal_inconsistency: false
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitFeedback = useMutation({
    mutationFn: async (feedbackData: any) => {
      const response = await fetch('/api/feedback', {
        method: "POST",
        body: JSON.stringify(feedbackData),
        headers: { "Content-Type": "application/json" }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you! The AI will learn from your feedback to improve future generations."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/gifs"] });
      setIsOpen(false);
      resetForm();
      onFeedbackSubmitted?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error submitting feedback",
        description: error.message || "Please try again",
        variant: "destructive"
      });
    }
  });

  const resetForm = () => {
    setRatings({ overall: 0, object: 0, movement: 0, environment: 0, lighting: 0 });
    setTextualFeedback("");
    setSpecificIssues({
      morphing: false,
      unnatural_motion: false,
      wrong_environment: false,
      lighting_issues: false,
      object_distortion: false,
      temporal_inconsistency: false
    });
  };

  const handleSubmit = () => {
    if (ratings.overall === 0) {
      toast({
        title: "Overall rating required",
        description: "Please provide an overall rating before submitting",
        variant: "destructive"
      });
      return;
    }

    const feedbackData = {
      gifId: gif.id,
      overallRating: ratings.overall,
      objectQuality: ratings.object || undefined,
      movementRealism: ratings.movement || undefined,
      environmentAccuracy: ratings.environment || undefined,
      lightingCoherence: ratings.lighting || undefined,
      textualFeedback: textualFeedback || undefined,
      specificIssues: Object.keys(specificIssues).some(key => specificIssues[key as keyof typeof specificIssues]) 
        ? specificIssues 
        : undefined
    };

    submitFeedback.mutate(feedbackData);
  };

  const StarRating = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-5 h-5 ${
                rating <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Rate & Improve AI
      </Button>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-500" />
          Help AI Learn - Rate This Generation
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Your feedback trains the AI to create better animations. Rate specific aspects and report issues.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <StarRating
            value={ratings.overall}
            onChange={(rating) => setRatings(prev => ({ ...prev, overall: rating }))}
            label="Overall Quality (Required)"
          />
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <StarRating
            value={ratings.object}
            onChange={(rating) => setRatings(prev => ({ ...prev, object: rating }))}
            label="Object Quality"
          />
          <StarRating
            value={ratings.movement}
            onChange={(rating) => setRatings(prev => ({ ...prev, movement: rating }))}
            label="Movement Realism"
          />
          <StarRating
            value={ratings.environment}
            onChange={(rating) => setRatings(prev => ({ ...prev, environment: rating }))}
            label="Environment Accuracy"
          />
          <StarRating
            value={ratings.lighting}
            onChange={(rating) => setRatings(prev => ({ ...prev, lighting: rating }))}
            label="Lighting Coherence"
          />
        </div>

        {/* Specific Issues */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Specific Issues (Check all that apply)</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { key: "morphing", label: "Objects morphing/changing shape" },
              { key: "unnatural_motion", label: "Unnatural movement" },
              { key: "wrong_environment", label: "Wrong environment/background" },
              { key: "lighting_issues", label: "Inconsistent lighting" },
              { key: "object_distortion", label: "Object distortion" },
              { key: "temporal_inconsistency", label: "Flickering/temporal issues" }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={key}
                  checked={specificIssues[key as keyof typeof specificIssues]}
                  onCheckedChange={(checked) =>
                    setSpecificIssues(prev => ({
                      ...prev,
                      [key]: checked === true
                    }))
                  }
                />
                <Label htmlFor={key} className="text-sm">
                  {label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Text Feedback */}
        <div className="space-y-2">
          <Label htmlFor="feedback-text" className="text-sm font-medium">
            Additional Comments (Optional)
          </Label>
          <Textarea
            id="feedback-text"
            placeholder="Describe what worked well and what could be improved..."
            value={textualFeedback}
            onChange={(e) => setTextualFeedback(e.target.value)}
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={submitFeedback.isPending || ratings.overall === 0}
            className="flex-1"
          >
            {submitFeedback.isPending ? "Submitting..." : "Submit Feedback"}
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            variant="outline"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}