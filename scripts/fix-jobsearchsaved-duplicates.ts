const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixJobSearchSavedDuplicates() {
  try {
    console.log('Finding duplicate userId+jobId combinations in JobSearchSaved...');
    
    const duplicates = await prisma.jobSearchSaved.groupBy({
      by: ['userId', 'jobId'],
      _count: true,
      having: {
        userId: {
          _count: {
            gt: 1
          }
        }
      }
    });
    
    console.log(`Found ${duplicates.length} duplicate groups`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      await prisma.$disconnect();
      return;
    }
    
    for (const group of duplicates) {
      const { userId, jobId } = group;
      
      const records = await prisma.jobSearchSaved.findMany({
        where: {
          userId,
          jobId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`\nGroup: userId=${userId}, jobId=${jobId} - ${records.length} records`);
      
      // Keep the most recent, delete the rest
      const keepId = records[0].id;
      const deleteIds = records.slice(1).map(r => r.id);
      
      console.log(`  Keeping ${keepId}, deleting ${deleteIds.length} duplicates`);
      
      if (deleteIds.length > 0) {
        await prisma.jobSearchSaved.deleteMany({
          where: {
            id: {
              in: deleteIds
            }
          }
        });
        console.log(`  ✓ Deleted ${deleteIds.length} duplicates`);
      }
    }
    
    console.log('\n✅ All JobSearchSaved duplicates fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixJobSearchSavedDuplicates();
