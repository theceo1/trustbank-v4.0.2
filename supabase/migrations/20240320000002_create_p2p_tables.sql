-- Create enum for order type
CREATE TYPE order_type AS ENUM ('buy', 'sell');

-- Create enum for order status
CREATE TYPE order_status AS ENUM ('active', 'completed', 'cancelled');

-- Create enum for trade status
CREATE TYPE trade_status AS ENUM ('pending_payment', 'paid', 'completed', 'disputed', 'cancelled');

-- Create enum for dispute status
CREATE TYPE dispute_status AS ENUM ('pending', 'resolved', 'rejected');

-- Create p2p_orders table
CREATE TABLE IF NOT EXISTS p2p_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type order_type NOT NULL,
  currency TEXT NOT NULL,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  min_order DECIMAL(24,8) NOT NULL,
  max_order DECIMAL(24,8) NOT NULL,
  payment_methods TEXT[] NOT NULL,
  terms TEXT,
  status order_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  CONSTRAINT positive_amount CHECK (amount > 0),
  CONSTRAINT positive_price CHECK (price > 0),
  CONSTRAINT valid_order_limits CHECK (min_order <= max_order AND max_order <= amount)
);

-- Create p2p_escrows table
CREATE TABLE IF NOT EXISTS p2p_escrows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  total DECIMAL(24,8) NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending_payment',
  escrow_wallet_id TEXT NOT NULL,
  escrow_confirmation_code TEXT NOT NULL,
  payment_window_minutes INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  payment_confirmed_at TIMESTAMPTZ,
  CONSTRAINT positive_escrow_amount CHECK (amount > 0),
  CONSTRAINT positive_escrow_price CHECK (price > 0),
  CONSTRAINT positive_escrow_total CHECK (total > 0)
);

-- Create p2p_trades table
CREATE TABLE IF NOT EXISTS p2p_trades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  escrow_id UUID NOT NULL REFERENCES p2p_escrows(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES p2p_orders(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(24,8) NOT NULL,
  price DECIMAL(24,8) NOT NULL,
  total DECIMAL(24,8) NOT NULL,
  status trade_status NOT NULL DEFAULT 'pending_payment',
  payment_proof TEXT,
  buyer_quidax_id TEXT NOT NULL,
  seller_quidax_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  CONSTRAINT positive_trade_amount CHECK (amount > 0),
  CONSTRAINT positive_trade_price CHECK (price > 0),
  CONSTRAINT positive_trade_total CHECK (total > 0)
);

-- Create p2p_disputes table
CREATE TABLE IF NOT EXISTS p2p_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trade_id UUID NOT NULL REFERENCES p2p_trades(id) ON DELETE CASCADE,
  initiator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  evidence TEXT,
  admin_notes TEXT,
  resolution TEXT,
  status dispute_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX p2p_orders_creator_id_idx ON p2p_orders(creator_id);
CREATE INDEX p2p_orders_currency_idx ON p2p_orders(currency);
CREATE INDEX p2p_orders_status_idx ON p2p_orders(status);
CREATE INDEX p2p_escrows_order_id_idx ON p2p_escrows(order_id);
CREATE INDEX p2p_escrows_buyer_id_idx ON p2p_escrows(buyer_id);
CREATE INDEX p2p_escrows_seller_id_idx ON p2p_escrows(seller_id);
CREATE INDEX p2p_trades_order_id_idx ON p2p_trades(order_id);
CREATE INDEX p2p_trades_buyer_id_idx ON p2p_trades(buyer_id);
CREATE INDEX p2p_trades_seller_id_idx ON p2p_trades(seller_id);
CREATE INDEX p2p_disputes_trade_id_idx ON p2p_disputes(trade_id);
CREATE INDEX p2p_disputes_initiator_id_idx ON p2p_disputes(initiator_id);
CREATE INDEX p2p_disputes_status_idx ON p2p_disputes(status);

-- Enable RLS
ALTER TABLE p2p_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE p2p_disputes ENABLE ROW LEVEL SECURITY;

-- RLS policies for p2p_orders
CREATE POLICY "View all active orders" ON p2p_orders
  FOR SELECT
  USING (status = 'active');

CREATE POLICY "View own orders" ON p2p_orders
  FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Create orders" ON p2p_orders
  FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Update own orders" ON p2p_orders
  FOR UPDATE
  USING (creator_id = auth.uid());

-- RLS policies for p2p_escrows
CREATE POLICY "View own escrows" ON p2p_escrows
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Create escrows" ON p2p_escrows
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Update own escrows" ON p2p_escrows
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS policies for p2p_trades
CREATE POLICY "View own trades" ON p2p_trades
  FOR SELECT
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Create trades" ON p2p_trades
  FOR INSERT
  WITH CHECK (buyer_id = auth.uid() OR seller_id = auth.uid());

CREATE POLICY "Update own trades" ON p2p_trades
  FOR UPDATE
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- RLS policies for p2p_disputes
CREATE POLICY "View own disputes" ON p2p_disputes
  FOR SELECT
  USING (
    initiator_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM p2p_trades t
      WHERE t.id = trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Create disputes" ON p2p_disputes
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM p2p_trades t
      WHERE t.id = trade_id
      AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
    )
  );

CREATE POLICY "Admin update disputes" ON p2p_disputes
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Admin view all disputes" ON p2p_disputes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
    )
  ); 