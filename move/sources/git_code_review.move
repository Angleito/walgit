module walgit::git_code_review {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::table::{Self, Table};
    use sui::event;
    use sui::transfer;
    use sui::dynamic_field as df;
    use std::string::{Self, String};
    use std::vector;
    use std::option::{Self, Option};
    
    use walgit::git_pull_request::{Self, PullRequest};
    use walgit::git_repository::{Self, Repository};

    /// Error codes
    const ENotPullRequestOwner: u64 = 1;
    const ENotReviewOwner: u64 = 2;
    const ECommentNotFound: u64 = 3;
    const EInvalidLineNumber: u64 = 4;
    const EPullRequestMismatch: u64 = 5;
    const EUnauthorized: u64 = 6;
    const EThreadClosed: u64 = 7;

    /// Review thread status
    const THREAD_STATUS_OPEN: u8 = 0;
    const THREAD_STATUS_RESOLVED: u8 = 1;
    const THREAD_STATUS_OUTDATED: u8 = 2;

    /// Inline comment represents a code review comment on a specific file and line
    struct InlineComment has key, store {
        id: UID,
        pull_request_id: ID,
        commenter: address,
        file_path: String,
        line_number: u64,
        content: String,
        created_at: u64,
        commit_id: Option<String>, // Optional reference to which commit this comment applies to
    }
    
    /// ReviewThread represents a discussion thread on a specific code location
    struct ReviewThread has key, store {
        id: UID,
        pull_request_id: ID,
        file_path: String,
        line_number: u64,
        status: u8, // 0: open, 1: resolved, 2: outdated
        creator: address,
        created_at: u64,
        comments: vector<ID>, // IDs of comments in this thread
        resolved_by: Option<address>, // Who resolved this thread, if resolved
        resolved_at: Option<u64>, // When this thread was resolved
    }
    
    /// CodeReviewSummary tracks all review data for a repository
    struct CodeReviewSummary has key, store {
        id: UID,
        repository_id: ID,
        threads_by_pr: Table<ID, vector<ID>>, // Maps PR ID to thread IDs
        comments_by_pr: Table<ID, vector<ID>>, // Maps PR ID to comment IDs
    }
    
    /// Events
    struct CommentCreated has copy, drop {
        comment_id: ID,
        pull_request_id: ID,
        commenter: address,
        file_path: String,
        line_number: u64,
        thread_id: Option<ID>,
    }
    
    struct ThreadCreated has copy, drop {
        thread_id: ID,
        pull_request_id: ID,
        file_path: String,
        line_number: u64,
        creator: address,
    }
    
    struct ThreadResolved has copy, drop {
        thread_id: ID,
        pull_request_id: ID,
        resolved_by: address,
    }
    
    struct ThreadReopened has copy, drop {
        thread_id: ID,
        pull_request_id: ID,
        reopened_by: address,
    }
    
    /// Initialize the code review system for a repository
    public fun initialize(repository: &Repository, ctx: &mut TxContext) {
        let repo_id = git_repository::id(repository);
        let summary = CodeReviewSummary {
            id: object::new(ctx),
            repository_id: repo_id,
            threads_by_pr: table::new(ctx),
            comments_by_pr: table::new(ctx),
        };
        
        // Make it a shared object
        transfer::share_object(summary);
    }
    
    /// Create an inline comment on a specific file and line
    public fun create_inline_comment(
        pull_request: &PullRequest,
        file_path: String,
        line_number: u64,
        content: String,
        commit_id: Option<String>,
        review_summary: &mut CodeReviewSummary,
        ctx: &mut TxContext
    ): ID {
        let pr_id = git_pull_request::id(pull_request);
        
        // Validate
        assert!(review_summary.repository_id == git_pull_request::repository_id(pull_request), EPullRequestMismatch);
        
        // Create the comment
        let comment = InlineComment {
            id: object::new(ctx),
            pull_request_id: pr_id,
            commenter: tx_context::sender(ctx),
            file_path,
            line_number,
            content,
            created_at: tx_context::epoch(ctx),
            commit_id,
        };
        
        let comment_id = object::id(&comment);
        
        // Store in table if entry exists, otherwise create new entry
        if (!table::contains(&review_summary.comments_by_pr, pr_id)) {
            table::add(&mut review_summary.comments_by_pr, pr_id, vector::singleton(comment_id));
        } else {
            let comments = table::borrow_mut(&mut review_summary.comments_by_pr, pr_id);
            vector::push_back(comments, comment_id);
        };
        
        // Emit event
        event::emit(CommentCreated {
            comment_id,
            pull_request_id: pr_id,
            commenter: tx_context::sender(ctx),
            file_path: file_path,
            line_number,
            thread_id: option::none(),
        });
        
        // Transfer to shared object
        transfer::share_object(comment);
        
        comment_id
    }
    
    /// Create a review thread on a specific file and line
    public fun create_review_thread(
        pull_request: &PullRequest,
        file_path: String,
        line_number: u64,
        initial_comment: String,
        commit_id: Option<String>,
        review_summary: &mut CodeReviewSummary,
        ctx: &mut TxContext
    ): ID {
        let pr_id = git_pull_request::id(pull_request);
        
        // Validate
        assert!(review_summary.repository_id == git_pull_request::repository_id(pull_request), EPullRequestMismatch);
        
        // Create the thread
        let thread = ReviewThread {
            id: object::new(ctx),
            pull_request_id: pr_id,
            file_path,
            line_number,
            status: THREAD_STATUS_OPEN,
            creator: tx_context::sender(ctx),
            created_at: tx_context::epoch(ctx),
            comments: vector::empty(),
            resolved_by: option::none(),
            resolved_at: option::none(),
        };
        
        let thread_id = object::id(&thread);
        
        // Create the initial comment
        let comment = InlineComment {
            id: object::new(ctx),
            pull_request_id: pr_id,
            commenter: tx_context::sender(ctx),
            file_path,
            line_number,
            content: initial_comment,
            created_at: tx_context::epoch(ctx),
            commit_id,
        };
        
        let comment_id = object::id(&comment);
        
        // Add comment to thread
        vector::push_back(&mut thread.comments, comment_id);
        
        // Store thread in table
        if (!table::contains(&review_summary.threads_by_pr, pr_id)) {
            table::add(&mut review_summary.threads_by_pr, pr_id, vector::singleton(thread_id));
        } else {
            let threads = table::borrow_mut(&mut review_summary.threads_by_pr, pr_id);
            vector::push_back(threads, thread_id);
        };
        
        // Store comment in table
        if (!table::contains(&review_summary.comments_by_pr, pr_id)) {
            table::add(&mut review_summary.comments_by_pr, pr_id, vector::singleton(comment_id));
        } else {
            let comments = table::borrow_mut(&mut review_summary.comments_by_pr, pr_id);
            vector::push_back(comments, comment_id);
        };
        
        // Emit events
        event::emit(ThreadCreated {
            thread_id,
            pull_request_id: pr_id,
            file_path: file_path,
            line_number,
            creator: tx_context::sender(ctx),
        });
        
        event::emit(CommentCreated {
            comment_id,
            pull_request_id: pr_id,
            commenter: tx_context::sender(ctx),
            file_path: file_path,
            line_number,
            thread_id: option::some(thread_id),
        });
        
        // Transfer to shared objects
        transfer::share_object(thread);
        transfer::share_object(comment);
        
        thread_id
    }
    
    /// Add a comment to an existing review thread
    public fun reply_to_thread(
        thread: &mut ReviewThread,
        content: String,
        review_summary: &mut CodeReviewSummary,
        ctx: &mut TxContext
    ): ID {
        // Ensure thread is open
        assert!(thread.status == THREAD_STATUS_OPEN, EThreadClosed);
        
        // Create the comment
        let comment = InlineComment {
            id: object::new(ctx),
            pull_request_id: thread.pull_request_id,
            commenter: tx_context::sender(ctx),
            file_path: thread.file_path,
            line_number: thread.line_number,
            content,
            created_at: tx_context::epoch(ctx),
            commit_id: option::none(), // Reply doesn't need commit reference
        };
        
        let comment_id = object::id(&comment);
        
        // Add to thread
        vector::push_back(&mut thread.comments, comment_id);
        
        // Add to summary
        if (table::contains(&review_summary.comments_by_pr, thread.pull_request_id)) {
            let comments = table::borrow_mut(&mut review_summary.comments_by_pr, thread.pull_request_id);
            vector::push_back(comments, comment_id);
        };
        
        // Emit event
        event::emit(CommentCreated {
            comment_id,
            pull_request_id: thread.pull_request_id,
            commenter: tx_context::sender(ctx),
            file_path: thread.file_path,
            line_number: thread.line_number,
            thread_id: option::some(object::id(thread)),
        });
        
        // Transfer to shared object
        transfer::share_object(comment);
        
        comment_id
    }
    
    /// Resolve a review thread
    public fun resolve_thread(thread: &mut ReviewThread, ctx: &mut TxContext) {
        assert!(thread.status == THREAD_STATUS_OPEN, EThreadClosed);
        
        thread.status = THREAD_STATUS_RESOLVED;
        thread.resolved_by = option::some(tx_context::sender(ctx));
        thread.resolved_at = option::some(tx_context::epoch(ctx));
        
        event::emit(ThreadResolved {
            thread_id: object::id(thread),
            pull_request_id: thread.pull_request_id,
            resolved_by: tx_context::sender(ctx),
        });
    }
    
    /// Reopen a resolved thread
    public fun reopen_thread(thread: &mut ReviewThread, ctx: &mut TxContext) {
        assert!(thread.status == THREAD_STATUS_RESOLVED, EThreadClosed);
        
        thread.status = THREAD_STATUS_OPEN;
        
        event::emit(ThreadReopened {
            thread_id: object::id(thread),
            pull_request_id: thread.pull_request_id,
            reopened_by: tx_context::sender(ctx),
        });
    }
    
    /// Mark threads as outdated when their referenced code changes
    public fun mark_threads_outdated(
        pull_request_id: ID,
        file_path: String,
        line_numbers: vector<u64>,
        review_summary: &mut CodeReviewSummary,
        ctx: &mut TxContext
    ) {
        // Get threads for this PR
        if (table::contains(&review_summary.threads_by_pr, pull_request_id)) {
            let thread_ids = table::borrow(&review_summary.threads_by_pr, pull_request_id);
            let len = vector::length(thread_ids);
            
            for (i in 0..len) {
                let thread_id = *vector::borrow(thread_ids, i);
                let thread_ref = df::borrow_mut<ID, ReviewThread>(&mut review_summary.id, thread_id);
                
                // Check if this thread matches the file path and is in the affected line numbers
                if (thread_ref.file_path == file_path && 
                    vector::contains(&line_numbers, &thread_ref.line_number) &&
                    thread_ref.status != THREAD_STATUS_OUTDATED) {
                    
                    thread_ref.status = THREAD_STATUS_OUTDATED;
                }
            };
        };
    }
    
    /// Get all threads for a pull request
    public fun get_threads_for_pr(
        review_summary: &CodeReviewSummary,
        pull_request_id: ID
    ): vector<ID> {
        if (table::contains(&review_summary.threads_by_pr, pull_request_id)) {
            *table::borrow(&review_summary.threads_by_pr, pull_request_id)
        } else {
            vector::empty()
        }
    }
    
    /// Get all comments for a pull request
    public fun get_comments_for_pr(
        review_summary: &CodeReviewSummary,
        pull_request_id: ID
    ): vector<ID> {
        if (table::contains(&review_summary.comments_by_pr, pull_request_id)) {
            *table::borrow(&review_summary.comments_by_pr, pull_request_id)
        } else {
            vector::empty()
        }
    }
    
    /// Get all comments in a thread
    public fun get_comments_in_thread(thread: &ReviewThread): vector<ID> {
        thread.comments
    }
    
    /// Public getters for thread properties
    public fun thread_status(thread: &ReviewThread): u8 { thread.status }
    public fun thread_file_path(thread: &ReviewThread): String { thread.file_path }
    public fun thread_line_number(thread: &ReviewThread): u64 { thread.line_number }
    public fun thread_creator(thread: &ReviewThread): address { thread.creator }
    public fun thread_created_at(thread: &ReviewThread): u64 { thread.created_at }
    public fun thread_resolved_by(thread: &ReviewThread): Option<address> { thread.resolved_by }
    public fun thread_resolved_at(thread: &ReviewThread): Option<u64> { thread.resolved_at }
    
    /// Public getters for comment properties
    public fun comment_pull_request_id(comment: &InlineComment): ID { comment.pull_request_id }
    public fun comment_commenter(comment: &InlineComment): address { comment.commenter }
    public fun comment_file_path(comment: &InlineComment): String { comment.file_path }
    public fun comment_line_number(comment: &InlineComment): u64 { comment.line_number }
    public fun comment_content(comment: &InlineComment): String { comment.content }
    public fun comment_created_at(comment: &InlineComment): u64 { comment.created_at }
    public fun comment_commit_id(comment: &InlineComment): Option<String> { comment.commit_id }
}