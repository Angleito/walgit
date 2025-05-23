"use client";

import React, { useState, useCallback } from 'react';
import HexagonalGrid, { HexNode } from './hexagonal-grid';
import { motion, AnimatePresence } from 'framer-motion';

export interface BlockchainVisualizationProps {
  className?: string;
  showControls?: boolean;
  nodeCount?: number;
  darkMode?: boolean;
  showDetails?: boolean;
  animationSpeed?: 'slow' | 'medium' | 'fast';
  highlightColor?: string;
}

const generateMockNodes = (count: number): HexNode[] => {
  const nodes: HexNode[] = [];
  const nodeTypes: Array<'block' | 'node' | 'storage'> = ['block', 'node', 'storage'];
  const statuses: Array<'active' | 'inactive' | 'transferring'> = ['active', 'inactive', 'transferring'];
  
  // Create storage nodes (about 20% of total)
  const storageCount = Math.max(1, Math.floor(count * 0.2));
  for (let i = 0; i < storageCount; i++) {
    nodes.push({
      id: `storage-${i}`,
      type: 'storage',
      status: Math.random() > 0.3 ? 'active' : 'inactive',
      data: {
        label: `Walrus Storage ${i+1}`,
        value: `${Math.floor(Math.random() * 100)} GB`,
        hash: `0x${Math.random().toString(16).substring(2, 10)}`,
        lastUpdated: new Date().toISOString(),
      }
    });
  }
  
  // Create block nodes (about 30% of total)
  const blockCount = Math.max(1, Math.floor(count * 0.3));
  for (let i = 0; i < blockCount; i++) {
    nodes.push({
      id: `block-${i}`,
      type: 'block',
      status: Math.random() > 0.2 ? 'active' : 'inactive',
      data: {
        label: `Block #${10000 + i}`,
        value: Math.floor(Math.random() * 100) + ' tx',
        hash: `0x${Math.random().toString(16).substring(2, 10)}`,
        lastUpdated: new Date().toISOString(),
      }
    });
  }
  
  // Fill the rest with standard nodes
  const remainingCount = count - storageCount - blockCount;
  for (let i = 0; i < remainingCount; i++) {
    nodes.push({
      id: `node-${i}`,
      type: 'node',
      status: Math.random() > 0.25 ? 'active' : 'inactive',
      data: {
        label: `Validator ${i+1}`,
        value: `#${Math.floor(Math.random() * 1000)}`,
        hash: `0x${Math.random().toString(16).substring(2, 10)}`,
        lastUpdated: new Date().toISOString(),
      }
    });
  }
  
  // Shuffle the array for more natural distribution
  return nodes.sort(() => Math.random() - 0.5);
};

const BlockchainVisualization: React.FC<BlockchainVisualizationProps> = ({
  className = '',
  showControls = true,
  nodeCount = 24,
  darkMode = true,
  showDetails = true,
  animationSpeed = 'medium',
  highlightColor = '#10b981' // emerald-500
}) => {
  const [nodes, setNodes] = useState<HexNode[]>(() => generateMockNodes(nodeCount));
  const [selectedNode, setSelectedNode] = useState<HexNode | null>(null);
  const [columns, setColumns] = useState(8);
  
  const handleNodeClick = useCallback((node: HexNode) => {
    setSelectedNode(prev => prev?.id === node.id ? null : node);
  }, []);
  
  const regenerateNodes = useCallback(() => {
    setSelectedNode(null);
    setNodes(generateMockNodes(nodeCount));
  }, [nodeCount]);
  
  const activateRandomNode = useCallback(() => {
    setNodes(prev => {
      const newNodes = [...prev];
      const inactiveNodes = newNodes.filter(n => n.status === 'inactive');
      
      if (inactiveNodes.length > 0) {
        const randomIndex = Math.floor(Math.random() * inactiveNodes.length);
        const nodeIndex = newNodes.findIndex(n => n.id === inactiveNodes[randomIndex].id);
        
        if (nodeIndex >= 0) {
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            status: 'active'
          };
        }
      }
      
      return newNodes;
    });
  }, []);
  
  // Animation speed settings
  const animationSettings = {
    slow: { interval: 4000, duration: 2500 },
    medium: { interval: 2000, duration: 1500 },
    fast: { interval: 1000, duration: 800 },
  }[animationSpeed];

  return (
    <div className={`relative ${className}`}>
      <div className={`rounded-xl overflow-hidden ${darkMode ? 'bg-slate-900' : 'bg-slate-100'} p-4 h-full`}>
        {/* Main visualization */}
        <HexagonalGrid
          nodes={nodes}
          columns={columns}
          spacing={12}
          onNodeClick={handleNodeClick}
          className="h-[400px] w-full"
          animated={true}
          highlightColor={highlightColor}
          darkMode={darkMode}
        />
        
        {/* Controls */}
        {showControls && (
          <div className={`mt-4 flex flex-wrap gap-2 justify-center ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            <button
              onClick={regenerateNodes}
              className={`px-3 py-1 rounded text-sm ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700' 
                  : 'bg-slate-200 hover:bg-slate-300'
              } transition`}
            >
              Regenerate Network
            </button>
            <button
              onClick={activateRandomNode}
              className={`px-3 py-1 rounded text-sm ${
                darkMode 
                  ? 'bg-emerald-800 hover:bg-emerald-700' 
                  : 'bg-emerald-200 hover:bg-emerald-300'
              } transition`}
            >
              Activate Node
            </button>
            <div className="flex items-center gap-2">
              <label className="text-sm">Columns:</label>
              <select 
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
                className={`p-1 rounded text-sm ${
                  darkMode 
                    ? 'bg-slate-800 border-slate-700' 
                    : 'bg-slate-200 border-slate-300'
                } border`}
              >
                {[4, 6, 8, 10, 12].map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>
      
      {/* Node details popup */}
      {showDetails && (
        <AnimatePresence>
          {selectedNode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className={`absolute right-4 top-4 p-4 rounded-lg shadow-lg max-w-xs z-10 ${
                darkMode 
                  ? 'bg-slate-800 text-white border border-slate-700' 
                  : 'bg-white text-slate-800 border border-slate-200'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium">{selectedNode.data?.label || 'Node Details'}</h3>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-sm opacity-70 hover:opacity-100"
                >
                  &times;
                </button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="font-medium capitalize">{selectedNode.type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span 
                    className={`font-medium capitalize ${
                      selectedNode.status === 'active' 
                        ? 'text-emerald-500' 
                        : selectedNode.status === 'transferring' 
                          ? 'text-amber-500' 
                          : 'text-slate-500'
                    }`}
                  >
                    {selectedNode.status}
                  </span>
                </div>
                
                {selectedNode.data?.value && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Value:</span>
                    <span>{selectedNode.data.value}</span>
                  </div>
                )}
                
                {selectedNode.data?.hash && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hash:</span>
                    <span className="font-mono text-xs">{selectedNode.data.hash}</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-2 border-t border-slate-700 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    selectedNode.status === 'active' ? 'bg-emerald-500' : 'bg-slate-500'
                  }`}></div>
                  <span>
                    {selectedNode.status === 'active' 
                      ? 'Active since ' 
                      : 'Last active '} 
                    {selectedNode.data?.lastUpdated 
                      ? new Date(selectedNode.data.lastUpdated).toLocaleTimeString() 
                      : 'unknown'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
      
      {/* Legend */}
      <div className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 justify-center text-xs ${
        darkMode ? 'text-slate-400' : 'text-slate-600'
      }`}>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 ${darkMode ? 'bg-blue-600' : 'bg-blue-500'} rounded-md`}></div>
          <span>Blocks</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 ${darkMode ? 'bg-violet-600' : 'bg-violet-500'} rounded-full`}></div>
          <span>Validators</span>
        </div>
        <div className="flex items-center gap-1">
          <div className={`w-3 h-3 ${darkMode ? 'bg-emerald-600' : 'bg-emerald-500'}`} style={{ clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)' }}></div>
          <span>Storage</span>
        </div>
      </div>
    </div>
  );
};

export default BlockchainVisualization;