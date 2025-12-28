-- ============================================================================
-- MOVESAFE MULTISIG WALLET - SUPABASE SCHEMA
-- ============================================================================
-- This schema supports off-chain coordination for native MultiEd25519 multisig
-- transactions on Movement/Aptos. The blockchain stores no partial signatures.
--
-- ARCHITECTURE:
-- 1. Safe = Native MultiEd25519 account (K-of-N signatures required)
-- 2. Supabase stores: Safe metadata, pending transactions, partial signatures
-- 3. Transaction execution: Collect K signatures → Aggregate → Submit on-chain
-- ============================================================================

-- ============================================================================
-- TABLE: safes
-- ============================================================================
-- Stores metadata for each multisig safe (wallet)
-- A "safe" is just an account address derived from K-of-N public keys

CREATE TABLE IF NOT EXISTS safes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- The MultiEd25519 account address (derived off-chain from owners' public keys)
    address TEXT NOT NULL UNIQUE,
    
    -- Human-readable name for the safe
    name TEXT NOT NULL,
    
    -- K-of-N: How many signatures required to execute a transaction
    threshold SMALLINT NOT NULL CHECK (threshold > 0),
    
    -- Array of owner wallet addresses (public keys or account addresses)
    -- These are the N owners who can sign transactions
    owners TEXT[] NOT NULL CHECK (array_length(owners, 1) >= threshold),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast safe lookups by address
CREATE INDEX IF NOT EXISTS idx_safes_address ON safes(address);

-- ============================================================================
-- TABLE: transactions
-- ============================================================================
-- Stores pending and executed transactions for each safe
-- Transactions remain in 'PENDING' until threshold signatures are collected

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the safe that owns this transaction
    safe_address TEXT NOT NULL REFERENCES safes(address) ON DELETE CASCADE,
    
    -- Transaction payload in JSON format
    -- Structure: { "function": "0x1::coin::transfer", 
    --             "typeArguments": ["0x1::aptos_coin::AptosCoin"],
    --             "functionArguments": ["0xRecipient", "1000000"] }
    payload JSONB NOT NULL,
    
    -- Transaction status
    status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (status IN ('PENDING', 'EXECUTED', 'REJECTED')),
    
    -- Address of the owner who created/proposed this transaction
    created_by TEXT NOT NULL,
    
    -- On-chain sequence number (critical for transaction ordering)
    -- This should match the account's sequence number when submitted
    sequence_number BIGINT NOT NULL,
    
    -- Optional: Transaction hash after execution (null if pending)
    tx_hash TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    executed_at TIMESTAMPTZ,
    
    -- Ensure created_by is one of the safe's owners (enforced at app level)
    CONSTRAINT valid_creator CHECK (created_by IS NOT NULL)
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_transactions_safe_address ON transactions(safe_address);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_safe_status ON transactions(safe_address, status);

-- ============================================================================
-- TABLE: signatures
-- ============================================================================
-- Stores partial signatures for pending transactions
-- A transaction becomes executable when signature count >= safe.threshold

CREATE TABLE IF NOT EXISTS signatures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key to the transaction being signed
    transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    
    -- Address of the owner who provided this signature
    signer_address TEXT NOT NULL,
    
    -- Raw signature in hexadecimal format (Ed25519Signature)
    signature_hex TEXT NOT NULL,
    
    -- Metadata
    signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Prevent duplicate signatures from the same signer for the same transaction
    CONSTRAINT unique_signature_per_signer UNIQUE (transaction_id, signer_address)
);

-- Indexes for efficient signature counting and retrieval
CREATE INDEX IF NOT EXISTS idx_signatures_transaction_id ON signatures(transaction_id);
CREATE INDEX IF NOT EXISTS idx_signatures_signer ON signatures(signer_address);

-- ============================================================================
-- VIEW: executable_transactions
-- ============================================================================
-- Helper view to identify transactions that have collected enough signatures
-- A transaction is executable when: signature_count >= threshold AND status = 'PENDING'

CREATE OR REPLACE VIEW executable_transactions AS
SELECT 
    t.id,
    t.safe_address,
    t.payload,
    t.status,
    t.sequence_number,
    t.created_by,
    t.created_at,
    s.threshold,
    COALESCE(sig_count.count, 0) AS signature_count,
    COALESCE(sig_count.count, 0) >= s.threshold AS is_executable
FROM transactions t
JOIN safes s ON t.safe_address = s.address
LEFT JOIN (
    SELECT transaction_id, COUNT(*) AS count
    FROM signatures
    GROUP BY transaction_id
) sig_count ON t.id = sig_count.transaction_id
WHERE t.status = 'PENDING';

-- ============================================================================
-- FUNCTION: get_transaction_signatures
-- ============================================================================
-- Helper function to retrieve all signatures for a transaction with signer indices
-- Returns signatures ordered by signer's index in the safe's owners array
-- This is critical for constructing the MultiEd25519Signature bitmap

CREATE OR REPLACE FUNCTION get_transaction_signatures(tx_id UUID)
RETURNS TABLE (
    signer_address TEXT,
    signature_hex TEXT,
    signer_index INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        sig.signer_address,
        sig.signature_hex,
        array_position(s.owners, sig.signer_address) - 1 AS signer_index -- 0-indexed
    FROM signatures sig
    JOIN transactions t ON sig.transaction_id = t.id
    JOIN safes s ON t.safe_address = s.address
    WHERE sig.transaction_id = tx_id
    ORDER BY signer_index;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS: Updated Timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_safes_updated_at ON safes;

CREATE TRIGGER update_safes_updated_at
    BEFORE UPDATE ON safes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE: safe_drafts
-- ============================================================================

CREATE TABLE IF NOT EXISTS safe_drafts (
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

CREATE INDEX IF NOT EXISTS idx_safe_drafts_status ON safe_drafts(status);

DROP TRIGGER IF EXISTS update_safe_drafts_updated_at ON safe_drafts;

CREATE TRIGGER update_safe_drafts_updated_at
    BEFORE UPDATE ON safe_drafts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- FUNCTION: join_safe_draft
-- ============================================================================

CREATE OR REPLACE FUNCTION join_safe_draft(draft_id UUID, join_token TEXT, owner_pubkey TEXT)
RETURNS safe_drafts AS $$
DECLARE
    d safe_drafts;
BEGIN
    SELECT * INTO d FROM safe_drafts WHERE id = draft_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Draft safe not found';
    END IF;

    IF d.join_token <> join_token THEN
        RAISE EXCEPTION 'Invalid join token';
    END IF;

    IF d.status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Draft safe is not joinable';
    END IF;

    IF array_position(d.owners, owner_pubkey) IS NOT NULL THEN
        RETURN d;
    END IF;

    IF array_length(d.owners, 1) IS NOT NULL AND array_length(d.owners, 1) >= d.owner_limit THEN
        RAISE EXCEPTION 'Draft safe is full';
    END IF;

    UPDATE safe_drafts
    SET owners = array_append(owners, owner_pubkey)
    WHERE id = draft_id
    RETURNING * INTO d;

    RETURN d;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: finalize_safe_draft
-- ============================================================================

CREATE OR REPLACE FUNCTION finalize_safe_draft(draft_id UUID, admin_token TEXT, safe_address TEXT)
RETURNS TEXT AS $$
DECLARE
    d safe_drafts;
BEGIN
    SELECT * INTO d FROM safe_drafts WHERE id = draft_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Draft safe not found';
    END IF;

    IF d.admin_token <> admin_token THEN
        RAISE EXCEPTION 'Invalid admin token';
    END IF;

    IF d.status <> 'DRAFT' THEN
        RAISE EXCEPTION 'Draft safe is not finalizable';
    END IF;

    IF array_length(d.owners, 1) IS NULL OR array_length(d.owners, 1) < d.threshold THEN
        RAISE EXCEPTION 'Not enough owners to finalize';
    END IF;

    INSERT INTO safes(address, name, threshold, owners)
    VALUES (safe_address, d.name, d.threshold, d.owners);

    UPDATE safe_drafts
    SET status = 'FINALIZED', finalized_safe_address = safe_address
    WHERE id = draft_id;

    RETURN safe_address;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - Optional but Recommended
-- ============================================================================
-- Enable RLS if you want user-level access control
-- For MVP, you might disable this and handle permissions in application layer

-- Uncomment below to enable RLS:
/*
ALTER TABLE safes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE signatures ENABLE ROW LEVEL SECURITY;

-- Example policy: Users can only see safes where they are an owner
CREATE POLICY "Users can view their own safes"
    ON safes FOR SELECT
    USING (auth.uid()::text = ANY(owners));

-- Example policy: Owners can create transactions for their safes
CREATE POLICY "Owners can create transactions"
    ON transactions FOR INSERT
    WITH CHECK (
        created_by = auth.uid()::text 
        AND created_by = ANY(SELECT unnest(owners) FROM safes WHERE address = safe_address)
    );

-- Example policy: Owners can sign their safe's transactions
CREATE POLICY "Owners can sign transactions"
    ON signatures FOR INSERT
    WITH CHECK (
        signer_address = auth.uid()::text
        AND signer_address = ANY(
            SELECT unnest(s.owners) 
            FROM safes s 
            JOIN transactions t ON s.address = t.safe_address 
            WHERE t.id = transaction_id
        )
    );
*/

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify the logic: "Transaction is executable when signature_count >= threshold"

-- Example query to check executable transactions:
/*
SELECT 
    id,
    safe_address,
    signature_count,
    threshold,
    is_executable
FROM executable_transactions
WHERE is_executable = true;
*/

-- ============================================================================
-- SAMPLE DATA (For Testing - Remove in Production)
-- ============================================================================

-- Example: Create a test safe
/*
INSERT INTO safes (address, name, threshold, owners) VALUES 
(
    '0xABCDEF1234567890',
    'Test Safe',
    2,
    ARRAY['0xOwner1', '0xOwner2', '0xOwner3']
);

-- Example: Create a pending transaction
INSERT INTO transactions (safe_address, payload, created_by, sequence_number) VALUES 
(
    '0xABCDEF1234567890',
    '{"function": "0x1::coin::transfer", "typeArguments": ["0x1::aptos_coin::AptosCoin"], "functionArguments": ["0xRecipient", "1000000"]}'::jsonb,
    '0xOwner1',
    0
);

-- Example: Add signatures (2 signatures for 2-of-3 safe)
INSERT INTO signatures (transaction_id, signer_address, signature_hex) VALUES 
(
    (SELECT id FROM transactions LIMIT 1),
    '0xOwner1',
    '0xSIGNATURE_HEX_1'
),
(
    (SELECT id FROM transactions LIMIT 1),
    '0xOwner3',
    '0xSIGNATURE_HEX_3'
);

-- Verify it's executable
SELECT * FROM executable_transactions;
*/
