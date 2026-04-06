const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixDuplicates() {
  try {
    console.log('Finding duplicate MonthlyUsage records...');
    
    // Get all MonthlyUsage records grouped by userId, billingMonth, billingYear
    const allRecords = await prisma.monthlyUsage.groupBy({
      by: ['userId', 'billingMonth', 'billingYear'],
      _count: true,
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    });

    console.log(`Found ${allRecords.length} duplicate groups`);

    if (allRecords.length === 0) {
      console.log('✅ No duplicates found!');
      await prisma.$disconnect();
      return;
    }

    // For each duplicate group, keep the most recent record and delete the others
    for (const group of allRecords) {
      const { userId, billingMonth, billingYear } = group;
      
      // Get all records for this group
      const records = await prisma.monthlyUsage.findMany({
        where: {
          userId,
          billingMonth,
          billingYear
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      console.log(`Group: userId=${userId}, month=${billingMonth}, year=${billingYear} - ${records.length} records`);
      
      // Keep the first (most recent), delete the rest
      const keepId = records[0].id;
      const deleteIds = records.slice(1).map(r => r.id);
      
      console.log(`  Keeping ${keepId}, deleting ${deleteIds.length} duplicates`);
      
      // Delete duplicates
      if (deleteIds.length > 0) {
        await prisma.monthlyUsage.deleteMany({
          where: {
            id: {
              in: deleteIds
            }
          }
        });
        console.log(`  ✓ Deleted ${deleteIds.length} duplicates`);
      }
    }

    console.log('✅ All duplicates cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixDuplicates();
