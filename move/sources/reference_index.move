module walgit::reference_index {
    use sui::table::{Self, Table};
    use sui::object::{Self, ID};
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    // Index types
    const INDEX_TYPE_COMMIT: u8 = 0;
    const INDEX_TYPE_TREE: u8 = 1;
    const INDEX_TYPE_BLOB: u8 = 2;
    const INDEX_TYPE_TAG: u8 = 3;
    
    // Reference types
    const SYMBOLIC_REF: u8 = 100;
    
    // Error codes
    const E_REFERENCE_NOT_FOUND: u64 = 1;
    const E_INVALID_REFERENCE: u64 = 2;
    const E_INDEX_CORRUPTED: u64 = 3;
    
    /// Reference entry in the index
    public struct ReferenceEntry has store, drop {
        ref_type: u8,        // branch, tag, etc
        target_id: ID,       // object ID being referenced
        target_type: u8,     // commit, tree, blob
        metadata: ReferenceMetadata
    }
    
    /// Reference metadata
    public struct ReferenceMetadata has store, drop {
        created_at: u64,
        updated_at: u64,
        created_by: address,
        message: Option<String>
    }
    
    /// Optimized reference index
    public struct ReferenceIndex has store {
        // Primary index: ref_name -> reference entry
        refs_by_name: Table<String, ReferenceEntry>,
        
        // Secondary indices for fast lookups
        refs_by_target: Table<ID, vector<String>>,   // object ID -> referencing names
        refs_by_type: Table<u8, vector<String>>,     // ref type -> ref names
        refs_by_prefix: Table<String, vector<String>>, // prefix -> matching refs
        
        // Stats
        total_refs: u64,
        last_updated: u64
    }
    
    /// Reference lookup result
    public struct ReferenceLookup has drop {
        name: String,
        entry: ReferenceEntry,
        path: vector<String>  // for symbolic refs
    }
    
    /// Create new reference index
    public fun new_index(ctx: &mut TxContext): ReferenceIndex {
        ReferenceIndex {
            refs_by_name: table::new(ctx),
            refs_by_target: table::new(ctx),
            refs_by_type: table::new(ctx),
            refs_by_prefix: table::new(ctx),
            total_refs: 0,
            last_updated: 0
        }
    }
    
    /// Add or update reference
    public fun add_reference(
        index: &mut ReferenceIndex,
        name: String,
        target_id: ID,
        ref_type: u8,
        target_type: u8,
        metadata: ReferenceMetadata
    ) {
        // Check if reference already exists
        let is_update = table::contains(&index.refs_by_name, name);
        
        // Remove old indices if updating
        if (is_update) {
            let old_entry = table::borrow(&index.refs_by_name, name);
            remove_from_indices(index, name, old_entry);
        } else {
            index.total_refs = index.total_refs + 1;
        };
        
        // Create new entry
        let entry = ReferenceEntry {
            ref_type,
            target_id,
            target_type,
            metadata
        };
        
        // Update primary index
        if (is_update) {
            *table::borrow_mut(&mut index.refs_by_name, name) = entry;
        } else {
            table::add(&mut index.refs_by_name, name, entry);
        };
        
        // Update secondary indices
        add_to_indices(index, name, &entry);
        
        index.last_updated = metadata.updated_at;
    }
    
    /// Get reference by name (fast lookup)
    public fun get_reference(
        index: &ReferenceIndex,
        name: String
    ): Option<ReferenceEntry> {
        if (table::contains(&index.refs_by_name, name)) {
            option::some(*table::borrow(&index.refs_by_name, name))
        } else {
            option::none()
        }
    }
    
    /// Find references by target object (reverse lookup)
    public fun find_refs_by_target(
        index: &ReferenceIndex,
        target_id: ID
    ): vector<ReferenceLookup> {
        let results = vector::empty();
        
        if (table::contains(&index.refs_by_target, target_id)) {
            let ref_names = table::borrow(&index.refs_by_target, target_id);
            let i = 0;
            
            while (i < vector::length(ref_names)) {
                let name = *vector::borrow(ref_names, i);
                let entry = *table::borrow(&index.refs_by_name, name);
                
                let lookup = ReferenceLookup {
                    name,
                    entry,
                    path: vector::empty()
                };
                
                vector::push_back(&mut results, lookup);
                i = i + 1;
            };
        };
        
        results
    }
    
    /// Find references by type
    public fun find_refs_by_type(
        index: &ReferenceIndex,
        ref_type: u8
    ): vector<String> {
        if (table::contains(&index.refs_by_type, ref_type)) {
            *table::borrow(&index.refs_by_type, ref_type)
        } else {
            vector::empty()
        }
    }
    
    /// Find references by prefix (for autocomplete)
    public fun find_refs_by_prefix(
        index: &ReferenceIndex,
        prefix: String
    ): vector<String> {
        if (table::contains(&index.refs_by_prefix, prefix)) {
            *table::borrow(&index.refs_by_prefix, prefix)
        } else {
            vector::empty()
        }
    }
    
    /// Resolve symbolic reference
    /// This function follows symbolic references to find the concrete reference
    /// It detects cycles by tracking visited reference names and aborts with E_INDEX_CORRUPTED
    /// if a cycle is detected.
    /// The max_depth parameter is a safety limit to prevent excessive recursion,
    /// but actual cycles are detected independently via visited tracking.
    public fun resolve_symbolic_ref(
        index: &ReferenceIndex,
        ref_name: String,
        max_depth: u64
    ): Option<ReferenceLookup> {
        let mut current_name = ref_name;
        let mut depth = 0;
        let mut path = vector::empty();
        let mut visited = vector::empty<String>();
        
        while (depth < max_depth) {
            // Check for cycles
            if (vector::contains(&visited, &current_name)) {
                // Cycle detected - this is a corrupted index state
                abort E_INDEX_CORRUPTED
            };
            
            vector::push_back(&mut visited, current_name);
            
            let ref_opt = get_reference(index, current_name);
            
            if (option::is_none(&ref_opt)) {
                return option::none()
            };
            
            let ref_entry = option::extract(&mut ref_opt);
            vector::push_back(&mut path, current_name);
            
            // Check if this is a symbolic ref
            if (is_symbolic_ref(&ref_entry)) {
                current_name = get_symbolic_target(&ref_entry);
                depth = depth + 1;
            } else {
                // Found concrete reference
                return option::some(ReferenceLookup {
                    name: current_name,
                    entry: ref_entry,
                    path
                })
            }
        };
        
        // Max depth exceeded
        option::none()
    }
    
    /// Delete reference
    public fun delete_reference(
        index: &mut ReferenceIndex,
        name: String
    ): bool {
        if (table::contains(&index.refs_by_name, name)) {
            let entry = table::remove(&mut index.refs_by_name, name);
            remove_from_indices(index, name, &entry);
            index.total_refs = index.total_refs - 1;
            true
        } else {
            false
        }
    }
    
    /// Helper: Add reference to secondary indices
    fun add_to_indices(
        index: &mut ReferenceIndex,
        name: String,
        entry: &ReferenceEntry
    ) {
        // Add to target index
        if (!table::contains(&index.refs_by_target, entry.target_id)) {
            table::add(&mut index.refs_by_target, entry.target_id, vector::empty());
        };
        let target_refs = table::borrow_mut(&mut index.refs_by_target, entry.target_id);
        vector::push_back(target_refs, name);
        
        // Add to type index
        if (!table::contains(&index.refs_by_type, entry.ref_type)) {
            table::add(&mut index.refs_by_type, entry.ref_type, vector::empty());
        };
        let type_refs = table::borrow_mut(&mut index.refs_by_type, entry.ref_type);
        vector::push_back(type_refs, name);
        
        // Add to prefix indices
        let prefixes = generate_prefixes(name);
        let i = 0;
        while (i < vector::length(&prefixes)) {
            let prefix = *vector::borrow(&prefixes, i);
            
            if (!table::contains(&index.refs_by_prefix, prefix)) {
                table::add(&mut index.refs_by_prefix, prefix, vector::empty());
            };
            let prefix_refs = table::borrow_mut(&mut index.refs_by_prefix, prefix);
            vector::push_back(prefix_refs, name);
            
            i = i + 1;
        };
    }
    
    /// Helper: Remove reference from secondary indices
    fun remove_from_indices(
        index: &mut ReferenceIndex,
        name: String,
        entry: &ReferenceEntry
    ) {
        // Remove from target index
        if (table::contains(&index.refs_by_target, entry.target_id)) {
            let target_refs = table::borrow_mut(&mut index.refs_by_target, entry.target_id);
            remove_from_vector(target_refs, name);
            
            if (vector::is_empty(target_refs)) {
                table::remove(&mut index.refs_by_target, entry.target_id);
            };
        };
        
        // Remove from type index
        if (table::contains(&index.refs_by_type, entry.ref_type)) {
            let type_refs = table::borrow_mut(&mut index.refs_by_type, entry.ref_type);
            remove_from_vector(type_refs, name);
            
            if (vector::is_empty(type_refs)) {
                table::remove(&mut index.refs_by_type, entry.ref_type);
            };
        };
        
        // Remove from prefix indices
        let prefixes = generate_prefixes(name);
        let i = 0;
        while (i < vector::length(&prefixes)) {
            let prefix = *vector::borrow(&prefixes, i);
            
            if (table::contains(&index.refs_by_prefix, prefix)) {
                let prefix_refs = table::borrow_mut(&mut index.refs_by_prefix, prefix);
                remove_from_vector(prefix_refs, name);
                
                if (vector::is_empty(prefix_refs)) {
                    table::remove(&mut index.refs_by_prefix, prefix);
                };
            };
            
            i = i + 1;
        };
    }
    
    /// Generate prefixes for a reference name
    fun generate_prefixes(name: String): vector<String> {
        let prefixes = vector::empty();
        let bytes = string::bytes(&name);
        let len = vector::length(bytes);
        
        // Generate prefixes of length 1 to min(len, 10)
        let max_prefix_len = if (len > 10) { 10 } else { len };
        let i = 1;
        
        while (i <= max_prefix_len) {
            let prefix_bytes = vector::empty();
            let j = 0;
            
            while (j < i) {
                vector::push_back(&mut prefix_bytes, *vector::borrow(bytes, j));
                j = j + 1;
            };
            
            vector::push_back(&mut prefixes, string::utf8(prefix_bytes));
            i = i + 1;
        };
        
        prefixes
    }
    
    /// Remove string from vector
    fun remove_from_vector(vec: &mut vector<String>, value: String) {
        let i = 0;
        while (i < vector::length(vec)) {
            if (*vector::borrow(vec, i) == value) {
                vector::remove(vec, i);
                break
            };
            i = i + 1;
        };
    }
    
    /// Check if reference is symbolic
    fun is_symbolic_ref(entry: &ReferenceEntry): bool {
        entry.ref_type == SYMBOLIC_REF
    }
    
    /// Get target of symbolic reference
    fun get_symbolic_target(entry: &ReferenceEntry): String {
        // In practice, would extract from metadata
        if (option::is_some(&entry.metadata.message)) {
            *option::borrow(&entry.metadata.message)
        } else {
            string::utf8(b"refs/heads/main")
        }
    }
    
    /// Get index statistics
    public fun get_index_stats(index: &ReferenceIndex): (u64, u64, u64, u64) {
        (
            index.total_refs,
            table::length(&index.refs_by_target),
            table::length(&index.refs_by_type),
            index.last_updated
        )
    }
}