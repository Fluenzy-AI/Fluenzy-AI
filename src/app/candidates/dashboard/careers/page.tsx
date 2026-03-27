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
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white/5 rounded-xl w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Browse Open Positions</h1>
          <p className="text-slate-400 text-sm mt-1">
            {filteredJobs.length} job{filteredJobs.length !== 1 ? "s" : ""} available
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-[#13161E] rounded-xl border border-white/5 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0A0C10] border border-white/5 text-white rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
            />
          </div>

          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-[#0A0C10] border border-white/5 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
          >
            {DEPARTMENTS.map((dept) => (
              <option key={dept} value={dept}>
                {dept} Department
              </option>
            ))}
          </select>

          {/* Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#0A0C10] border border-white/5 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
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
            className="bg-[#0A0C10] border border-white/5 text-white rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-violet-500/50"
          >
            {LOCATIONS.map((location) => (
              <option key={location} value={location}>
                {location} Location
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-[#13161E] rounded-xl border border-white/5 p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-violet-500/10 flex items-center justify-center">
            <Briefcase className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">No jobs found</h3>
          <p className="text-sm text-slate-400">
            Try adjusting your search criteria or check back later for new opportunities
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job, index) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#13161E] rounded-xl border border-white/5 p-6 hover:border-violet-500/20 transition-all group"
            >
              <div className="flex items-start justify-between gap-6">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white group-hover:text-violet-300 transition-colors">
                        {job.title}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-400">
                        <span className="flex items-center gap-1">
                          <Building className="w-4 h-4" />
                          Fluenzy AI
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.employmentType.replace("_", " ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.experienceLevel}
                        </span>
                        {job.salaryRange && (
                          <span className="flex items-center gap-1">
                            <IndianRupee className="w-4 h-4" />
                            {job.salaryRange}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      {job.department}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Posted {new Date(job.postedAt).toLocaleDateString("en-IN", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                    <Link
                      href={`/candidates/dashboard/careers/${job.slug}`}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-violet-500 text-white text-sm font-semibold hover:bg-violet-400 transition-colors"
                    >
                      Apply Now
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}