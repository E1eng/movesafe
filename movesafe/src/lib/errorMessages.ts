/**
 * User-friendly error message mapping
 * Converts API/blockchain errors to actionable messages
 */

interface ErrorInfo {
    message: string;
    suggestion?: string;
    retryable: boolean;
}

// Movement/Aptos VM error codes
const VM_ERROR_MAP: Record<string, ErrorInfo> = {
    'INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE': {
        message: 'Not enough MOVE to pay transaction fee',
        suggestion: 'Add more MOVE to your safe wallet',
        retryable: false,
    },
    'INVALID_SIGNATURE': {
        message: 'Signature does not match transaction',
        suggestion: 'Please sign the transaction again',
        retryable: true,
    },
    'SEQUENCE_NUMBER_TOO_OLD': {
        message: 'Transaction expired or already executed',
        suggestion: 'Discard this transaction and create a new one',
        retryable: false,
    },
    'SEQUENCE_NUMBER_TOO_NEW': {
        message: 'Previous transactions must execute first',
        suggestion: 'Execute or discard pending transactions with lower sequence numbers',
        retryable: true,
    },
    'OUT_OF_GAS': {
        message: 'Transaction ran out of gas',
        suggestion: 'Try with higher gas limit',
        retryable: true,
    },
    'TRANSACTION_EXPIRED': {
        message: 'Transaction has expired',
        suggestion: 'Discard and create a new transaction',
        retryable: false,
    },
};

// Network/API errors
const NETWORK_ERROR_MAP: Record<string, ErrorInfo> = {
    'Failed to fetch': {
        message: 'Network connection failed',
        suggestion: 'Check your internet connection and try again',
        retryable: true,
    },
    'timeout': {
        message: 'Request timed out',
        suggestion: 'Network may be congested. Please try again',
        retryable: true,
    },
    'rate limit': {
        message: 'Too many requests',
        suggestion: 'Please wait a moment before trying again',
        retryable: true,
    },
};

// Safe-specific errors
const SAFE_ERROR_MAP: Record<string, ErrorInfo> = {
    'Not enough signatures': {
        message: 'More signatures needed',
        suggestion: 'Wait for other owners to sign',
        retryable: false,
    },
    'account_not_found': {
        message: 'Safe wallet not activated',
        suggestion: 'Send MOVE to the safe address to activate it',
        retryable: false,
    },
    'E_LIMIT_EXCEEDED': {
        message: 'Daily spending limit exceeded',
        suggestion: 'Wait for the limit to reset tomorrow or request a higher limit',
        retryable: false,
    },
    'E_NOT_AUTHORIZED': {
        message: 'You are not authorized for this action',
        suggestion: 'Only safe owners can perform this action',
        retryable: false,
    },
    'E_CONTRACT_PAUSED': {
        message: 'Contract is temporarily paused',
        suggestion: 'Contact the safe admin to unpause',
        retryable: false,
    },
};

/**
 * Parse an error and return user-friendly info
 */
export function parseError(error: unknown): ErrorInfo {
    const errorStr = error instanceof Error ? error.message : String(error);
    const errorLower = errorStr.toLowerCase();

    // Check VM errors
    for (const [key, info] of Object.entries(VM_ERROR_MAP)) {
        if (errorStr.includes(key) || errorLower.includes(key.toLowerCase())) {
            return info;
        }
    }

    // Check network errors
    for (const [key, info] of Object.entries(NETWORK_ERROR_MAP)) {
        if (errorLower.includes(key.toLowerCase())) {
            return info;
        }
    }

    // Check safe-specific errors
    for (const [key, info] of Object.entries(SAFE_ERROR_MAP)) {
        if (errorStr.includes(key) || errorLower.includes(key.toLowerCase())) {
            return info;
        }
    }

    // Default fallback
    return {
        message: 'An unexpected error occurred',
        suggestion: 'Please try again or contact support if the problem persists',
        retryable: true,
    };
}

/**
 * Format error for display
 */
export function formatError(error: unknown): string {
    const info = parseError(error);
    return info.suggestion ? `${info.message}. ${info.suggestion}` : info.message;
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: unknown): boolean {
    return parseError(error).retryable;
}
