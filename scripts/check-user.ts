import { prisma } from '../lib/db/prisma'

async function checkUser() {
  const userId = 'cmeubd19x00006zcdy52aaf1n'
  
  console.log(`Checking for user with ID: ${userId}`)
  
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    
    if (user) {
      console.log('User found:', {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt
      })
    } else {
      console.log('User NOT found in database')
      console.log('\nThis user ID exists in your session but not in the database.')
      console.log('You need to clear your browser cookies/session to fix this.')
      console.log('\nTo clear session:')
      console.log('1. Clear browser cookies for this site')
      console.log('2. Or open Developer Tools > Application > Storage > Clear Site Data')
    }
    
    // Also list all existing users
    console.log('\n--- All existing users ---')
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true
      }
    })
    
    if (allUsers.length === 0) {
      console.log('No users found in database')
    } else {
      allUsers.forEach(u => {
        console.log(`- ${u.email} (${u.id})`)
      })
    }
    
  } catch (error) {
    console.error('Error checking user:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()