module walgit::enhanced_storage {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::event;
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    use walgit::storage;
    use walgit::git_repository::{Self, Repository};

    /// Error codes
    const EInsufficientBalance: u64 = 1;
    const EInvalidAllocationSize: u64 = 2;
    const EAllocationExpired: u64 = 3;
    const EInvalidTier: u64 = 4;
    const EAllocationActive: u64 = 5;
    const EInvalidRefundAmount: u64 = 6;
    const EInsufficientStorage: u64 = 7;
    const ERepositoryNotFound: u64 = 8;
    const ENotAuthorized: u64 = 9;

    /// Storage tier constants
    const TIER_BASIC: u8 = 0;
    const TIER_STANDARD: u8 = 1;
    const TIER_PREMIUM: u8 = 2;
    const TIER_CUSTOM: u8 = 3;

    /// Default storage allocation sizes in bytes
    const BASIC_ALLOCATION: u64 = 104857600;      // 100 MB
    const STANDARD_ALLOCATION: u64 = 1073741824;  // 1 GB
    const PREMIUM_ALLOCATION: u64 = 10737418240;  // 10 GB
    
    /// Default storage duration in seconds
    const BASIC_DURATION: u64 = 2592000;    // 30 days
    const STANDARD_DURATION: u64 = 15552000; // 180 days
    const PREMIUM_DURATION: u64 = 31536000;  // 365 days
    
    /// Base cost in SUI (1 SUI = 10^9 MIST)
    const BASIC_COST: u64 = 1000000000;    // 1 SUI
    const STANDARD_COST: u64 = 5000000000;  // 5 SUI
    const PREMIUM_COST: u64 = 20000000000;  // 20 SUI
    
    /// Cost per GB for custom tier (2 SUI per GB)
    const CUSTOM_COST_PER_GB: u64 = 2000000000;

    /// StorageAllocation represents the storage allocation for a repository
    struct StorageAllocation has key, store {
        id: UID,
        repository_id: ID,
        owner: address,
        size_bytes: u64,
        used_bytes: u64,
        tier: u8,
        cost: u64,
        created_at: u64,
        expires_at: u64,
        auto_renew: bool,
    }
    
    /// TreasuryCapability allows management of the treasury
    struct TreasuryCapability has key {
        id: UID,
    }
    
    /// Treasury holds the funds for the storage allocations
    struct Treasury has key {
        id: UID,
        balance: Balance<SUI>,
        total_allocations: u64,
        total_bytes_allocated: u64,
    }
    
    /// StorageUsage tracks storage usage per repository
    struct StorageUsage has key {
        id: UID,
        allocations: Table<ID, ID>, // Repository ID -> StorageAllocation ID
    }
    
    /// Events
    struct AllocationCreated has copy, drop {
        allocation_id: ID,
        repository_id: ID,
        owner: address,
        size_bytes: u64,
        tier: u8,
        cost: u64,
        expires_at: u64,
    }
    
    struct AllocationRenewed has copy, drop {
        allocation_id: ID,
        repository_id: ID,
        owner: address,
        expires_at: u64,
        cost: u64,
    }
    
    struct AllocationUpgraded has copy, drop {
        allocation_id: ID,
        repository_id: ID,
        old_tier: u8,
        new_tier: u8,
        old_size: u64,
        new_size: u64,
        cost_difference: u64,
    }
    
    struct StorageUsageUpdated has copy, drop {
        repository_id: ID,
        old_usage: u64,
        new_usage: u64,
        allocation_id: ID,
    }
    
    /// Initializes the storage module
    fun init(ctx: &mut TxContext) {
        // Create the treasury capability
        let treasury_cap = TreasuryCapability {
            id: object::new(ctx),
        };
        
        // Create the treasury
        let treasury = Treasury {
            id: object::new(ctx),
            balance: balance::zero(),
            total_allocations: 0,
            total_bytes_allocated: 0,
        };
        
        // Create storage usage tracker
        let storage_usage = StorageUsage {
            id: object::new(ctx),
            allocations: table::new(ctx),
        };
        
        // Transfer objects to appropriate places
        transfer::transfer(treasury_cap, tx_context::sender(ctx));
        transfer::share_object(treasury);
        transfer::share_object(storage_usage);
    }
    
    /// Creates a new storage allocation for a repository with default tier settings
    public fun create_allocation(
        repository: &Repository,
        tier: u8,
        payment: Coin<SUI>,
        auto_renew: bool,
        ctx: &mut TxContext
    ): ID {
        let repository_id = git_repository::id(repository);
        let repository_owner = git_repository::owner(repository);
        
        // Verify caller is the repository owner
        assert!(repository_owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Calculate allocation parameters based on tier
        let (size_bytes, duration, cost) = if (tier == TIER_BASIC) {
            (BASIC_ALLOCATION, BASIC_DURATION, BASIC_COST)
        } else if (tier == TIER_STANDARD) {
            (STANDARD_ALLOCATION, STANDARD_DURATION, STANDARD_COST)
        } else if (tier == TIER_PREMIUM) {
            (PREMIUM_ALLOCATION, PREMIUM_DURATION, PREMIUM_COST)
        } else {
            abort EInvalidTier
        };
        
        // Verify payment is sufficient
        assert!(coin::value(&payment) >= cost, EInsufficientBalance);
        
        // Create allocation
        let allocation = StorageAllocation {
            id: object::new(ctx),
            repository_id,
            owner: repository_owner,
            size_bytes,
            used_bytes: 0,
            tier,
            cost,
            created_at: tx_context::epoch(ctx),
            expires_at: tx_context::epoch(ctx) + duration,
            auto_renew,
        };
        
        let allocation_id = object::id(&allocation);
        
        // Get the treasury and storage usage objects
        let treasury = storage::borrow_treasury_mut();
        let storage_usage = storage::borrow_storage_usage_mut();
        
        // Update treasury
        let payment_value = coin::value(&payment);
        let treasury_balance = &mut treasury.balance;
        balance::join(treasury_balance, coin::into_balance(payment));
        
        // Update allocation count and total bytes
        treasury.total_allocations = treasury.total_allocations + 1;
        treasury.total_bytes_allocated = treasury.total_bytes_allocated + size_bytes;
        
        // Register allocation in storage usage
        table::add(&mut storage_usage.allocations, repository_id, allocation_id);
        
        // Emit event
        event::emit(AllocationCreated {
            allocation_id,
            repository_id,
            owner: repository_owner,
            size_bytes,
            tier,
            cost,
            expires_at: tx_context::epoch(ctx) + duration,
        });
        
        // Return the allocation for shared access
        transfer::share_object(allocation);
        
        allocation_id
    }
    
    /// Creates a custom storage allocation for a repository
    public fun create_custom_allocation(
        repository: &Repository,
        size_gb: u64,
        duration_days: u64,
        payment: Coin<SUI>,
        auto_renew: bool,
        ctx: &mut TxContext
    ): ID {
        let repository_id = git_repository::id(repository);
        let repository_owner = git_repository::owner(repository);
        
        // Verify caller is the repository owner
        assert!(repository_owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Calculate allocation parameters
        let size_bytes = size_gb * 1073741824;  // Convert GB to bytes
        let duration = duration_days * 86400;   // Convert days to seconds
        
        // Calculate cost based on size and duration
        let base_cost = size_gb * CUSTOM_COST_PER_GB;
        let duration_multiplier = (duration_days as u64) / 30;  // Cost per month
        let cost = base_cost * duration_multiplier;
        
        // Verify payment is sufficient
        assert!(coin::value(&payment) >= cost, EInsufficientBalance);
        
        // Create allocation
        let allocation = StorageAllocation {
            id: object::new(ctx),
            repository_id,
            owner: repository_owner,
            size_bytes,
            used_bytes: 0,
            tier: TIER_CUSTOM,
            cost,
            created_at: tx_context::epoch(ctx),
            expires_at: tx_context::epoch(ctx) + duration,
            auto_renew,
        };
        
        let allocation_id = object::id(&allocation);
        
        // Get the treasury and storage usage objects
        let treasury = storage::borrow_treasury_mut();
        let storage_usage = storage::borrow_storage_usage_mut();
        
        // Update treasury
        let payment_value = coin::value(&payment);
        let treasury_balance = &mut treasury.balance;
        balance::join(treasury_balance, coin::into_balance(payment));
        
        // Update allocation count and total bytes
        treasury.total_allocations = treasury.total_allocations + 1;
        treasury.total_bytes_allocated = treasury.total_bytes_allocated + size_bytes;
        
        // Register allocation in storage usage
        table::add(&mut storage_usage.allocations, repository_id, allocation_id);
        
        // Emit event
        event::emit(AllocationCreated {
            allocation_id,
            repository_id,
            owner: repository_owner,
            size_bytes,
            tier: TIER_CUSTOM,
            cost,
            expires_at: tx_context::epoch(ctx) + duration,
        });
        
        // Return the allocation for shared access
        transfer::share_object(allocation);
        
        allocation_id
    }
    
    /// Renews a storage allocation
    public fun renew_allocation(
        allocation: &mut StorageAllocation,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the allocation owner
        assert!(allocation.owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Calculate renewal parameters based on tier
        let (duration, cost) = if (allocation.tier == TIER_BASIC) {
            (BASIC_DURATION, BASIC_COST)
        } else if (allocation.tier == TIER_STANDARD) {
            (STANDARD_DURATION, STANDARD_COST)
        } else if (allocation.tier == TIER_PREMIUM) {
            (PREMIUM_DURATION, PREMIUM_COST)
        } else {
            // For custom tier, calculate based on existing parameters
            let size_gb = allocation.size_bytes / 1073741824;
            let days_remaining = (allocation.expires_at - tx_context::epoch(ctx)) / 86400;
            let additional_days = 30; // Renew for 30 days
            
            let base_cost = size_gb * CUSTOM_COST_PER_GB;
            let cost = base_cost * (additional_days / 30);
            (additional_days * 86400, cost)
        };
        
        // Verify payment is sufficient
        assert!(coin::value(&payment) >= cost, EInsufficientBalance);
        
        // Get the treasury
        let treasury = storage::borrow_treasury_mut();
        
        // Update treasury
        let treasury_balance = &mut treasury.balance;
        balance::join(treasury_balance, coin::into_balance(payment));
        
        // Update allocation expiration
        allocation.expires_at = allocation.expires_at + duration;
        
        // Emit event
        event::emit(AllocationRenewed {
            allocation_id: object::id(allocation),
            repository_id: allocation.repository_id,
            owner: allocation.owner,
            expires_at: allocation.expires_at,
            cost,
        });
    }
    
    /// Upgrades a storage allocation to a higher tier
    public fun upgrade_allocation(
        allocation: &mut StorageAllocation,
        new_tier: u8,
        payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // Verify caller is the allocation owner
        assert!(allocation.owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Verify new tier is valid and higher than current
        assert!(new_tier <= TIER_PREMIUM, EInvalidTier);
        assert!(new_tier > allocation.tier, EInvalidTier);
        
        // Calculate new allocation parameters
        let (new_size, new_duration, new_base_cost) = if (new_tier == TIER_STANDARD) {
            (STANDARD_ALLOCATION, STANDARD_DURATION, STANDARD_COST)
        } else if (new_tier == TIER_PREMIUM) {
            (PREMIUM_ALLOCATION, PREMIUM_DURATION, PREMIUM_COST)
        } else {
            abort EInvalidTier
        };
        
        // Calculate prorated cost for remaining time
        let current_epoch = tx_context::epoch(ctx);
        let time_remaining = if (allocation.expires_at > current_epoch) {
            allocation.expires_at - current_epoch
        } else {
            0
        };
        
        let old_tier_cost_per_second = if (allocation.tier == TIER_BASIC) {
            (BASIC_COST as u128) / (BASIC_DURATION as u128)
        } else if (allocation.tier == TIER_STANDARD) {
            (STANDARD_COST as u128) / (STANDARD_DURATION as u128)
        } else {
            (CUSTOM_COST_PER_GB as u128) * (allocation.size_bytes / 1073741824 as u128) / 2592000
        };
        
        let new_tier_cost_per_second = if (new_tier == TIER_STANDARD) {
            (STANDARD_COST as u128) / (STANDARD_DURATION as u128)
        } else {
            (PREMIUM_COST as u128) / (PREMIUM_DURATION as u128)
        };
        
        // Credit for unused time on old tier
        let credit = (old_tier_cost_per_second * (time_remaining as u128) as u64);
        
        // Cost for new tier
        let new_cost = new_base_cost;
        
        // Calculate final cost (may be 0 if credit exceeds new cost)
        let final_cost = if (new_cost > credit) { 
            new_cost - credit 
        } else { 
            0 
        };
        
        // Verify payment is sufficient
        assert!(coin::value(&payment) >= final_cost, EInsufficientBalance);
        
        // Get the treasury and storage usage objects
        let treasury = storage::borrow_treasury_mut();
        
        // Update treasury
        let treasury_balance = &mut treasury.balance;
        balance::join(treasury_balance, coin::into_balance(payment));
        
        // Update total bytes
        let old_size = allocation.size_bytes;
        treasury.total_bytes_allocated = treasury.total_bytes_allocated - old_size + new_size;
        
        // Update allocation
        let old_tier = allocation.tier;
        allocation.tier = new_tier;
        allocation.size_bytes = new_size;
        allocation.expires_at = current_epoch + new_duration;
        
        // Emit event
        event::emit(AllocationUpgraded {
            allocation_id: object::id(allocation),
            repository_id: allocation.repository_id,
            old_tier,
            new_tier,
            old_size,
            new_size,
            cost_difference: final_cost,
        });
    }
    
    /// Updates the storage usage for a repository
    public fun update_storage_usage(
        repository_id: ID,
        new_usage: u64,
        ctx: &mut TxContext
    ) {
        // Get the storage usage object
        let storage_usage = storage::borrow_storage_usage_mut();
        
        // Verify repository has an allocation
        assert!(table::contains(&storage_usage.allocations, repository_id), ERepositoryNotFound);
        
        // Get the allocation
        let allocation_id = *table::borrow(&storage_usage.allocations, repository_id);
        let allocation = storage::borrow_allocation_mut(allocation_id);
        
        // Verify allocation is not expired
        assert!(allocation.expires_at >= tx_context::epoch(ctx), EAllocationExpired);
        
        // Verify new usage is within allocation limit
        assert!(new_usage <= allocation.size_bytes, EInsufficientStorage);
        
        // Update usage
        let old_usage = allocation.used_bytes;
        allocation.used_bytes = new_usage;
        
        // Emit event
        event::emit(StorageUsageUpdated {
            repository_id,
            old_usage,
            new_usage,
            allocation_id,
        });
    }
    
    /// Checks if an allocation is active and has sufficient remaining space
    public fun check_allocation_space(
        repository_id: ID,
        required_space: u64,
        ctx: &mut TxContext
    ): bool {
        // Get the storage usage object
        let storage_usage = storage::borrow_storage_usage();
        
        // Check if repository has an allocation
        if (!table::contains(&storage_usage.allocations, repository_id)) {
            return false
        };
        
        // Get the allocation
        let allocation_id = *table::borrow(&storage_usage.allocations, repository_id);
        let allocation = storage::borrow_allocation(allocation_id);
        
        // Check if allocation is expired
        if (allocation.expires_at < tx_context::epoch(ctx)) {
            return false
        };
        
        // Check if allocation has sufficient space
        let available_space = allocation.size_bytes - allocation.used_bytes;
        available_space >= required_space
    }
    
    /// Public getters for allocation information
    public fun allocation_repository_id(allocation: &StorageAllocation): ID { allocation.repository_id }
    public fun allocation_owner(allocation: &StorageAllocation): address { allocation.owner }
    public fun allocation_size_bytes(allocation: &StorageAllocation): u64 { allocation.size_bytes }
    public fun allocation_used_bytes(allocation: &StorageAllocation): u64 { allocation.used_bytes }
    public fun allocation_tier(allocation: &StorageAllocation): u8 { allocation.tier }
    public fun allocation_cost(allocation: &StorageAllocation): u64 { allocation.cost }
    public fun allocation_created_at(allocation: &StorageAllocation): u64 { allocation.created_at }
    public fun allocation_expires_at(allocation: &StorageAllocation): u64 { allocation.expires_at }
    public fun allocation_auto_renew(allocation: &StorageAllocation): bool { allocation.auto_renew }
    
    /// Gets allocation utilization as a percentage
    public fun allocation_utilization(allocation: &StorageAllocation): u64 {
        if (allocation.size_bytes == 0) {
            return 0
        };
        
        (allocation.used_bytes * 100) / allocation.size_bytes
    }
    
    /// Gets remaining time until allocation expires
    public fun allocation_remaining_time(allocation: &StorageAllocation, ctx: &TxContext): u64 {
        let current_epoch = tx_context::epoch(ctx);
        
        if (allocation.expires_at <= current_epoch) {
            return 0
        };
        
        allocation.expires_at - current_epoch
    }
}