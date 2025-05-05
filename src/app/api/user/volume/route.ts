import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });

  // Get trades and swaps in the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Query trades table for USD equivalent
  const { data: trades, error: tradesError } = await supabase
    .from("trades")
    .select("usd_equivalent")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (tradesError) {
    return NextResponse.json({ error: tradesError.message }, { status: 500 });
  }

  // Query swap_transactions table for USD equivalent
  const { data: swaps, error: swapsError } = await supabase
    .from("swap_transactions")
    .select("usd_equivalent")
    .eq("user_id", userId)
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (swapsError) {
    return NextResponse.json({ error: swapsError.message }, { status: 500 });
  }

  // Sum the usd_equivalent values from both tables
  const tradesVolume = (trades || []).reduce(
    (sum, trade) => sum + Number(trade.usd_equivalent || 0),
    0
  );
  const swapsVolume = (swaps || []).reduce(
    (sum, swap) => sum + Number(swap.usd_equivalent || 0),
    0
  );

  const volume_usd = tradesVolume + swapsVolume;

  return NextResponse.json({ volume_usd });
} 