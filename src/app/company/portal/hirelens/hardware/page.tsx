'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bluetooth, Plus, Zap, RefreshCw, ArrowLeft } from 'lucide-react';
import { DeviceSelectCard } from '@/components/interview/hardware/DeviceSelectCard';
import { useCompanyAuth } from '@/contexts/CompanyAuthContext';
import type { HireLensDevice } from '@/types/hardware';

export default function HardwareDeviceListPage() {
  const { user, loading } = useCompanyAuth();
  const router = useRouter();

  const [devices, setDevices] = useState<HireLensDevice[]>([]);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDevices = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/interview/devices', { credentials: 'include' });
      if (res.ok) {
        const { devices: d } = await res.json();
        setDevices(d || []);
      }
    } finally {
      setFetchLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!loading && !user) router.push('/company/login');
  }, [user, loading, router]);

  useEffect(() => {
    fetchDevices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0F] text-white">
      <div className="max-w-2xl mx-auto px-6 py-10">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <button
            onClick={() => router.push('/company/portal/hirelens')}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-sm mb-5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to mode selection
          </button>

          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
            <Bluetooth className="w-3.5 h-3.5" /> Hardware Mode
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">HireLens Devices</h1>
              <p className="text-slate-400 text-sm">Select a paired collar device to start an interview session.</p>
            </div>
            <button
              onClick={fetchDevices}
              disabled={refreshing}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-slate-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </motion.div>

        {/* Pair new device shortcut */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <Link
            href="/company/portal/hirelens/hardware/pair"
            className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800/60 transition-all mb-5 group"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/15 flex items-center justify-center group-hover:bg-indigo-500/25 transition-colors flex-shrink-0">
              <Plus className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">Pair New Device</p>
              <p className="text-xs text-slate-500">Connect a new HireLens collar device via Bluetooth</p>
            </div>
          </Link>
        </motion.div>

        {/* Device list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-3"
        >
          {fetchLoading ? (
            [1, 2].map(i => (
              <div key={i} className="h-[72px] rounded-2xl bg-slate-800/50 animate-pulse" />
            ))
          ) : devices.length === 0 ? (
            <div className="text-center py-16 text-slate-600">
              <Bluetooth className="w-14 h-14 mx-auto mb-3 opacity-15" />
              <p className="font-semibold mb-1 text-slate-500">No devices paired yet</p>
              <p className="text-sm">Click &quot;Pair New Device&quot; above to connect your HireLens collar.</p>
            </div>
          ) : (
            devices.map((device, i) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <DeviceSelectCard
                  device={device}
                  selected={selectedId === device.id}
                  onSelect={() => setSelectedId(prev => prev === device.id ? null : device.id)}
                />
              </motion.div>
            ))
          )}
        </motion.div>

        {/* Continue CTA */}
        {selectedId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={() => router.push(`/company/portal/hirelens/hardware/new?deviceId=${selectedId}`)}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-base flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/25 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <Zap className="w-5 h-5" />
              Continue with Selected Device
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
