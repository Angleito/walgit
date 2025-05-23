// This module manages storage quotas for users, allowing them to purchase and consume storage space.
#[allow(duplicate_alias, unused_use)]
module walgit::storage {
    // Import necessary modules and types
    use sui::coin::{Self as coin, Coin}; // Using 'coin' alias for coin functions
    use sui::sui::SUI;                   // The native SUI coin type
    use sui::object::{Self, UID, ID};    // Import object module and UID type
    use sui::tx_context::sender;         // Import sender function
    use sui::tx_context;                 // For TxContext type
    use sui::transfer::{transfer, public_transfer}; // For transferring objects
    use sui::event;                      // For emitting events
    use std::option::{Self, Option};
    
    // Import our new phase 1 modules
    use walgit::compression::{Self, CompressedData};
    use walgit::delta_compression::{Self, DeltaObject};
    use walgit::pack_files::{Self, PackFile, PackIndex};

    // --- Error Codes ---

    // Error when a user attempts an action without sufficient SUI funds.
    const EInsufficientFunds: u64 = 1;
    // Error when a user attempts to consume more storage than available
    const EInsufficientStorage: u64 = 2;
    // Error when compression algorithm is unsupported
    const EUnsupportedCompression: u64 = 3;
    // Error when storage tier is invalid
    const EInvalidStorageTier: u64 = 4;
    // Error when delta chain is too deep
    const EMaxDeltaDepthExceeded: u64 = 5;
    
    // --- Constants ---
    
    // Storage tiers
    const TIER_INLINE: u8 = 0;    // Small objects stored inline
    const TIER_CHUNKED: u8 = 1;   // Medium objects stored in chunks
    const TIER_WALRUS: u8 = 2;    // Large objects stored in Walrus
    const TIER_DELTA: u8 = 3;     // Delta-compressed objects
    const TIER_PACKED: u8 = 4;    // Objects in pack files
    
    // Size thresholds
    const INLINE_THRESHOLD: u64 = 1024;           // 1 KB
    const CHUNK_THRESHOLD: u64 = 10240;           // 10 KB  
    const DELTA_THRESHOLD: u64 = 51200;           // 50 KB
    const PACK_THRESHOLD: u64 = 1048576;          // 1 MB
    
    // Compression settings
    const DEFAULT_COMPRESSION_LEVEL: u8 = 6;

    // --- Structs ---

    // Represents a user's storage quota, tracking available and used bytes.
    // This object is owned by the user.
    public struct StorageQuota has key, store {
        id: UID,
        owner: address,
        bytes_available: u64, // Storage space the user has purchased (in bytes)
        bytes_used: u64       // Storage space the user has consumed (in bytes)
    }
    
    // Optimized storage reference
    public struct OptimizedStorageRef has store, drop {
        tier: u8,               // Storage tier (inline, chunked, walrus, delta, packed)
        compressed: bool,       // Whether the data is compressed
        compression_algo: u8,   // Compression algorithm used
        original_size: u64,     // Original size before compression/delta
        stored_size: u64,       // Actual size stored
        object_id: Option<ID>,  // Reference to stored object (for chunked/walrus/delta/packed)
        inline_data: Option<vector<u8>>, // Inline data for small objects
        delta_base: Option<ID>, // Base object for delta compression
        pack_file_id: Option<ID>, // Pack file containing this object
        hash: vector<u8>        // SHA-1 hash of the original content
    }
    
    // Storage statistics
    public struct StorageStats has store, drop {
        total_objects: u64,
        inline_objects: u64,
        chunked_objects: u64,
        walrus_objects: u64,
        delta_objects: u64,
        packed_objects: u64,
        bytes_saved_compression: u64,
        bytes_saved_delta: u64,
        compression_ratio: u64
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
            id: object::new(ctx),           // Create a new UID for the object using object::new
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
    // Aborts if insufficient storage is available.
    public fun consume_storage(
        storage: &mut StorageQuota, // The user's StorageQuota object (mutable reference)
        bytes_needed: u64           // The amount of storage required for the operation (in bytes)
    ) {
        // Check if the user has enough available bytes
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
    
    // Creates a test storage quota with a specific amount of bytes
    // This is primarily used for testing and development purposes
    public fun create_test_quota(bytes: u64, owner: address, ctx: &mut tx_context::TxContext): StorageQuota {
        StorageQuota {
            id: object::new(ctx),
            owner,
            bytes_available: bytes,
            bytes_used: 0
        }
    }
    
    // --- Optimized Storage Functions ---
    
    /// Store data optimally based on size and content
    public fun store_optimized(
        data: &vector<u8>,
        quota: &mut StorageQuota,
        enable_delta: bool,
        base_object: Option<ID>,
        ctx: &mut tx_context::TxContext
    ): OptimizedStorageRef {
        let data_size = std::vector::length(data);
        let storage_tier = determine_storage_tier(data_size);
        
        // Try compression first for medium to large objects
        let compressed_opt = if (data_size > INLINE_THRESHOLD) {
            let compressed = compression::compress(
                data,
                compression::choose_algorithm(data, false),
                DEFAULT_COMPRESSION_LEVEL
            );
            
            if (compression::should_compress(data_size, compressed.compressed_size, 90)) {
                option::some(compressed)
            } else {
                option::none()
            }
        } else {
            option::none()
        };
        
        // Calculate hash of original data
        let hash = calculate_hash(data);
        
        // Store based on tier
        if (storage_tier == TIER_INLINE) {
            // Small data - store inline
            let stored_size = data_size;
            consume_storage(quota, stored_size);
            
            OptimizedStorageRef {
                tier: TIER_INLINE,
                compressed: false,
                compression_algo: 0,
                original_size: data_size,
                stored_size,
                object_id: option::none(),
                inline_data: option::some(*data),
                delta_base: option::none(),
                pack_file_id: option::none(),
                hash
            }
        } else if (enable_delta && option::is_some(&base_object)) {
            // Try delta compression if enabled and base provided
            let mock_base = std::vector::empty<u8>(); // Mock base for now
            let delta_opt = delta_compression::try_create_delta(
                &mock_base,
                data,
                *option::borrow(&base_object),
                std::string::utf8(b"target_hash"),
                0,
                ctx
            );
            
            if (option::is_some(&delta_opt)) {
                let delta = option::extract(&mut delta_opt);
                let stored_size = delta_compression::delta_compressed_size(&delta);
                consume_storage(quota, stored_size);
                
                // Create delta object (mock for now)
                let delta_id = object::get_id(&delta);
                
                OptimizedStorageRef {
                    tier: TIER_DELTA,
                    compressed: true,
                    compression_algo: 0,
                    original_size: data_size,
                    stored_size,
                    object_id: option::some(delta_id),
                    inline_data: option::none(),
                    delta_base: base_object,
                    pack_file_id: option::none(),
                    hash
                }
            } else {
                // Delta didn't save space, fall back to regular compression
                store_compressed_or_raw(data, compressed_opt, quota, hash, storage_tier, ctx)
            }
        } else {
            // No delta, use compression or raw
            store_compressed_or_raw(data, compressed_opt, quota, hash, storage_tier, ctx)
        }
    }
    
    /// Store with compression or raw
    fun store_compressed_or_raw(
        data: &vector<u8>,
        compressed_opt: Option<CompressedData>,
        quota: &mut StorageQuota,
        hash: vector<u8>,
        storage_tier: u8,
        ctx: &mut tx_context::TxContext
    ): OptimizedStorageRef {
        if (option::is_some(&compressed_opt)) {
            let compressed = option::borrow(&compressed_opt);
            let stored_size = compressed.compressed_size;
            consume_storage(quota, stored_size);
            
            // Create mock object ID
            let obj_id = object::id_from_bytes(&hash);
            
            OptimizedStorageRef {
                tier: storage_tier,
                compressed: true,
                compression_algo: compressed.algorithm,
                original_size: compressed.uncompressed_size,
                stored_size,
                object_id: option::some(obj_id),
                inline_data: option::none(),
                delta_base: option::none(),
                pack_file_id: option::none(),
                hash
            }
        } else {
            let data_size = std::vector::length(data);
            consume_storage(quota, data_size);
            
            // Create mock object ID
            let obj_id = object::id_from_bytes(&hash);
            
            OptimizedStorageRef {
                tier: storage_tier,
                compressed: false,
                compression_algo: 0,
                original_size: data_size,
                stored_size: data_size,
                object_id: option::some(obj_id),
                inline_data: option::none(),
                delta_base: option::none(),
                pack_file_id: option::none(),
                hash
            }
        }
    }
    
    /// Determine storage tier based on size
    public fun determine_storage_tier(size: u64): u8 {
        if (size <= INLINE_THRESHOLD) {
            TIER_INLINE
        } else if (size <= CHUNK_THRESHOLD) {
            TIER_CHUNKED
        } else if (size <= DELTA_THRESHOLD) {
            TIER_WALRUS
        } else if (size <= PACK_THRESHOLD) {
            TIER_DELTA
        } else {
            TIER_PACKED
        }
    }
    
    /// Calculate hash of data (mock implementation)
    fun calculate_hash(data: &vector<u8>): vector<u8> {
        let hash = std::vector::empty<u8>();
        let i = 0;
        while (i < 20) { // SHA-1 is 20 bytes
            std::vector::push_back(&mut hash, ((i + 1) as u8));
            i = i + 1;
        };
        hash
    }
    
    /// Get storage statistics
    public fun calculate_storage_stats(refs: &vector<OptimizedStorageRef>): StorageStats {
        let total_objects = std::vector::length(refs);
        let inline_objects = 0;
        let chunked_objects = 0;
        let walrus_objects = 0;
        let delta_objects = 0;
        let packed_objects = 0;
        let bytes_saved_compression = 0;
        let bytes_saved_delta = 0;
        
        let i = 0;
        while (i < total_objects) {
            let ref = std::vector::borrow(refs, i);
            
            if (ref.tier == TIER_INLINE) {
                inline_objects = inline_objects + 1;
            } else if (ref.tier == TIER_CHUNKED) {
                chunked_objects = chunked_objects + 1;
            } else if (ref.tier == TIER_WALRUS) {
                walrus_objects = walrus_objects + 1;
            } else if (ref.tier == TIER_DELTA) {
                delta_objects = delta_objects + 1;
                bytes_saved_delta = bytes_saved_delta + (ref.original_size - ref.stored_size);
            } else if (ref.tier == TIER_PACKED) {
                packed_objects = packed_objects + 1;
            };
            
            if (ref.compressed) {
                bytes_saved_compression = bytes_saved_compression + (ref.original_size - ref.stored_size);
            };
            
            i = i + 1;
        };
        
        StorageStats {
            total_objects,
            inline_objects,
            chunked_objects,
            walrus_objects,
            delta_objects,
            packed_objects,
            bytes_saved_compression,
            bytes_saved_delta,
            compression_ratio: if (bytes_saved_compression > 0) {
                ((bytes_saved_compression + bytes_saved_delta) * 100) / total_objects
            } else {
                0
            }
        }
    }
}
