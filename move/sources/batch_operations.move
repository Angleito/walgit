module walgit::batch_operations {
    use sui::object::{Self, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::clock::{Self, Clock};
    use std::vector;
    use std::string::{Self, String};
    use std::option::{Self, Option};
    
    use walgit::git_blob_object::{Self, GitBlobObject};
    use walgit::git_tree_object::{Self, GitTreeObject};
    use walgit::git_commit_object::{Self, GitCommitObject};
    use walgit::object_cache::{Self, ObjectCache};
    use walgit::reference_index::{Self, ReferenceIndex};
    
    // Batch operation types
    const OP_CREATE_BLOB: u8 = 1;
    const OP_CREATE_TREE: u8 = 2;
    const OP_CREATE_COMMIT: u8 = 3;
    const OP_UPDATE_REF: u8 = 4;
    const OP_DELETE_REF: u8 = 5;
    const OP_CACHE_OBJECT: u8 = 6;
    
    // Error codes
    const E_INVALID_OPERATION: u64 = 1;
    const E_BATCH_TOO_LARGE: u64 = 2;
    const E_OPERATION_FAILED: u64 = 3;
    const E_DEPENDENCY_FAILED: u64 = 4;
    
    // Maximum operations per batch
    const MAX_BATCH_SIZE: u64 = 100;
    
    /// Batch operation request
    public struct BatchOperation has drop {
        op_type: u8,
        operation_id: u64,    // unique ID within batch
        depends_on: vector<u64>, // operation IDs this depends on
        data: OperationData
    }
    
    /// Create a new batch operation
    public fun new_batch_operation(
        op_type: u8,
        operation_id: u64,
        depends_on: vector<u64>,
        data: OperationData
    ): BatchOperation {
        BatchOperation {
            op_type,
            operation_id,
            depends_on,
            data
        }
    }
    
    /// Operation-specific data
    public struct OperationData has drop {
        // For blob creation
        blob_data: Option<vector<u8>>,
        
        // For tree creation
        tree_entries: Option<vector<TreeEntry>>,
        
        // For commit creation
        commit_data: Option<CommitData>,
        
        // For reference operations
        ref_name: Option<String>,
        ref_target: Option<ID>,
        
        // For caching
        object_id: Option<ID>,
        object_type: Option<u8>
    }
    
    /// Create new operation data
    public fun new_operation_data(
        blob_data: Option<vector<u8>>,
        tree_entries: Option<vector<TreeEntry>>,
        commit_data: Option<CommitData>,
        ref_name: Option<String>,
        ref_target: Option<ID>,
        object_id: Option<ID>,
        object_type: Option<u8>
    ): OperationData {
        OperationData {
            blob_data,
            tree_entries,
            commit_data,
            ref_name,
            ref_target,
            object_id,
            object_type
        }
    }
    
    /// Tree entry for batch tree creation
    public struct TreeEntry has drop {
        name: String,
        object_id: ID,
        mode: u32
    }
    
    /// Commit data for batch commit creation
    public struct CommitData has drop {
        tree_id: ID,
        parent_ids: vector<ID>,
        author: String,
        committer: String,
        message: String,
        timestamp: u64
    }
    
    /// Batch operation result
    public struct BatchResult has drop {
        operation_id: u64,
        success: bool,
        result_id: Option<ID>,
        error_message: Option<String>
    }
    
    /// Check if batch result was successful
    public fun is_successful(result: &BatchResult): bool {
        result.success
    }
    
    /// Execute a batch of operations
    public fun execute_batch(
        operations: vector<BatchOperation>,
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        ctx: &mut TxContext
    ): vector<BatchResult> {
        let results = vector::empty();
        let completed_ops = vector::empty<u64>();
        
        // Validate batch size
        assert!(vector::length(&operations) <= MAX_BATCH_SIZE, E_BATCH_TOO_LARGE);
        
        // Sort operations by dependencies (topological sort)
        let sorted_ops = topological_sort(&operations);
        
        // Execute operations in order
        let i = 0;
        while (i < vector::length(&sorted_ops)) {
            let op_index = *vector::borrow(&sorted_ops, i);
            let operation = vector::borrow(&operations, op_index);
            
            // Check dependencies
            if (check_dependencies(operation, &completed_ops)) {
                // Execute operation
                let result = execute_single_operation(
                    operation,
                    cache,
                    ref_index,
                    ctx
                );
                
                if (result.success) {
                    vector::push_back(&mut completed_ops, operation.operation_id);
                };
                
                vector::push_back(&mut results, result);
            } else {
                // Dependency failed
                let failed_result = BatchResult {
                    operation_id: operation.operation_id,
                    success: false,
                    result_id: option::none(),
                    error_message: option::some(string::utf8(b"Dependency failed"))
                };
                
                vector::push_back(&mut results, failed_result);
            };
            
            i = i + 1;
        };
        
        results
    }
    
    /// Execute a single operation
    fun execute_single_operation(
        operation: &BatchOperation,
        cache: &mut ObjectCache,
        ref_index: &mut ReferenceIndex,
        ctx: &mut TxContext
    ): BatchResult {
        if (operation.op_type == OP_CREATE_BLOB) {
            execute_create_blob(operation, cache, ctx)
        } else if (operation.op_type == OP_CREATE_TREE) {
            execute_create_tree(operation, cache, ctx)
        } else if (operation.op_type == OP_CREATE_COMMIT) {
            execute_create_commit(operation, cache, ctx)
        } else if (operation.op_type == OP_UPDATE_REF) {
            execute_update_ref(operation, ref_index)
        } else if (operation.op_type == OP_DELETE_REF) {
            execute_delete_ref(operation, ref_index)
        } else if (operation.op_type == OP_CACHE_OBJECT) {
            execute_cache_object(operation, cache, ctx)
        } else {
            BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Invalid operation type"))
            }
        }
    }
    
    /// Execute blob creation
    fun execute_create_blob(
        operation: &BatchOperation,
        cache: &mut ObjectCache,
        ctx: &mut TxContext
    ): BatchResult {
        if (option::is_none(&operation.data.blob_data)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing blob data"))
            }
        };
        
        let blob_data = *option::borrow(&operation.data.blob_data);
        
        // Mock blob creation - in reality would create actual blob
        let blob_id = object::new_id_from_bytes(&blob_data);
        
        // Cache the blob
        object_cache::cache_object(
            cache,
            blob_id,
            3, // BLOB type
            blob_data,
            &clock::create_for_testing(ctx)
        );
        
        BatchResult {
            operation_id: operation.operation_id,
            success: true,
            result_id: option::some(blob_id),
            error_message: option::none()
        }
    }
    
    /// Execute tree creation
    fun execute_create_tree(
        operation: &BatchOperation,
        cache: &mut ObjectCache,
        ctx: &mut TxContext
    ): BatchResult {
        if (option::is_none(&operation.data.tree_entries)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing tree entries"))
            }
        };
        
        // Mock tree creation
        let tree_id = object::new_id_from_bytes(b"mock_tree");
        
        BatchResult {
            operation_id: operation.operation_id,
            success: true,
            result_id: option::some(tree_id),
            error_message: option::none()
        }
    }
    
    /// Execute commit creation
    fun execute_create_commit(
        operation: &BatchOperation,
        cache: &mut ObjectCache,
        ctx: &mut TxContext
    ): BatchResult {
        if (option::is_none(&operation.data.commit_data)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing commit data"))
            }
        };
        
        // Mock commit creation
        let commit_id = object::new_id_from_bytes(b"mock_commit");
        
        BatchResult {
            operation_id: operation.operation_id,
            success: true,
            result_id: option::some(commit_id),
            error_message: option::none()
        }
    }
    
    /// Execute reference update
    fun execute_update_ref(
        operation: &BatchOperation,
        ref_index: &mut ReferenceIndex
    ): BatchResult {
        if (option::is_none(&operation.data.ref_name) || 
            option::is_none(&operation.data.ref_target)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing ref data"))
            }
        };
        
        let ref_name = *option::borrow(&operation.data.ref_name);
        let ref_target = *option::borrow(&operation.data.ref_target);
        
        // Create metadata
        let metadata = reference_index::ReferenceMetadata {
            created_at: 0,
            updated_at: 0,
            created_by: @0x0,
            message: option::none()
        };
        
        reference_index::add_reference(
            ref_index,
            ref_name,
            ref_target,
            0, // ref type
            0, // target type
            metadata
        );
        
        BatchResult {
            operation_id: operation.operation_id,
            success: true,
            result_id: option::none(),
            error_message: option::none()
        }
    }
    
    /// Execute reference deletion
    fun execute_delete_ref(
        operation: &BatchOperation,
        ref_index: &mut ReferenceIndex
    ): BatchResult {
        if (option::is_none(&operation.data.ref_name)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing ref name"))
            }
        };
        
        let ref_name = *option::borrow(&operation.data.ref_name);
        let deleted = reference_index::delete_reference(ref_index, ref_name);
        
        BatchResult {
            operation_id: operation.operation_id,
            success: deleted,
            result_id: option::none(),
            error_message: if (deleted) { 
                option::none() 
            } else { 
                option::some(string::utf8(b"Reference not found"))
            }
        }
    }
    
    /// Execute cache object
    fun execute_cache_object(
        operation: &BatchOperation,
        cache: &mut ObjectCache,
        ctx: &mut TxContext
    ): BatchResult {
        if (option::is_none(&operation.data.object_id)) {
            return BatchResult {
                operation_id: operation.operation_id,
                success: false,
                result_id: option::none(),
                error_message: option::some(string::utf8(b"Missing object ID"))
            }
        };
        
        let object_id = *option::borrow(&operation.data.object_id);
        let object_type = if (option::is_some(&operation.data.object_type)) {
            *option::borrow(&operation.data.object_type)
        } else {
            0
        };
        
        // Mock caching
        object_cache::cache_object(
            cache,
            object_id,
            object_type,
            b"mock_data",
            &clock::create_for_testing(ctx)
        );
        
        BatchResult {
            operation_id: operation.operation_id,
            success: true,
            result_id: option::none(),
            error_message: option::none()
        }
    }
    
    /// Check if all dependencies are satisfied
    fun check_dependencies(
        operation: &BatchOperation,
        completed_ops: &vector<u64>
    ): bool {
        let i = 0;
        while (i < vector::length(&operation.depends_on)) {
            let dep_id = *vector::borrow(&operation.depends_on, i);
            
            if (!vector::contains(completed_ops, &dep_id)) {
                return false
            };
            
            i = i + 1;
        };
        
        true
    }
    
    /// Topological sort operations by dependencies
    fun topological_sort(operations: &vector<BatchOperation>): vector<u64> {
        let result = vector::empty();
        let visited = vector::empty<bool>();
        let in_stack = vector::empty<bool>();
        
        // Initialize visited array
        let i = 0;
        while (i < vector::length(operations)) {
            vector::push_back(&mut visited, false);
            vector::push_back(&mut in_stack, false);
            i = i + 1;
        };
        
        // DFS for each unvisited node
        i = 0;
        while (i < vector::length(operations)) {
            if (!*vector::borrow(&visited, i)) {
                dfs_visit(i, operations, &mut visited, &mut in_stack, &mut result);
            };
            i = i + 1;
        };
        
        // Reverse result for correct order
        vector::reverse(&mut result);
        result
    }
    
    /// DFS visit for topological sort
    fun dfs_visit(
        node: u64,
        operations: &vector<BatchOperation>,
        visited: &mut vector<bool>,
        in_stack: &mut vector<bool>,
        result: &mut vector<u64>
    ) {
        *vector::borrow_mut(visited, node) = true;
        *vector::borrow_mut(in_stack, node) = true;
        
        let operation = vector::borrow(operations, node);
        let i = 0;
        
        // Visit all dependencies
        while (i < vector::length(&operation.depends_on)) {
            let dep_id = *vector::borrow(&operation.depends_on, i);
            
            // Find the index of this dependency
            let dep_index = find_operation_index(operations, dep_id);
            
            if (dep_index < vector::length(operations)) {
                if (!*vector::borrow(visited, dep_index)) {
                    dfs_visit(dep_index, operations, visited, in_stack, result);
                }
            };
            
            i = i + 1;
        };
        
        *vector::borrow_mut(in_stack, node) = false;
        vector::push_back(result, node);
    }
    
    /// Find operation index by ID
    fun find_operation_index(
        operations: &vector<BatchOperation>,
        operation_id: u64
    ): u64 {
        let i = 0;
        while (i < vector::length(operations)) {
            let op = vector::borrow(operations, i);
            if (op.operation_id == operation_id) {
                return i
            };
            i = i + 1;
        };
        
        vector::length(operations) // Not found
    }
}