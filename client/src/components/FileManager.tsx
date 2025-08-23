import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Download, 
  Trash2, 
  FileText, 
  Image, 
  Video, 
  Upload,
  RefreshCw,
  Eye,
  Share
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ObjectUploader } from "./ObjectUploader";

interface FileItem {
  name: string;
  path: string;
  contentType: string;
  size: number;
  uploadedAt: string;
  downloadUrl: string;
}

/**
 * File Manager Component inspired by Android flashcard apps
 * 
 * Features:
 * - View uploaded GIFs and videos
 * - Import/export flashcard sets
 * - Download and share files
 * - Delete unwanted files
 * - File preview and metadata
 */
export function FileManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'gifs' | 'exports' | 'all'>('gifs');

  // Fetch user files
  const { data: files, isLoading, error } = useQuery({
    queryKey: ['/api/files', activeTab],
    queryFn: async () => {
      const response = await fetch(`/api/files?type=${activeTab}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch files');
      }
      return response.json();
    },
    enabled: !!user,
  });

  // Delete file mutation
  const deleteFileMutation = useMutation({
    mutationFn: async (filePath: string) => {
      const response = await apiRequest("DELETE", `/api/files${filePath}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/files'] });
      toast({
        title: "File Deleted",
        description: "File has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Upload handlers
  const handleGifUpload = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", { 
      fileType: 'image/gif' 
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleFlashcardUpload = async () => {
    const response = await apiRequest("POST", "/api/objects/upload", { 
      fileType: 'application/json' 
    });
    const data = await response.json();
    return {
      method: "PUT" as const,
      url: data.uploadURL,
    };
  };

  const handleUploadComplete = (result: any) => {
    console.log("Upload completed:", result);
    queryClient.invalidateQueries({ queryKey: ['/api/files'] });
    toast({
      title: "Upload Successful",
      description: `${result.successful?.length || 0} file(s) uploaded successfully.`,
    });
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (contentType.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (contentType.includes('json') || contentType.includes('csv')) return <FileText className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  // Get file type badge color
  const getBadgeVariant = (contentType: string) => {
    if (contentType.startsWith('image/')) return 'default';
    if (contentType.startsWith('video/')) return 'secondary';
    if (contentType.includes('json')) return 'outline';
    return 'secondary';
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Please log in to manage your files.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            File Manager
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="gifs">GIFs & Videos</TabsTrigger>
              <TabsTrigger value="exports">Flashcard Sets</TabsTrigger>
              <TabsTrigger value="all">All Files</TabsTrigger>
            </TabsList>

            <div className="mt-4 flex gap-2">
              <ObjectUploader
                uploadType="gif"
                maxNumberOfFiles={10}
                onGetUploadParameters={handleGifUpload}
                onComplete={handleUploadComplete}
                buttonClassName="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload GIFs/Videos
              </ObjectUploader>

              <ObjectUploader
                uploadType="flashcard"
                maxNumberOfFiles={5}
                onGetUploadParameters={handleFlashcardUpload}
                onComplete={handleUploadComplete}
                buttonClassName="flex-1"
              >
                <FileText className="h-4 w-4 mr-2" />
                Import Flashcards
              </ObjectUploader>

              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/files'] })}
                disabled={isLoading}
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            <TabsContent value="gifs" className="mt-4">
              <FileList 
                files={files?.filter((f: FileItem) => 
                  f.contentType.startsWith('image/') || f.contentType.startsWith('video/')
                )} 
                isLoading={isLoading}
                onDelete={deleteFileMutation.mutate}
                emptyMessage="No GIFs or videos uploaded yet. Upload some visual content for your flashcards!"
              />
            </TabsContent>

            <TabsContent value="exports" className="mt-4">
              <FileList 
                files={files?.filter((f: FileItem) => 
                  f.contentType.includes('json') || f.contentType.includes('csv')
                )} 
                isLoading={isLoading}
                onDelete={deleteFileMutation.mutate}
                emptyMessage="No flashcard sets imported yet. Import JSON or CSV files to get started!"
              />
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              <FileList 
                files={files} 
                isLoading={isLoading}
                onDelete={deleteFileMutation.mutate}
                emptyMessage="No files uploaded yet. Start by uploading some GIFs or flashcard sets!"
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );

  function FileList({ 
    files, 
    isLoading, 
    onDelete, 
    emptyMessage 
  }: { 
    files?: FileItem[]; 
    isLoading: boolean; 
    onDelete: (path: string) => void;
    emptyMessage: string;
  }) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading files...</span>
        </div>
      );
    }

    if (!files || files.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{emptyMessage}</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-96">
        <div className="space-y-3">
          {files.map((file) => (
            <Card key={file.path} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(file.contentType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={getBadgeVariant(file.contentType)} className="text-xs">
                        {file.contentType.split('/')[1]?.toUpperCase()}
                      </Badge>
                      <span>{formatFileSize(file.size)}</span>
                      <span>•</span>
                      <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {file.contentType.startsWith('image/') && (
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(file.downloadUrl, '_blank')}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="ghost" size="sm">
                    <Share className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => onDelete(file.path)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    );
  }
}