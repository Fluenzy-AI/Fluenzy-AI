const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixCompanyMemberDuplicates() {
  try {
    console.log('Finding duplicate inviteToken values using MongoDB aggregation...');
    
    // Use Prisma's raw MongoDB access
    const result = await prisma.$runCommandRaw({
      aggregate: 'CompanyMember',
      pipeline: [
        {
          $group: {
            _id: '$inviteToken',
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            records: { $push: '$$ROOT' }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ],
      cursor: {}
    });
    
    const cursor = result.cursor;
    const duplicates = cursor.firstBatch || [];
    
    console.log(`Found ${duplicates.length} duplicate groups`);
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
      await prisma.$disconnect();
      return;
    }
    
    for (const dup of duplicates) {
      console.log(`\nDuplicate inviteToken: ${dup._id === null ? 'null' : dup._id}`);
      console.log(`  Count: ${dup.count}`);
      
      // Keep the first record, update the rest with unique tokens
      const [keep, ...rest] = dup.ids;
      console.log(`  Keeping ID: ${keep}`);
      
      for (const id of rest) {
        const uniqueToken = `migrated_${id.toString()}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        
        await prisma.$runCommandRaw({
          update: 'CompanyMember',
          updates: [{
            q: { _id: id },
            u: { $set: { inviteToken: uniqueToken } }
          }]
        });
        
        console.log(`  Updated ${id} with token: ${uniqueToken}`);
      }
    }
    
    console.log('\n✅ All duplicates fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixCompanyMemberDuplicates();
