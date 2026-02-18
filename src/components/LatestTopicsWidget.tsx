"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Building2, MessageSquare, Briefcase, Code2, ChevronLeft, ChevronRight, TrendingUp } from "lucide-react";

interface LatestTopic {
  id: string;
  companyName: string;
  gdTopic: string | null;
  personalInterviewTopic: string | null;
  technicalInterviewTopic: string | null;
  createdAt: string;
}

export default function LatestTopicsWidget() {
  const [topics, setTopics] = useState<LatestTopic[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "6",
      });
      if (filter !== "all") params.set("type", filter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/latest-topics?${params}`);
      if (res.ok) {
        const data = await res.json();
        setTopics(data.topics);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch latest topics:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filter, search]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(1);
  };

  if (loading && topics.length === 0) {
    return null; // Don't show section if still loading first time
  }

  if (!loading && total === 0 && !search && filter === "all") {
    return null; // No topics added yet — hide section entirely
  }

  return (
    <div className="space-y-4 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <TrendingUp className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold tracking-tight">Latest Company Topics & Trends</h2>
          <p className="text-sm text-muted-foreground">
            Stay updated with real GD topics and interview questions recently asked by companies
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search company..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-9"
            />
          </div>
          {search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(""); setSearchInput(""); setPage(1); }}
            >
              Clear
            </Button>
          )}
        </div>
        <Select value={filter} onValueChange={(v) => { setFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Filter type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="gd">GD Topics</SelectItem>
            <SelectItem value="personal">Personal Interview</SelectItem>
            <SelectItem value="technical">Technical Interview</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Topic Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="pt-6 space-y-3">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No topics found{search ? ` for "${search}"` : ""}.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {topics.map((topic) => (
            <Card key={topic.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <CardTitle className="text-base">{topic.companyName}</CardTitle>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(topic.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {topic.gdTopic && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
                      <Badge variant="secondary" className="text-xs font-normal">GD Topic</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5 leading-relaxed">
                      {topic.gdTopic}
                    </p>
                  </div>
                )}
                {topic.personalInterviewTopic && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-green-500" />
                      <Badge variant="secondary" className="text-xs font-normal">Personal Interview</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5 leading-relaxed">
                      {topic.personalInterviewTopic}
                    </p>
                  </div>
                )}
                {topic.technicalInterviewTopic && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Code2 className="h-3.5 w-3.5 text-orange-500" />
                      <Badge variant="secondary" className="text-xs font-normal">Technical Interview</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground pl-5 leading-relaxed">
                      {topic.technicalInterviewTopic}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Showing {topics.length} of {total} topics
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
