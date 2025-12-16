import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const setupAdmin = async () => {
  try {
    console.log('🔧 Setting up admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: 'admin' }
    });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      console.log('   Username:', existingAdmin.username);
      console.log('   Email:', existingAdmin.email);
      console.log('   Role:', existingAdmin.role);
      await prisma.$disconnect();
      return;
    }

    // Create admin user
    const adminPassword = await bcrypt.hash('magic2024', 10);
    
    await prisma.user.create({
      data: {
        username: 'admin',
        password: adminPassword,
        email: 'admin@magic.com',
        name: 'Administrator',
        role: 'admin',
        isActive: true
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Username: admin');
    console.log('   Password: magic2024');
    console.log('   Email: admin@magic.com');
    console.log('   Role: admin');
    console.log('');
    console.log('🎉 You can now login with these credentials!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('❌ Error setting up admin:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
};

setupAdmin();
