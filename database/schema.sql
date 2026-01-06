-- ============================================================================
-- MOVESAFE MULTISIG WALLET - SUPABASE SCHEMA 
-- ============================================================================
-- This schema supports off-chain coordination for native MultiEd25519 multisig
-- transactions on Movement/Aptos.
-- ============================================================================

-- ============================================================================
-- 1. HELPER FUNCTIONS & NORMALIZATION
-- ============================================================================

-- Normalizes addresses to handle '0x' prefix and casing consistently
CREATE OR REPLACE FUNCTION public.normalize_address(addr text)
RETURNS text AS $$
BEGIN
    RETURN lower(regexp_replace(addr, '^0x', ''));
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- Gets the normalized wallet address from the request header
CREATE OR REPLACE FUNCTION public.get_wallet_address()
RETURNS text AS $$
BEGIN
    RETURN public.normalize_address(
        COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', '')
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- Checks if a user is an owner of a specific safe
CREATE OR REPLACE FUNCTION public.is_safe_owner(safe_addr text, user_wallet text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.safes
        WHERE public.normalize_address(address) = public.normalize_address(safe_addr)
        AND public.normalize_address(user_wallet) = ANY (
            ARRAY(SELECT public.normalize_address(o) FROM unnest(owners) o)
        )
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 2. TABLES
-- ============================================================================

-- TABLE: safes
CREATE TABLE IF NOT EXISTS public.safes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    address TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    threshold SMALLINT NOT NULL CHECK (threshold > 0),
    owners TEXT[] NOT NULL CHECK (array_length(owners, 1) >= threshold),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_safes_address ON public.safes(address);

-- TABLE: transactions
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    safe_address TEXT NOT NULL REFERENCES public.safes(address) ON DELETE CASCADE,
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'EXECUTED', 'REJECTED')),
    created_by TEXT NOT NULL,
    sequence_number BIGINT NOT NULL,
    tx_hash TEXT,
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT valid_creator CHECK (created_by IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_transactions_safe_address ON public.transactions(safe_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- TABLE: signatures
CREATE TABLE IF NOT EXISTS public.signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    signer_address TEXT NOT NULL,
    signature_hex TEXT NOT NULL,
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_signature_per_signer UNIQUE (transaction_id, signer_address)
);

CREATE INDEX IF NOT EXISTS idx_signatures_transaction_id ON public.signatures(transaction_id);

-- TABLE: safe_drafts
CREATE TABLE IF NOT EXISTS public.safe_drafts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    threshold SMALLINT NOT NULL CHECK (threshold > 0),
    owner_limit SMALLINT NOT NULL CHECK (owner_limit > 0),
    owners TEXT[] NOT NULL DEFAULT '{}',
    created_by_pubkey TEXT NOT NULL,
    join_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    admin_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'FINALIZED', 'CANCELLED')),
    finalized_safe_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT safe_drafts_owners_limit CHECK (array_length(owners, 1) IS NULL OR array_length(owners, 1) <= owner_limit)
);

-- ============================================================================
-- 3. FUNCTIONS & RPC
-- ============================================================================

-- join_safe_draft: Normalized owner entry
CREATE OR REPLACE FUNCTION public.join_safe_draft(draft_id UUID, join_token TEXT, owner_pubkey TEXT)
RETURNS public.safe_drafts AS $$
DECLARE
    d public.safe_drafts;
BEGIN
    SELECT * INTO d FROM public.safe_drafts WHERE id = draft_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found'; END IF;
    IF d.join_token <> join_token THEN RAISE EXCEPTION 'Invalid token'; END IF;
    IF d.status <> 'DRAFT' THEN RAISE EXCEPTION 'Not joinable'; END IF;

    IF public.normalize_address(owner_pubkey) = ANY (ARRAY(SELECT public.normalize_address(o) FROM unnest(d.owners) o)) THEN
        RETURN d;
    END IF;

    UPDATE public.safe_drafts SET owners = array_append(owners, owner_pubkey) WHERE id = draft_id RETURNING * INTO d;
    RETURN d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- finalize_safe_draft: Professional transition from draft to active safe
CREATE OR REPLACE FUNCTION public.finalize_safe_draft(draft_id UUID, admin_token TEXT, safe_address TEXT)
RETURNS TEXT AS $$
DECLARE
    d public.safe_drafts;
    caller TEXT;
BEGIN
    SELECT * INTO d FROM public.safe_drafts WHERE id = draft_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Draft not found'; END IF;
    
    caller := public.get_wallet_address();
    
    IF d.admin_token <> admin_token AND NOT (
        caller <> '' AND caller-- ============================================================================
-- ROW LEVEL SECURITY (RLS) 
-- ============================================================================

ALTER TABLE public.safes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safe_drafts ENABLE ROW LEVEL SECURITY;

-- 1. POLICIES: safes
CREATE POLICY "Allow select for all" ON safes FOR SELECT USING (true);
CREATE POLICY "Owners can update safes" ON safes FOR UPDATE USING (
    LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = ANY (ARRAY(SELECT LOWER(REGEXP_REPLACE(o, '^0x', '')) FROM UNNEST(owners) o))
    OR
    LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = ANY (ARRAY(SELECT LOWER(REGEXP_REPLACE(o, '^0x', '')) FROM UNNEST(owners) o))
);

-- 2. POLICIES: transactions (ULTIMATE PATCH)
CREATE POLICY "Owners can create transactions" ON transactions FOR INSERT WITH CHECK (
    (
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(created_by, '^0x', ''))
        OR
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(created_by, '^0x', ''))
    )
    AND EXISTS (
        SELECT 1 FROM safes s WHERE LOWER(REGEXP_REPLACE(s.address, '^0x', '')) = LOWER(REGEXP_REPLACE(transactions.safe_address, '^0x', ''))
        AND EXISTS (SELECT 1 FROM UNNEST(s.owners) o WHERE LOWER(REGEXP_REPLACE(o, '^0x', '')) = LOWER(REGEXP_REPLACE(created_by, '^0x', '')) )
    )
);

CREATE POLICY "Owners can update transactions" ON transactions FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM safes s WHERE LOWER(REGEXP_REPLACE(s.address, '^0x', '')) = LOWER(REGEXP_REPLACE(safe_address, '^0x', ''))
        AND (
            LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = ANY (ARRAY(SELECT LOWER(REGEXP_REPLACE(o, '^0x', '')) FROM UNNEST(s.owners) o))
            OR
            LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = ANY (ARRAY(SELECT LOWER(REGEXP_REPLACE(o, '^0x', '')) FROM UNNEST(s.owners) o))
        )
    )
);

CREATE POLICY "Creator can delete pending" ON transactions FOR DELETE USING (
    status = 'PENDING' AND (
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(created_by, '^0x', ''))
        OR
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(created_by, '^0x', ''))
    )
);

-- 3. POLICIES: signatures
CREATE POLICY "Allow select for all" ON signatures FOR SELECT USING (true);
CREATE POLICY "Signer can sign" ON signatures FOR INSERT WITH CHECK (
    (
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(signer_address, '^0x', ''))
        OR
        LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(signer_address, '^0x', ''))
    )
    AND EXISTS (
        SELECT 1 FROM transactions t JOIN safes s ON t.safe_address = s.address
        WHERE t.id = transaction_id AND t.status = 'PENDING'
        AND LOWER(REGEXP_REPLACE(signer_address, '^0x', '')) = ANY (ARRAY(SELECT LOWER(REGEXP_REPLACE(o, '^0x', '')) FROM UNNEST(s.owners) o))
    )
);

CREATE POLICY "Signer can retract" ON signatures FOR DELETE USING (
    LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-address', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(signer_address, '^0x', ''))
    OR
    LOWER(REGEXP_REPLACE(COALESCE(current_setting('request.headers', true)::json->>'x-wallet-pubkey', ''), '^0x', '')) = LOWER(REGEXP_REPLACE(signer_address, '^0x', ''))
);
CREATE POLICY "Anyone can create draft" ON public.safe_drafts FOR INSERT WITH CHECK (public.get_wallet_address() <> '');
CREATE POLICY "Members can update draft" ON public.safe_drafts FOR UPDATE USING (
    public.get_wallet_address() = public.normalize_address(created_by_pubkey) 
    OR public.get_wallet_address() = ANY (ARRAY(SELECT public.normalize_address(o) FROM unnest(d.owners) o))
);
```
