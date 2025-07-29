import { ExtendedUser } from "$/types/data.types"
import { axiosInstanceLocal } from "@/lib/axiosInstance"
import axios from "axios"
import random from "random"
import { toast } from "sonner"
import { logError } from "@/utils/sentryUtils"

// Request payload types
interface ImageGenerationRequest {
  inputs: {
    Prompt: string
    Seed: number
    n?: number
  }
  author: string
  category: string
}

interface VideoGenerationRequest {
  inputs: {
    Prompt: string
    Seed: number
    n?: number
  }
  author: string
  category: string
}

// Function to send job request (Fire-and-Forget for images, await for videos)
export const sendJobRequest = async ({
  prompt,
  user,
  stopGeneration,
  imageCount = 4,
  mediaType = 'image',
}: {
  prompt: string
  user: ExtendedUser | null
  stopGeneration: () => void
  imageCount?: number
  mediaType?: 'image' | 'video'
}): Promise<{ postId?: number; jobId?: string } | void> => {
  // Early validation
  if (!user) {
    logError("User is undefined, cannot send job request", new Error("No user"))
    toast.error(`Please log in to generate ${mediaType}s`)
    stopGeneration()
    return
  }

  if (!user.id) {
    logError(
      "User ID is undefined, cannot send job request",
      new Error("No user ID")
    )
    toast.error("User authentication error")
    stopGeneration()
    return
  }

  // Validate prompt
  if (!prompt || prompt.trim().length === 0) {
    toast.error("Please enter a prompt")
    stopGeneration()
    return
  }

  if (prompt.length > 1000) {
    toast.error("Prompt too long (max 1000 characters)")
    stopGeneration()
    return
  }

  // Create request payload
  const requestPayload: ImageGenerationRequest | VideoGenerationRequest = {
    inputs: {
      Prompt: prompt.trim(),
      Seed: random.int(1e3, 1e8),
      n: mediaType === 'video' ? 1 : Math.min(Math.max(imageCount, 1), 10), // Videos: 1, Images: 1-10
    },
    author: user.id,
    category: "GENERATION",
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  // Add Authorization header if needed
  if (user.creditBalance <= 0 && user.wallet?.privateKey) {
    headers.Authorization = `Bearer ${user.wallet.privateKey}`
  }

  // Determine API endpoint based on media type
  const apiEndpoint = mediaType === 'video' ? '/api/videos/generations' : '/api/images/generations';
  
  if (mediaType === 'video') {
    // For videos: await the response to get jobId before redirecting
    try {
      const response = await axiosInstanceLocal.post(apiEndpoint, requestPayload, {
        headers,
      });

      if (response.data?.status && response.data?.data?.jobId) {
        // Return the jobId for video generation
        return { 
          jobId: response.data.data.jobId,
          postId: response.data.data.postId 
        };
      } else {
        throw new Error("Invalid response from video generation API");
      }
    } catch (error) {
      stopGeneration();
      
      // Enhanced error handling
      let errorMessage = `Failed to start ${mediaType} generation`;

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage = "Request timeout - please try again";
        } else if (error.response?.status === 401) {
          errorMessage = `Please log in to generate ${mediaType}s`;
        } else if (error.response?.status === 400) {
          errorMessage = error.response.data?.message || "Invalid request";
        } else if (error.response?.status === 500) {
          errorMessage = "Server error - please try again";
        } else {
          errorMessage = error.response?.data?.message || error.message;
        }
      }

      toast.error(errorMessage, {
        description: "Please check your connection and try again",
        duration: 5000,
      });

      logError("Error sending job request", {
        error,
        prompt: prompt.substring(0, 100), // Only log first 100 chars
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  } else {
    // For images: 🚀 Fire-and-Forget (existing behavior)
    axiosInstanceLocal
      .post(apiEndpoint, requestPayload, {
        headers,
        // timeout: 10000, // You have to wait unfortunately
      })
      .then((response) => {
        // Optional: Log success and show estimated time
        if (response.data?.status) {
          if (response.data?.data?.estimated_processing_time) {
            console.info(
              `Processing time: ${response.data.data.estimated_processing_time}`
            )
          }
        }
      })
      .catch((error) => {
        stopGeneration()

        // Enhanced error handling
        let errorMessage = `Failed to start ${mediaType} generation`

        if (axios.isAxiosError(error)) {
          if (error.code === "ECONNABORTED") {
            errorMessage = "Request timeout - please try again"
          } else if (error.response?.status === 401) {
            errorMessage = `Please log in to generate ${mediaType}s`
          } else if (error.response?.status === 400) {
            errorMessage = error.response.data?.message || "Invalid request"
          } else if (error.response?.status === 500) {
            errorMessage = "Server error - please try again"
          } else {
            errorMessage = error.response?.data?.message || error.message
          }
        }

        toast.error(errorMessage, {
          description: "Please check your connection and try again",
          duration: 5000,
        })

        logError("Error sending job request", {
          error,
          prompt: prompt.substring(0, 100), // Only log first 100 chars
          userId: user.id,
          timestamp: new Date().toISOString(),
        })
      })
  }
}
