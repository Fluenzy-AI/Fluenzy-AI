'use client';

// ═══════════════════════════════════════════════════════════════════════════════
// Module Weight Editor Component
// Drag-and-drop editor for competition module weights
// ═══════════════════════════════════════════════════════════════════════════════

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  GripVertical, 
  Plus, 
  Trash2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleConfig {
  moduleType: string;
  weight: number;
  order: number;
  config?: Record<string, unknown>;
}

interface ModuleOption {
  value: string;
  label: string;
}

interface ModuleWeightEditorProps {
  modules: ModuleConfig[];
  availableModules: ModuleOption[];
  onChange: (modules: ModuleConfig[]) => void;
  maxModules?: number;
}

export function ModuleWeightEditor({
  modules,
  availableModules,
  onChange,
  maxModules = 6
}: ModuleWeightEditorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const totalWeight = modules.reduce((sum, m) => sum + m.weight, 0);
  const isWeightValid = totalWeight === 100;

  const usedModuleTypes = modules.map(m => m.moduleType);
  const unusedModules = availableModules.filter(
    m => !usedModuleTypes.includes(m.value)
  );

  const addModule = () => {
    if (modules.length >= maxModules || unusedModules.length === 0) return;
    
    const remainingWeight = Math.max(0, 100 - totalWeight);
    const newModule: ModuleConfig = {
      moduleType: unusedModules[0].value,
      weight: remainingWeight,
      order: modules.length + 1
    };
    
    onChange([...modules, newModule]);
  };

  const removeModule = (index: number) => {
    onChange(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof ModuleConfig, value: string | number) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], [field]: value };
    onChange(newModules);
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newModules = [...modules];
    const draggedModule = newModules[draggedIndex];
    newModules.splice(draggedIndex, 1);
    newModules.splice(index, 0, draggedModule);
    
    // Update order
    newModules.forEach((m, i) => { m.order = i + 1; });
    
    setDraggedIndex(index);
    onChange(newModules);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const distributeEvenly = () => {
    const evenWeight = Math.floor(100 / modules.length);
    const remainder = 100 - (evenWeight * modules.length);
    
    const newModules = modules.map((m, i) => ({
      ...m,
      weight: evenWeight + (i === 0 ? remainder : 0)
    }));
    
    onChange(newModules);
  };

  return (
    <div className="space-y-4">
      {/* Weight Summary */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-lg',
        isWeightValid ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-amber-500/10 border border-amber-500/20'
      )}>
        <div className="flex items-center gap-2">
          {!isWeightValid && <AlertCircle className="h-4 w-4 text-amber-400" />}
          <span className={cn(
            'text-sm font-medium',
            isWeightValid ? 'text-emerald-400' : 'text-amber-400'
          )}>
            Total Weight: {totalWeight}%
            {!isWeightValid && ' (must equal 100%)'}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={distributeEvenly}>
          Distribute Evenly
        </Button>
      </div>

      {/* Modules List */}
      <div className="space-y-2">
        {modules.map((module, index) => {
          const moduleLabel = availableModules.find(m => m.value === module.moduleType)?.label || module.moduleType;
          
          return (
            <Card 
              key={module.moduleType}
              className={cn(
                'bg-slate-800/50 transition-all',
                draggedIndex === index && 'opacity-50 scale-[0.98]'
              )}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  {/* Drag Handle */}
                  <div className="cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                  </div>

                  {/* Order Number */}
                  <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-medium text-violet-400">
                    {index + 1}
                  </div>

                  {/* Module Type Selector */}
                  <Select
                    value={module.moduleType}
                    onValueChange={(value) => updateModule(index, 'moduleType', value)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue>{moduleLabel}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={module.moduleType}>{moduleLabel}</SelectItem>
                      {unusedModules.map((m) => (
                        <SelectItem key={m.value} value={m.value}>
                          {m.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Weight Slider */}
                  <div className="flex-1 flex items-center gap-4">
                    <Slider
                      value={[module.weight]}
                      onValueChange={([value]) => updateModule(index, 'weight', value)}
                      min={0}
                      max={100}
                      step={5}
                      className="flex-1"
                    />
                    <div className="flex items-center gap-1 w-24">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={module.weight}
                        onChange={(e) => updateModule(index, 'weight', parseInt(e.target.value) || 0)}
                        className="w-16 text-center"
                      />
                      <span className="text-muted-foreground">%</span>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeModule(index)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    disabled={modules.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add Module Button */}
      {modules.length < maxModules && unusedModules.length > 0 && (
        <Button 
          variant="outline" 
          className="w-full border-dashed"
          onClick={addModule}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Module
        </Button>
      )}
    </div>
  );
}
