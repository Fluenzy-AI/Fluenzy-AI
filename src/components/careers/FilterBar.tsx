"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { SimpleCounter } from "../shared/AnimatedCounter";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

type LocationType = "REMOTE" | "HYBRID" | "ONSITE";
type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERNSHIP";

interface FilterState {
  search: string;
  department: string;
  location: string;
  employmentType: string;
}

interface FilterBarProps {
  departments: string[];
  resultsCount: number;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  loading?: boolean;
  className?: string;
}

const LOCATION_OPTIONS = [
  { value: "All", label: "All Locations" },
  { value: "REMOTE", label: "Remote" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "ONSITE", label: "On-site" },
];

const TYPE_OPTIONS = [
  { value: "All", label: "All Types" },
  { value: "FULL_TIME", label: "Full-time" },
  { value: "PART_TIME", label: "Part-time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERNSHIP", label: "Internship" },
];

// Animated search placeholder
const PLACEHOLDER_SUGGESTIONS = [
  "Software Engineer",
  "Product Designer",
  "Data Scientist",
  "Frontend Developer",
  "Marketing Manager",
];

function AnimatedPlaceholder() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % PLACEHOLDER_SUGGESTIONS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={currentIndex}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="text-[#52515E]"
      >
        Search "{PLACEHOLDER_SUGGESTIONS[currentIndex]}"...
      </motion.span>
    </AnimatePresence>
  );
}

// Filter pill component
function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#7C5CFC]/10 text-[#9F7FFF] text-xs font-medium border border-[#7C5CFC]/20"
    >
      {label}
      <button
        onClick={onRemove}
        className="p-0.5 rounded-full hover:bg-white/10 transition-colors"
        aria-label={`Remove ${label} filter`}
      >
        <X className="w-3 h-3" />
      </button>
    </motion.span>
  );
}

// Custom select dropdown
function SelectDropdown({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all min-w-[140px]",
          "bg-white/[0.04] border border-white/[0.06]",
          "hover:bg-white/[0.06] hover:border-white/[0.1]",
          "focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40",
          isOpen && "border-[#7C5CFC]/40 bg-white/[0.06]"
        )}
      >
        <span className={value === "All" ? "text-[#8B8A99]" : "text-[#F1F0F5]"}>
          {selectedOption?.label}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-[#52515E] transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 py-1 rounded-xl bg-[#1A1D28] border border-white/[0.08] shadow-xl z-50 overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full px-3.5 py-2 text-left text-sm transition-colors",
                  value === option.value
                    ? "bg-[#7C5CFC]/10 text-[#9F7FFF]"
                    : "text-[#8B8A99] hover:text-[#F1F0F5] hover:bg-white/[0.04]"
                )}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function FilterBar({
  departments,
  resultsCount,
  filters,
  onFilterChange,
  loading = false,
  className,
}: FilterBarProps) {
  const [inputFocused, setInputFocused] = useState(false);

  const departmentOptions = [
    { value: "All", label: "All Departments" },
    ...departments.map((d) => ({ value: d, label: d })),
  ];

  const updateFilter = (key: keyof FilterState, value: string | boolean) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const hasActiveFilters =
    filters.search ||
    filters.department !== "All" ||
    filters.location !== "All" ||
    filters.employmentType !== "All";

  const clearAllFilters = () => {
    onFilterChange({
      search: "",
      department: "All",
      location: "All",
      employmentType: "All",
    });
  };

  const activeFilterPills: { label: string; onRemove: () => void }[] = [];

  if (filters.department !== "All") {
    activeFilterPills.push({
      label: filters.department,
      onRemove: () => updateFilter("department", "All"),
    });
  }
  if (filters.location !== "All") {
    activeFilterPills.push({
      label: LOCATION_OPTIONS.find((o) => o.value === filters.location)?.label || filters.location,
      onRemove: () => updateFilter("location", "All"),
    });
  }
  if (filters.employmentType !== "All") {
    activeFilterPills.push({
      label: TYPE_OPTIONS.find((o) => o.value === filters.employmentType)?.label || filters.employmentType,
      onRemove: () => updateFilter("employmentType", "All"),
    });
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main filter row */}
      <div className="flex flex-col lg:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#52515E]" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            className={cn(
              "w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              "bg-white/[0.04] border border-white/[0.06]",
              "hover:bg-white/[0.06] hover:border-white/[0.1]",
              "focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 focus:border-[#7C5CFC]/40",
              "text-[#F1F0F5] placeholder:text-[#52515E]"
            )}
            placeholder=""
          />
          {!filters.search && !inputFocused && (
            <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
              <AnimatedPlaceholder />
            </div>
          )}
          {filters.search && (
            <button
              onClick={() => updateFilter("search", "")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-white/[0.08] text-[#52515E] hover:text-[#8B8A99] transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap gap-3">
          <SelectDropdown
            value={filters.department}
            options={departmentOptions}
            onChange={(v) => updateFilter("department", v)}
          />

          <SelectDropdown
            value={filters.location}
            options={LOCATION_OPTIONS}
            onChange={(v) => updateFilter("location", v)}
          />

          <SelectDropdown
            value={filters.employmentType}
            options={TYPE_OPTIONS}
            onChange={(v) => updateFilter("employmentType", v)}
          />
        </div>
      </div>

      {/* Active filters + results count */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <AnimatePresence>
            {activeFilterPills.map((pill) => (
              <FilterPill key={pill.label} label={pill.label} onRemove={pill.onRemove} />
            ))}
          </AnimatePresence>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-[#7C5CFC] hover:text-[#9F7FFF] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Results count */}
        {!loading && (
          <p className="text-sm text-[#8B8A99]">
            <span className="font-medium text-[#F1F0F5]">
              <SimpleCounter value={resultsCount} duration={300} />
            </span>{" "}
            open position{resultsCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
