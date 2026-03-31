"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  Building,
  Clock,
  Filter,
  Search,
  ChevronRight,
  IndianRupee,
  Users,
  Calendar,
} from "lucide-react";

interface Job {
  id: string;
  title: string;
  slug: string;
  department: string;
  location: string;
  employmentType: string;
  experienceLevel: string;
  salaryRange?: string;
  isActive: boolean;
  description: string;
  postedAt: string;
}

const DEPARTMENTS = ["All", "Engineering", "Data & Analytics", "Marketing", "Operations"];
const TYPES = ["All", "FULL_TIME", "PART_TIME", "INTERNSHIP", "CONTRACT"];
const LOCATIONS = ["All", "Remote", "Hybrid", "On-site"];

export default function CareersPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch("/api/careers/jobs");
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = selectedDepartment === "All" || job.department === selectedDepartment;
    const matchesType = selectedType === "All" || job.employmentType === selectedType;
    const matchesLocation = selectedLocation === "All" || job.location.includes(selectedLocation);

    return matchesSearch && matchesDepartment && matchesType && matchesLocation && job.isActive;
  });

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse">
        <div className="h-8 sm:h-10 bg-white/5 rounded-xl w-36 sm:w-48" />
        <div className="h-32 sm:h-24 bg-white/5 rounded-xl" />
        <div className="grid gap-3 sm:gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 sm:h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-white">Browse Open Positions</h1>
        <p className="text-slate-400 text-sm mt-1">
          {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-3 sm:p-4 lg:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept === "All" ? "All Departments" : dept}
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            {TYPES.map((type) => (
              <option key={type} value={type}>
                {type === "All" ? "All Types" : type.replace("_", " ")}
              </option>
            ))}
          </select>

          {/* Location Filter */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="bg-[#0A0C10] border border-white/5 text-white rounded-xl px-3 sm:px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50 transition-colors"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location === "All" ? "All Locations" : location}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Briefcase className="w-7 h-7 sm:w-8 sm:h-8 text-violet-400" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or check back later for new opportunities
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:gap-4">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#13161E] rounded-xl border border-white/5 p-4 sm:p-5 lg:p-6 hover:border-violet-500/20 active:bg-[#151922] transition-all group"
            >
              <div className="space-y-3 sm:space-y-4">
                {/* Job Title and Department */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-violet-300 transition-colors min-w-0 flex-1">
                    {job.title}
                  </h3>
                  <span className="self-start px-2.5 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 flex-shrink-0 whitespace-nowrap">
                    {job.department}
                  </span>
                </div>

                {/* Job Meta Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs sm:text-sm text-slate-400">
                  <span className="flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">Fluenzy AI</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{job.location}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{job.employmentType.replace("_", " ")}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                    <span className="truncate">{job.experienceLevel}</span>
                  </span>
                  {job.salaryRange && (
                    <span className="flex items-center gap-1">
                      <IndianRupee className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="truncate">{job.salaryRange}</span>
                    </span>
                  )}
                </div>

                {/* Description */}
                <p className="text-sm text-slate-300 leading-relaxed line-clamp-2">
                  {job.description}
                </p>

                {/* Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 sm:pt-2">
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    Posted {new Date(job.postedAt).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <Link
                    href={`/candidates/dashboard/careers/${job.slug}`}
                    className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 sm:px-6 py-2.5 rounded-xl bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 active:bg-violet-600 transition-colors"
                  >
                    Apply Now
                    <ChevronRight className="w-4 h-4 flex-shrink-0" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}