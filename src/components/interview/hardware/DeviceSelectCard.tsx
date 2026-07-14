'use client';

import { Bluetooth, Battery } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeviceStatusBadge } from './DeviceStatusBadge';
import type { HireLensDevice } from '@/types/hardware';

interface Props {
  device: HireLensDevice;
  selected: boolean;
  onSelect: () => void;
}

export function DeviceSelectCard({ device, selected, onSelect }: Props) {
  const batteryColor =
    !device.lastBatteryLevel
      ? 'text-slate-600'
      : device.lastBatteryLevel < 20
      ? 'text-red-400'
      : device.lastBatteryLevel < 50
      ? 'text-amber-400'
      : 'text-emerald-400';

  return (
    <button
      onClick={onSelect}
      className={cn(
        'w-full p-4 rounded-2xl border-2 text-left transition-all duration-150 focus:outline-none group',
        selected
          ? 'border-indigo-500 bg-indigo-600/10 shadow-lg shadow-indigo-500/10'
          : 'border-slate-700/80 bg-slate-800/60 hover:border-indigo-500/50 hover:bg-slate-800'
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {/* Icon + info */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors',
              selected ? 'bg-indigo-500/20' : 'bg-slate-700/80 group-hover:bg-slate-700'
            )}
          >
            <Bluetooth
              className={cn(
                'w-5 h-5',
                selected ? 'text-indigo-400' : 'text-slate-400'
              )}
            />
          </div>
          <div>
            <p className="text-white font-semibold text-sm">
              {device.nickname || device.serialNumber}
            </p>
            <p className="text-slate-500 text-xs">
              {device.serialNumber} · fw {device.firmwareVersion}
            </p>
          </div>
        </div>

        {/* Right side: battery + status */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {device.lastBatteryLevel !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs', batteryColor)}>
              <Battery className="w-3.5 h-3.5" />
              <span>{device.lastBatteryLevel}%</span>
            </div>
          )}
          <DeviceStatusBadge status={device.status} />
        </div>
      </div>

      {/* Selection indicator */}
      {selected && (
        <p className="mt-2 text-xs text-indigo-400 font-medium">
          ✓ Selected for this interview
        </p>
      )}
    </button>
  );
}
