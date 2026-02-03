import React from 'react';
import { motion } from 'framer-motion';
import { Layout, Building2 } from 'lucide-react';

export default function DevModeModal({ onSelect }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
            Development Mode
          </h2>
          <p className="text-gray-400">Select the deployment environment to simulate</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => onSelect('standard')}
            className="group relative p-6 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl transition-all duration-300 text-left"
          >
            <div className="mb-4 w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Layout className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Standard Mode</h3>
            <p className="text-gray-400 text-sm">
              Individual users with credit system. Pay-as-you-go model.
            </p>
          </button>

          <button
            onClick={() => onSelect('custom')}
            className="group relative p-6 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl transition-all duration-300 text-left"
          >
            <div className="mb-4 w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Building2 className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Custom Mode</h3>
            <p className="text-gray-400 text-sm">
              Organization deployment. No credits, usage billing, custom policies.
            </p>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
