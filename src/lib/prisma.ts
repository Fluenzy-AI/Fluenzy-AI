import { PrismaClient } from '@prisma/client';
import { 
  Role, 
  Plan, 
  DiscountType, 
  GDRole, 
  GDMode, 
  GDDifficulty, 
  GDPhase, 
  ParticipantStatus 
} from '@prisma/client';

declare global {
  namespace globalThis {
    var prismadb: PrismaClient;
  }
}

const prisma = globalThis.prismadb || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalThis.prismadb = prisma;

export { prisma };
export default prisma;

// Export enums
export { 
  Role, 
  Plan, 
  DiscountType, 
  GDRole, 
  GDMode, 
  GDDifficulty, 
  GDPhase, 
  ParticipantStatus 
};
