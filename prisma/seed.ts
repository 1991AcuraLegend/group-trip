import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean up existing data
  console.log('🧹 Cleaning up existing data...');
  await prisma.activity.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.carRental.deleteMany();
  await prisma.lodging.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log('👤 Creating test users...');
  const passwordHash = await bcrypt.hash('password123', 12);
  const user = await prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      passwordHash,
    },
  });
  console.log(`✅ Created user: ${user.email} (password: password123)`);

  const viewerPasswordHash = await bcrypt.hash('viewer123', 12);
  const viewerUser = await prisma.user.create({
    data: {
      email: 'viewer@example.com',
      name: 'Viewer User',
      passwordHash: viewerPasswordHash,
    },
  });
  console.log(`✅ Created viewer user: ${viewerUser.email} (password: viewer123)`);

  // Create San Diego trip (June 10-12, 2026)
  console.log('✈️  Creating San Diego trip...');
  const trip = await prisma.trip.create({
    data: {
      name: 'San Diego Weekend Getaway',
      description: 'A fun weekend exploring San Diego - beaches, food, and attractions!',
      startDate: new Date('2026-06-10T00:00:00Z'),
      endDate: new Date('2026-06-12T23:59:59Z'),
      ownerId: user.id,
      shareCode: 'SD2026SUMMER',
      shareRole: 'COLLABORATOR',
      viewerShareCode: 'SD2026VIEW',
    },
  });
  console.log(`✅ Created trip: ${trip.name}`);

  // Add trip members
  console.log('👥 Adding trip members...');
  
  // Add owner as a trip member with OWNER role
  const ownerMember = await prisma.tripMember.create({
    data: {
      userId: user.id,
      tripId: trip.id,
      role: 'OWNER',
    },
  });
  console.log(`✅ Added ${user.name} as OWNER to trip`);

  // Add viewer user as a trip member
  const viewerMember = await prisma.tripMember.create({
    data: {
      userId: viewerUser.id,
      tripId: trip.id,
      role: 'VIEWER',
    },
  });
  console.log(`✅ Added ${viewerUser.name} as VIEWER to trip`);

  // Add outbound flight: AUS → SAN (June 10, morning)
  console.log('🛫 Adding flights...');
  const outboundFlight = await prisma.flight.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      airline: 'Southwest Airlines',
      flightNumber: 'WN1523',
      departureDate: new Date('2026-06-10T08:30:00Z'),
      arrivalDate: new Date('2026-06-10T10:45:00Z'),
      departureCity: 'Austin',
      arrivalCity: 'San Diego',
      departureAirport: 'AUS',
      arrivalAirport: 'SAN',
      confirmationNum: 'ABC123',
      cost: 249.99,
      notes: 'Early morning flight, arrive with plenty of time to explore',
    },
  });
  console.log(`✅ Added outbound flight: ${outboundFlight.airline} ${outboundFlight.flightNumber}`);

  // Add return flight: SAN → AUS (June 12, evening)
  const returnFlight = await prisma.flight.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      airline: 'Southwest Airlines',
      flightNumber: 'WN2847',
      departureDate: new Date('2026-06-12T18:20:00Z'),
      arrivalDate: new Date('2026-06-12T22:45:00Z'),
      departureCity: 'San Diego',
      arrivalCity: 'Austin',
      departureAirport: 'SAN',
      arrivalAirport: 'AUS',
      confirmationNum: 'ABC124',
      cost: 269.99,
      notes: 'Evening flight back home',
    },
  });
  console.log(`✅ Added return flight: ${returnFlight.airline} ${returnFlight.flightNumber}`);

  // Add hotel - Hotel del Coronado (full trip duration)
  console.log('🏨 Adding hotel...');
  const hotel = await prisma.lodging.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'Hotel del Coronado',
      address: '1500 Orange Ave, Coronado, CA 92118',
      checkIn: new Date('2026-06-10T15:00:00Z'),
      checkOut: new Date('2026-06-12T11:00:00Z'),
      lat: 32.6811,
      lng: -117.1784,
      confirmationNum: 'HDC789456',
      cost: 895.00,
      notes: 'Historic beachfront hotel with stunning views. Early check-in requested.',
    },
  });
  console.log(`✅ Added hotel: ${hotel.name}`);

  // Add restaurants
  console.log('🍽️  Adding restaurants...');
  const restaurant1 = await prisma.restaurant.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'The Fish Market',
      address: '750 N Harbor Dr, San Diego, CA 92101',
      date: new Date('2026-06-10'),
      time: '19:00',
      lat: 32.7174,
      lng: -117.1699,
      cuisine: 'Seafood',
      priceRange: '$$',
      reservationId: 'FM061026-1900',
      cost: 120.00,
      notes: 'Waterfront seafood restaurant with fresh catches. Reservation for 2.',
    },
  });
  console.log(`✅ Added restaurant: ${restaurant1.name}`);

  const restaurant2 = await prisma.restaurant.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'Puesto Mexican Street Food',
      address: '789 W Harbor Dr, San Diego, CA 92101',
      date: new Date('2026-06-11'),
      time: '12:30',
      lat: 32.7091,
      lng: -117.1693,
      cuisine: 'Mexican',
      priceRange: '$',
      cost: 45.00,
      notes: 'Amazing tacos and guacamole, great lunch spot near the bay',
    },
  });
  console.log(`✅ Added restaurant: ${restaurant2.name}`);

  // Add activities
  console.log('🎯 Adding activities...');
  const activity1 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'San Diego Zoo',
      address: '2920 Zoo Dr, San Diego, CA 92101',
      date: new Date('2026-06-11'),
      startTime: '09:00',
      endTime: '14:00',
      lat: 32.7353,
      lng: -117.1490,
      category: 'Wildlife',
      cost: 128.00,
      notes: 'World-famous zoo with pandas, polar bears, and more. Get there early!',
      bookingRef: 'SDZOO-061126',
    },
  });
  console.log(`✅ Added activity: ${activity1.name}`);

  const activity2 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'Balboa Park Exploration',
      address: '1549 El Prado, San Diego, CA 92101',
      date: new Date('2026-06-11'),
      startTime: '15:00',
      endTime: '18:00',
      lat: 32.7341,
      lng: -117.1440,
      category: 'Cultural',
      cost: 0.00,
      notes: 'Beautiful park with Spanish architecture, gardens, and museums',
    },
  });
  console.log(`✅ Added activity: ${activity2.name}`);

  const activity3 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: false,
      name: 'La Jolla Cove & Beach',
      address: '1100 Coast Blvd, La Jolla, CA 92037',
      date: new Date('2026-06-12'),
      startTime: '09:00',
      endTime: '12:00',
      lat: 32.8509,
      lng: -117.2713,
      category: 'Beach',
      cost: 0.00,
      notes: 'Stunning cove with sea lions, great for photos and swimming. Check out before heading to airport.',
    },
  });
  console.log(`✅ Added activity: ${activity3.name}`);

  // Add activity ideas
  console.log('💡 Adding activity ideas...');
  const activityIdea1 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      name: 'USS Midway Museum',
      address: '910 N Harbor Dr, San Diego, CA 92101',
      lat: 32.7137,
      lng: -117.1751,
      category: 'Museum',
      cost: 26.00,
      notes: 'Aircraft carrier museum with vintage planes and flight simulators',
    },
  });
  console.log(`✅ Added activity idea: ${activityIdea1.name}`);

  const activityIdea2 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      name: 'Torrey Pines State Reserve',
      address: '12600 N Torrey Pines Rd, La Jolla, CA 92037',
      lat: 32.9216,
      lng: -117.2565,
      category: 'Hiking',
      cost: 0.00,
      notes: 'Scenic coastal hiking trails with ocean views',
    },
  });
  console.log(`✅ Added activity idea: ${activityIdea2.name}`);

  const activityIdea3 = await prisma.activity.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      name: 'Sunset Cliffs Natural Park',
      address: 'Sunset Cliffs Blvd, San Diego, CA 92107',
      lat: 32.7157,
      lng: -117.2573,
      category: 'Nature',
      cost: 0.00,
      notes: 'Perfect spot for sunset views and photography',
    },
  });
  console.log(`✅ Added activity idea: ${activityIdea3.name}`);

  // Add restaurant ideas
  console.log('💡 Adding restaurant ideas...');
  const restaurantIdea1 = await prisma.restaurant.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      name: 'Juniper & Ivy',
      address: '2228 Kettner Blvd, San Diego, CA 92101',
      lat: 32.7280,
      lng: -117.1697,
      cuisine: 'Contemporary American',
      priceRange: '$$$',
      notes: 'Upscale restaurant with creative seasonal menu',
    },
  });
  console.log(`✅ Added restaurant idea: ${restaurantIdea1.name}`);

  const restaurantIdea2 = await prisma.restaurant.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      name: 'Oscar\'s Mexican Seafood',
      address: '687 W 19th St, San Diego, CA 92101',
      lat: 32.7083,
      lng: -117.1538,
      cuisine: 'Mexican Seafood',
      priceRange: '$',
      notes: 'Famous for fish tacos and ceviche',
    },
  });
  console.log(`✅ Added restaurant idea: ${restaurantIdea2.name}`);

  // Add car rental ideas
  console.log('💡 Adding car rental ideas...');
  const carRentalIdea1 = await prisma.carRental.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      company: 'Enterprise',
      pickupAddress: 'San Diego International Airport, 3355 Admiral Boland Way, San Diego, CA 92101',
      pickupLat: 32.7338,
      pickupLng: -117.1933,
      cost: 180.00,
      notes: 'Full-size sedan, free additional driver',
    },
  });
  console.log(`✅ Added car rental idea: ${carRentalIdea1.company}`);

  const carRentalIdea2 = await prisma.carRental.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      company: 'Hertz',
      pickupAddress: 'San Diego International Airport, Terminal 1, San Diego, CA 92101',
      pickupLat: 32.7338,
      pickupLng: -117.1933,
      cost: 195.00,
      notes: 'Convertible available, Gold Plus rewards',
    },
  });
  console.log(`✅ Added car rental idea: ${carRentalIdea2.company}`);

  const carRentalIdea3 = await prisma.carRental.create({
    data: {
      tripId: trip.id,
      createdById: user.id,
      isIdea: true,
      company: 'Budget',
      pickupAddress: 'San Diego International Airport, 3355 Admiral Boland Way, San Diego, CA 92101',
      pickupLat: 32.7338,
      pickupLng: -117.1933,
      cost: 160.00,
      notes: 'Economy car, best price option',
    },
  });
  console.log(`✅ Added car rental idea: ${carRentalIdea3.company}`);

  console.log('\n✨ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   Users: 2 (1 owner, 1 viewer)`);
  console.log(`   Trip: ${trip.name}`);
  console.log(`   Flights: 2`);
  console.log(`   Hotels: 1`);
  console.log(`   Restaurants: 2 (+ 2 ideas)`);
  console.log(`   Activities: 3 (+ 3 ideas)`);
  console.log(`   Car Rentals: 3 ideas`);
  console.log('\n🔑 Login credentials:');
  console.log(`   Owner: test@example.com / password123`);
  console.log(`   Viewer: viewer@example.com / viewer123`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
