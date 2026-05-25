import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Layout, Building2, Zap, Eye, EyeOff } from 'lucide-react';

export default function DevModeModal({ onSelect }) {
  const [showLiveLogin, setShowLiveLogin] = useState(false);
  const [email, setEmail] = useState('admin@smartscript.com');
  const [password, setPassword] = useState('demo1234');
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-2xl w-full shadow-2xl"
      >
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/logo.png" alt="SmartScript" className="h-10 w-10 object-contain" />
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            SmartScript
          </h2>
        </div>
        <p className="text-gray-400 text-center mb-8">Select environment to launch</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Standard Mode */}
          <button
            onClick={() => onSelect('standard')}
            className="group relative p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-blue-500 rounded-xl transition-all duration-300 text-left"
          >
            <div className="mb-3 w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
              <Layout className="w-5 h-5 text-blue-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Standard</h3>
            <p className="text-gray-400 text-xs">Mock data · Credit-based · Pay-as-you-go</p>
          </button>

          {/* Custom Mode */}
          <button
            onClick={() => onSelect('custom')}
            className="group relative p-5 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-purple-500 rounded-xl transition-all duration-300 text-left"
          >
            <div className="mb-3 w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Custom</h3>
            <p className="text-gray-400 text-xs">Mock data · Organization · No credits</p>
          </button>

          {/* Live Backend Mode */}
          <button
            onClick={() => setShowLiveLogin(true)}
            className="group relative p-5 bg-emerald-900/30 hover:bg-emerald-900/50 border border-emerald-700/50 hover:border-emerald-400 rounded-xl transition-all duration-300 text-left"
          >
            <div className="mb-3 w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Zap className="w-5 h-5 text-emerald-400" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">Live Demo</h3>
            <p className="text-gray-400 text-xs">Real backend · AI marking · Real data</p>
            <span className="absolute top-2 right-2 text-[10px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full font-medium">LIVE</span>
          </button>
        </div>

        {/* Live login sub-panel */}
        {showLiveLogin && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-5 bg-gray-800 border border-emerald-700/40 rounded-xl"
          >
            <p className="text-sm text-emerald-400 font-medium mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Connect to Live Backend (any credentials work)
            </p>
            <div className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:outline-none focus:border-emerald-500 pr-10"
                />
                <button
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelect('live', email, password)}
                  className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium transition-colors"
                >
                  Launch Live Demo
                </button>
                <button
                  onClick={() => setShowLiveLogin(false)}
                  className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
