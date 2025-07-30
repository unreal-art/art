"use client"

import { createClient } from "$/supabase/client"
import { Client } from "$/supabase/client"
import { logError } from "@/utils/sentryUtils"
import appConfig from "@/config"
import { toast } from "sonner"

/**
 * Updates a user's torus ID in the database
 * @param torusId The torus user ID to update
 * @param client Optional Supabase client instance
 * @returns Promise indicating success or error
 */
export const updateUserTorusId = async (torusId: string, client?: Client) => {
  console.log("updateUserTorusId called with torusId:", torusId)

  const supabase = createClient()
  const authClient = client ?? supabase
  try {
    const { data: userData, error } = await authClient.auth.getUser()
    if (error) {
      console.error("Error fetching auth user:", error)
      return { success: false, error: "Failed to fetch auth user" }
    }

    if (!userData?.user?.id) {
      console.error("No user ID found")
      return { success: false, error: "No user ID found" }
    }

    const { data: profileData, error: profileError } = await authClient
      .from("profiles")
      .select("*")
      .eq("id", userData.user.id)
      .single()

    if (profileError) {
      console.error("Error fetching user profile data:", profileError)
      return { success: false, error: "Failed to fetch user profile" }
    }

    console.log("Found profile data:", profileData)

    if (!profileData.torus_id) {
      console.log("Updating torus_id for user")
      const { error: updateError } = await authClient
        .from("profiles")
        .update({ torus_id: torusId })
        .eq("id", profileData.id)
        .single()

      if (updateError) {
        console.error("Error updating torus_id:", updateError)
        // await supabase.auth.signOut()
        // window.location.replace(`/auth?torus_user=${torusId}`)

        // show error to user..
        toast.error("Failed to update torus_id")
        return { success: false, error: "Failed to update torus_id" }
      }

      // Insert credit purchase record for new user
      const creditAmount = appConfig.app.newUserCredit

      const { error: creditError } = await authClient
        .from("credit_purchases")
        .insert([
          {
            amount: creditAmount,
            user: profileData.id,
          },
        ])

      if (creditError) {
        console.error("Error inserting credit purchase:", creditError)
        // Don't fail the whole process if credit insertion fails
      }

      // Clear localStorage after successful update
      window.localStorage.removeItem("torusUser")
      return { success: true }
    } else {
      console.log("User already has torus_id")
      return { success: true }
    }
  } catch (error) {
    console.error("Unexpected error in updateUserTorusId:", error)
    // FIXME:lets not logout the user just cuz of this
    await supabase.auth.signOut()
    window.location.replace(`/auth?torus_user=${torusId}`)
    return { success: false, error: "Unexpected error occurred" }
  }
}

/**
 * Retrieves a user's torus ID from the database
 * @param client Optional Supabase client instance
 * @returns Promise with torus ID or null
 */
export const getUserTorusId = async (client?: Client) => {
  const supabase = createClient()
  const authClient = client ?? supabase

  const { data: userData, error } = await authClient.auth.getUser()
  if (error) {
    console.error("Error fetching auth user:", error)
    return null
  }

  if (!userData?.user?.id) {
    console.error("No user ID found")
    return null
  }

  const { data: profileData, error: profileError } = await authClient
    .from("profiles")
    .select("torus_id")
    .eq("id", userData.user.id)
    .single()

  if (profileError) {
    console.error("Error fetching user profile data:", profileError)
    return null
  }

  return profileData?.torus_id || null
}
