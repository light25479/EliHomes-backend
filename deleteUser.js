import prisma from './lib/prisma.js';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true },
      orderBy: { id: 'asc' },
    });

    if (users.length === 0) {
      console.log('❌ No users found in the database.');
      rl.close();
      return;
    }

    console.log('Users available:');
    users.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
    });

    rl.question(
      '\nEnter the numbers of the users you want to delete (comma-separated, e.g., 1,3,5): ',
      async (answer) => {
        const selections = answer
          .split(',')
          .map((num) => Number(num.trim()) - 1)
          .filter((idx) => idx >= 0 && idx < users.length);

        if (selections.length === 0) {
          console.log('❌ No valid selections made. Exiting.');
          rl.close();
          return;
        }

        const selectedUsers = selections.map((idx) => users[idx]);
        console.log('\n⚠️ The following users will be deleted:');
        selectedUsers.forEach((user) => {
          console.log(`- ID: ${user.id}, Email: ${user.email}, Role: ${user.role}`);
        });

        rl.question('\nAre you sure? This action is irreversible (yes/no): ', async (confirm) => {
          if (confirm.toLowerCase() !== 'yes') {
            console.log('Aborted. No users were deleted.');
            rl.close();
            return;
          }

          const userIdsToDelete = selectedUsers.map((u) => u.id);

          try {
            // Delete related property images first
            await prisma.propertyImage.deleteMany({
              where: { property: { ownerId: { in: userIdsToDelete } } },
            });

            // Delete related properties
            await prisma.property.deleteMany({
              where: { ownerId: { in: userIdsToDelete } },
            });

            // Delete users
            const deletedUsers = await prisma.user.deleteMany({
              where: { id: { in: userIdsToDelete } },
            });

            console.log(`✅ Successfully deleted ${deletedUsers.count} user(s) and all related data.`);
          } catch (error) {
            console.error('❌ Error deleting users:', error);
          } finally {
            rl.close();
          }
        });
      }
    );
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    rl.close();
  }
}

main();
//node deleteUser.js-to run this script
//Type the numbers corresponding to the users you want to delete
//Type yes to delete, or anything else to abort:
//The script will delete the users and any related properties/images.
//Tip: Always double-check which users you are deleting. Once confirmed, it cannot be undone.