/**
 * Tests for the PersistentCache implementation
 */

import { PersistentCache } from '../cli/src/utils/persistent-cache.js';

// Example usage of PersistentCache
async function demonstratePersistentCache() {
  try {
    // Create a new cache with custom settings
    const cache = new PersistentCache({
      dbName: 'walgit-test-cache',
      storeName: 'test-store',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxAge: 60 * 60 * 1000 // 1 hour
    });
    
    // Initialize the database
    await cache.init();
    console.log('Cache initialized');
    
    // Store some values
    await cache.set('key1', 'Simple string value');
    await cache.set('key2', { complex: 'object', with: { nested: 'properties' } });
    await cache.set('key3', Buffer.from('Binary data example'));
    
    // Store with metadata
    await cache.set('key4', 'Value with metadata', {
      type: 'important-data',
      source: 'user-input',
      expiresAt: Date.now() + 3600000
    });
    
    // Retrieve values
    const value1 = await cache.get('key1');
    console.log('Retrieved value1:', value1);
    
    const value2 = await cache.get('key2');
    console.log('Retrieved value2:', value2);
    
    const value3 = await cache.get('key3');
    console.log('Retrieved value3:', value3.toString());
    
    // Get cache statistics
    const stats = await cache.getStats();
    console.log('Cache statistics:', stats);
    
    // Prune old entries
    const prunedCount = await cache.prune({ maxAge: 24 * 60 * 60 * 1000 });
    console.log(`Pruned ${prunedCount} entries`);
    
    // Remove specific entry
    await cache.remove('key1');
    console.log('Removed key1');
    
    // Clear the entire cache
    await cache.clear();
    console.log('Cache cleared');
    
    // Close the connection
    await cache.close();
    console.log('Cache connection closed');
    
    return 'Demo completed successfully';
  } catch (error) {
    console.error('Error in demonstratePersistentCache:', error);
    throw error;
  }
}

// Demonstrate integration with blob storage
async function demonstrateBlobCaching() {
  try {
    const cache = new PersistentCache({
      dbName: 'walgit-blob-cache',
      storeName: 'blobs',
      maxSize: 100 * 1024 * 1024 // 100MB
    });
    
    await cache.init();
    
    // Simulate storing a blob in cache
    const blobContent = Buffer.from('This is a sample blob content for testing');
    const blobHash = 'a1b2c3d4e5f6'; // Normally this would be calculated
    
    await cache.set(blobHash, blobContent, {
      type: 'blob',
      contentType: 'text/plain',
      size: blobContent.length,
      hash: blobHash
    });
    
    // Retrieve the blob
    const retrievedBlob = await cache.get(blobHash);
    
    if (retrievedBlob && Buffer.isBuffer(retrievedBlob)) {
      console.log('Successfully retrieved blob from cache');
      console.log('Blob content:', retrievedBlob.toString());
    } else {
      console.log('Failed to retrieve blob from cache');
    }
    
    await cache.close();
    
    return 'Blob caching demo completed';
  } catch (error) {
    console.error('Error in demonstrateBlobCaching:', error);
    throw error;
  }
}

// Run the demonstrations
async function runDemos() {
  console.log('=== PERSISTENT CACHE DEMO ===');
  await demonstratePersistentCache();
  
  console.log('\n=== BLOB CACHING DEMO ===');
  await demonstrateBlobCaching();
}

// This is a demo file - uncomment the following line to run the demo
// runDemos().catch(console.error);

export { demonstratePersistentCache, demonstrateBlobCaching };