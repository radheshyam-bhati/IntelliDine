import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import * as dotenv from 'dotenv'
dotenv.config({ path: './apps/web/.env.local' })

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
pool.on('connect', client => {
  client.query('SET search_path TO intellidine, public')
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const users = await prisma.user.findMany()
  console.log('Current users:', users.map(u => ({ email: u.email, role: u.role })))
  
  if (users.length > 0) {
    const user = users.find(u => u.email === 'khushiagarwalg1@gmail.com') || users[0]
    await prisma.user.update({
      where: { id: user.id },
      data: { role: 'manager' }
    })
    console.log(`Promoted user ${user.email} to manager!`)
  } else {
    console.log('No users found in the database. Please log in first.')
  }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
