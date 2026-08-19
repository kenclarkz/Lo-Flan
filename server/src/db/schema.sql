CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY DEFAULT ('ord-' || replace(gen_random_uuid()::text, '-', '')),
  source TEXT NOT NULL CHECK (source IN ('chat', 'phone')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('pending', 'new', 'confirmed', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT,
  phone TEXT,
  items JSONB,
  notes TEXT,
  message TEXT,
  call_sid TEXT,
  conversation_id TEXT,
  transcript TEXT,
  is_order BOOLEAN NOT NULL DEFAULT false,
  delivery_method TEXT,
  delivery_address TEXT,
  pickup_date TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_source ON orders (source);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
