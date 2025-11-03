import { NextResponse } from "next/server"
import { getUser } from "@/queries/user"
import { createClient } from "@supabase/supabase-js"
import appConfig from "@/config"

// Types for video generation request
interface VideoGenerationRequest {
    inputs: {
        Prompt: string
        Seed?: number
        n?: number
    }
    author: string
    category: string
}

// Video API response interface
interface VideoGenerationResponse {
    jobId: string
    status: string
    createdAt: string
}

// Input validation for video generation
const validateRequest = (requestData: any): VideoGenerationRequest => {
    if (!requestData.inputs?.Prompt) {
        throw new Error("Prompt is required")
    }
    if (!requestData.author) {
        throw new Error("Author is required")
    }
    if (!requestData.category) {
        throw new Error("Category is required")
    }

    return requestData as VideoGenerationRequest
}

export async function POST(req: Request) {
    const supabaseUrl = appConfig.services.supabase.url as string
    const private_SRK = appConfig.services.supabase.SRK as string

    // Configuration check
    if (!supabaseUrl || !private_SRK) {
        return NextResponse.json(
            {
                status: false,
                message: "System Error: Missing required configuration",
            },
            { status: 500 }
        )
    }

    try {
        // Parse and validate request
        const requestBody = await req.json()
        const requestData = validateRequest(requestBody)

        // User authentication
        const user = await getUser()
        if (!user || !user.id) {
            return NextResponse.json(
                {
                    status: false,
                    message: "User not authenticated",
                },
                { status: 401 }
            )
        }

        // Make fetch request to video generation API
        const prompt = requestData.inputs.Prompt
        const body = JSON.stringify({ "prompt": prompt })
        
        const response = await fetch("https://openai.ideomind.org/v1/videos/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
            },
            body: body
        })

        if (!response.ok) {
            throw new Error(`Video generation API failed: ${response.statusText}`)
        }

        const videoResponse: VideoGenerationResponse = await response.json()
        console.log(videoResponse)
        
        // Initialize Supabase client
        const supabaseClient = createClient(supabaseUrl, private_SRK)

        // Create post with basic fields plus jobId
        const { data, error } = await supabaseClient
            .from("posts")
            .insert({
                author: requestData.author,
                isPrivate: false,
                prompt: prompt,
                category: requestData.category,
                jobId: videoResponse.jobId,
                media_type: "VIDEO"
            })
            .select()
            .single()


        //send job response to queue
        const { error: job_error } = await supabaseClient.rpc("send_to_queue", {
            queue_name: "video_jobs",
            msg: {
                jobResponse: videoResponse,
                post_data: data
            },
            // delay: 0, // No delay
        });

        if(job_error) {
            throw new Error(`Job failed with error: ${job_error}`)
        }

        if (error) {
            throw new Error(`Database insertion failed: ${error.message}`)
        }

        console.log(`Video generation post created:`, data.id)

        // Return success response
        return NextResponse.json({
            status: true,
            message: "Video generation started",
            data: {
                prompt: prompt,
                author: requestData.author,
                category: requestData.category,
                jobId: videoResponse.jobId,
                postId: data.id,
                estimated_processing_time: "few minutes",
            },
        })
    } catch (error: unknown) {
        console.error("Error starting video generation:", error)

        // Handle validation errors
        if (error instanceof Error) {
            if (
                error.message.includes("required") ||
                error.message.includes("invalid")
            ) {
                return NextResponse.json(
                    {
                        status: false,
                        message: error.message,
                    },
                    { status: 400 }
                )
            }
        }

        return NextResponse.json(
            {
                status: false,
                message: "Failed to start video generation",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        )
    }
}
