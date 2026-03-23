"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import * as Tooltip from "@radix-ui/react-tooltip";
import { Plus } from "lucide-react";

export type ProficiencyLevel = 1 | 2 | 3 | 4 | 5;

interface SkillPillProps {
  skill: string;
  proficiency?: ProficiencyLevel;
  years?: number;
  removable?: boolean;
  onRemove?: () => void;
  className?: string;
  size?: "sm" | "md";
}

const PROFICIENCY_LABELS: Record<ProficiencyLevel, string> = {
  1: "Beginner",
  2: "Elementary",
  3: "Intermediate",
  4: "Advanced",
  5: "Expert",
};

export function SkillPill({
  skill,
  proficiency,
  years,
  removable = false,
  onRemove,
  className,
  size = "md",
}: SkillPillProps) {
  const content = (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.05 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "inline-flex items-center gap-1.5 bg-[#7C5CFC]/10 text-[#9F7FFF] border border-[#7C5CFC]/20 font-medium rounded-md transition-all duration-150 hover:bg-[#7C5CFC]/15 hover:border-[#7C5CFC]/30",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <span>{skill}</span>

      {/* Proficiency dots */}
      {proficiency && (
        <span className="flex items-center gap-0.5 ml-0.5">
          {[1, 2, 3, 4, 5].map((level) => (
            <span
              key={level}
              className={cn(
                "w-1 h-1 rounded-full transition-colors",
                level <= proficiency ? "bg-[#9F7FFF]" : "bg-[#52515E]"
              )}
            />
          ))}
        </span>
      )}

      {/* Remove button */}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 p-0.5 hover:bg-white/10 rounded transition-colors"
          aria-label={`Remove ${skill}`}
        >
          <svg
            className="w-2.5 h-2.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </motion.span>
  );

  // If proficiency is provided, wrap in tooltip
  if (proficiency) {
    return (
      <Tooltip.Provider delayDuration={200}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>{content}</Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              side="top"
              sideOffset={5}
              className="z-50 px-3 py-2 bg-[#1A1D28] border border-white/10 rounded-lg shadow-xl animate-in fade-in-0 zoom-in-95"
            >
              <div className="text-xs">
                <p className="font-medium text-[#F1F0F5]">
                  {PROFICIENCY_LABELS[proficiency]}
                </p>
                {years && (
                  <p className="text-[#8B8A99] mt-0.5">
                    {years} {years === 1 ? "year" : "years"} experience
                  </p>
                )}
              </div>
              <Tooltip.Arrow className="fill-[#1A1D28]" />
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>
    );
  }

  return content;
}

// Add Skill button component
interface AddSkillButtonProps {
  onClick: () => void;
  className?: string;
}

export function AddSkillButton({ onClick, className }: AddSkillButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#8B8A99] bg-white/5 border border-dashed border-white/10 rounded-md transition-all hover:text-[#7C5CFC] hover:border-[#7C5CFC]/30 hover:bg-[#7C5CFC]/5",
        className
      )}
    >
      <Plus className="w-3 h-3" />
      <span>Add skill</span>
    </motion.button>
  );
}

// Skills list wrapper
interface SkillsListProps {
  skills: Array<{
    name: string;
    proficiency?: ProficiencyLevel;
    years?: number;
  }>;
  maxDisplay?: number;
  showAdd?: boolean;
  onAddSkill?: () => void;
  onRemoveSkill?: (skill: string) => void;
  removable?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function SkillsList({
  skills,
  maxDisplay = 6,
  showAdd = false,
  onAddSkill,
  onRemoveSkill,
  removable = false,
  className,
  size = "md",
}: SkillsListProps) {
  const displaySkills = skills.slice(0, maxDisplay);
  const remaining = skills.length - maxDisplay;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {displaySkills.map((skill) => (
        <SkillPill
          key={skill.name}
          skill={skill.name}
          proficiency={skill.proficiency}
          years={skill.years}
          removable={removable}
          onRemove={onRemoveSkill ? () => onRemoveSkill(skill.name) : undefined}
          size={size}
        />
      ))}

      {remaining > 0 && (
        <Tooltip.Provider delayDuration={200}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-[#8B8A99] bg-white/5 border border-white/10 rounded-md cursor-default">
                +{remaining} more
              </span>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                side="top"
                sideOffset={5}
                className="z-50 px-3 py-2 bg-[#1A1D28] border border-white/10 rounded-lg shadow-xl max-w-xs"
              >
                <div className="flex flex-wrap gap-1.5">
                  {skills.slice(maxDisplay).map((skill) => (
                    <span
                      key={skill.name}
                      className="px-2 py-0.5 text-[10px] font-medium text-[#9F7FFF] bg-[#7C5CFC]/10 rounded"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                <Tooltip.Arrow className="fill-[#1A1D28]" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      )}

      {showAdd && onAddSkill && <AddSkillButton onClick={onAddSkill} />}
    </div>
  );
}
