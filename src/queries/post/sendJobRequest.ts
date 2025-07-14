import { ExtendedUser } from "$/types/data.types"
import { axiosInstanceLocal } from "@/lib/axiosInstance"
import axios from "axios"
import random from "random"
import { toast } from "sonner"
import { logError } from "@/utils/sentryUtils"

// Request payload type
interface ImageGenerationRequest {
  inputs: {
    Prompt: string
    Seed: number
    n?: number
  }
  author: string
  category: string
}

// Function to send job request (Fire-and-Forget)
export const sendJobRequest = ({
  prompt,
  user,
  stopGeneration,
  imageCount = 4,
}: {
  prompt: string
  user: ExtendedUser | null
  stopGeneration: () => void
  imageCount?: number
}) => {
  // Early validation
  if (!user) {
    logError("User is undefined, cannot send job request", new Error("No user"))
    toast.error("Please log in to generate images")
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
  const requestPayload: ImageGenerationRequest = {
    inputs: {
      Prompt: prompt.trim(),
      Seed: random.int(1e3, 1e8),
      n: Math.min(Math.max(imageCount, 1), 10), // Clamp between 1-10
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

  // 🚀 Fire-and-Forget: Send request without awaiting
  axiosInstanceLocal
    .post("/api/images/generations", requestPayload, {
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
      let errorMessage = "Failed to start image generation"

      if (axios.isAxiosError(error)) {
        if (error.code === "ECONNABORTED") {
          errorMessage = "Request timeout - please try again"
        } else if (error.response?.status === 401) {
          errorMessage = "Please log in to generate images"
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
