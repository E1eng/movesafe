# MoveSafe Smart Contract

## Spending Limit Module

This module implements daily spending limits (SafeGuards) for multisig wallets.

### Features

- **Approve Limit**: Multisig admins can set daily spending limits for beneficiaries
- **Withdraw**: Beneficiaries can instantly withdraw up to their daily limit without multisig approval
- **Auto-Reset**: Spending resets every 24 hours automatically
- **View Functions**: Query allowances, remaining limits, and all beneficiaries

### Deployment

```bash
# Install Aptos CLI
curl -fsSL "https://aptos.dev/scripts/install_cli.py" | python3

# Compile the module
aptos move compile --named-addresses movesafe=YOUR_SAFE_ADDRESS

# Publish to Movement Testnet
aptos move publish \
  --named-addresses movesafe=YOUR_SAFE_ADDRESS \
  --url https://aptos.testnet.bardock.movementlabs.xyz/v1 \
  --private-key-file 83f9....
```

### Usage

**Initialize (First time only):**
```bash
aptos move run \
  --function-id YOUR_SAFE_ADDRESS::spending_limit::initialize \
  --url https://aptos.testnet.bardock.movementlabs.xyz/v1
```

**Approve Limit (Requires Multisig):**
```bash
aptos move run \
  --function-id YOUR_SAFE_ADDRESS::spending_limit::approve_limit \
  --args address:BENEFICIARY_ADDRESS u64:1000000000 \
  --url https://aptos.testnet.bardock.movementlabs.xyz/v1
```

**Withdraw (Beneficiary):**
```bash
aptos move run \
  --function-id YOUR_SAFE_ADDRESS::spending_limit::withdraw \
  --args address:SAFE_ADDRESS u64:100000000 \
  --url https://aptos.testnet.bardock.movementlabs.xyz/v1
```

### View Functions

```typescript
// Get specific allowance
const [dailyLimit, currentSpent, lastReset] = await aptos.view({
  function: `${safeAddress}::spending_limit::get_allowance`,
  type_arguments: [],
  arguments: [safeAddress, beneficiaryAddress]
});

// Get all allowances
const allowances = await aptos.view({
  function: `${safeAddress}::spending_limit::get_all_allowances`,
  type_arguments: [],
  arguments: [safeAddress]
});

// Get remaining limit
const remaining = await aptos.view({
  function: `${safeAddress}::spending_limit::get_remaining_limit`,
  type_arguments: [],
  arguments: [safeAddress, beneficiaryAddress]
});
```

### Error Codes

- `E_NOT_AUTHORIZED (1)`: Beneficiary not authorized for this safe
- `E_LIMIT_EXCEEDED (2)`: Withdrawal would exceed daily limit
- `E_ALLOWANCE_NOT_FOUND (3)`: No allowance exists for this beneficiary
- `E_INVALID_AMOUNT (4)`: Invalid amount (must be > 0)
