"use client";

import React from 'react';
import BlockchainVisualization from './blockchain-visualization';
import { motion } from 'framer-motion';

export interface WalrusStorageVisualizationProps {
  className?: string;
  title?: string;
  description?: string;
  darkMode?: boolean;
  showDetails?: boolean;
  size?: 'small' | 'medium' | 'large';
  highlightColor?: string;
}

const WalrusStorageVisualization: React.FC<WalrusStorageVisualizationProps> = ({
  className = '',
  title = 'Walrus Storage Protocol',
  description = 'Decentralized storage for your Git repositories with optimized performance and security.',
  darkMode = true,
  showDetails = true,
  size = 'medium',
  highlightColor = '#10b981' // emerald-500
}) => {
  // Determine node count based on size
  const nodeCount = {
    small: 16,
    medium: 24,
    large: 36
  }[size];
  
  // Determine height based on size
  const height = {
    small: 'h-[300px]',
    medium: 'h-[400px]',
    large: 'h-[500px]'
  }[size];
  
  return (
    <div className={`w-full ${className}`}>
      <div className={`rounded-xl overflow-hidden shadow-xl ${
        darkMode 
          ? 'bg-slate-900/95 shadow-emerald-900/20' 
          : 'bg-white/95 shadow-slate-200/60'
      }`}>
        {/* Header section */}
        {(title || description) && (
          <div className="px-6 py-5">
            {title && (
              <motion.h3 
                className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-slate-800'}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <span className="mr-2">{title}</span>
                <span className="inline-block animate-pulse">
                  <span className={`inline-block w-2 h-2 rounded-full ${
                    darkMode ? 'bg-emerald-400' : 'bg-emerald-500'
                  }`}></span>
                </span>
              </motion.h3>
            )}
            
            {description && (
              <motion.p 
                className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {description}
              </motion.p>
            )}
          </div>
        )}
        
        {/* Visualization */}
        <div className={height}>
          <BlockchainVisualization
            nodeCount={nodeCount}
            darkMode={darkMode}
            showDetails={showDetails}
            showControls={false}
            animationSpeed="medium"
            highlightColor={highlightColor}
            className="h-full"
          />
        </div>
        
        {/* Features section */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border-t ${
          darkMode ? 'border-slate-800' : 'border-slate-100'
        }`}>
          <motion.div 
            className="flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Decentralized Storage
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Distributed across multiple nodes for high availability and redundancy.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Optimized Performance
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Smart caching and parallel data transfer reduce latency and boost performance.
            </p>
          </motion.div>
          
          <motion.div 
            className="flex flex-col"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h4 className={`text-sm font-medium mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
              Secure Transactions
            </h4>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Encrypted data transfer with cryptographic validation ensures integrity.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default WalrusStorageVisualization;