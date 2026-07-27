import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from "@prisma/adapter-pg"
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL! })
pool.on('connect', client => {
  client.query('SET search_path TO intellidine, public')
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const hash = await bcrypt.hash('password123', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {
      passwordHash: hash,
      role: 'manager'
    },
    create: {
      email: 'manager@example.com',
      name: 'Test Manager',
      passwordHash: hash,
      role: 'manager',
      restaurantId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      fullName: 'Test Manager',
    }
  })

  console.log('Created user:', user.email)
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect()
  })
