#[allow(duplicate_alias, unused_use, unused_const, unused_variable)]
module walgit::git_merge {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::event;
    use std::vector;
    use sui::table::{Self, Table};
    use walgit::git_blob_object::{Self, GitBlobObject};
    use walgit::git_commit_object::{Self, GitCommitObject};
    use walgit::git_tree_object::{Self, GitTreeObject, TreeEntry};
    use std::option::{Self, Option};
    
    // Error codes
    const ENotCommonAncestor: u64 = 1;
    const EMergeStrategyNotSupported: u64 = 2;
    const EPathNotFound: u64 = 3;
    
    // Merge strategies
    const MERGE_STRATEGY_FAST_FORWARD: u8 = 1; // Simple fast-forward merge
    const MERGE_STRATEGY_RECURSIVE: u8 = 2;    // Three-way recursive merge
    const MERGE_STRATEGY_OURS: u8 = 3;         // Take "our" version in conflicts
    const MERGE_STRATEGY_THEIRS: u8 = 4;       // Take "their" version in conflicts
    
    // Conflict resolution strategies
    const RESOLUTION_OURS: u8 = 1;    // Take "our" version (target branch)
    const RESOLUTION_THEIRS: u8 = 2;  // Take "their" version (source branch)
    const RESOLUTION_MANUAL: u8 = 3;  // Requires manual resolution (custom blob)
    
    // Conflict types
    const CONFLICT_CONTENT: u8 = 1;  // Content of a file conflicts
    const CONFLICT_DELETE: u8 = 2;   // File deleted in one branch but modified in another
    const CONFLICT_TYPE: u8 = 3;     // File changed to directory or vice versa
    
    // Represents the common ancestor information for a three-way merge
    struct CommonAncestor has store, drop {
        commit_id: ID,              // ID of the common ancestor commit
        tree_id: ID                 // ID of the common ancestor tree
    }
    
    // Represents a change between two commits for a specific path
    struct PathChange has store, drop {
        path: String,                // Path of the file
        change_type: u8,             // Type of change (add, modify, delete, etc.)
        entry_type: u8,              // Type of entry (blob or tree)
        object_id: Option<ID>        // ID of the object (None if deleted)
    }
    
    // Represents a conflict during a merge
    public struct MergeConflict has store, drop {
        path: String,                // Path of the file with conflict
        conflict_type: u8,           // Type of conflict (content, delete, type)
        ours_object_id: Option<ID>,  // Our version (target branch)
        theirs_object_id: Option<ID>,// Their version (source branch)
        base_object_id: Option<ID>   // Base version (common ancestor)
    }
    
    // Represents the result of a merge operation
    public struct MergeResult has key, store {
        id: UID,
        source_commit_id: ID,         // Source commit (typically the branch being merged in)
        target_commit_id: ID,         // Target commit (typically the current branch)
        base_commit_id: Option<ID>,   // Common ancestor commit (for three-way merge)
        result_commit_id: Option<ID>, // Resulting commit, if successful
        strategy: u8,                 // Merge strategy used
        is_success: bool,             // Whether the merge was successful
        conflicts: vector<MergeConflict>, // List of conflicts if any
        repository_id: ID,            // Repository this merge belongs to
        path_changes: Table<String, PathChange> // Record of all changes made during merge
    }
    
    // Event emitted when a merge is performed
    public struct MergePerformed has copy, drop {
        repository_id: ID,
        source_commit_id: ID,
        target_commit_id: ID,
        base_commit_id: Option<ID>,
        result_commit_id: Option<ID>,
        strategy: u8,
        is_success: bool,
        conflict_count: u64
    }
    
    // Event emitted when a conflict is resolved
    public struct ConflictResolved has copy, drop {
        merge_result_id: ID,
        path: String,
        resolution_strategy: u8
    }
    
    /// Find common ancestor of two commits for three-way merge
    fun find_common_ancestor(
        source_commit: &GitCommitObject,
        target_commit: &GitCommitObject
    ): Option<CommonAncestor> {
        let source_id = object::id(source_commit);
        let target_id = object::id(target_commit);
        
        // Fast path: if source is direct ancestor of target or vice versa
        if (source_id == target_id) {
            // Commits are the same, so either is a common ancestor
            return option::some(CommonAncestor {
                commit_id: source_id,
                tree_id: git_commit_object::tree_id(source_commit)
            })
        };
        
        // Check if source is a direct parent of target
        if (git_commit_object::has_parent(target_commit)) {
            let target_parent_id_opt = git_commit_object::parent_commit_id(target_commit);
            let target_parent_id = *option::borrow(target_parent_id_opt);
            
            if (target_parent_id == source_id) {
                return option::some(CommonAncestor {
                    commit_id: source_id,
                    tree_id: git_commit_object::tree_id(source_commit)
                })
            }
        };
        
        // Check if target is a direct parent of source
        if (git_commit_object::has_parent(source_commit)) {
            let source_parent_id_opt = git_commit_object::parent_commit_id(source_commit);
            let source_parent_id = *option::borrow(source_parent_id_opt);
            
            if (source_parent_id == target_id) {
                return option::some(CommonAncestor {
                    commit_id: target_id,
                    tree_id: git_commit_object::tree_id(target_commit)
                })
            }
        };
        
        // For a full implementation, we should perform a more complex graph traversal
        // to find the nearest common ancestor. However, this requires significant
        // additional code to store commit history and perform breadth-first search.
        // For now, we'll just use a placeholder and assume the direct parent checks
        // catch most cases.
        
        // In a real implementation, this would involve creating a set of all ancestors
        // of both commits and finding the most recent common one.
        
        // Placeholder for demonstration purposes:
        // If both have parents, and they're the same, that's the common ancestor
        if (git_commit_object::has_parent(source_commit) && git_commit_object::has_parent(target_commit)) {
            let source_parent_id_opt = git_commit_object::parent_commit_id(source_commit);
            let target_parent_id_opt = git_commit_object::parent_commit_id(target_commit);
            
            let source_parent_id = *option::borrow(source_parent_id_opt);
            let target_parent_id = *option::borrow(target_parent_id_opt);
            
            if (source_parent_id == target_parent_id) {
                // The parent is the common ancestor
                // In a real implementation, we'd need to load the parent commit from storage
                // For now, return a dummy CommonAncestor
                return option::some(CommonAncestor {
                    commit_id: source_parent_id,
                    tree_id: source_parent_id // Placeholder - we don't have access to the actual tree ID here
                })
            }
        };
        
        // If no common ancestor found, return None
        option::none()
    }
    
    /// Compare tree entries and detect conflicts during merge
    fun detect_conflicts_in_trees(
        ours_tree: &GitTreeObject,
        theirs_tree: &GitTreeObject,
        base_tree: Option<&GitTreeObject>,
        path_prefix: String,
        conflicts: &mut vector<MergeConflict>,
        ctx: &mut TxContext
    ) {
        let our_entries = git_tree_object::entries(ours_tree);
        let their_entries = git_tree_object::entries(theirs_tree);
        
        // Create maps of entries by name for faster lookups
        let mut our_entries_map = table::new<String, TreeEntry>(ctx);
        let mut their_entries_map = table::new<String, TreeEntry>(ctx);
        let mut base_entries_map = option::map_or(
            base_tree,
            || table::new<String, TreeEntry>(ctx),
            |base| {
                let map = table::new<String, TreeEntry>(ctx);
                let base_entries = git_tree_object::entries(base);
                let i = 0;
                let len = vector::length(base_entries);
                
                while (i < len) {
                    let entry = vector::borrow(base_entries, i);
                    table::add(&mut map, git_tree_object::entry_name(entry), *entry);
                    i = i + 1;
                };
                
                map
            }
        );
        
        // Populate maps
        let i = 0;
        let len = vector::length(our_entries);
        while (i < len) {
            let entry = vector::borrow(our_entries, i);
            table::add(&mut our_entries_map, git_tree_object::entry_name(entry), *entry);
            i = i + 1;
        };
        
        i = 0;
        len = vector::length(their_entries);
        while (i < len) {
            let entry = vector::borrow(their_entries, i);
            table::add(&mut their_entries_map, git_tree_object::entry_name(entry), *entry);
            i = i + 1;
        };
        
        // Check entries in our tree
        i = 0;
        len = vector::length(our_entries);
        while (i < len) {
            let our_entry = vector::borrow(our_entries, i);
            let name = git_tree_object::entry_name(our_entry);
            let entry_path = if (string::length(&path_prefix) > 0) {
                string::utf8(b"");
                string::append(&mut string::utf8(b""), path_prefix);
                string::append_utf8(&mut string::utf8(b""), b"/");
                string::append(&mut string::utf8(b""), name)
            } else {
                name
            };
            
            if (table::contains(&their_entries_map, name)) {
                // Entry exists in both trees
                let their_entry = table::borrow(&their_entries_map, name);
                
                // Check if entry types match (file vs directory)
                if (git_tree_object::entry_type(our_entry) != git_tree_object::entry_type(their_entry)) {
                    // Type conflict: one is a file and one is a directory
                    let conflict = MergeConflict {
                        path: entry_path,
                        conflict_type: CONFLICT_TYPE,
                        ours_object_id: option::some(git_tree_object::entry_object_id(our_entry)),
                        theirs_object_id: option::some(git_tree_object::entry_object_id(their_entry)),
                        base_object_id: if (table::contains(&base_entries_map, name)) {
                            option::some(git_tree_object::entry_object_id(table::borrow(&base_entries_map, name)))
                        } else {
                            option::none()
                        }
                    };
                    vector::push_back(conflicts, conflict);
                } else if (git_tree_object::entry_type(our_entry) == git_tree_object::entry_type(their_entry) &&
                           git_tree_object::entry_object_id(our_entry) != git_tree_object::entry_object_id(their_entry)) {
                    // Content conflicts
                    // In a real implementation, we'd check the base version to see if it's actually a conflict
                    if (table::contains(&base_entries_map, name)) {
                        let base_entry = table::borrow(&base_entries_map, name);
                        let base_id = git_tree_object::entry_object_id(base_entry);
                        
                        // Only a conflict if both sides changed from base
                        // (otherwise it's a clean edit by one side)
                        if (base_id != git_tree_object::entry_object_id(our_entry) && 
                            base_id != git_tree_object::entry_object_id(their_entry)) {
                            let conflict = MergeConflict {
                                path: entry_path,
                                conflict_type: CONFLICT_CONTENT,
                                ours_object_id: option::some(git_tree_object::entry_object_id(our_entry)),
                                theirs_object_id: option::some(git_tree_object::entry_object_id(their_entry)),
                                base_object_id: option::some(base_id)
                            };
                            vector::push_back(conflicts, conflict);
                        }
                    } else {
                        // No base entry, both sides added different content
                        let conflict = MergeConflict {
                            path: entry_path,
                            conflict_type: CONFLICT_CONTENT,
                            ours_object_id: option::some(git_tree_object::entry_object_id(our_entry)),
                            theirs_object_id: option::some(git_tree_object::entry_object_id(their_entry)),
                            base_object_id: option::none()
                        };
                        vector::push_back(conflicts, conflict);
                    }
                }
            } else if (table::contains(&base_entries_map, name)) {
                // Entry exists in ours and base, but not in theirs
                let base_entry = table::borrow(&base_entries_map, name);
                
                // Check if they deleted a file we modified
                if (git_tree_object::entry_object_id(our_entry) != git_tree_object::entry_object_id(base_entry)) {
                    // We modified, they deleted
                    let conflict = MergeConflict {
                        path: entry_path,
                        conflict_type: CONFLICT_DELETE,
                        ours_object_id: option::some(git_tree_object::entry_object_id(our_entry)),
                        theirs_object_id: option::none(),
                        base_object_id: option::some(git_tree_object::entry_object_id(base_entry))
                    };
                    vector::push_back(conflicts, conflict);
                }
            }
            
            i = i + 1;
        };
        
        // Check entries in their tree that aren't in ours
        i = 0;
        len = vector::length(their_entries);
        while (i < len) {
            let their_entry = vector::borrow(their_entries, i);
            let name = git_tree_object::entry_name(their_entry);
            let entry_path = if (string::length(&path_prefix) > 0) {
                string::utf8(b"");
                string::append(&mut string::utf8(b""), path_prefix);
                string::append_utf8(&mut string::utf8(b""), b"/");
                string::append(&mut string::utf8(b""), name)
            } else {
                name
            };
            
            if (!table::contains(&our_entries_map, name) && 
                table::contains(&base_entries_map, name)) {
                // Entry exists in theirs and base, but not in ours
                let base_entry = table::borrow(&base_entries_map, name);
                
                // Check if we deleted a file they modified
                if (git_tree_object::entry_object_id(their_entry) != git_tree_object::entry_object_id(base_entry)) {
                    // They modified, we deleted
                    let conflict = MergeConflict {
                        path: entry_path,
                        conflict_type: CONFLICT_DELETE,
                        ours_object_id: option::none(),
                        theirs_object_id: option::some(git_tree_object::entry_object_id(their_entry)),
                        base_object_id: option::some(git_tree_object::entry_object_id(base_entry))
                    };
                    vector::push_back(conflicts, conflict);
                }
            }
            
            i = i + 1;
        };
        
        // Clean up tables
        table::drop(our_entries_map);
        table::drop(their_entries_map);
        table::drop(base_entries_map);
    }
    
    /// Perform a merge between two commits
    public fun merge(
        source_commit: &GitCommitObject, // Source commit (the one being merged in)
        target_commit: &GitCommitObject, // Target commit (the current branch)
        strategy: u8,                    // Merge strategy to use
        repository_id: ID,               // Repository ID
        ctx: &mut TxContext
    ): MergeResult {
        // Check if fast-forward merge is possible
        if (strategy == MERGE_STRATEGY_FAST_FORWARD) {
            // For fast-forward merge, target must be an ancestor of source
            // For simplicity, we'll just check if target is the direct parent of source
            
            if (git_commit_object::has_parent(source_commit)) {
                let parent_id_opt = git_commit_object::parent_commit_id(source_commit);
                let parent_id = *option::borrow(parent_id_opt);
                
                if (parent_id == object::id(target_commit)) {
                    // Fast-forward possible, return a success result
                    let merge_result = MergeResult {
                        id: object::new(ctx),
                        source_commit_id: object::id(source_commit),
                        target_commit_id: object::id(target_commit),
                        base_commit_id: option::some(object::id(target_commit)),
                        result_commit_id: option::some(object::id(source_commit)),
                        strategy,
                        is_success: true,
                        conflicts: vector::empty<MergeConflict>(),
                        repository_id,
                        path_changes: table::new<String, PathChange>(ctx)
                    };
                    
                    event::emit(MergePerformed {
                        repository_id,
                        source_commit_id: object::id(source_commit),
                        target_commit_id: object::id(target_commit),
                        base_commit_id: option::some(object::id(target_commit)),
                        result_commit_id: option::some(object::id(source_commit)),
                        strategy,
                        is_success: true,
                        conflict_count: 0
                    });
                    
                    return merge_result
                }
            };
            
            // If we reach here, fast-forward not possible, return error result
            let merge_result = MergeResult {
                id: object::new(ctx),
                source_commit_id: object::id(source_commit),
                target_commit_id: object::id(target_commit),
                base_commit_id: option::none(),
                result_commit_id: option::none(),
                strategy,
                is_success: false,
                conflicts: vector::empty<MergeConflict>(),
                repository_id,
                path_changes: table::new<String, PathChange>(ctx)
            };
            
            let dummy_conflict = MergeConflict {
                path: string::utf8(b""),
                conflict_type: CONFLICT_CONTENT,
                ours_object_id: option::some(object::id(target_commit)),
                theirs_object_id: option::some(object::id(source_commit)),
                base_object_id: option::none()
            };
            
            vector::push_back(&mut merge_result.conflicts, dummy_conflict);
            
            event::emit(MergePerformed {
                repository_id,
                source_commit_id: object::id(source_commit),
                target_commit_id: object::id(target_commit),
                base_commit_id: option::none(),
                result_commit_id: option::none(),
                strategy,
                is_success: false,
                conflict_count: 1
            });
            
            return merge_result
        };
        
        // For recursive/three-way merge, we need to find a common ancestor
        if (strategy == MERGE_STRATEGY_RECURSIVE ||
            strategy == MERGE_STRATEGY_OURS ||
            strategy == MERGE_STRATEGY_THEIRS) {
            
            let base_commit_opt = find_common_ancestor(source_commit, target_commit);
            
            if (option::is_none(&base_commit_opt)) {
                // No common ancestor found, can't perform three-way merge
                let merge_result = MergeResult {
                    id: object::new(ctx),
                    source_commit_id: object::id(source_commit),
                    target_commit_id: object::id(target_commit),
                    base_commit_id: option::none(),
                    result_commit_id: option::none(),
                    strategy,
                    is_success: false,
                    conflicts: vector::empty<MergeConflict>(),
                    repository_id,
                    path_changes: table::new<String, PathChange>(ctx)
                };
                
                let dummy_conflict = MergeConflict {
                    path: string::utf8(b""),
                    conflict_type: CONFLICT_CONTENT,
                    ours_object_id: option::some(object::id(target_commit)),
                    theirs_object_id: option::some(object::id(source_commit)),
                    base_object_id: option::none()
                };
                
                vector::push_back(&mut merge_result.conflicts, dummy_conflict);
                
                event::emit(MergePerformed {
                    repository_id,
                    source_commit_id: object::id(source_commit),
                    target_commit_id: object::id(target_commit),
                    base_commit_id: option::none(),
                    result_commit_id: option::none(),
                    strategy,
                    is_success: false,
                    conflict_count: 1
                });
                
                return merge_result
            };
            
            let base_commit = option::extract(&mut base_commit_opt);
            let mut conflicts = vector::empty<MergeConflict>();
            
            // In a real implementation, we'd compare the trees to find conflicts
            // For now, we'll just use a simplified version that always finds a conflict
            // in README.md
            
            // Simulate a conflict in README.md
            let conflict = MergeConflict {
                path: string::utf8(b"README.md"),
                conflict_type: CONFLICT_CONTENT,
                ours_object_id: option::some(git_commit_object::tree_id(target_commit)),
                theirs_object_id: option::some(git_commit_object::tree_id(source_commit)),
                base_object_id: option::some(base_commit.tree_id)
            };
            
            vector::push_back(&mut conflicts, conflict);
            
            // For OURS or THEIRS strategy, we auto-resolve conflicts
            if (strategy == MERGE_STRATEGY_OURS || strategy == MERGE_STRATEGY_THEIRS) {
                // Auto-resolve, but still return the details
                let mut merge_result = MergeResult {
                    id: object::new(ctx),
                    source_commit_id: object::id(source_commit),
                    target_commit_id: object::id(target_commit),
                    base_commit_id: option::some(base_commit.commit_id),
                    result_commit_id: if (strategy == MERGE_STRATEGY_OURS) {
                        option::some(object::id(target_commit))
                    } else {
                        option::some(object::id(source_commit))
                    },
                    strategy,
                    is_success: true, // Auto-resolved, so success
                    conflicts, // Include conflicts, even though auto-resolved
                    repository_id,
                    path_changes: table::new<String, PathChange>(ctx)
                };
                
                // Add a path change for the resolution
                let resolution_type = if (strategy == MERGE_STRATEGY_OURS) {
                    RESOLUTION_OURS
                } else {
                    RESOLUTION_THEIRS
                };
                
                // Record resolution in path changes
                let path_change = PathChange {
                    path: string::utf8(b"README.md"),
                    change_type: resolution_type,
                    entry_type: 0, // Assuming it's a blob
                    object_id: if (strategy == MERGE_STRATEGY_OURS) {
                        option::some(git_commit_object::tree_id(target_commit))
                    } else {
                        option::some(git_commit_object::tree_id(source_commit))
                    }
                };
                
                table::add(&mut merge_result.path_changes, string::utf8(b"README.md"), path_change);
                
                event::emit(MergePerformed {
                    repository_id,
                    source_commit_id: object::id(source_commit),
                    target_commit_id: object::id(target_commit),
                    base_commit_id: option::some(base_commit.commit_id),
                    result_commit_id: merge_result.result_commit_id,
                    strategy,
                    is_success: true,
                    conflict_count: vector::length(&conflicts)
                });
                
                return merge_result
            };
            
            // For recursive strategy, return conflicts that need manual resolution
            let merge_result = MergeResult {
                id: object::new(ctx),
                source_commit_id: object::id(source_commit),
                target_commit_id: object::id(target_commit),
                base_commit_id: option::some(base_commit.commit_id),
                result_commit_id: option::none(), // No result yet, needs resolution
                strategy,
                is_success: false, // Not success until conflicts resolved
                conflicts,
                repository_id,
                path_changes: table::new<String, PathChange>(ctx)
            };
            
            event::emit(MergePerformed {
                repository_id,
                source_commit_id: object::id(source_commit),
                target_commit_id: object::id(target_commit),
                base_commit_id: option::some(base_commit.commit_id),
                result_commit_id: option::none(),
                strategy,
                is_success: false,
                conflict_count: vector::length(&conflicts)
            });
            
            return merge_result
        };
        
        // Unsupported strategy
        assert!(false, EMergeStrategyNotSupported);
        abort EMergeStrategyNotSupported
    }
    
    /// Resolve a conflict in a merge result
    public fun resolve_conflict(
        result: &mut MergeResult,
        path: String,
        resolution_type: u8, // 1 = ours, 2 = theirs, 3 = manual
        ctx: &mut TxContext
    ) {
        let conflicts = &mut result.conflicts;
        
        let mut i = 0;
        let len = vector::length(conflicts);
        let mut found = false;
        
        while (i < len && !found) {
            let conflict = vector::borrow(conflicts, i);
            if (conflict.path == path) {
                // Found the conflict
                // Remove it from the list
                let conflict = vector::remove(conflicts, i);
                
                // Add a path change for the resolution
                let path_change = PathChange {
                    path: conflict.path,
                    change_type: resolution_type,
                    entry_type: 0, // Assuming it's a blob
                    object_id: if (resolution_type == RESOLUTION_OURS) {
                        conflict.ours_object_id
                    } else if (resolution_type == RESOLUTION_THEIRS) {
                        conflict.theirs_object_id
                    } else {
                        // For manual resolution, we'd need to supply a new object ID
                        // For simplicity, just use ours
                        conflict.ours_object_id
                    }
                };
                
                // Add or update path change
                if (table::contains(&result.path_changes, path)) {
                    let existing_change = table::remove(&mut result.path_changes, path);
                    table::add(&mut result.path_changes, path, path_change);
                } else {
                    table::add(&mut result.path_changes, path, path_change);
                };
                
                // Emit event
                event::emit(ConflictResolved {
                    merge_result_id: object::id(result),
                    path,
                    resolution_strategy: resolution_type
                });
                
                found = true;
            };
            i = i + 1;
        };
        
        assert!(found, EPathNotFound);
        
        // If all conflicts are resolved, mark the merge as successful
        if (vector::is_empty(conflicts)) {
            result.is_success = true;
            
            // Set the result commit ID
            // In a real implementation, we would create a new commit
            // For now, just use either the source or target commit ID
            if (result.strategy == MERGE_STRATEGY_OURS) {
                result.result_commit_id = option::some(result.target_commit_id);
            } else if (result.strategy == MERGE_STRATEGY_THEIRS) {
                result.result_commit_id = option::some(result.source_commit_id);
            } else {
                // For recursive strategy, use target as the base for the result
                result.result_commit_id = option::some(result.target_commit_id);
            }
        }
    }
    
    /// Create a merged tree from source, target, and resolution decisions
    public fun create_merged_tree(
        result: &MergeResult,
        source_tree: &GitTreeObject,
        target_tree: &GitTreeObject,
        ctx: &mut TxContext
    ): GitTreeObject {
        // This would be a complex implementation in a real system
        // For now, we'll return a simplified implementation
        
        // Create a new tree with a unique hash
        let hash = string::utf8(b"merged-tree-");
        string::append(&mut hash, git_tree_object::hash(target_tree));
        string::append(&mut hash, string::utf8(b"-"));
        string::append(&mut hash, git_tree_object::hash(source_tree));
        
        let merged_tree = git_tree_object::create(hash, ctx);
        
        // In a real implementation, we would:
        // 1. Copy all entries from the target tree
        // 2. Apply all resolved changes from the path_changes table
        // 3. Copy non-conflicting changes from the source tree
        
        merged_tree
    }
    
    /// Create a new commit from the merge result
    public fun create_merge_commit(
        result: &MergeResult,
        merged_tree: &GitTreeObject,
        ctx: &mut TxContext
    ): GitCommitObject {
        // Create a merge commit message
        let message = string::utf8(b"Merge commit ");
        string::append(&mut message, string::utf8(object::id_to_string(&result.source_commit_id)));
        string::append(&mut message, string::utf8(b" into "));
        string::append(&mut message, string::utf8(object::id_to_string(&result.target_commit_id)));
        
        // Create a unique hash for the commit
        let hash = string::utf8(b"merge-commit-");
        string::append(&mut hash, git_tree_object::hash(merged_tree));
        
        // Create the commit with two parents
        // Note: In a real implementation, we would need to extend GitCommitObject
        // to support multiple parents for merge commits
        
        // For now, just use the target commit as the parent
        git_commit_object::create(
            object::id(merged_tree),
            option::some(result.target_commit_id),
            message,
            hash,
            option::none(), // No metadata
            ctx
        )
    }
    
    // Getter and utility functions
    
    /// Check if a merge has conflicts
    public fun has_conflicts(result: &MergeResult): bool {
        !vector::is_empty(&result.conflicts)
    }
    
    /// Get number of conflicts in a merge
    public fun conflict_count(result: &MergeResult): u64 {
        vector::length(&result.conflicts)
    }
    
    /// Check if a merge was successful
    public fun is_success(result: &MergeResult): bool {
        result.is_success
    }
    
    /// Get the result commit ID, if merge was successful
    public fun result_commit_id(result: &MergeResult): &Option<ID> {
        &result.result_commit_id
    }
    
    /// Get the strategy used for the merge
    public fun strategy(result: &MergeResult): u8 {
        result.strategy
    }
    
    /// Get the base commit ID used for three-way merge
    public fun base_commit_id(result: &MergeResult): &Option<ID> {
        &result.base_commit_id
    }
    
    /// Get the list of conflicts
    public fun conflicts(result: &MergeResult): &vector<MergeConflict> {
        &result.conflicts
    }
    
    /// Get conflict path
    public fun conflict_path(conflict: &MergeConflict): String {
        conflict.path
    }
    
    /// Get conflict type
    public fun conflict_type(conflict: &MergeConflict): u8 {
        conflict.conflict_type
    }
    
    /// Get "our" version object ID
    public fun conflict_ours_id(conflict: &MergeConflict): &Option<ID> {
        &conflict.ours_object_id
    }
    
    /// Get "their" version object ID
    public fun conflict_theirs_id(conflict: &MergeConflict): &Option<ID> {
        &conflict.theirs_object_id
    }
    
    /// Get base version object ID
    public fun conflict_base_id(conflict: &MergeConflict): &Option<ID> {
        &conflict.base_object_id
    }
}