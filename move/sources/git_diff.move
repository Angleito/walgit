module walgit::git_diff {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    
    use walgit::git_repository::{Self, Repository};
    use walgit::git_commit_object::{Self, Commit};

    /// Error codes
    const EInvalidHunkRange: u64 = 1;
    const ERepositoryMismatch: u64 = 2;
    const EDiffNotFound: u64 = 3;
    const EInvalidDiffOperation: u64 = 4;

    /// Diff change type constants
    const DIFF_ADDED: u8 = 0;
    const DIFF_REMOVED: u8 = 1;
    const DIFF_MODIFIED: u8 = 2;
    const DIFF_UNCHANGED: u8 = 3;

    /// A file diff hunk represents a continuous block of changes in a file
    struct FileDiffHunk has store {
        old_start: u64,
        old_lines: u64,
        new_start: u64,
        new_lines: u64,
        context_before: vector<String>,
        lines: vector<FileDiffLine>,
        context_after: vector<String>,
    }
    
    /// A single line in a diff showing the change
    struct FileDiffLine has store {
        change_type: u8, // 0: added, 1: removed, 2: modified, 3: unchanged
        line_number_old: Option<u64>,
        line_number_new: Option<u64>,
        content: String,
    }
    
    /// A diff for a specific file
    struct FileDiff has key, store {
        id: UID,
        repository_id: ID,
        commit_id: ID,
        file_path: String,
        hunks: vector<FileDiffHunk>,
        stats: FileDiffStats,
        binary: bool, // Whether this is a binary file
    }
    
    /// Statistics for a file diff
    struct FileDiffStats has store {
        added: u64,
        removed: u64,
        modified: u64,
    }
    
    /// Collection of diffs for a commit
    struct CommitDiff has key {
        id: UID,
        repository_id: ID,
        commit_id: ID,
        file_diffs: Table<String, ID>, // Maps file path to FileDiff ID
        file_paths: vector<String>,    // Track table keys for iteration
        stats: FileDiffStats,
    }
    
    /// Events
    public struct CommitDiffCreated has copy, drop {
        diff_id: ID,
        repository_id: ID,
        commit_id: ID,
        files_changed: u64,
    }
    
    public struct FileDiffCreated has copy, drop {
        diff_id: ID,
        repository_id: ID,
        commit_id: ID,
        file_path: String,
        added: u64,
        removed: u64,
        modified: u64,
    }
    
    /// Create a diff for a commit
    public fun create_commit_diff(
        repository: &Repository,
        commit: &Commit,
        ctx: &mut TxContext
    ): ID {
        let repo_id = git_repository::id(repository);
        let commit_id = git_commit_object::id(commit);
        
        // Create the commit diff
        let diff = CommitDiff {
            id: object::new(ctx),
            repository_id: repo_id,
            commit_id: commit_id,
            file_diffs: table::new(ctx),
            file_paths: vector::empty(),  // Initialize empty vector for tracking file paths
            stats: FileDiffStats {
                added: 0,
                removed: 0,
                modified: 0,
            },
        };
        
        let diff_id = object::id(&diff);
        
        event::emit(CommitDiffCreated {
            diff_id,
            repository_id: repo_id,
            commit_id: commit_id,
            files_changed: 0, // Will be updated as file diffs are added
        });
        
        transfer::share_object(diff);
        
        diff_id
    }
    
    /// Add a file diff to a commit diff
    public fun add_file_diff(
        commit_diff: &mut CommitDiff,
        file_path: String,
        hunks: vector<FileDiffHunk>,
        binary: bool,
        ctx: &mut TxContext
    ): ID {
        // Calculate statistics
        let added = 0;
        let removed = 0;
        let modified = 0;
        
        let hunks_len = vector::length(&hunks);
        let i = 0;
        while (i < hunks_len) {
            let hunk = vector::borrow(&hunks, i);
            let lines_len = vector::length(&hunk.lines);
            
            let j = 0;
            while (j < lines_len) {
                let line = vector::borrow(&hunk.lines, j);
                if (line.change_type == DIFF_ADDED) {
                    added = added + 1;
                } else if (line.change_type == DIFF_REMOVED) {
                    removed = removed + 1;
                } else if (line.change_type == DIFF_MODIFIED) {
                    modified = modified + 1;
                };
                j = j + 1;
            };
            i = i + 1;
        };
        
        // Create the file diff
        let file_diff = FileDiff {
            id: object::new(ctx),
            repository_id: commit_diff.repository_id,
            commit_id: commit_diff.commit_id,
            file_path: file_path,
            hunks,
            stats: FileDiffStats {
                added,
                removed,
                modified,
            },
            binary,
        };
        
        let file_diff_id = object::id(&file_diff);
        
        // Add to commit diff
        table::add(&mut commit_diff.file_diffs, file_path, file_diff_id);
        // Track the file path for iteration
        vector::push_back(&mut commit_diff.file_paths, file_path);
        
        // Update commit diff stats
        commit_diff.stats.added = commit_diff.stats.added + added;
        commit_diff.stats.removed = commit_diff.stats.removed + removed;
        commit_diff.stats.modified = commit_diff.stats.modified + modified;
        
        // Emit event
        event::emit(FileDiffCreated {
            diff_id: file_diff_id,
            repository_id: commit_diff.repository_id,
            commit_id: commit_diff.commit_id,
            file_path: file_path,
            added,
            removed,
            modified,
        });
        
        // Make the file diff a shared object
        transfer::share_object(file_diff);
        
        file_diff_id
    }
    
    /// Create a new file diff hunk
    public fun create_file_diff_hunk(
        old_start: u64,
        old_lines: u64,
        new_start: u64,
        new_lines: u64,
        context_before: vector<String>,
        lines: vector<FileDiffLine>,
        context_after: vector<String>,
    ): FileDiffHunk {
        // Ensure valid hunk range
        assert!(old_lines > 0 || new_lines > 0, EInvalidHunkRange);
        
        FileDiffHunk {
            old_start,
            old_lines,
            new_start,
            new_lines,
            context_before,
            lines,
            context_after,
        }
    }
    
    /// Create a new diff line for added content
    public fun create_added_line(
        line_number: u64,
        content: String
    ): FileDiffLine {
        FileDiffLine {
            change_type: DIFF_ADDED,
            line_number_old: option::none(),
            line_number_new: option::some(line_number),
            content,
        }
    }
    
    /// Create a new diff line for removed content
    public fun create_removed_line(
        line_number: u64,
        content: String
    ): FileDiffLine {
        FileDiffLine {
            change_type: DIFF_REMOVED,
            line_number_old: option::some(line_number),
            line_number_new: option::none(),
            content,
        }
    }
    
    /// Create a new diff line for modified content (shown as removed + added in most UIs)
    public fun create_modified_line(
        old_line_number: u64,
        new_line_number: u64,
        content: String
    ): FileDiffLine {
        FileDiffLine {
            change_type: DIFF_MODIFIED,
            line_number_old: option::some(old_line_number),
            line_number_new: option::some(new_line_number),
            content,
        }
    }
    
    /// Create a new diff line for unchanged content
    public fun create_unchanged_line(
        old_line_number: u64,
        new_line_number: u64,
        content: String
    ): FileDiffLine {
        FileDiffLine {
            change_type: DIFF_UNCHANGED,
            line_number_old: option::some(old_line_number),
            line_number_new: option::some(new_line_number),
            content,
        }
    }
    
    /// Get the file diffs for a commit
    public fun get_file_diffs(commit_diff: &CommitDiff): vector<ID> {
        let diffs = vector::empty<ID>();
        
        let len = vector::length(&commit_diff.file_paths);
        let i = 0;
        while (i < len) {
            let path = vector::borrow(&commit_diff.file_paths, i);
            let diff_id = table::borrow(&commit_diff.file_diffs, *path);
            vector::push_back(&mut diffs, *diff_id);
            i = i + 1;
        };
        
        diffs
    }
    
    /// Get statistics for a commit diff
    public fun get_commit_diff_stats(commit_diff: &CommitDiff): (u64, u64, u64, u64) {
        let files_changed = table::length(&commit_diff.file_diffs);
        let added = commit_diff.stats.added;
        let removed = commit_diff.stats.removed;
        let modified = commit_diff.stats.modified;
        
        (files_changed, added, removed, modified)
    }
    
    /// Get statistics for a file diff
    public fun get_file_diff_stats(file_diff: &FileDiff): (u64, u64, u64) {
        (file_diff.stats.added, file_diff.stats.removed, file_diff.stats.modified)
    }
    
    /// Get the hunks in a file diff
    public fun get_file_diff_hunks(file_diff: &FileDiff): &vector<FileDiffHunk> {
        &file_diff.hunks
    }
    
    /// Get the lines in a hunk
    public fun get_hunk_lines(hunk: &FileDiffHunk): &vector<FileDiffLine> {
        &hunk.lines
    }
    
    /// Get hunk range information
    public fun get_hunk_range(hunk: &FileDiffHunk): (u64, u64, u64, u64) {
        (hunk.old_start, hunk.old_lines, hunk.new_start, hunk.new_lines)
    }
    
    /// Check if a line is within a hunk's range
    public fun is_line_in_hunk(hunk: &FileDiffHunk, line_number: u64, is_old_version: bool): bool {
        if (is_old_version) {
            line_number >= hunk.old_start && line_number < (hunk.old_start + hunk.old_lines)
        } else {
            line_number >= hunk.new_start && line_number < (hunk.new_start + hunk.new_lines)
        }
    }
}