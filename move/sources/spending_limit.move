module movesafe::spending_limit {
    use std::signer;
    use std::error;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::timestamp;
    use aptos_framework::account;

    const SECONDS_PER_DAY: u64 = 86400;

    const E_NOT_AUTHORIZED: u64 = 1;
    const E_LIMIT_EXCEEDED: u64 = 2;
    const E_ALLOWANCE_NOT_FOUND: u64 = 3;
    const E_INVALID_AMOUNT: u64 = 4;

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

    public entry fun initialize(admin: &signer) {
        let admin_addr = signer::address_of(admin);
        
        if (!exists<AllowanceStore>(admin_addr)) {
            move_to(admin, AllowanceStore {
                allowances: vector::empty<AllowanceEntry>(),
            });
        };
    }

    public entry fun approve_limit(
        admin: &signer,
        beneficiary: address,
        daily_limit: u64
    ) acquires AllowanceStore {
        let admin_addr = signer::address_of(admin);
        
        assert!(daily_limit > 0, error::invalid_argument(E_INVALID_AMOUNT));

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

    public entry fun withdraw(
        beneficiary: &signer,
        safe_address: address,
        amount: u64
    ) acquires AllowanceStore {
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

        coin::transfer<AptosCoin>(beneficiary, beneficiary_addr, amount);
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
