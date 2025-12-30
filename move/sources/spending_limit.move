module movesafe::spending_limit {
    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    const SECONDS_PER_DAY: u64 = 86400;
    const TIMELOCK_DELAY: u64 = 86400; // 24 hours for high-value limit changes
    const HIGH_VALUE_THRESHOLD: u64 = 100000000; // 1 MOVE = 100M octas

    // Error codes
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_LIMIT_EXCEEDED: u64 = 2;
    const E_ALLOWANCE_NOT_FOUND: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;
    const E_CONTRACT_PAUSED: u64 = 5;
    const E_REENTRANCY_DETECTED: u64 = 6;
    const E_TIMELOCK_NOT_EXPIRED: u64 = 7;
    const E_NO_PENDING_CHANGE: u64 = 8;
    const E_ALREADY_PAUSED: u64 = 9;
    const E_NOT_PAUSED: u64 = 10;

    // ==================== Security Structs ====================

    /// Emergency pause state - allows admin to halt all operations
    struct PauseState has key {
        is_paused: bool,
        paused_by: address,
        paused_at: u64,
    }

    /// Reentrancy guard to prevent recursive calls
    struct ReentrancyGuard has key {
        locked: bool,
    }

    /// Pending limit change with timelock for high-value changes
    struct PendingLimitChange has key {
        changes: vector<PendingChange>,
    }

    struct PendingChange has store, drop, copy {
        beneficiary: address,
        new_limit: u64,
        execute_after: u64,
        requested_by: address,
    }

    // ==================== Existing Structs ====================

    struct Allowance has key {
        daily_limit: u64,
        current_spent: u64,
        last_reset_time: u64,
    }

    struct AllowanceStore has key {
        allowances: vector<AllowanceEntry>,
    }

    struct AllowanceEntry has store, drop, copy {
        beneficiary: address,
        daily_limit: u64,
        current_spent: u64,
        last_reset_time: u64,
    }

    // ==================== Pause Functions ====================

    /// Initialize pause state (must be called once by admin)
    public entry fun initialize_security(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        if (!exists<PauseState>(admin_addr)) {
            move_to(admin, PauseState {
                is_paused: false,
                paused_by: @0x0,
                paused_at: 0,
            });
        };
        
        if (!exists<ReentrancyGuard>(admin_addr)) {
            move_to(admin, ReentrancyGuard {
                locked: false,
            });
        };
        
        if (!exists<PendingLimitChange>(admin_addr)) {
            move_to(admin, PendingLimitChange {
                changes: vector::empty<PendingChange>(),
            });
        };
    }

    /// Emergency pause - halts all withdraw operations
    public entry fun pause(admin: &signer) acquires PauseState {
        let admin_addr = signer::address_of(admin);
        
        if (!exists<PauseState>(admin_addr)) {
            move_to(admin, PauseState {
                is_paused: true,
                paused_by: admin_addr,
                paused_at: timestamp::now_seconds(),
            });
        } else {
            let state = borrow_global_mut<PauseState>(admin_addr);
            assert!(!state.is_paused, error::invalid_state(E_ALREADY_PAUSED));
            state.is_paused = true;
            state.paused_by = admin_addr;
            state.paused_at = timestamp::now_seconds();
        };
    }

    /// Unpause - resumes normal operations
    public entry fun unpause(admin: &signer) acquires PauseState {
        let admin_addr = signer::address_of(admin);
        assert!(exists<PauseState>(admin_addr), error::not_found(E_NOT_AUTHORIZED));
        
        let state = borrow_global_mut<PauseState>(admin_addr);
        assert!(state.is_paused, error::invalid_state(E_NOT_PAUSED));
        state.is_paused = false;
    }

    /// Check if contract is paused
    fun assert_not_paused(safe_address: address) acquires PauseState {
        if (exists<PauseState>(safe_address)) {
            let state = borrow_global<PauseState>(safe_address);
            assert!(!state.is_paused, error::unavailable(E_CONTRACT_PAUSED));
        };
    }

    // ==================== Reentrancy Guard ====================

    fun acquire_lock(safe_address: address) acquires ReentrancyGuard {
        if (exists<ReentrancyGuard>(safe_address)) {
            let guard = borrow_global_mut<ReentrancyGuard>(safe_address);
            assert!(!guard.locked, error::invalid_state(E_REENTRANCY_DETECTED));
            guard.locked = true;
        };
    }

    fun release_lock(safe_address: address) acquires ReentrancyGuard {
        if (exists<ReentrancyGuard>(safe_address)) {
            let guard = borrow_global_mut<ReentrancyGuard>(safe_address);
            guard.locked = false;
        };
    }

    // ==================== Timelock Functions ====================

    /// Request a limit change with timelock (for high-value limits)
    public entry fun request_limit_change(
        admin: &signer,
        beneficiary: address,
        new_limit: u64
    ) acquires PendingLimitChange, PauseState {
        let admin_addr = signer::address_of(admin);
        assert_not_paused(admin_addr);
        assert!(new_limit > 0, error::invalid_argument(E_INVALID_AMOUNT));

        // If limit is below threshold, approve immediately (use regular approve_limit)
        if (new_limit < HIGH_VALUE_THRESHOLD) {
            // Small limits don't need timelock - caller should use approve_limit directly
            abort error::invalid_argument(E_INVALID_AMOUNT)
        };

        if (!exists<PendingLimitChange>(admin_addr)) {
            move_to(admin, PendingLimitChange {
                changes: vector::empty<PendingChange>(),
            });
        };

        let pending = borrow_global_mut<PendingLimitChange>(admin_addr);
        let execute_after = timestamp::now_seconds() + TIMELOCK_DELAY;

        // Remove any existing pending change for this beneficiary
        let (found, index) = find_pending_index(&pending.changes, beneficiary);
        if (found) {
            vector::remove(&mut pending.changes, index);
        };

        vector::push_back(&mut pending.changes, PendingChange {
            beneficiary,
            new_limit,
            execute_after,
            requested_by: admin_addr,
        });
    }

    /// Execute a pending limit change after timelock expires
    public entry fun execute_limit_change(
        admin: &signer,
        beneficiary: address
    ) acquires PendingLimitChange, AllowanceStore, PauseState {
        let admin_addr = signer::address_of(admin);
        assert_not_paused(admin_addr);
        
        assert!(exists<PendingLimitChange>(admin_addr), error::not_found(E_NO_PENDING_CHANGE));
        
        let pending = borrow_global_mut<PendingLimitChange>(admin_addr);
        let (found, index) = find_pending_index(&pending.changes, beneficiary);
        assert!(found, error::not_found(E_NO_PENDING_CHANGE));
        
        let change = vector::borrow(&pending.changes, index);
        let current_time = timestamp::now_seconds();
        assert!(current_time >= change.execute_after, error::invalid_state(E_TIMELOCK_NOT_EXPIRED));
        
        let new_limit = change.new_limit;
        vector::remove(&mut pending.changes, index);

        // Apply the limit change
        apply_limit_internal(admin, beneficiary, new_limit);
    }

    /// Cancel a pending limit change
    public entry fun cancel_limit_change(
        admin: &signer,
        beneficiary: address
    ) acquires PendingLimitChange {
        let admin_addr = signer::address_of(admin);
        assert!(exists<PendingLimitChange>(admin_addr), error::not_found(E_NO_PENDING_CHANGE));
        
        let pending = borrow_global_mut<PendingLimitChange>(admin_addr);
        let (found, index) = find_pending_index(&pending.changes, beneficiary);
        assert!(found, error::not_found(E_NO_PENDING_CHANGE));
        
        vector::remove(&mut pending.changes, index);
    }

    fun find_pending_index(changes: &vector<PendingChange>, beneficiary: address): (bool, u64) {
        let len = vector::length(changes);
        let i = 0;
        
        while (i < len) {
            let entry = vector::borrow(changes, i);
            if (entry.beneficiary == beneficiary) {
                return (true, i)
            };
            i = i + 1;
        };
        
        (false, 0)
    }

    // ==================== Main Functions (Updated) ====================

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        if (!exists<AllowanceStore>(admin_addr)) {
            move_to(admin, AllowanceStore {
                allowances: vector::empty<AllowanceEntry>(),
            });
        };
    }

    /// Internal function to apply limit (used by both approve_limit and execute_limit_change)
    fun apply_limit_internal(
        admin: &signer,
        beneficiary: address,
        daily_limit: u64
    ) acquires AllowanceStore {
        let admin_addr = signer::address_of(admin);

        if (!exists<AllowanceStore>(admin_addr)) {
            move_to(admin, AllowanceStore {
                allowances: vector::empty<AllowanceEntry>(),
            });
        };

        let store = borrow_global_mut<AllowanceStore>(admin_addr);
        let current_time = timestamp::now_seconds();
        
        let (found, index) = find_allowance_index(&store.allowances, beneficiary);
        
        if (found) {
            let allowance = vector::borrow_mut(&mut store.allowances, index);
            allowance.daily_limit = daily_limit;
            allowance.current_spent = 0;
            allowance.last_reset_time = current_time;
        } else {
            vector::push_back(&mut store.allowances, AllowanceEntry {
                beneficiary,
                daily_limit,
                current_spent: 0,
                last_reset_time: current_time,
            });
        };
    }

    /// Approve spending limit (for low-value limits, no timelock)
    public entry fun approve_limit(
        admin: &signer,
        beneficiary: address,
        daily_limit: u64
    ) acquires AllowanceStore, PauseState {
        let admin_addr = signer::address_of(admin);
        assert_not_paused(admin_addr);
        assert!(daily_limit > 0, error::invalid_argument(E_INVALID_AMOUNT));
        
        // High-value limits require timelock
        assert!(daily_limit < HIGH_VALUE_THRESHOLD, error::permission_denied(E_NOT_AUTHORIZED));

        apply_limit_internal(admin, beneficiary, daily_limit);
    }

    /// Withdraw with reentrancy protection and pause check
    public entry fun withdraw(
        beneficiary: &signer,
        safe_address: address,
        amount: u64
    ) acquires AllowanceStore, PauseState, ReentrancyGuard {
        // Security checks
        assert_not_paused(safe_address);
        acquire_lock(safe_address);
        
        let beneficiary_addr = signer::address_of(beneficiary);
        
        assert!(amount > 0, error::invalid_argument(E_INVALID_AMOUNT));
        assert!(exists<AllowanceStore>(safe_address), error::not_found(E_ALLOWANCE_NOT_FOUND));

        let store = borrow_global_mut<AllowanceStore>(safe_address);
        let (found, index) = find_allowance_index(&store.allowances, beneficiary_addr);
        
        assert!(found, error::permission_denied(E_NOT_AUTHORIZED));

        let allowance = vector::borrow_mut(&mut store.allowances, index);
        let current_time = timestamp::now_seconds();
        
        if (current_time - allowance.last_reset_time >= SECONDS_PER_DAY) {
            allowance.current_spent = 0;
            allowance.last_reset_time = current_time;
        };

        assert!(
            allowance.current_spent + amount <= allowance.daily_limit,
            error::permission_denied(E_LIMIT_EXCEEDED)
        );

        allowance.current_spent = allowance.current_spent + amount;

        // Transfer (potential external call - hence reentrancy guard)
        coin::transfer<AptosCoin>(beneficiary, beneficiary_addr, amount);
        
        // Release lock after transfer
        release_lock(safe_address);
    }

    fun find_allowance_index(allowances: &vector<AllowanceEntry>, beneficiary: address): (bool, u64) {
        let len = vector::length(allowances);
        let i = 0;
        
        while (i < len) {
            let entry = vector::borrow(allowances, i);
            if (entry.beneficiary == beneficiary) {
                return (true, i)
            };
            i = i + 1;
        };
        
        (false, 0)
    }

    // ==================== View Functions ====================

    #[view]
    public fun is_paused(safe_address: address): bool acquires PauseState {
        if (!exists<PauseState>(safe_address)) {
            return false
        };
        let state = borrow_global<PauseState>(safe_address);
        state.is_paused
    }

    #[view]
    public fun get_pending_change(safe_address: address, beneficiary: address): (u64, u64) acquires PendingLimitChange {
        if (!exists<PendingLimitChange>(safe_address)) {
            return (0, 0)
        };
        
        let pending = borrow_global<PendingLimitChange>(safe_address);
        let (found, index) = find_pending_index(&pending.changes, beneficiary);
        
        if (!found) {
            return (0, 0)
        };
        
        let change = vector::borrow(&pending.changes, index);
        (change.new_limit, change.execute_after)
    }

    #[view]
    public fun get_allowance(safe_address: address, beneficiary: address): (u64, u64, u64) acquires AllowanceStore {
        assert!(exists<AllowanceStore>(safe_address), error::not_found(E_ALLOWANCE_NOT_FOUND));
        
        let store = borrow_global<AllowanceStore>(safe_address);
        let (found, index) = find_allowance_index(&store.allowances, beneficiary);
        
        assert!(found, error::not_found(E_ALLOWANCE_NOT_FOUND));
        
        let allowance = vector::borrow(&store.allowances, index);
        let current_time = timestamp::now_seconds();
        
        let current_spent = if (current_time - allowance.last_reset_time >= SECONDS_PER_DAY) {
            0
        } else {
            allowance.current_spent
        };
        
        (allowance.daily_limit, current_spent, allowance.last_reset_time)
    }

    #[view]
    public fun get_all_allowances(safe_address: address): vector<AllowanceEntry> acquires AllowanceStore {
        if (!exists<AllowanceStore>(safe_address)) {
            return vector::empty<AllowanceEntry>()
        };
        
        let store = borrow_global<AllowanceStore>(safe_address);
        *&store.allowances
    }

    #[view]
    public fun get_remaining_limit(safe_address: address, beneficiary: address): u64 acquires AllowanceStore {
        let (daily_limit, current_spent, last_reset_time) = get_allowance(safe_address, beneficiary);
        let current_time = timestamp::now_seconds();
        
        let spent = if (current_time - last_reset_time >= SECONDS_PER_DAY) {
            0
        } else {
            current_spent
        };
        
        if (daily_limit >= spent) {
            daily_limit - spent
        } else {
            0
        }
    }
}
