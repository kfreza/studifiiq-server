import "dotenv/config";
import { cs_connectDB, cs_getCollections } from "../src/config/db.js";

const cs_img = (id) => `https://images.unsplash.com/photo-${id}?w=1200&q=80&auto=format&fit=crop`;

// seed owners
const CS_OWNER = {
  ownerName: process.env.CS_SEED_OWNER_NAME || "Examiner",
  ownerEmail: process.env.CS_SEED_OWNER_EMAIL || "examiner@studiospace.dev",
  ownerPhoto: process.env.CS_SEED_OWNER_PHOTO || "",
};
const CS_SECOND_HOST = {
  ownerName: "StudioSpace Demo Host",
  ownerEmail: "host@studiospace.dev",
  ownerPhoto: "",
};
const CS_SECOND_HOST_STUDIOS = [1, 4, 6, 9];

// studios
const cs_seedStudios = [
  {
    title: "Northlight Cyc Wall Studio",
    category: "Photo Studio",
    hourlyRate: 65, securityDeposit: 150, maxCapacity: 12,
    location: "Brooklyn, New York",
    images: ["1471341971476-ae15ff5dd4ea", "1527011046414-4781f1f94f8c", "1768818928341-3b31b8965c6d"],
    amenities: ["Cyc Wall", "Strobe Kit", "Softboxes", "Makeup Station", "Wi-Fi", "Changing Room"],
    overview: "A bright 1,400 sq ft daylight studio built around a 20 ft white cyclorama. Ideal for fashion lookbooks, e-commerce catalogs and portrait sessions. Profoto strobes, three softboxes and a dedicated hair and makeup corner are included with every booking.",
  },
  {
    title: "Concrete & Canvas Portrait Loft",
    category: "Photo Studio",
    hourlyRate: 48, securityDeposit: 100, maxCapacity: 8,
    location: "Austin, Texas",
    images: ["1786325492057-e45a9aea8c8a", "1786325492063-8967ed6ad88d", "1777322615136-2f1d5d636cc4"],
    amenities: ["Natural Light", "Continuous LEDs", "Backdrop Rolls", "Full-Length Mirror", "Wi-Fi"],
    overview: "Polished concrete floors, tall windows and a neutral palette make this loft a favorite for headshots, editorial portraits and brand content. Swap between natural light and dimmable LED panels without changing rooms.",
  },
  {
    title: "Neon Garage Creative Studio",
    category: "Photo Studio",
    hourlyRate: 55, securityDeposit: 120, maxCapacity: 10,
    location: "Los Angeles, California",
    images: ["1767130298927-2df12c33e5d6", "1554941829-202a0b2403b8"],
    amenities: ["RGB Lighting", "Haze Machine", "Tethering Station", "Parking", "Wi-Fi"],
    overview: "A converted garage studio tuned for bold color work. Programmable RGB tubes, a haze machine and a tethered capture desk make it a go-to space for music artwork, product launches and social campaigns.",
  },
  {
    title: "Stage Nine Production Soundstage",
    category: "Film Stage",
    hourlyRate: 180, securityDeposit: 500, maxCapacity: 40,
    location: "Atlanta, Georgia",
    images: ["1612544409025-e1f6a56c1152", "1632187981988-40f3cbaeef5e", "1759417501248-0aa9489dab3f"],
    amenities: ["Lighting Grid", "Green Screen", "Grip Truck Access", "Production Office", "Loading Dock", "Parking"],
    overview: "A 6,000 sq ft soundproofed stage with a full overhead lighting grid, a three-wall green screen and drive-in loading. Built for commercials, music videos and short films that need room for crew, sets and camera movement.",
  },
  {
    title: "Frame & Field Indie Film Space",
    category: "Film Stage",
    hourlyRate: 120, securityDeposit: 300, maxCapacity: 25,
    location: "Toronto, Ontario",
    images: ["1782889187454-a568fe1f20e2", "1515634928627-2a4e0dae3ddf", "1485846234645-a62644f84728"],
    amenities: ["Blackout Curtains", "Dolly Track", "Cinema Camera Rental", "Green Room", "Wi-Fi"],
    overview: "An independent-friendly stage with blackout control, 40 ft of dolly track and an on-site rental cage. Directors use it for narrative scenes, interviews and product films without paying soundstage prices.",
  },
  {
    title: "The Walnut Room Podcast Lounge",
    category: "Podcast Lounge",
    hourlyRate: 40, securityDeposit: 60, maxCapacity: 4,
    location: "Chicago, Illinois",
    images: ["1782274265689-4f10a91d4abb", "1559523161-0fc0d8b38a7a", "1590602847861-f357a9332bbc"],
    amenities: ["4 Shure SM7B Mics", "Rodecaster Pro", "3-Camera Video", "Acoustic Panels", "Engineer on Request"],
    overview: "A warm, wood-paneled lounge set up for four-person conversations. Four broadcast microphones, a multitrack mixer and three synced cameras let hosts record audio and video episodes in a single take.",
  },
  {
    title: "Velvet Couch Video Podcast Set",
    category: "Podcast Lounge",
    hourlyRate: 35, securityDeposit: 50, maxCapacity: 3,
    location: "Miami, Florida",
    images: ["1783067091773-fc175ae0dbfb", "1478737270239-2f02b77fc618", "1589903308904-1010c2294adc"],
    amenities: ["Lounge Set", "2 Condenser Mics", "Teleprompter", "Ring Lights", "Wi-Fi"],
    overview: "A styled interview set with a velvet sofa, practical lamps and soft key lighting. Made for video podcasts, YouTube interviews and short-form clips that need to look polished on camera.",
  },
  {
    title: "Analog Heart Recording Suite",
    category: "Music Suite",
    hourlyRate: 85, securityDeposit: 200, maxCapacity: 8,
    location: "Nashville, Tennessee",
    images: ["1598488035139-bdbb2231ce04", "1574517947730-55cb23e608c2", "1531651008558-ed1740375b39"],
    amenities: ["SSL Console", "Vocal Booth", "Guitar Collection", "Pro Tools", "Engineer Included"],
    overview: "A tracking and mixing suite built around a large-format console and a treated vocal booth. A wall of vintage guitars and amps is available to every session, and a house engineer is included for the first two hours.",
  },
  {
    title: "Skyline Mix & Master Room",
    category: "Music Suite",
    hourlyRate: 70, securityDeposit: 150, maxCapacity: 5,
    location: "London, United Kingdom",
    images: ["1760780567530-389d8a3fba75", "1514320291840-2e0a9bf2a9ae"],
    amenities: ["Genelec Monitors", "Logic Pro & Ableton", "Acoustic Treatment", "Lounge Area", "Wi-Fi"],
    overview: "A precisely treated control room for mixing, mastering and production sessions. Reference-grade monitors and both major DAWs are ready on arrival, with a quiet lounge for clients between takes.",
  },
  {
    title: "Greenhouse Songwriting Studio",
    category: "Music Suite",
    hourlyRate: 45, securityDeposit: 80, maxCapacity: 6,
    location: "Portland, Oregon",
    images: ["1758336717046-c475fc6f45ce", "1511379938547-c1f69419868d"],
    amenities: ["Upright Piano", "Acoustic Guitars", "Natural Light", "Small Drum Kit", "Wi-Fi"],
    overview: "A sunlit writing room surrounded by plants, with an upright piano, acoustic guitars and a compact drum kit. Songwriters book it for co-writes, demos and rehearsal days away from a control-room setting.",
  },
  {
    title: "Bluebird Painting Atelier",
    category: "Art Workshop",
    hourlyRate: 30, securityDeposit: 50, maxCapacity: 10,
    location: "Berlin, Germany",
    images: ["1785423613154-a3f078420790", "1778897426627-0c29354ff50c", "1460661419201-fd4cecdf8a8b"],
    amenities: ["Easels", "North-Facing Windows", "Sink & Wash Area", "Drying Racks", "Storage Lockers"],
    overview: "A classic atelier with tall north-facing windows for even, color-accurate light all day. Ten easels, a wash station and drying racks make it suited to life drawing groups, workshops and solo painting days.",
  },
  {
    title: "Kiln & Clay Makers Workshop",
    category: "Art Workshop",
    hourlyRate: 38, securityDeposit: 70, maxCapacity: 12,
    location: "Melbourne, Australia",
    images: ["1784386178066-5ec051949ead", "1785637394287-13d5fdf5c96f", "1513364776144-60967b0f800f"],
    amenities: ["Work Tables", "Pottery Wheels", "Kiln Access", "Tool Wall", "Ventilation"],
    overview: "A hands-on makers space with large work tables, pottery wheels and kiln access. Hosts run ceramics classes, mixed-media workshops and team sessions here, with a full tool wall included in every booking.",
  },
];

// reviews
const cs_seedReviews = [
  [["Maya Chen", 5, "The cyc wall was spotless and the strobes were ready on arrival. Our lookbook shoot ran ahead of schedule."], ["Jordan Price", 5, "Great light, easy load-in and a really helpful host."], ["Ali Rahman", 4, "Excellent space. Parking nearby is limited, so plan for that."]],
  [["Sofia Alvarez", 5, "Perfect for headshots. The window light in the afternoon is beautiful."], ["Ethan Brooks", 4, "Clean, quiet and well equipped. Would book again."]],
  [["Priya Nair", 5, "The RGB setup saved us hours of rigging for our album cover."], ["Lucas Meyer", 4, "Fun space with lots of character. Bring extra sandbags."]],
  [["Hannah Lee", 5, "Huge stage, great grid and the production office was a lifesaver."], ["Marcus Johnson", 5, "We shot a full commercial here. Loading dock access made everything simple."], ["Nina Petrova", 4, "Excellent stage. HVAC is a little loud between takes."]],
  [["Tom Becker", 4, "Great value for an indie shoot. The dolly track was in good shape."], ["Aisha Khan", 5, "Blackout control was perfect for our night interior scenes."]],
  [["Chris Walker", 5, "Audio quality was outstanding and the room sounds great on camera."], ["Leah Simmons", 5, "Setup took minutes. Our first episode was recorded in one take."]],
  [["Daniel Ortiz", 4, "Looks amazing on video. The teleprompter was a nice bonus."], ["Grace Kim", 5, "Cozy set, friendly host and everything just worked."]],
  [["Ryan Mitchell", 5, "The console and vocal booth are top tier. The engineer knew the room inside out."], ["Zara Ahmed", 5, "Best tracking session we have had. The guitar wall is a dream."], ["Owen Clarke", 4, "Fantastic suite. Booking more hours next time."]],
  [["Emily Turner", 5, "Mixes translated perfectly everywhere we checked them."], ["Samuel Green", 4, "Precise room and comfortable lounge for clients."]],
  [["Isabella Rossi", 5, "Wrote three songs in one afternoon. The light and the piano are lovely."], ["Noah Fischer", 4, "Inspiring room. The drum kit is small but fine for demos."]],
  [["Clara Schmidt", 5, "The north light is consistent all day. Ideal for color work."], ["Ben Howard", 5, "We ran a life drawing class here and everyone loved it."]],
  [["Mia Thompson", 5, "Great for our team ceramics workshop. The tool wall is well organized."], ["Leo Martins", 4, "Spacious and well ventilated. Kiln slots book up fast."]],
];

// run seed
const cs_run = async () => {
  await cs_connectDB();
  const { cs_studios, cs_reviews, cs_wishlist, cs_bookings } = await cs_getCollections();

  // clear old seed
  await cs_studios.deleteMany({ isSeed: true });
  await cs_reviews.deleteMany({ isSeed: true });
  await cs_bookings.deleteMany({ isSeed: true });
  await cs_wishlist.deleteMany({ isSeed: true });
  const cs_ids = [];

  const cs_now = Date.now();
  const cs_day = 24 * 60 * 60 * 1000;

  for (const [index, studio] of cs_seedStudios.entries()) {
    const cs_reviewList = cs_seedReviews[index];
    const cs_avg = cs_reviewList.reduce((sum, [, rating]) => sum + rating, 0) / cs_reviewList.length;
    const cs_createdAt = new Date(cs_now - (index + 1) * 3 * cs_day);

    const { insertedId } = await cs_studios.insertOne({
      ...studio,
      images: studio.images.map(cs_img),
      ...(CS_SECOND_HOST_STUDIOS.includes(index) ? CS_SECOND_HOST : CS_OWNER),
      rating: Math.round(cs_avg * 10) / 10,
      reviewCount: cs_reviewList.length,
      isSeed: true,
      createdAt: cs_createdAt,
      updatedAt: cs_createdAt,
    });

    cs_ids.push({ _id: insertedId, ...studio, ...(CS_SECOND_HOST_STUDIOS.includes(index) ? CS_SECOND_HOST : CS_OWNER) });

    await cs_reviews.insertMany(
      cs_reviewList.map(([userName, rating, comment], reviewIndex) => ({
        studioId: insertedId,
        userName,
        userEmail: `${userName.toLowerCase().split(" ").join(".")}@example.com`,
        userPhoto: "",
        rating,
        comment,
        isSeed: true,
        createdAt: new Date(cs_createdAt.getTime() + (reviewIndex + 1) * cs_day),
      }))
    );
  }

  // sample bookings
  const cs_dateFrom = (days) => new Date(cs_now + days * cs_day).toISOString().slice(0, 10);
  const cs_booking = (studioIndex, guest, days, startTime, endTime, status) => {
    const cs_studio = cs_ids[studioIndex];
    const date = cs_dateFrom(days);
    const start = new Date(`${date}T${startTime}:00.000Z`);
    const end = new Date(`${date}T${endTime}:00.000Z`);
    const hours = (end - start) / (60 * 60 * 1000);
    const subtotal = hours * cs_studio.hourlyRate;
    const createdAt = new Date(Math.min(cs_now, start.getTime()) - 2 * cs_day);
    return {
      studioId: cs_studio._id,
      studioTitle: cs_studio.title,
      studioImage: cs_img(cs_studio.images[0]),
      studioLocation: cs_studio.location,
      hostName: cs_studio.ownerName,
      hostEmail: cs_studio.ownerEmail,
      userName: guest.name,
      userEmail: guest.email,
      date,
      startTime,
      endTime,
      start,
      end,
      hours,
      hourlyRate: cs_studio.hourlyRate,
      securityDeposit: cs_studio.securityDeposit,
      subtotal,
      totalPrice: subtotal + cs_studio.securityDeposit,
      status,
      isSeed: true,
      createdAt,
      updatedAt: createdAt,
    };
  };
  const cs_examiner = { name: CS_OWNER.ownerName, email: CS_OWNER.ownerEmail };
  await cs_bookings.insertMany([
    cs_booking(1, cs_examiner, -6, "10:00", "14:00", "Completed"),
    cs_booking(4, cs_examiner, 3, "09:00", "13:00", "Confirmed"),
    cs_booking(6, cs_examiner, 7, "15:00", "17:00", "Pending"),
    cs_booking(0, { name: "Maya Chen", email: "maya.chen@example.com" }, 5, "10:00", "13:00", "Pending"),
    cs_booking(3, { name: "Marcus Johnson", email: "marcus.johnson@example.com" }, 4, "08:00", "16:00", "Confirmed"),
    cs_booking(7, { name: "Zara Ahmed", email: "zara.ahmed@example.com" }, -10, "12:00", "16:00", "Completed"),
  ]);

  // sample wishlist
  await cs_wishlist.insertMany(
    [4, 9].map((studioIndex) => ({
      userEmail: CS_OWNER.ownerEmail,
      studioId: cs_ids[studioIndex]._id,
      isSeed: true,
      createdAt: new Date(),
    }))
  );

  // indexes
  await cs_studios.createIndex({ category: 1 });
  await cs_studios.createIndex({ rating: -1, reviewCount: -1 });
  await cs_studios.createIndex({ createdAt: -1 });
  await cs_studios.createIndex({ ownerEmail: 1 });
  await cs_reviews.createIndex({ studioId: 1, createdAt: -1 });
  await cs_reviews.createIndex({ studioId: 1, userEmail: 1 });
  await cs_wishlist.createIndex({ userEmail: 1, studioId: 1 }, { unique: true });

  console.log(`Seeded ${cs_seedStudios.length} studios (8 owned by ${CS_OWNER.ownerEmail}), reviews, 6 bookings and 2 saved studios.`);
  process.exit(0);
};

cs_run().catch((err) => {
  console.error("Seeding failed:", err.message);
  process.exit(1);
});
