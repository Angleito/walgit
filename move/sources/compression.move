module walgit::compression {
    use std::vector;
    use std::option::{Self, Option};
    use sui::object::{Self, UID};
    use sui::tx_context::TxContext;
    
    /// Error codes
    const EInvalidCompressionLevel: u64 = 1;
    const ECompressionFailed: u64 = 2;
    const EDecompressionFailed: u64 = 3;
    const EUnsupportedAlgorithm: u64 = 4;
    const EDataTooLarge: u64 = 5;
    
    /// Compression algorithms
    const ALGO_NONE: u8 = 0;
    const ALGO_ZLIB: u8 = 1;
    const ALGO_GZIP: u8 = 2;
    const ALGO_ZSTD: u8 = 3;
    const ALGO_LZ4: u8 = 4;
    
    /// Compression levels
    const LEVEL_NONE: u8 = 0;
    const LEVEL_FAST: u8 = 1;
    const LEVEL_DEFAULT: u8 = 6;
    const LEVEL_BEST: u8 = 9;
    
    /// Maximum uncompressed size (100 MB)
    const MAX_UNCOMPRESSED_SIZE: u64 = 104857600;
    
    /// Compressed data wrapper
    public struct CompressedData has store, drop, copy {
        algorithm: u8,
        level: u8,
        compressed_size: u64,
        uncompressed_size: u64,
        data: vector<u8>,
        checksum: u32
    }
    
    /// Compression statistics
    public struct CompressionStats has store, drop {
        total_compressed: u64,
        total_uncompressed: u64,
        compression_ratio: u64,
        algorithm_usage: vector<AlgorithmUsage>
    }
    
    public struct AlgorithmUsage has store, drop {
        algorithm: u8,
        count: u64,
        bytes_compressed: u64,
        bytes_saved: u64
    }
    
    /// Compress data using specified algorithm
    public fun compress(
        data: &vector<u8>,
        algorithm: u8,
        level: u8
    ): CompressedData {
        assert!(level <= LEVEL_BEST, EInvalidCompressionLevel);
        assert!(vector::length(data) <= MAX_UNCOMPRESSED_SIZE, EDataTooLarge);
        
        let compressed = if (algorithm == ALGO_NONE) {
            *data
        } else if (algorithm == ALGO_ZLIB) {
            compress_zlib(data, level)
        } else if (algorithm == ALGO_GZIP) {
            compress_gzip(data, level)
        } else if (algorithm == ALGO_ZSTD) {
            compress_zstd(data, level)
        } else if (algorithm == ALGO_LZ4) {
            compress_lz4(data, level)
        } else {
            abort EUnsupportedAlgorithm
        };
        
        CompressedData {
            algorithm,
            level,
            compressed_size: vector::length(&compressed),
            uncompressed_size: vector::length(data),
            data: compressed,
            checksum: calculate_checksum(data)
        }
    }
    
    /// Decompress data
    public fun decompress(compressed: &CompressedData): vector<u8> {
        let decompressed = if (compressed.algorithm == ALGO_NONE) {
            compressed.data
        } else if (compressed.algorithm == ALGO_ZLIB) {
            decompress_zlib(&compressed.data)
        } else if (compressed.algorithm == ALGO_GZIP) {
            decompress_gzip(&compressed.data)
        } else if (compressed.algorithm == ALGO_ZSTD) {
            decompress_zstd(&compressed.data)
        } else if (compressed.algorithm == ALGO_LZ4) {
            decompress_lz4(&compressed.data)
        } else {
            abort EUnsupportedAlgorithm
        };
        
        // Verify checksum
        let checksum = calculate_checksum(&decompressed);
        assert!(checksum == compressed.checksum, EDecompressionFailed);
        
        decompressed
    }
    
    /// Compress with default settings (ZLIB, level 6)
    public fun compress_data(data: &vector<u8>): vector<u8> {
        let compressed = compress(data, ALGO_ZLIB, LEVEL_DEFAULT);
        compressed.data
    }
    
    /// Decompress with default settings
    public fun decompress_data(data: &vector<u8>): vector<u8> {
        let compressed = CompressedData {
            algorithm: ALGO_ZLIB,
            level: LEVEL_DEFAULT,
            compressed_size: vector::length(data),
            uncompressed_size: 0, // Unknown until decompressed
            data: *data,
            checksum: 0 // Will be verified during decompression
        };
        
        decompress(&compressed)
    }
    
    /// Choose best algorithm for data type
    public fun choose_algorithm(
        data: &vector<u8>,
        speed_priority: bool
    ): u8 {
        let size = vector::length(data);
        
        if (size < 1024) {
            // Small data - no compression
            ALGO_NONE
        } else if (speed_priority) {
            // Prioritize speed
            ALGO_LZ4
        } else if (is_text_data(data)) {
            // Text compresses well with ZLIB
            ALGO_ZLIB
        } else if (size > 1048576) {
            // Large data - use ZSTD
            ALGO_ZSTD
        } else {
            // Default
            ALGO_GZIP
        }
    }
    
    /// Get compression ratio (percentage)
    public fun get_compression_ratio(compressed: &CompressedData): u64 {
        if (compressed.uncompressed_size == 0) {
            100
        } else {
            ((compressed.compressed_size * 100) / compressed.uncompressed_size)
        }
    }
    
    /// Check if compression is beneficial
    public fun should_compress(
        original_size: u64,
        compressed_size: u64,
        threshold_percent: u64
    ): bool {
        compressed_size < (original_size * threshold_percent / 100)
    }
    
    // ====== Algorithm implementations (simplified) ======
    
    fun compress_zlib(data: &vector<u8>, level: u8): vector<u8> {
        // Simplified ZLIB compression
        // In production, would use actual ZLIB implementation
        let compressed = vector::empty();
        
        // Add ZLIB header
        vector::push_back(&mut compressed, 0x78); // CMF
        vector::push_back(&mut compressed, level); // FLG
        
        // Simplified compression (just copy for now)
        let i = 0;
        while (i < vector::length(data)) {
            let byte = *vector::borrow(data, i);
            // Simple RLE compression
            if (i + 1 < vector::length(data) && byte == *vector::borrow(data, i + 1)) {
                let count = 1;
                while (i + count < vector::length(data) && 
                       byte == *vector::borrow(data, i + count) && 
                       count < 255) {
                    count = count + 1;
                };
                vector::push_back(&mut compressed, 0xFF); // RLE marker
                vector::push_back(&mut compressed, (count as u8));
                vector::push_back(&mut compressed, byte);
                i = i + count;
            } else {
                vector::push_back(&mut compressed, byte);
                i = i + 1;
            }
        };
        
        compressed
    }
    
    fun decompress_zlib(data: &vector<u8>): vector<u8> {
        // Simplified ZLIB decompression
        let decompressed = vector::empty();
        
        // Skip ZLIB header
        let i = 2;
        while (i < vector::length(data)) {
            let byte = *vector::borrow(data, i);
            
            if (byte == 0xFF && i + 2 < vector::length(data)) {
                // RLE decompression
                let count = *vector::borrow(data, i + 1);
                let value = *vector::borrow(data, i + 2);
                
                let j = 0;
                while (j < (count as u64)) {
                    vector::push_back(&mut decompressed, value);
                    j = j + 1;
                };
                i = i + 3;
            } else {
                vector::push_back(&mut decompressed, byte);
                i = i + 1;
            }
        };
        
        decompressed
    }
    
    fun compress_gzip(data: &vector<u8>, level: u8): vector<u8> {
        // Simplified GZIP compression
        // Add GZIP header and use ZLIB compression
        let compressed = vector::empty();
        
        // GZIP header
        vector::push_back(&mut compressed, 0x1f); // ID1
        vector::push_back(&mut compressed, 0x8b); // ID2
        vector::push_back(&mut compressed, 0x08); // CM (deflate)
        vector::push_back(&mut compressed, 0x00); // FLG
        
        // Timestamp (4 bytes) - set to 0
        let i = 0;
        while (i < 4) {
            vector::push_back(&mut compressed, 0x00);
            i = i + 1;
        };
        
        vector::push_back(&mut compressed, level); // XFL
        vector::push_back(&mut compressed, 0x00); // OS
        
        // Use ZLIB compression for the data
        let zlib_compressed = compress_zlib(data, level);
        vector::append(&mut compressed, zlib_compressed);
        
        compressed
    }
    
    fun decompress_gzip(data: &vector<u8>): vector<u8> {
        // Skip GZIP header (10 bytes) and decompress with ZLIB
        let zlib_data = vector::empty();
        let i = 10;
        
        while (i < vector::length(data)) {
            vector::push_back(&mut zlib_data, *vector::borrow(data, i));
            i = i + 1;
        };
        
        decompress_zlib(&zlib_data)
    }
    
    fun compress_zstd(data: &vector<u8>, level: u8): vector<u8> {
        // Simplified ZSTD compression
        // In production would use actual ZSTD implementation
        compress_zlib(data, level) // Fallback to ZLIB
    }
    
    fun decompress_zstd(data: &vector<u8>): vector<u8> {
        // Simplified ZSTD decompression
        decompress_zlib(data) // Fallback to ZLIB
    }
    
    fun compress_lz4(data: &vector<u8>, _level: u8): vector<u8> {
        // Simplified LZ4 compression
        // LZ4 is optimized for speed, minimal compression
        let compressed = vector::empty();
        
        // LZ4 header
        vector::push_back(&mut compressed, 0x04); // Magic number
        vector::push_back(&mut compressed, 0x22); 
        vector::push_back(&mut compressed, 0x4D); 
        vector::push_back(&mut compressed, 0x18); 
        
        // Simple compression - copy with basic deduplication
        vector::append(&mut compressed, *data);
        
        compressed
    }
    
    fun decompress_lz4(data: &vector<u8>): vector<u8> {
        // Skip LZ4 header and return data
        let decompressed = vector::empty();
        let i = 4; // Skip header
        
        while (i < vector::length(data)) {
            vector::push_back(&mut decompressed, *vector::borrow(data, i));
            i = i + 1;
        };
        
        decompressed
    }
    
    // ====== Helper functions ======
    
    fun is_text_data(data: &vector<u8>): bool {
        // Check if data is likely text (ASCII)
        let i = 0;
        let text_count = 0;
        let sample_size = if (vector::length(data) > 100) { 100 } else { vector::length(data) };
        
        while (i < sample_size) {
            let byte = *vector::borrow(data, i);
            if ((byte >= 32 && byte <= 126) || byte == 9 || byte == 10 || byte == 13) {
                text_count = text_count + 1;
            };
            i = i + 1;
        };
        
        // If >80% of sample is text-like, consider it text
        (text_count * 100 / sample_size) > 80
    }
    
    fun calculate_checksum(data: &vector<u8>): u32 {
        // Simple checksum calculation
        let checksum: u64 = 0;
        let i = 0;
        
        while (i < vector::length(data)) {
            checksum = (checksum + (*vector::borrow(data, i) as u64)) % 4294967296;
            i = i + 1;
        };
        
        (checksum as u32)
    }
    
    /// Get statistics for multiple compressions
    public fun calculate_compression_stats(
        compressions: &vector<CompressedData>
    ): CompressionStats {
        let total_compressed = 0;
        let total_uncompressed = 0;
        let algorithm_stats = vector::empty();
        
        // Initialize algorithm usage
        let i = 0;
        while (i <= 4) { // 5 algorithms
            vector::push_back(&mut algorithm_stats, AlgorithmUsage {
                algorithm: (i as u8),
                count: 0,
                bytes_compressed: 0,
                bytes_saved: 0
            });
            i = i + 1;
        };
        
        // Process each compression
        i = 0;
        while (i < vector::length(compressions)) {
            let comp = vector::borrow(compressions, i);
            
            total_compressed = total_compressed + comp.compressed_size;
            total_uncompressed = total_uncompressed + comp.uncompressed_size;
            
            // Update algorithm stats
            let algo_stat = vector::borrow_mut(&mut algorithm_stats, (comp.algorithm as u64));
            algo_stat.count = algo_stat.count + 1;
            algo_stat.bytes_compressed = algo_stat.bytes_compressed + comp.compressed_size;
            algo_stat.bytes_saved = algo_stat.bytes_saved + 
                (comp.uncompressed_size - comp.compressed_size);
            
            i = i + 1;
        };
        
        CompressionStats {
            total_compressed,
            total_uncompressed,
            compression_ratio: if (total_compressed > 0) {
                (total_uncompressed * 100) / total_compressed
            } else {
                100
            },
            algorithm_usage: algorithm_stats
        }
    }
}