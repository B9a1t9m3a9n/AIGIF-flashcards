import { Gif } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { downloadGif, shareGif, formatRelativeTime } from "@/lib/utils";
import { Download, Share2 } from "lucide-react";
import FeedbackPanel from "./feedback-panel";
import { useToast } from "@/hooks/use-toast";

interface GifGridProps {
  gifs: Gif[];
}

export default function GifGrid({ gifs }: GifGridProps) {
  const { toast } = useToast();

  const handleDownload = async (gif: Gif) => {
    try {
      await downloadGif(gif.id, gif.prompt);
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Could not download the GIF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (gif: Gif) => {
    try {
      await shareGif(gif.id, gif.prompt);
      toast({
        title: "Link copied!",
        description: "GIF link copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Could not share the GIF. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="mb-10">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Your Generated Animations</h2>
      
      {gifs.length === 0 ? (
        <Card className="bg-white rounded-xl shadow-md p-12 text-center">
          <CardContent className="p-0">
            <div className="w-48 h-48 mx-auto mb-6 rounded-full bg-gradient-to-r from-primary to-secondary opacity-70 flex items-center justify-center">
              <span className="text-6xl text-white opacity-80">✨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No animations generated yet</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Enter a prompt and click "Generate Animation" to create your first animation.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifs.map((gif) => (
            <Card key={gif.id} className="bg-white rounded-xl shadow-md overflow-hidden group">
              <div className="relative">
                <div className="w-full h-48 overflow-hidden relative">
                  {gif.url.endsWith('.svg') ? (
                    <iframe
                      src={gif.url}
                      className="w-full h-full border-0"
                      title={`Generated animation: ${gif.prompt}`}
                      sandbox="allow-same-origin allow-scripts"
                    />
                  ) : gif.url.endsWith('.mp4') ? (
                    <video
                      src={gif.url}
                      className="w-full h-full object-cover"
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={gif.url}
                      alt={`Generated content: ${gif.prompt}`}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <button
                    onClick={() => handleDownload(gif)}
                    className="bg-white text-gray-800 p-2 rounded-full mr-2 hover:bg-primary hover:text-white transition-colors"
                    title="Download Animation"
                  >
                    <Download className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleShare(gif)}
                    className="bg-white text-gray-800 p-2 rounded-full hover:bg-primary hover:text-white transition-colors"
                    title="Share Animation"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-gray-700 font-medium truncate">{gif.prompt}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2">
                    {gif.settings?.quality && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {gif.settings.quality.charAt(0).toUpperCase() + gif.settings.quality.slice(1)}
                      </span>
                    )}
                    {gif.settings?.style && (
                      <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">
                        {gif.settings.style.charAt(0).toUpperCase() + gif.settings.style.slice(1)}
                      </span>
                    )}
                    {gif.settings?.type && (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        {gif.settings.type === "animated" ? "AI Animation" : "AI Image"}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {gif.createdAt 
                    ? formatRelativeTime(gif.createdAt) 
                    : "Generated just now"}
                </p>
                
                {/* Feedback Panel */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <FeedbackPanel gif={gif} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
