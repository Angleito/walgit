#[allow(duplicate_alias, unused_use)]
module walgit::blob {
    use sui::object::{new, UID, ID};
    use sui::tx_context::{TxContext};
    use std::string::String;
    use sui::transfer::share_object;

    /// Represents a Git blob stored on Walrus.
    public struct GitBlobObject has key, store {
        id: UID,
        /// The identifier provided by Walrus for the stored data.
        walrus_blob_id: String,
        /// Optional: Original filename for context.
        filename: Option<String>,
        /// Optional: File type or mode (e.g., executable).
        mode: u8, // Could use an enum or constants for modes
    }

    /// Create a new GitBlobObject.
    /// This function is intended to be called internally during the commit process.
    public fun new(
        walrus_blob_id: String,
        filename: Option<String>,
        mode: u8,
        ctx: &mut TxContext
    ): GitBlobObject {
        GitBlobObject {
            id: new(ctx),
            walrus_blob_id,
            filename,
            mode,
        }
    }

    /// Get the Walrus blob ID.
    public fun walrus_blob_id(blob: &GitBlobObject): &String {
        &blob.walrus_blob_id
    }

    /// Get the filename.
    public fun filename(blob: &GitBlobObject): &Option<String> {
        &blob.filename
    }

    /// Get the mode.
    public fun mode(blob: &GitBlobObject): u8 {
        blob.mode
    }

    /// Share the GitBlobObject (if needed, though typically owned by a Tree).
    public fun share(blob: GitBlobObject) {
        share_object(blob);
    }

    /// Get the ID of the GitBlobObject.
    public fun id(blob: &GitBlobObject): ID {
        id(blob)
    }
}
