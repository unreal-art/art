"use client"

import { useEffect, useState } from "react"
import { supabase } from "$/supabase/client"
import { IPhoto } from "@/app/libs/interfaces"

interface VideoStatus {
  jobId: string
  status: "queued" | "processing" | "completed" | "failed"
  createdAt: string
  updatedAt: string
  video?: {
    s3: string
    url: string
  }
  error?: string
}

interface VideoStatusPollProps {
  postId: number
  jobId: string
  onVideoReady: (videoUrl: string) => void
}

export default function VideoStatusPoll({
  postId,
  jobId,
  onVideoReady,
}: VideoStatusPollProps) {
  const [status, setStatus] = useState<VideoStatus | null>(null)
  const [isPolling, setIsPolling] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  console.log(
    `VideoStatusPoll rendered with postId: ${postId}, jobId: ${jobId}, isPolling: ${isPolling}`
  )

  useEffect(() => {
    if (!jobId || !isPolling) return

    const pollVideoStatus = async () => {
      try {
        const response = await fetch(`/api/videos/status/${jobId}`)

        if (!response.ok) {
          // If it's a 404, the job might not exist yet, keep trying
          if (response.status === 404 && retryCount < 10) {
            console.log(
              `Job ${jobId} not found yet, retrying... (${retryCount + 1}/10)`
            )
            setRetryCount((prev) => prev + 1)
            return
          }

          // For other errors, still try a few times before giving up
          if (retryCount < 5) {
            console.log(
              `API error ${response.status}, retrying... (${retryCount + 1}/5)`
            )
            setRetryCount((prev) => prev + 1)
            return
          }

          throw new Error(
            `Status check failed after ${retryCount} retries: ${response.statusText}`
          )
        }

        const statusData: VideoStatus = await response.json()
        setStatus(statusData)
        setRetryCount(0) // Reset retry count on successful response

        // If video is ready, update the database and stop polling
        if (statusData.status === "completed" && statusData.video?.url) {
          await updatePostWithVideo(statusData.video.url, statusData.video.s3)
          onVideoReady(statusData.video.url)
          setIsPolling(false)
        } else if (statusData.status === "failed") {
          setError(statusData.error || "Video generation failed")
          setIsPolling(false)
        }
        // For "queued" or "processing", continue polling
      } catch (err) {
        console.error("Error polling video status:", err)

        // Only stop polling if we've retried too many times
        if (retryCount >= 10) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to check video status after multiple retries"
          )
          setIsPolling(false)
        } else {
          setRetryCount((prev) => prev + 1)
        }
      }
    }

    // Update post in database with video URL
    const updatePostWithVideo = async (videoUrl: string, s3Url: string) => {
      try {
        const { error } = await supabase
          .from("posts")
          .update({
            video_data: [
              {
                hash: videoUrl,
                url: videoUrl,
                s3: s3Url,
              },
            ],
          })
          .eq("id", postId)

        if (error) {
          console.error("Error updating post with video data:", error)
        } else {
          console.log("Post updated with video data successfully")
        }
      } catch (err) {
        console.error("Error updating post:", err)
      }
    }

    // Poll immediately, then every 3 seconds
    pollVideoStatus()
    const interval = setInterval(pollVideoStatus, 3000)

    return () => clearInterval(interval)
  }, [jobId, postId, isPolling, onVideoReady, retryCount])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-primary-13 border border-primary-11 rounded-lg">
        <div className="text-primary-3 mb-2">❌</div>
        <h3 className="text-lg font-semibold text-primary-2 mb-2">
          Video Generation Failed
        </h3>
        <p className="text-primary-4 text-center">{error}</p>
      </div>
    )
  }

  if (!status || status.status === "queued" || status.status === "processing") {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-primary-13 border border-primary-11 rounded-lg">
        <div className="animate-pulse rounded-lg h-12 w-12 bg-primary-5 mb-4"></div>
        <h3 className="text-lg font-semibold text-primary-2 mb-2">
          {status?.status === "processing"
            ? "Generating Video..."
            : "Video In Queue..."}
        </h3>
        <p className="text-primary-4 text-center mb-2">
          Your video is being generated. This might take a while.
        </p>
        {status && (
          <div className="text-sm text-primary-6 space-y-1">
            <p>
              Status:{" "}
              <span className="font-medium capitalize text-primary-3">
                {status.status}
              </span>
            </p>
            <p>
              Job ID:{" "}
              <span className="font-mono text-xs text-primary-7">
                {status.jobId}
              </span>
            </p>
            {status.updatedAt && (
              <p>
                Last updated:{" "}
                <span className="text-primary-5">
                  {new Date(status.updatedAt).toLocaleTimeString()}
                </span>
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  // This should never be reached, but add a fallback just in case
  console.log("VideoStatusPoll: Unexpected state reached")
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-primary-13 border border-primary-11 rounded-lg">
      <div className="animate-pulse rounded-lg h-12 w-12 bg-primary-5 mb-4"></div>
      <h3 className="text-lg font-semibold text-primary-2 mb-2">
        Loading Video Status...
      </h3>
      {/*<p className="text-primary-4 text-center">Job ID: {jobId}</p>*/}
    </div>
  )
}
