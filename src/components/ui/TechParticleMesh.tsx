"use client";
import React from "react";
import { motion } from "framer-motion";

export const TechParticleMesh: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {/* 3D Perspective Grid Background */}
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(168, 85, 247, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(59, 130, 246, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "perspective(500px) rotateX(60deg) translateY(-100px) scale(1.5)",
          transformOrigin: "center top",
        }}
      />

      {/* Floating 3D Graphic Nodes */}
      {Array.from({ length: 8 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-purple-500/30 to-cyan-500/30 border border-white/20 blur-[1px]"
          style={{
            width: 8 + (i % 4) * 6,
            height: 8 + (i % 4) * 6,
            left: `${10 + i * 11}%`,
            top: `${15 + (i % 3) * 28}%`,
          }}
          animate={{
            y: [0, -25, 0],
            rotate: [0, 180, 360],
            scale: [1, 1.25, 1],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 6 + i * 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Sci-Fi Telemetry Coordinates & Graphic Markings */}
      <div className="absolute top-10 left-6 text-[9px] font-mono tracking-widest text-purple-400/40 uppercase">
        [SYS_NODE // 3D_MATRIX_ACTIVE] • POS_X: 48.22 • POS_Y: 109.4
      </div>
      <div className="absolute bottom-10 right-6 text-[9px] font-mono tracking-widest text-cyan-400/40 uppercase">
        [AI_NEURAL_ENGINE] • TILT: 3D_ENABLED • FPS: 60
      </div>

      {/* Glowing Ambient Light Orbs */}
      <div className="absolute top-1/4 left-1/3 w-[450px] h-[450px] bg-purple-600/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-1/4 right-1/3 w-[450px] h-[450px] bg-cyan-600/10 rounded-full blur-[140px]" />
    </div>
  );
};

export default TechParticleMesh;
