const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function fixNullTokens() {
  try {
    console.log('Finding CompanyMember records with null inviteToken...');
    
    // Get all records with null inviteToken
    const nullTokenRecords = await prisma.companyMember.findMany({
      where: {
        inviteToken: null
      }
    });

    console.log(`Found ${nullTokenRecords.length} records with null inviteToken`);

    if (nullTokenRecords.length <= 1) {
      console.log('✅ No duplicate null tokens (0 or 1 record is okay)!');
      await prisma.$disconnect();
      return;
    }

    // We need to set unique token values for all but one
    // Keep the first one as null, update the rest with unique tokens
    const [first, ...rest] = nullTokenRecords;
    
    console.log(`Keeping first record (${first.id}) with null token`);
    console.log(`Updating ${rest.length} records with unique tokens`);

    for (const record of rest) {
      const uniqueToken = `token_${record.id}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      await prisma.companyMember.update({
        where: { id: record.id },
        data: { inviteToken: uniqueToken }
      });
      console.log(`  Updated ${record.id} with token: ${uniqueToken}`);
    }

    console.log('✅ All null tokens fixed!');
    
  } catch (error) {
    console.error('❌ Error fixing null tokens:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

fixNullTokens();
