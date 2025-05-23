module walgit::enhanced_walrus_integration {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::dynamic_field as df;
    use sui::transfer;
    use sui::event;
    use sui::vec_map::{Self, VecMap};
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    
    use walgit::storage;
    use walgit::enhanced_storage;
    use walgit::git_repository::{Self, Repository};
    use walgit::git_blob_object::{Self, BlobObject};

    /// Error codes
    const EInvalidBlobSize: u64 = 1;
    const EBlobNotFound: u64 = 2;
    const ERepositoryMismatch: u64 = 3;
    const EInsufficientStorage: u64 = 4;
    const ENotAuthorized: u64 = 5;
    const ERenewalInProgress: u64 = 6;
    const EInvalidChunkSize: u64 = 7;
    const EInvalidChunkIndex: u64 = 8;
    const EBlobRegistrationIncomplete: u64 = 9;
    const EBlobAlreadyRegistered: u64 = 10;

    /// Constants for storage optimization
    const MAX_BLOB_SIZE: u64 = 67108864; // 64 MB max blob size
    const CHUNK_SIZE: u64 = 1048576;     // 1 MB chunk size
    const METADATA_KEY: vector<u8> = b"blob_metadata";

    /// BlobRegistration tracks a blob's metadata on-chain
    struct BlobRegistration has key, store {
        id: UID,
        repository_id: ID,
        blob_id: vector<u8>,         // SHA-1 hash of the blob
        size: u64,                   // Size in bytes
        chunks: u64,                 // Number of chunks
        complete: bool,              // Whether all chunks are uploaded
        content_type: String,        // MIME type
        walrus_url: String,          // URL in Walrus storage
        created_at: u64,             // Creation timestamp
        expires_at: u64,             // Expiration timestamp
        auto_renew: bool,            // Whether to auto-renew storage
    }
    
    /// RepositoryStorage tracks all blobs for a repository
    struct RepositoryStorage has key, store {
        id: UID,
        repository_id: ID,
        total_size: u64,
        total_blobs: u64,
        blobs: Table<vector<u8>, ID>, // Blob hash -> BlobRegistration ID
    }
    
    /// BlobChunkUpload tracks the upload progress of a large blob
    struct BlobChunkUpload has key {
        id: UID,
        repository_id: ID,
        blob_id: vector<u8>,
        size: u64,
        chunk_size: u64,
        chunks_uploaded: VecMap<u64, bool>, // Chunk index -> uploaded status
        total_chunks: u64,
        created_at: u64,
    }
    
    /// Events
    struct BlobRegistered has copy, drop {
        registration_id: ID,
        repository_id: ID,
        blob_id: vector<u8>,
        size: u64,
        content_type: String,
        expires_at: u64,
    }
    
    struct BlobRenewed has copy, drop {
        registration_id: ID,
        repository_id: ID,
        blob_id: vector<u8>,
        new_expiration: u64,
    }
    
    struct BlobChunkUploaded has copy, drop {
        upload_id: ID,
        repository_id: ID,
        blob_id: vector<u8>,
        chunk_index: u64,
        total_chunks: u64,
    }
    
    struct BlobUploadCompleted has copy, drop {
        upload_id: ID,
        registration_id: ID,
        repository_id: ID,
        blob_id: vector<u8>,
        size: u64,
    }
    
    /// Initialize repository storage for a repository
    public fun initialize_repository_storage(
        repository: &Repository,
        ctx: &mut TxContext
    ): ID {
        let repository_id = git_repository::id(repository);
        
        let repo_storage = RepositoryStorage {
            id: object::new(ctx),
            repository_id,
            total_size: 0,
            total_blobs: 0,
            blobs: table::new(ctx),
        };
        
        let storage_id = object::id(&repo_storage);
        
        // Share object for global access
        transfer::share_object(repo_storage);
        
        storage_id
    }
    
    /// Registers a new blob in Walrus storage
    public fun register_blob(
        repository: &Repository,
        blob_id: vector<u8>,
        size: u64,
        content_type: String,
        walrus_url: String,
        auto_renew: bool,
        ctx: &mut TxContext
    ): ID {
        let repository_id = git_repository::id(repository);
        let repository_owner = git_repository::owner(repository);
        
        // Verify caller is authorized
        assert!(repository_owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Verify size is valid
        assert!(size > 0 && size <= MAX_BLOB_SIZE, EInvalidBlobSize);
        
        // Verify storage allocation has sufficient space
        assert!(
            enhanced_storage::check_allocation_space(repository_id, size, ctx),
            EInsufficientStorage
        );
        
        // Get or create repository storage
        let repo_storage = storage::borrow_repository_storage_mut(repository_id);
        
        // Verify blob doesn't already exist
        assert!(!table::contains(&repo_storage.blobs, blob_id), EBlobAlreadyRegistered);
        
        // Create blob registration
        let current_epoch = tx_context::epoch(ctx);
        let registration = BlobRegistration {
            id: object::new(ctx),
            repository_id,
            blob_id,
            size,
            chunks: 1, // Default to 1 for small blobs
            complete: true, // Assume complete for direct registration
            content_type,
            walrus_url,
            created_at: current_epoch,
            expires_at: current_epoch + 2592000, // 30 days default
            auto_renew,
        };
        
        let registration_id = object::id(&registration);
        
        // Update repository storage
        repo_storage.total_size = repo_storage.total_size + size;
        repo_storage.total_blobs = repo_storage.total_blobs + 1;
        table::add(&mut repo_storage.blobs, blob_id, registration_id);
        
        // Update storage usage
        enhanced_storage::update_storage_usage(repository_id, repo_storage.total_size, ctx);
        
        // Emit event
        event::emit(BlobRegistered {
            registration_id,
            repository_id,
            blob_id,
            size,
            content_type,
            expires_at: current_epoch + 2592000,
        });
        
        // Transfer registration to shared object
        transfer::share_object(registration);
        
        registration_id
    }
    
    /// Starts a chunked upload for a large blob
    public fun start_chunked_upload(
        repository: &Repository,
        blob_id: vector<u8>,
        total_size: u64,
        total_chunks: u64,
        content_type: String,
        ctx: &mut TxContext
    ): ID {
        let repository_id = git_repository::id(repository);
        let repository_owner = git_repository::owner(repository);
        
        // Verify caller is authorized
        assert!(repository_owner == tx_context::sender(ctx), ENotAuthorized);
        
        // Verify size and chunks are valid
        assert!(total_size > 0 && total_size <= MAX_BLOB_SIZE, EInvalidBlobSize);
        assert!(total_chunks > 0, EInvalidChunkSize);
        
        // Calculate chunk size
        let chunk_size = total_size / total_chunks;
        if (total_size % total_chunks != 0) {
            chunk_size = chunk_size + 1;
        };
        
        // Create chunk upload tracker
        let upload = BlobChunkUpload {
            id: object::new(ctx),
            repository_id,
            blob_id,
            size: total_size,
            chunk_size,
            chunks_uploaded: vec_map::empty(),
            total_chunks,
            created_at: tx_context::epoch(ctx),
        };
        
        // Initialize chunks_uploaded map
        let i = 0;
        while (i < total_chunks) {
            vec_map::insert(&mut upload.chunks_uploaded, i, false);
            i = i + 1;
        };
        
        let upload_id = object::id(&upload);
        
        // Pre-register the blob as incomplete
        let repo_storage = storage::borrow_repository_storage_mut(repository_id);
        
        // Create blob registration
        let current_epoch = tx_context::epoch(ctx);
        let registration = BlobRegistration {
            id: object::new(ctx),
            repository_id,
            blob_id,
            size: total_size,
            chunks: total_chunks,
            complete: false, // Mark as incomplete
            content_type,
            walrus_url: string::utf8(b""), // Empty URL until complete
            created_at: current_epoch,
            expires_at: current_epoch + 2592000, // 30 days default
            auto_renew: false, // Set auto_renew once complete
        };
        
        let registration_id = object::id(&registration);
        
        // Update repository storage
        repo_storage.total_size = repo_storage.total_size + total_size;
        repo_storage.total_blobs = repo_storage.total_blobs + 1;
        table::add(&mut repo_storage.blobs, blob_id, registration_id);
        
        // Update storage usage
        enhanced_storage::update_storage_usage(repository_id, repo_storage.total_size, ctx);
        
        // Store registration ID in dynamic field of upload
        df::add(&mut upload.id, METADATA_KEY, registration_id);
        
        // Transfer objects to shared access
        transfer::share_object(upload);
        transfer::share_object(registration);
        
        upload_id
    }
    
    /// Uploads a chunk of a large blob
    public fun upload_chunk(
        upload: &mut BlobChunkUpload,
        chunk_index: u64,
        ctx: &mut TxContext
    ) {
        // Verify chunk index is valid
        assert!(chunk_index < upload.total_chunks, EInvalidChunkIndex);
        
        // Update chunks_uploaded map
        let (_, existing) = vec_map::remove(&mut upload.chunks_uploaded, &chunk_index);
        
        // Verify chunk wasn't already uploaded
        assert!(!existing, EInvalidChunkIndex);
        
        // Mark chunk as uploaded
        vec_map::insert(&mut upload.chunks_uploaded, chunk_index, true);
        
        // Emit event
        event::emit(BlobChunkUploaded {
            upload_id: object::id(upload),
            repository_id: upload.repository_id,
            blob_id: upload.blob_id,
            chunk_index,
            total_chunks: upload.total_chunks,
        });
    }
    
    /// Completes a chunked upload
    public fun complete_chunked_upload(
        upload: &mut BlobChunkUpload,
        walrus_url: String,
        auto_renew: bool,
        ctx: &mut TxContext
    ) {
        // Verify all chunks are uploaded
        let i = 0;
        while (i < upload.total_chunks) {
            let (_, uploaded) = vec_map::get(&upload.chunks_uploaded, &i);
            assert!(*uploaded, EBlobRegistrationIncomplete);
            i = i + 1;
        };
        
        // Get the registration ID from dynamic field
        let registration_id = *df::borrow<vector<u8>, ID>(&upload.id, METADATA_KEY);
        
        // Update registration
        let registration = storage::borrow_blob_registration_mut(registration_id);
        registration.complete = true;
        registration.walrus_url = walrus_url;
        registration.auto_renew = auto_renew;
        
        // Emit event
        event::emit(BlobUploadCompleted {
            upload_id: object::id(upload),
            registration_id,
            repository_id: upload.repository_id,
            blob_id: upload.blob_id,
            size: upload.size,
        });
    }
    
    /// Links a blob object to its Walrus storage
    public fun link_blob_object(
        blob: &mut BlobObject,
        registration_id: ID,
        ctx: &mut TxContext
    ) {
        // Get the registration
        let registration = storage::borrow_blob_registration(registration_id);
        
        // Verify the blob is complete
        assert!(registration.complete, EBlobRegistrationIncomplete);
        
        // Add Walrus URL as dynamic field to blob
        if (!df::exists_(&blob.id, METADATA_KEY)) {
            df::add(&mut blob.id, METADATA_KEY, registration.walrus_url);
        } else {
            *df::borrow_mut(&mut blob.id, METADATA_KEY) = registration.walrus_url;
        };
    }
    
    /// Renews a blob registration
    public fun renew_blob_registration(
        registration: &mut BlobRegistration,
        duration_days: u64,
        ctx: &mut TxContext
    ) {
        // Calculate new expiration
        let current_epoch = tx_context::epoch(ctx);
        let new_expiration = current_epoch + (duration_days * 86400); // Convert days to seconds
        
        // Update expiration
        registration.expires_at = new_expiration;
        
        // Emit event
        event::emit(BlobRenewed {
            registration_id: object::id(registration),
            repository_id: registration.repository_id,
            blob_id: registration.blob_id,
            new_expiration,
        });
    }
    
    /// Checks if a blob is about to expire
    public fun is_blob_expiring_soon(
        registration: &BlobRegistration,
        days_threshold: u64,
        ctx: &mut TxContext
    ): bool {
        let current_epoch = tx_context::epoch(ctx);
        let seconds_threshold = days_threshold * 86400;
        
        // Check if expiration is within threshold
        registration.expires_at <= current_epoch + seconds_threshold
    }
    
    /// Gets total blob count for a repository
    public fun get_repository_blob_count(repository_id: ID): u64 {
        let repo_storage = storage::borrow_repository_storage(repository_id);
        repo_storage.total_blobs
    }
    
    /// Gets total storage size for a repository
    public fun get_repository_storage_size(repository_id: ID): u64 {
        let repo_storage = storage::borrow_repository_storage(repository_id);
        repo_storage.total_size
    }
    
    /// Checks if a blob exists in a repository
    public fun blob_exists(repository_id: ID, blob_id: vector<u8>): bool {
        let repo_storage = storage::borrow_repository_storage(repository_id);
        table::contains(&repo_storage.blobs, blob_id)
    }
    
    /// Gets a blob's Walrus URL
    public fun get_blob_url(blob: &BlobObject): String {
        assert!(df::exists_(&blob.id, METADATA_KEY), EBlobNotFound);
        *df::borrow<vector<u8>, String>(&blob.id, METADATA_KEY)
    }
    
    /// Public getters for registration properties
    public fun registration_repository_id(registration: &BlobRegistration): ID { registration.repository_id }
    public fun registration_blob_id(registration: &BlobRegistration): vector<u8> { registration.blob_id }
    public fun registration_size(registration: &BlobRegistration): u64 { registration.size }
    public fun registration_content_type(registration: &BlobRegistration): String { registration.content_type }
    public fun registration_walrus_url(registration: &BlobRegistration): String { registration.walrus_url }
    public fun registration_created_at(registration: &BlobRegistration): u64 { registration.created_at }
    public fun registration_expires_at(registration: &BlobRegistration): u64 { registration.expires_at }
    public fun registration_auto_renew(registration: &BlobRegistration): bool { registration.auto_renew }
    public fun registration_is_complete(registration: &BlobRegistration): bool { registration.complete }
}