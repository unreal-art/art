"use server"

import { createClient } from "$/supabase/server"
import { generateEthereumWallet } from "@/utils"
import { Client } from "$/supabase/client"

export const getUser = async (client?: Client): Promise<User | null> => {
  const supabase = await createClient()

  const authClient = client ?? supabase
  const { data: userData, error } = await authClient.auth.getUser()

  if (error) {
    return null
  }

  //get data from profile data
  const { data: profileData, error: profileError } = await authClient
    .from("profiles")
    .select("*")
    .eq("id", userData?.user?.id)

  if (profileError) {
    return null
  }

  //check if user has a wallet
  if (!profileData[0].wallet) {
    const wallet = generateEthereumWallet()
    // console.log(wallet);

    const { error: walletError } = await authClient
      .from("profiles")
      .update({ wallet }) // Set new wallet
      .eq("id", profileData[0].id) // Where the user_id matches
      .single() // Ensures only one row is returned

    if (walletError) {
      console.error(walletError)
      return null
    }

    return getUser()
  }

  // console.log(profileData[0].wallet);

  const user = {
    ...userData.user,
    wallet: profileData[0].wallet as WalletObject | undefined,
    bio: profileData[0].bio as string,
    location: profileData[0].location as string,
    creditBalance: profileData[0].credit_balance as number,
    full_name: profileData[0].full_name as string,
    username: profileData[0].display_name || profileData[0].full_name,
    avatar_url: profileData[0].avatar_url as string,
    torus_id: profileData[0].torus_id as string,
  }
  return user
}
