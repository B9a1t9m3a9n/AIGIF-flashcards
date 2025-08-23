import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { apiRequest } from "./queryClient";

/**
 * Combine class names with tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a date to a relative time string (e.g. "2 hours ago")
 */
export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (diffInSeconds < 5) {
    return "just now";
  } else if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

/**
 * Download a file from a URL
 */
export async function downloadGif(id: number, prompt: string): Promise<void> {
  try {
    // Create a temporary anchor element
    const a = document.createElement("a");
    a.href = `/api/gifs/${id}/download`;
    a.download = `${prompt.slice(0, 20).trim()}.svg`; 
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Failed to download animation:", error);
    throw error;
  }
}

/**
 * Share a GIF
 */
export async function shareGif(id: number, prompt: string): Promise<void> {
  // Get base URL of the application
  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}/gif/${id}`;
  
  // Check if Web Share API is available
  if (navigator.share) {
    try {
      await navigator.share({
        title: prompt,
        text: `Check out this animation: ${prompt}`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Error sharing:", error);
      // Fallback to clipboard copy
      copyToClipboard(shareUrl);
    }
  } else {
    // Fallback for browsers that don't support the Web Share API
    copyToClipboard(shareUrl);
  }
}

/**
 * Copy text to clipboard and show a toast notification
 */
function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text)
    .then(() => {
      console.log("Link copied to clipboard!");
      // Toast message is handled by the component
    })
    .catch((error) => {
      console.error("Failed to copy link:", error);
    });
}
