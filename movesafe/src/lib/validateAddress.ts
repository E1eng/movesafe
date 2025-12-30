/**
 * Address validation utility for Movement/Aptos addresses
 * Provides comprehensive validation for wallet addresses
 */

export interface ValidationResult {
    isValid: boolean;
    error?: string;
    normalized?: string;
}

/**
 * Validates a Movement/Aptos wallet address
 * - Must start with 0x
 * - Must be 66 characters (0x + 64 hex chars)
 * - Must contain only valid hex characters
 */
export function validateAddress(address: string): ValidationResult {
    if (!address) {
        return { isValid: false, error: 'Address is required' };
    }

    const trimmed = address.trim();

    // Check 0x prefix
    if (!trimmed.startsWith('0x')) {
        return { isValid: false, error: 'Address must start with 0x' };
    }

    // Check length (0x + 64 hex chars = 66 total)
    if (trimmed.length !== 66) {
        return {
            isValid: false,
            error: `Address must be 66 characters (got ${trimmed.length})`,
        };
    }

    // Check hex characters only (after 0x)
    const hexPart = trimmed.slice(2);
    if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
        return { isValid: false, error: 'Address contains invalid characters' };
    }

    // Normalize to lowercase
    const normalized = trimmed.toLowerCase();

    return { isValid: true, normalized };
}

/**
 * Validates a transaction amount
 * - Must be positive
 * - Must not exceed available balance
 * - Must be a valid number
 */
export function validateAmount(
    amount: string,
    maxBalance?: number
): ValidationResult {
    if (!amount || amount.trim() === '') {
        return { isValid: false, error: 'Amount is required' };
    }

    const parsed = parseFloat(amount);

    if (isNaN(parsed)) {
        return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (parsed <= 0) {
        return { isValid: false, error: 'Amount must be greater than 0' };
    }

    // Check decimal places (max 8 for MOVE)
    const parts = amount.split('.');
    if (parts[1] && parts[1].length > 8) {
        return { isValid: false, error: 'Maximum 8 decimal places allowed' };
    }

    if (maxBalance !== undefined && parsed > maxBalance) {
        return {
            isValid: false,
            error: `Amount exceeds balance (${maxBalance.toFixed(4)} MOVE available)`,
        };
    }

    return { isValid: true };
}

/**
 * Validates multiple owner addresses for safe creation
 */
export function validateOwners(owners: string[]): ValidationResult {
    if (!owners || owners.length === 0) {
        return { isValid: false, error: 'At least one owner is required' };
    }

    const seen = new Set<string>();

    for (let i = 0; i < owners.length; i++) {
        const result = validateAddress(owners[i]);
        if (!result.isValid) {
            return {
                isValid: false,
                error: `Owner ${i + 1}: ${result.error}`,
            };
        }

        // Check for duplicates
        if (seen.has(result.normalized!)) {
            return {
                isValid: false,
                error: `Owner ${i + 1} is a duplicate address`,
            };
        }
        seen.add(result.normalized!);
    }

    return { isValid: true };
}

/**
 * Validates threshold for multisig
 */
export function validateThreshold(
    threshold: number,
    ownerCount: number
): ValidationResult {
    if (!Number.isInteger(threshold) || threshold < 1) {
        return { isValid: false, error: 'Threshold must be at least 1' };
    }

    if (threshold > ownerCount) {
        return {
            isValid: false,
            error: `Threshold cannot exceed number of owners (${ownerCount})`,
        };
    }

    return { isValid: true };
}
