//src/app/api/transactions/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { z } from "zod"

const transactionSchema = z.object({
  type: z.enum([
    "deposit",
    "withdrawal",
    "transfer",
    "buy",
    "sell",
    "trade",
    "referral_bonus",
    "referral_commission"
  ]),
  amount: z.number().positive(),
  description: z.string().optional(),
  recipientId: z.string().optional(), // For transfers
  reference: z.string().optional(),  
  currency: z.string().default('NGN'), // Ensure currency is always present
});

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Fetch transactions from all relevant tables
    const { data: fiatTxs, error: fiatError } = await supabase
      .from('transactions')
      .select('*')
      .or(`user_id.eq.${userId},recipient_id.eq.${userId}`)

    const { data: swapTxs, error: swapError } = await supabase
      .from('swap_transactions')
      .select('*')
      .eq('user_id', userId)

    const { data: tradeTxs, error: tradeError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', userId)

    if (fiatError || swapError || tradeError) {
      console.error("Error fetching transactions:", fiatError, swapError, tradeError)
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 }
      )
    }

  

    // Normalize and merge
    const fiat = (fiatTxs || []).map(tx => ({
      ...tx,
      _source: 'fiat',
      _type: tx.type,
      _amount: tx.amount,
      _currency: tx.currency,
      _status: tx.status,
      _created_at: tx.created_at,
    }))
    const swaps = (swapTxs || []).map(tx => ({
      ...tx,
      _source: 'swap',
      _type: 'swap',
      _amount: tx.from_amount ?? tx.amount, // fallback to amount
      _currency: tx.from_currency ?? tx.currency, // fallback to currency
      _status: tx.status,
      _created_at: tx.created_at,
    }))
    const trades = (tradeTxs || []).map(tx => ({
      ...tx,
      _source: 'trade',
      _type: tx.type,
      _amount: tx.amount,
      _currency: tx.currency,
      _status: tx.status,
      _created_at: tx.created_at,
    }))

    // Merge and sort by date
    const allTxs = [...fiat, ...swaps, ...trades].sort(
      (a, b) => new Date(b._created_at).getTime() - new Date(a._created_at).getTime()
    )

    return NextResponse.json(allTxs)
  } catch (error) {
    console.error("Error fetching transactions:", error)
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const validatedData = transactionSchema.parse(body)
    const userId = session.user.id

    // Map type to lowercase for the database
    const dbType = validatedData.type.toLowerCase();
    // Note: If you want to track currency per transaction, add a 'currency' column to the DB and update the function signature.

    // Get user's current balance
    const { data: user, error: userError } = await supabase
      .from('user_profiles')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // Check if user has sufficient balance for withdrawal or transfer
    if (
      (validatedData.type === "withdrawal" || validatedData.type === "transfer") &&
      user.balance < validatedData.amount
    ) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      )
    }

    // For transfers, verify recipient exists
    if (validatedData.type === "transfer") {
      if (!validatedData.recipientId) {
        return NextResponse.json(
          { error: "Recipient ID is required for transfers" },
          { status: 400 }
        )
      }

      const { data: recipient, error: recipientError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', validatedData.recipientId)
        .single()

      if (recipientError || !recipient) {
        return NextResponse.json(
          { error: "Recipient not found" },
          { status: 404 }
        )
      }
    }

    // Start a Supabase transaction using RPC
    // Insert transaction using lowercase type for DB
    const { data: transaction, error: transactionError } = await supabase
      .rpc('create_transaction', {
        p_type: dbType, // always lowercase for DB
        p_amount: validatedData.amount,
        p_description: validatedData.description || '',
        p_user_id: userId,
        p_recipient_id: validatedData.recipientId || null,
        p_reference: validatedData.reference || null,
        // p_currency removed to match DB schema
      })
      .single();

    if (transactionError) {
      console.error("Transaction error:", transactionError)
      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid transaction data", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Error creating transaction:", error)
    return NextResponse.json(
      { error: "Failed to create transaction" },
      { status: 500 }
    )
  }
}