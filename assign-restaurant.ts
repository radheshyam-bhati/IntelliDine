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
  const email = 'khushiagarwalg1@gmail.com'
  const user = await prisma.user.findUnique({ where: { email } })
  
  if (!user) {
    console.log(`User ${email} not found!`)
    return
  }
  
  let restaurant = await prisma.restaurant.findFirst()
  
  if (!restaurant) {
    console.log('No restaurants found. Creating a demo restaurant...')
    restaurant = await prisma.restaurant.create({
      data: {
        name: 'Demo Restaurant',
        slug: 'demo',
      }
    })
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { restaurantId: restaurant.id }
  })
  
  console.log(`Assigned user ${email} to restaurant ${restaurant.name} (${restaurant.id})!`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
