module walgit::walgit {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::table::{Self, Table};
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};

    // ======== Constants ========
    
    // Storage types
    const STORAGE_INLINE: u8 = 0;
    const STORAGE_WALRUS: u8 = 1;
    
    // Object types
    const TYPE_BLOB: u8 = 0;
    const TYPE_TREE: u8 = 1;
    const TYPE_COMMIT: u8 = 2;

    // Error codes
    const ERepositoryExists: u64 = 1;
    const ERepositoryNotFound: u64 = 2;
    const EUnauthorized: u64 = 3;
    const EInvalidHash: u64 = 4;
    const EBlobNotFound: u64 = 5;

    // ======== Main WalGit Object ========
    
    public struct WalGit has key {
        id: UID,
        version: String,
        admin: address,
        // Global repository registry
        repositories: Table<String, RepositoryInfo>,
        // Global blob deduplication registry  
        blob_registry: Table<String, ID>,
        total_repos: u64,
        total_blobs: u64
    }

    // ======== Repository Registry ========
    
    public struct RepositoryInfo has store, copy, drop {
        id: ID,
        owner: address,
        name: String,
        description: String,
        created_at: u64,
        is_public: bool
    }

    public struct Repository has key, store {
        id: UID,
        name: String,
        description: String,
        owner: address,
        default_branch: String,
        head_commit_id: Option<ID>,
        branches: Table<String, ID>,
        tags: Table<String, ID>,
        collaborators: vector<address>,
        is_public: bool,
        created_at: u64,
        updated_at: u64,
        total_commits: u64,
        total_size: u64
    }

    // ======== Git Objects ========
    
    public struct GitBlobObject has key, store {
        id: UID,
        hash: String,
        size: u64,
        storage_type: u8,
        // Walrus blob ID (empty string if inline)
        walrus_blob_id: String,
        // Inline content (empty if in Walrus)
        inline_content: vector<u8>,
        ref_count: u64
    }

    public struct GitTreeObject has key, store {
        id: UID,
        hash: String,
        entries: vector<TreeEntry>
    }

    public struct TreeEntry has store {
        name: String,
        entry_type: u8,
        object_id: ID,
        hash: String
    }

    public struct GitCommitObject has key, store {
        id: UID,
        hash: String,
        tree_id: ID,
        parent_commit_id: Option<ID>,
        author: address,
        message: String,
        timestamp: u64,
        repository_id: ID
    }

    // ======== Events ========
    
    public struct RepositoryCreated has copy, drop {
        repository_id: ID,
        name: String,
        owner: address
    }

    public struct BlobUploaded has copy, drop {
        blob_id: ID,
        hash: String,
        size: u64,
        walrus_blob_id: String
    }

    public struct CommitCreated has copy, drop {
        commit_id: ID,
        repository_id: ID,
        hash: String,
        message: String
    }

    // ======== Initialize ========
    
    fun init(ctx: &mut TxContext) {
        let walgit = WalGit {
            id: object::new(ctx),
            version: string::utf8(b"0.2.0"),
            admin: tx_context::sender(ctx),
            repositories: table::new(ctx),
            blob_registry: table::new(ctx),
            total_repos: 0,
            total_blobs: 0
        };
        transfer::share_object(walgit);
    }

    // ======== Repository Management ========
    
    public entry fun create_repository(
        walgit: &mut WalGit,
        name: String,
        description: String,
        is_public: bool,
        ctx: &mut TxContext
    ) {
        let owner = tx_context::sender(ctx);
        let repo_key = format_repo_key(&owner, &name);
        
        assert!(!table::contains(&walgit.repositories, repo_key), ERepositoryExists);
        
        let repo_uid = object::new(ctx);
        let repo_id = object::uid_to_inner(&repo_uid);
        
        let repository = Repository {
            id: repo_uid,
            name,
            description,
            owner,
            default_branch: string::utf8(b"main"),
            head_commit_id: option::none(),
            branches: table::new(ctx),
            tags: table::new(ctx),
            collaborators: vector::empty(),
            is_public,
            created_at: tx_context::epoch(ctx),
            updated_at: tx_context::epoch(ctx),
            total_commits: 0,
            total_size: 0
        };
        
        let repo_info = RepositoryInfo {
            id: repo_id,
            owner,
            name: repository.name,
            description: repository.description,
            created_at: repository.created_at,
            is_public
        };
        
        table::add(&mut walgit.repositories, repo_key, repo_info);
        walgit.total_repos = walgit.total_repos + 1;
        
        event::emit(RepositoryCreated {
            repository_id: repo_id,
            name: repository.name,
            owner
        });
        
        transfer::share_object(repository);
    }

    // ======== Blob Management with Walrus ========
    
    public entry fun upload_blob(
        walgit: &mut WalGit,
        repository: &mut Repository,
        hash: String,
        size: u64,
        walrus_blob_id: String,
        ctx: &mut TxContext
    ) {
        assert!(is_authorized(repository, tx_context::sender(ctx)), EUnauthorized);
        
        // Check if blob already exists (deduplication)
        if (table::contains(&walgit.blob_registry, hash)) {
            let existing_blob_id = *table::borrow(&walgit.blob_registry, hash);
            // Increment reference count on existing blob
            // (Would need to implement blob borrowing in production)
            return
        };
        
        let blob = GitBlobObject {
            id: object::new(ctx),
            hash,
            size,
            storage_type: STORAGE_WALRUS,
            walrus_blob_id,
            inline_content: vector::empty(),
            ref_count: 1
        };
        
        let blob_id = object::id(&blob);
        table::add(&mut walgit.blob_registry, blob.hash, blob_id);
        walgit.total_blobs = walgit.total_blobs + 1;
        repository.total_size = repository.total_size + size;
        
        event::emit(BlobUploaded {
            blob_id,
            hash: blob.hash,
            size,
            walrus_blob_id
        });
        
        transfer::share_object(blob);
    }

    public entry fun upload_blob_inline(
        walgit: &mut WalGit,
        repository: &mut Repository,
        hash: String,
        content: vector<u8>,
        ctx: &mut TxContext
    ) {
        assert!(is_authorized(repository, tx_context::sender(ctx)), EUnauthorized);
        
        let size = vector::length(&content);
        
        let blob = GitBlobObject {
            id: object::new(ctx),
            hash,
            size: (size as u64),
            storage_type: STORAGE_INLINE,
            walrus_blob_id: string::utf8(b""),
            inline_content: content,
            ref_count: 1
        };
        
        let blob_id = object::id(&blob);
        table::add(&mut walgit.blob_registry, blob.hash, blob_id);
        walgit.total_blobs = walgit.total_blobs + 1;
        repository.total_size = repository.total_size + (size as u64);
        
        transfer::share_object(blob);
    }

    // ======== Tree Management ========
    
    public entry fun create_tree(
        _repository: &mut Repository,
        hash: String,
        entry_names: vector<String>,
        entry_types: vector<u8>,
        entry_ids: vector<ID>,
        entry_hashes: vector<String>,
        ctx: &mut TxContext
    ) {
        let mut entries = vector::empty<TreeEntry>();
        let len = vector::length(&entry_names);
        let mut i = 0;
        
        while (i < len) {
            let entry = TreeEntry {
                name: *vector::borrow(&entry_names, i),
                entry_type: *vector::borrow(&entry_types, i),
                object_id: *vector::borrow(&entry_ids, i),
                hash: *vector::borrow(&entry_hashes, i)
            };
            vector::push_back(&mut entries, entry);
            i = i + 1;
        };
        
        let tree = GitTreeObject {
            id: object::new(ctx),
            hash,
            entries
        };
        
        transfer::share_object(tree);
    }

    // ======== Commit Management ========
    
    public entry fun create_commit(
        repository: &mut Repository,
        hash: String,
        tree_id: ID,
        parent_commit_id_vec: vector<ID>,
        message: String,
        ctx: &mut TxContext
    ) {
        assert!(is_authorized(repository, tx_context::sender(ctx)), EUnauthorized);
        
        let parent_commit_id = if (vector::is_empty(&parent_commit_id_vec)) {
            option::none()
        } else {
            option::some(*vector::borrow(&parent_commit_id_vec, 0))
        };
        
        let commit = GitCommitObject {
            id: object::new(ctx),
            hash,
            tree_id,
            parent_commit_id,
            author: tx_context::sender(ctx),
            message,
            timestamp: tx_context::epoch(ctx),
            repository_id: object::id(repository)
        };
        
        let commit_id = object::id(&commit);
        repository.head_commit_id = option::some(commit_id);
        repository.total_commits = repository.total_commits + 1;
        repository.updated_at = tx_context::epoch(ctx);
        
        // Update main branch
        if (table::contains(&repository.branches, repository.default_branch)) {
            table::remove(&mut repository.branches, repository.default_branch);
        };
        table::add(&mut repository.branches, repository.default_branch, commit_id);
        
        event::emit(CommitCreated {
            commit_id,
            repository_id: object::id(repository),
            hash: commit.hash,
            message: commit.message
        });
        
        transfer::share_object(commit);
    }

    // ======== Repository Discovery ========
    
    public fun get_public_repositories(walgit: &WalGit): vector<RepositoryInfo> {
        let repos = vector::empty<RepositoryInfo>();
        // In production, this would iterate through paginated results
        // For now, returning empty vector as Table doesn't support iteration
        repos
    }

    public fun get_repository_info(walgit: &WalGit, owner: address, name: String): Option<RepositoryInfo> {
        let key = format_repo_key(&owner, &name);
        if (table::contains(&walgit.repositories, key)) {
            let info = table::borrow(&walgit.repositories, key);
            option::some(*info)
        } else {
            option::none()
        }
    }

    // ======== Helper Functions ========
    
    fun format_repo_key(owner: &address, name: &String): String {
        let owner_str = address_to_string(owner);
        let separator = string::utf8(b"/");
        let mut key = owner_str;
        string::append(&mut key, separator);
        string::append(&mut key, *name);
        key
    }

    fun address_to_string(addr: &address): String {
        // Simplified address to string conversion
        // In production, would use proper hex encoding
        string::utf8(b"0x") // Placeholder
    }

    fun is_authorized(repository: &Repository, user: address): bool {
        repository.owner == user || 
        repository.is_public ||
        vector::contains(&repository.collaborators, &user)
    }

    // ======== View Functions ========
    
    public fun get_total_repositories(walgit: &WalGit): u64 {
        walgit.total_repos
    }

    public fun get_total_blobs(walgit: &WalGit): u64 {
        walgit.total_blobs
    }

    public fun get_repository_name(repository: &Repository): String {
        repository.name
    }

    public fun get_repository_owner(repository: &Repository): address {
        repository.owner
    }

    public fun get_blob_walrus_id(blob: &GitBlobObject): String {
        blob.walrus_blob_id
    }

    public fun get_blob_hash(blob: &GitBlobObject): String {
        blob.hash
    }
}