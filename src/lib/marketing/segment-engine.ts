/**
 * User Segmentation Engine for Marketing System
 * Provides dynamic user filtering based on various criteria
 */

import prisma from "@/lib/prisma";

export interface SegmentResult {
  userIds: string[];
  count: number;
  previewSample: Array<{
    id: string;
    name: string;
    email: string;
    plan: string;
    createdAt: Date;
  }>;
}

export interface FilterCondition {
  type: string;
  operator?: string;
  value?: any;
  params?: Record<string, any>;
}

export interface SegmentFilter {
  conditions: FilterCondition[];
  logic: "AND" | "OR";
}

/**
 * Segment Engine - Build dynamic user segments for email campaigns
 */
export class SegmentEngine {
  /**
   * Get users with incomplete module progress
   * @param threshold - Progress threshold (0.0 to 1.0), default 0.5 (50%)
   */
  async incompleteModule(threshold: number = 0.5): Promise<SegmentResult> {
    // Find users who have some lesson progress but not all completed
    const usersWithProgress = await prisma.lessonProgress.groupBy({
      by: ["userId"],
      _count: { isCompleted: true },
      _avg: { score: true },
      having: {
        isCompleted: {
          _count: {
            lt: 10, // Less than 10 completed lessons
          },
        },
      },
    });

    const userIds = usersWithProgress.map((u) => u.userId);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
      take: 100,
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get users who submitted interviews very quickly (likely didn't complete properly)
   * @param maxSeconds - Maximum duration in seconds, default 60
   */
  async quickSubmit(maxSeconds: number = 60): Promise<SegmentResult> {
    const quickSessions = await prisma.session.findMany({
      where: {
        duration: {
          not: null,
          lte: Math.ceil(maxSeconds / 60), // Convert to minutes
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    const userIds = quickSessions.map((s) => s.userId);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
      take: 100,
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get users who haven't been active for X days
   * @param days - Number of inactive days, default 7
   */
  async inactiveUsers(days: number = 7): Promise<SegmentResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get users whose last login was before cutoff
    const inactiveLogins = await prisma.userLoginLog.groupBy({
      by: ["userId"],
      _max: {
        loginTime: true,
      },
      having: {
        loginTime: {
          _max: {
            lt: cutoffDate,
          },
        },
      },
    });

    const userIds = inactiveLogins.map((l) => l.userId);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
      take: 100,
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get users with low scores
   * @param threshold - Score threshold (0.0 to 1.0), default 0.4 (40%)
   */
  async lowScore(threshold: number = 0.4): Promise<SegmentResult> {
    const lowScoreProgress = await prisma.lessonProgress.groupBy({
      by: ["userId"],
      _avg: {
        score: true,
      },
      having: {
        score: {
          _avg: {
            lt: threshold * 100, // Assuming scores are 0-100
          },
        },
      },
    });

    const userIds = lowScoreProgress.map((p) => p.userId);

    const users = await prisma.users.findMany({
      where: {
        id: { in: userIds },
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
      take: 100,
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get users by plan type
   * @param plan - Plan type: 'Free' | 'Standard' | 'Pro' | 'Enterprise'
   */
  async planType(plan: "Free" | "Standard" | "Pro" | "Enterprise"): Promise<SegmentResult> {
    const users = await prisma.users.findMany({
      where: {
        plan: plan,
        disabled: false,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get users who haven't used a specific module
   * @param module - Module type: 'english' | 'hr' | 'technical' | 'company' | 'mock' | 'gd'
   */
  async featureNotUsed(module: string): Promise<SegmentResult> {
    const usageField = `${module}Usage`;
    
    const users = await prisma.users.findMany({
      where: {
        disabled: false,
        [usageField]: 0,
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get power users (top 10% by engagement)
   */
  async powerUsers(): Promise<SegmentResult> {
    // Get users with highest total usage
    const allUsers = await prisma.users.findMany({
      where: { disabled: false },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
        englishUsage: true,
        hrUsage: true,
        technicalUsage: true,
        companyUsage: true,
        mockUsage: true,
        gdUsage: true,
      },
      orderBy: {
        usageCount: "desc",
      },
    });

    // Calculate top 10%
    const top10PercentCount = Math.ceil(allUsers.length * 0.1);
    const powerUsersList = allUsers.slice(0, top10PercentCount);

    return {
      userIds: powerUsersList.map((u) => u.id),
      count: powerUsersList.length,
      previewSample: powerUsersList.slice(0, 10).map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        plan: u.plan,
        createdAt: u.createdAt,
      })),
    };
  }

  /**
   * Get all active users
   */
  async allUsers(): Promise<SegmentResult> {
    const users = await prisma.users.findMany({
      where: { disabled: false },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Get new users (signed up in last X days)
   * @param days - Number of days since signup, default 7
   */
  async newUsers(days: number = 7): Promise<SegmentResult> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const users = await prisma.users.findMany({
      where: {
        disabled: false,
        createdAt: {
          gte: cutoffDate,
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });

    return {
      userIds: users.map((u) => u.id),
      count: users.length,
      previewSample: users.slice(0, 10),
    };
  }

  /**
   * Execute a custom filter query
   * @param filter - Segment filter with conditions
   */
  async executeFilter(filter: SegmentFilter): Promise<SegmentResult> {
    const results: SegmentResult[] = [];

    for (const condition of filter.conditions) {
      const result = await this.executeCondition(condition);
      results.push(result);
    }

    if (results.length === 0) {
      return { userIds: [], count: 0, previewSample: [] };
    }

    // Combine results based on logic
    if (filter.logic === "AND") {
      // Intersection of all results
      const commonIds = results.reduce((acc, result) => {
        const idSet = new Set(result.userIds);
        return acc.filter((id) => idSet.has(id));
      }, results[0].userIds);

      const users = await prisma.users.findMany({
        where: {
          id: { in: commonIds },
          disabled: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
        },
      });

      return {
        userIds: users.map((u) => u.id),
        count: users.length,
        previewSample: users.slice(0, 10),
      };
    } else {
      // Union of all results
      const allIds = new Set<string>();
      results.forEach((result) => {
        result.userIds.forEach((id) => allIds.add(id));
      });

      const users = await prisma.users.findMany({
        where: {
          id: { in: Array.from(allIds) },
          disabled: false,
        },
        select: {
          id: true,
          name: true,
          email: true,
          plan: true,
          createdAt: true,
        },
      });

      return {
        userIds: users.map((u) => u.id),
        count: users.length,
        previewSample: users.slice(0, 10),
      };
    }
  }

  /**
   * Execute a single condition
   */
  private async executeCondition(condition: FilterCondition): Promise<SegmentResult> {
    const params = condition.params || {};

    switch (condition.type) {
      case "incomplete_module":
        return this.incompleteModule(params.threshold || 0.5);
      case "quick_submit":
        return this.quickSubmit(params.maxSeconds || 60);
      case "inactive":
        return this.inactiveUsers(params.days || 7);
      case "low_score":
        return this.lowScore(params.threshold || 0.4);
      case "plan":
        return this.planType(params.plan || "Free");
      case "feature_not_used":
        return this.featureNotUsed(params.module || "english");
      case "power_users":
        return this.powerUsers();
      case "all_users":
        return this.allUsers();
      case "new_users":
        return this.newUsers(params.days || 7);
      default:
        return { userIds: [], count: 0, previewSample: [] };
    }
  }

  /**
   * Get predefined segments with live counts
   */
  async getPredefinedSegments(): Promise<Array<{
    id: string;
    name: string;
    description: string;
    type: string;
    count: number;
  }>> {
    const segments = [
      {
        id: "all_users",
        name: "All Users",
        description: "All active users on the platform",
        type: "all_users",
      },
      {
        id: "free_users",
        name: "Free Plan Users",
        description: "Users on the free plan",
        type: "plan",
      },
      {
        id: "pro_users",
        name: "Pro Plan Users",
        description: "Users on the pro plan",
        type: "plan",
      },
      {
        id: "inactive_7d",
        name: "Inactive (7 days)",
        description: "Users inactive for 7+ days",
        type: "inactive",
      },
      {
        id: "inactive_30d",
        name: "Inactive (30 days)",
        description: "Users inactive for 30+ days",
        type: "inactive",
      },
      {
        id: "new_users_7d",
        name: "New Users (7 days)",
        description: "Users who signed up in last 7 days",
        type: "new_users",
      },
      {
        id: "low_scorers",
        name: "Low Scorers",
        description: "Users with average score below 40%",
        type: "low_score",
      },
      {
        id: "power_users",
        name: "Power Users",
        description: "Top 10% most engaged users",
        type: "power_users",
      },
      {
        id: "incomplete_modules",
        name: "Incomplete Modules",
        description: "Users with incomplete training modules",
        type: "incomplete_module",
      },
      {
        id: "quick_submitters",
        name: "Quick Submitters",
        description: "Users who submit interviews in <60 seconds",
        type: "quick_submit",
      },
    ];

    // Get counts for each segment
    const segmentsWithCounts = await Promise.all(
      segments.map(async (segment) => {
        let result: SegmentResult;
        
        switch (segment.type) {
          case "all_users":
            result = await this.allUsers();
            break;
          case "plan":
            if (segment.id === "free_users") {
              result = await this.planType("Free");
            } else {
              result = await this.planType("Pro");
            }
            break;
          case "inactive":
            const days = segment.id === "inactive_7d" ? 7 : 30;
            result = await this.inactiveUsers(days);
            break;
          case "new_users":
            result = await this.newUsers(7);
            break;
          case "low_score":
            result = await this.lowScore(0.4);
            break;
          case "power_users":
            result = await this.powerUsers();
            break;
          case "incomplete_module":
            result = await this.incompleteModule(0.5);
            break;
          case "quick_submit":
            result = await this.quickSubmit(60);
            break;
          default:
            result = { userIds: [], count: 0, previewSample: [] };
        }

        return {
          ...segment,
          count: result.count,
        };
      })
    );

    return segmentsWithCounts;
  }
}

export const segmentEngine = new SegmentEngine();
