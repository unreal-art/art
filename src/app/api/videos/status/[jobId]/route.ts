import { NextResponse } from "next/server"
import { getUser } from "@/queries/user"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    // Verify user is authenticated
    const user = await getUser()
    if (!user || !user.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      )
    }

    const { jobId } = await params

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 })
    }

    // Make request to external API with server-side API key
    const response = await fetch(
      `https://openai.ideomind.org/v1/videos/status/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    )

    if (!response.ok) {
      // Return the original status and error from the external API
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: `External API error: ${response.statusText}`,
          details: errorText,
        },
        { status: response.status }
      )
    }

    const statusData = await response.json()

    return NextResponse.json(statusData)
  } catch (error) {
    console.error("Error checking video status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
