"use client";

import React from "react";
import { motion } from "framer-motion";
import { Users, Clock, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface GDMatchingUIProps {
  participantsWaiting: number;
  participantsRequired: number;
  onCancel: () => void;
  estimatedWaitTime?: number;
}

export default function GDMatchingUI({
  participantsWaiting,
  participantsRequired,
  onCancel,
  estimatedWaitTime = 60,
}: GDMatchingUIProps) {
  const progressPercent = (participantsWaiting / participantsRequired) * 100;
  const participantsNeeded = participantsRequired - participantsWaiting;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800/50 border-slate-700/50 backdrop-blur">
        <CardContent className="pt-12 pb-8 px-6">
          {/* Animated Search Icon */}
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative"
            >
              <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl animate-pulse" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Search className="w-12 h-12 text-white" />
              </div>
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white text-center mb-2">
            Matching in Progress
          </h2>
          
          {/* Subtitle */}
          <p className="text-slate-400 text-center mb-8">
            {participantsNeeded > 0 
              ? `Looking for ${participantsNeeded} more candidate${participantsNeeded !== 1 ? 's' : ''}...`
              : 'All participants joined! Starting discussion...'}
          </p>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Participants
              </span>
              <span className="text-sm font-medium text-white">
                {participantsWaiting} / {participantsRequired}
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Users className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                {participantsWaiting}
              </div>
              <div className="text-xs text-slate-400">Waiting</div>
            </div>
            
            <div className="bg-slate-700/30 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white mb-1">
                ~{estimatedWaitTime}s
              </div>
              <div className="text-xs text-slate-400">Est. Wait</div>
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="flex items-center justify-center gap-2 text-slate-400 mb-6">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Searching for candidates...</span>
          </div>

          {/* Cancel Button */}
          <Button
            onClick={onCancel}
            variant="outline"
            className="w-full bg-slate-700/50 border-slate-600 hover:bg-slate-700 text-white"
          >
            Cancel Queue
          </Button>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              You can also join as company staff members<br />
              Minimum 2 participants required to start
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
