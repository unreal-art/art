import { getUser } from "$/queries/user"
import { createClient } from "$/supabase/server"
import { queryOptions } from "@tanstack/react-query"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")
  const encodedRedirectTo = requestUrl.searchParams.get("redirect") || "/"

  console.log("encodedRedirectTo", encodedRedirectTo)

  const redirectTo = decodeURIComponent(encodedRedirectTo)

  const supabase = await createClient()

  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
  }

  //Do this to generate user wallet
  const user = await getUser()

  // if (torusUser && torusUser !== "" && !user?.torus_id && user && user.id) {
  //   //update user torus id field if it does not exist
  //   await supabase
  //     .from("profiles")
  //     .update({ torus_id: torusUser })
  //     .eq("id", user.id);
  // }
  return NextResponse.redirect(`${requestUrl.origin}${redirectTo}`)
}
