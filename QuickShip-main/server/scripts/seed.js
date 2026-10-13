const bcrypt = require('bcryptjs');
const db = require('../models');

const NEPAL_LOCATIONS = [
    { province: 'Bagmati', district: 'Kathmandu', city_or_area: 'Kathmandu', latitude: 27.7172, longitude: 85.3240 },
    { province: 'Gandaki', district: 'Kaski', city_or_area: 'Pokhara', latitude: 28.2096, longitude: 83.9856 },
    { province: 'Bagmati', district: 'Chitwan', city_or_area: 'Bharatpur', latitude: 27.6766, longitude: 84.4363 },
    { province: 'Koshi', district: 'Morang', city_or_area: 'Biratnagar', latitude: 26.4525, longitude: 87.2718 },
    { province: 'Lumbini', district: 'Rupandehi', city_or_area: 'Butwal', latitude: 27.7006, longitude: 83.4484 },
    { province: 'Madhesh', district: 'Parsa', city_or_area: 'Birgunj', latitude: 27.0112, longitude: 84.8778 },
    { province: 'Sudurpashchim', district: 'Kailali', city_or_area: 'Dhangadhi', latitude: 28.6946, longitude: 80.5960 },
    { province: 'Karnali', district: 'Surkhet', city_or_area: 'Birendranagar', latitude: 28.6019, longitude: 81.6339 },
    { province: 'Lumbini', district: 'Banke', city_or_area: 'Nepalgunj', latitude: 28.0500, longitude: 81.6167 },
    { province: 'Bagmati', district: 'Lalitpur', city_or_area: 'Lalitpur', latitude: 27.6685, longitude: 85.3206 }
];

async function seed() {
    try {
        console.log('Syncing database (existing tables are kept, missing ones created)...');
        await db.sequelize.sync({ alter: true });

        const existingAdmin = await db.User.findOne({ where: { role: 'admin' } });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.User.create({
                full_name: 'System Admin',
                email: 'admin@quickship.com',
                password: hashedPassword,
                role: 'admin',
                phone: '9800000000'
            });
            console.log('Admin seeded: admin@quickship.com / admin123');
        } else {
            console.log('Admin already exists, skipping.');
        }

        const locationCount = await db.Location.count();
        if (locationCount === 0) {
            await db.Location.bulkCreate(NEPAL_LOCATIONS);
            console.log(`Seeded ${NEPAL_LOCATIONS.length} locations.`);
        } else {
            console.log('Locations already exist, skipping.');
        }

        console.log('Seed complete.');
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err);
        process.exit(1);
    }
}

seed();
