// This module manages storage quotas for users, allowing them to purchase and consume storage space.
module walgit::storage {
    // Import necessary modules and types
    use sui::coin::{Self as coin, Coin}; // Using 'coin' alias for coin functions
    use sui::sui::SUI;                   // The native SUI coin type
    use sui::object::new;                // For creating new objects. UID is implicitly available.
    use sui::tx_context::sender;         // For getting the transaction sender. TxContext is implicitly available.
    use sui::transfer::{transfer, public_transfer}; // For transferring objects
    use sui::event;                      // For emitting events

    // --- Error Codes ---

    // Error when a user attempts an action without sufficient SUI funds.
    const EInsufficientFunds: u64 = 1;
    // Error when a user attempts an action requiring more storage than they have available.
    const EInsufficientStorage: u64 = 2;

    // --- Structs ---

    // Represents a user's storage quota, tracking available and used bytes.
    // This object is owned by the user.
    public struct StorageQuota has key, store {
        id: UID,
        owner: address,
        bytes_available: u64, // Storage space the user has purchased (in bytes)
        bytes_used: u64       // Storage space the user has consumed (in bytes)
    }

    // --- Events ---

    // Emitted when a user successfully purchases storage.
    public struct StoragePurchased has copy, drop {
        buyer: address,       // The address that purchased the storage
        amount_paid: u64,     // The amount of SUI paid
        bytes_added: u64      // The amount of storage added (in bytes)
    }

    // Emitted when a user consumes storage space.
    public struct StorageUsed has copy, drop {
        user: address,          // The address that consumed the storage
        bytes_used: u64,        // The amount of storage consumed in this action (in bytes)
        bytes_remaining: u64    // The user's remaining available storage (in bytes)
    }

    // --- Entry Functions ---

    // Creates an initial, empty StorageQuota object for the transaction sender.
    public entry fun create_storage_quota(ctx: &mut TxContext) {
        let owner = sender(ctx); // Get the sender of the transaction
        let storage = StorageQuota {
            id: new(ctx),           // Create a new UID for the object
            owner,
            bytes_available: 0,     // Start with 0 available bytes
            bytes_used: 0           // Start with 0 used bytes
        };

        // Transfer the newly created StorageQuota object to its owner.
        transfer(storage, owner);
    }

    // Allows a user to purchase additional storage bytes using SUI.
    public entry fun purchase_storage(
        storage: &mut StorageQuota, // The user's StorageQuota object (mutable reference)
        payment: &mut Coin<SUI>,    // The SUI coin object used for payment (mutable reference)
        bytes_to_purchase: u64, // The amount of storage to buy (in bytes)
        ctx: &mut TxContext
    ) {
        let owner = sender(ctx); // Get the transaction sender
        // Ensure the transaction sender is the owner of the StorageQuota object.
        assert!(storage.owner == owner, EInsufficientFunds); // Re-using EInsufficientFunds for ownership check, consider a dedicated error code.

        // --- Calculate Storage Cost ---
        // Define the cost rate: 1 SUI per 1 MiB (1024 * 1024 bytes).
        // This should ideally be a configurable constant or fetched from another object.
        let cost_per_mib_sui = 1;
        let bytes_per_mib = 1024 * 1024;
        // Calculate cost using ceiling division to ensure partial MiBs are paid for.
        // Declare 'cost' as mutable because it might be reassigned below.
        let mut cost = (bytes_to_purchase + bytes_per_mib - 1) / bytes_per_mib * cost_per_mib_sui;
        // Ensure a minimum cost of 1 SUI if any bytes are purchased, preventing free storage.
        if (cost == 0 && bytes_to_purchase > 0) { cost = 1 };

        // Check if the payment coin has sufficient value.
        assert!(coin::value(payment) >= cost, EInsufficientFunds);

        // --- Process Payment ---
        // Split the required cost from the payment coin.
        let paid_coin = coin::split(payment, cost, ctx);
        // Transfer the paid amount to the project's treasury address (@walgit).
        public_transfer(paid_coin, @walgit);

        // --- Update Storage Quota ---
        // Add the purchased bytes to the user's available storage.
        storage.bytes_available = storage.bytes_available + bytes_to_purchase;

        // --- Emit Event ---
        // Notify listeners that storage was purchased.
        event::emit(StoragePurchased {
            buyer: owner,
            amount_paid: cost,
            bytes_added: bytes_to_purchase
        });
    }

    // --- Public Functions ---

    // Consumes a specified amount of storage bytes from the user's quota.
    // Aborts the transaction if insufficient storage is available.
    public fun consume_storage(
        storage: &mut StorageQuota, // The user's StorageQuota object (mutable reference)
        bytes_needed: u64           // The amount of storage required for the operation (in bytes)
    ) {
        // Ensure the user has enough available bytes.
        assert!(storage.bytes_available >= bytes_needed, EInsufficientStorage);

        // Decrease available bytes and increase used bytes.
        storage.bytes_available = storage.bytes_available - bytes_needed;
        storage.bytes_used = storage.bytes_used + bytes_needed;

        // Emit an event indicating storage was used.
        event::emit(StorageUsed {
            user: storage.owner,
            bytes_used: bytes_needed,
            bytes_remaining: storage.bytes_available
        });
    }

    // --- Getter Functions ---

    /// address that owns this StorageQuota
    public fun owner(s: &StorageQuota): address {
        s.owner
    }

    // Returns the number of bytes currently available in the storage quota.
    public fun bytes_available(storage: &StorageQuota): u64 {
        storage.bytes_available
    }

    // Returns the number of bytes currently used in the storage quota.
    public fun bytes_used(storage: &StorageQuota): u64 {
        storage.bytes_used
    }
}
