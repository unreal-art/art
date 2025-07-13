"use client";

import { createClient } from "$/supabase/client";
import { ExtendedUser } from "$/types/data.types";
import { useGenerationStore } from "@/app/providers/GenerationStoreProvider";
import { sendJobRequest } from "@/queries/post/sendJobRequest";
import { useRouter } from "next/navigation";
import { useEffect, useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logError } from "@/utils/sentryUtils";

interface JobParams {
  prompt: string;
  negative_prompt?: string;
  model?: string;
  numImages?: number;
}

/**
 * Enhanced hook for creating image generation jobs
 * Integrates with the generationStore for state management
 */
export function useCreateJob(user: ExtendedUser | null) {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Get only the confirmed functions from the store
  const { startGeneration, stopGeneration } = useGenerationStore(
    (state) => state,
  );

  // Maintain local state for tracking
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Define mutation with proper error handling and retries
  const mutation = useMutation({
    mutationFn: async (params: JobParams) => {
      const { prompt } = params;

      if (!prompt) throw new Error("Prompt is required");
      if (!user) throw new Error("User must be logged in");

      // Update local state and use the store's function
      setIsGenerating(true);
      setProgress(0);
      startGeneration();

      try {
        // Send job request with only the supported parameters
        await sendJobRequest({
          prompt,
          user,
          stopGeneration,
        });

        // Update progress
        setProgress(100);

        // Return success
        return { success: true };
      } catch (error) {
        // Handle errors gracefully
        setIsGenerating(false);
        stopGeneration();
        throw error;
      }
    },
    onError: (error) => {
      logError("Error creating job", error);
      setIsGenerating(false);
      stopGeneration();

      // Clear stale data if needed
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
    // Retry on certain errors, but not on validation errors
    retry: (failureCount, error) => {
      // Don't retry on user errors
      if (
        error.message.includes("Prompt is required") ||
        error.message.includes("User must be logged in")
      ) {
        return false;
      }

      // Retry network errors up to 2 times
      return failureCount < 2;
    },
  });

  // Helper to cancel the job
  const cancelJob = useCallback(() => {
    setIsGenerating(false);
    setProgress(0);
    stopGeneration();
  }, [stopGeneration]);

  // Poll for new posts instead of using real-time subscription
  useEffect(() => {
    if (!user || !isGenerating) {
      return;
    }

    console.log("Starting polling for user:", user.id);
    const supabaseClient = createClient();
    let latestPostId: number | null = null;

    // Get the latest post ID initially
    const getLatestPost = async () => {
      const { data } = await supabaseClient
        .from("posts")
        .select("id")
        .eq("author", user.id)
        .order("id", { ascending: false })
        .limit(1)
        .single();

      if (data) {
        latestPostId = data.id;
        console.log("Latest post ID:", latestPostId);
      }
    };

    getLatestPost();

    // Poll every 2 seconds
    const interval = setInterval(async () => {
      try {
        const { data } = await supabaseClient
          .from("posts")
          .select("id, author")
          .eq("author", user.id)
          .order("id", { ascending: false })
          .limit(1)
          .single();

        if (data && data.id !== latestPostId) {
          console.log("New post detected:", data);
          latestPostId = data.id;

          // Handle successful generation
          setIsGenerating(false);
          setProgress(100);
          stopGeneration();

          // Prefetch post data
          queryClient.invalidateQueries({ queryKey: ["posts"] });

          // Navigate to the new post
          // setTimeout(() => {
          router.push(`/home/photo/${data.id}`);
          // }, 100);
        }
      } catch (error) {
        console.log("Polling check - no new posts yet");
      }
    }, 2000);

    return () => {
      console.log("Stopping polling");
      clearInterval(interval);
    };
  }, [user, router, stopGeneration, queryClient, isGenerating]);

  return {
    ...mutation,
    cancelJob,
    isGenerating,
    progress,
    generationState: {
      isGenerating,
      progress,
    },
  };
}
