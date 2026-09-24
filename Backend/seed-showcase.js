import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DB_URL || "mongodb://127.0.0.1:27017/shopsphere_db";

async function seed() {
  await mongoose.connect(DB_URL);
  const db = mongoose.connection.db;

  const categories = await db.collection("categories").find({}).toArray();
  const getCatId = (name) => categories.find(c => c.name.toLowerCase().includes(name.toLowerCase()))?._id;

  const stores = await db.collection("stores").find({}).toArray();
  const defaultStore = stores[1] || stores[0];
  const defaultSellerId = defaultStore?.sellerId;
  const defaultStoreId = defaultStore?._id;

  const electronicCat = getCatId("Electronics");
  const fashionCat = getCatId("Fashion");
  const homeCat = getCatId("Home");
  const beautyCat = getCatId("Beauty");
  const sportsCat = getCatId("Sports");

  const showcaseProducts = [
    {
      title: "Aura Pro Wireless Noise-Cancelling Headphones",
      sku: "AURA-PRO-01",
      description: "Immerse yourself in acoustic precision with industry-leading active noise cancellation, 40-hour battery life, and spatial audio clarity.",
      price: 14999,
      originalPrice: 19999,
      category: electronicCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 35,
      lowStockThreshold: 5,
      images: [
        "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "AuraAcoustics",
      status: "active",
      rating: 4.9,
      reviewsCount: 128,
      aiGeneratedFeatures: ["Active Noise Cancellation", "40-Hour Battery", "Ultra-plush Memory Foam"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Zenith Ultra 4K Smart Watch Series 8",
      sku: "ZENITH-SW-8",
      description: "Always-on sapphire AMOLED display, advanced biometric health suite, ECG sensor, GPS tracking, and titanium bezel.",
      price: 8499,
      originalPrice: 12999,
      category: electronicCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 42,
      lowStockThreshold: 8,
      images: [
        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "ZenithTech",
      status: "active",
      rating: 4.8,
      reviewsCount: 94,
      aiGeneratedFeatures: ["Titanium Chassis", "Sapphire Glass", "ECG + Blood Oxygen"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "PixelCraft Mechanical Gaming Keyboard RGB",
      sku: "PIXEL-KEY-RGB",
      description: "Hot-swappable tactile mechanical switches, per-key RGB backlighting, sound-dampening gasket mount, and aircraft-grade aluminum top plate.",
      price: 4999,
      originalPrice: 6999,
      category: electronicCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 28,
      lowStockThreshold: 4,
      images: [
        "https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "PixelCraft",
      status: "active",
      rating: 4.7,
      reviewsCount: 76,
      aiGeneratedFeatures: ["Hot-Swappable Switches", "Gasket Mount", "Per-Key RGB"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "StudioPod Hi-Res Portable Bluetooth Speaker",
      sku: "STUDIO-POD-02",
      description: "360-degree room-filling acoustic output with dual passive radiators, IPX7 waterproof rating, and 24-hour continuous playback.",
      price: 3499,
      originalPrice: 4999,
      category: electronicCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 50,
      lowStockThreshold: 6,
      images: [
        "https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "StudioSound",
      status: "active",
      rating: 4.6,
      reviewsCount: 52,
      aiGeneratedFeatures: ["360 Soundstage", "IPX7 Waterproof", "24-Hour Battery"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Artisan Leather Minimalist Weekender Duffel",
      sku: "ART-DUFFEL-01",
      description: "Handcrafted from full-grain vegetable-tanned leather with antique brass hardware and reinforced water-resistant canvas lining.",
      price: 6999,
      originalPrice: 9499,
      category: fashionCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 19,
      lowStockThreshold: 3,
      images: [
        "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "Kinsman Goods",
      status: "active",
      rating: 4.9,
      reviewsCount: 88,
      aiGeneratedFeatures: ["Full-Grain Leather", "Solid Brass Hardware", "Airline Carry-On Sized"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Urban Knit Minimalist White Sneakers",
      sku: "URBAN-KNIT-09",
      description: "Breathable engineered mesh upper, cushioned orthopedic EVA insole, and vulcanized rubber sole for all-day comfort.",
      price: 3299,
      originalPrice: 4599,
      category: fashionCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 45,
      lowStockThreshold: 5,
      images: [
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "AeroStep",
      status: "active",
      rating: 4.8,
      reviewsCount: 110,
      aiGeneratedFeatures: ["Featherweight Foam", "Machine Washable", "All-Day Arch Support"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Classic Polarized Aviator Sunglasses",
      sku: "POLAR-AV-01",
      description: "Titanium alloy frames with UV400 polarized scratch-resistant mineral glass lenses designed for glare-free outdoor vision.",
      price: 2499,
      originalPrice: 3999,
      category: fashionCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 60,
      lowStockThreshold: 10,
      images: [
        "https://images.unsplash.com/photo-1511499767150-a48a237f0083?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "SolRay Eyewear",
      status: "active",
      rating: 4.7,
      reviewsCount: 65,
      aiGeneratedFeatures: ["100% UV400 Protection", "Titanium Frame", "Anti-Scratch Coating"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Barista Touch Espresso Machine & Steam Wand",
      sku: "BARISTA-TOUCH-01",
      description: "Commercial 15-bar Italian pump, dual thermo-block temperature control, integrated burr grinder, and precision micro-foam frother.",
      price: 28999,
      originalPrice: 35999,
      category: homeCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 14,
      lowStockThreshold: 3,
      images: [
        "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "CremaCraft",
      status: "active",
      rating: 4.9,
      reviewsCount: 142,
      aiGeneratedFeatures: ["15-Bar Italian Pump", "Precision Burr Grinder", "Dual Thermo-Block"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Nordic Ceramic Pour-Over Kettle & Coffee Set",
      sku: "NORDIC-POT-03",
      description: "Gooseneck temperature-accurate precision kettle with handmade matte ceramic dripper and double-wall insulated carafe.",
      price: 2799,
      originalPrice: 3899,
      category: homeCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 32,
      lowStockThreshold: 4,
      images: [
        "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "NordicForm",
      status: "active",
      rating: 4.8,
      reviewsCount: 49,
      aiGeneratedFeatures: ["Ergonomic Pour", "Matte Ceramic", "Heat Retentive"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Minimalist Sculptural Table Lamp with Dimmable LED",
      sku: "SCULPT-LAMP-01",
      description: "Organic brass and frosted glass silhouette providing 3 adjustable color temperatures and touch dimming control.",
      price: 3499,
      originalPrice: 4899,
      category: homeCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 22,
      lowStockThreshold: 4,
      images: [
        "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "Lumiere Studio",
      status: "active",
      rating: 4.7,
      reviewsCount: 38,
      aiGeneratedFeatures: ["3 Color Temperatures", "Touch Dimming", "Solid Brushed Brass"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Botanical Radiance Glow Face Elixir Serum",
      sku: "BOTANIC-ELIXIR-01",
      description: "Cold-pressed rosehip seed oil infused with squalane, bakuchiol, and vitamin C for intense hydration and natural luminous radiance.",
      price: 1899,
      originalPrice: 2699,
      category: beautyCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 55,
      lowStockThreshold: 10,
      images: [
        "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80",
        "https://images.unsplash.com/photo-1608248597359-25f00e9ec03f?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "Flora Botanics",
      status: "active",
      rating: 4.9,
      reviewsCount: 165,
      aiGeneratedFeatures: ["100% Organic Cold-Pressed", "Vegan & Cruelty-Free", "Fast-Absorbing"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "Organic Rosewater & Aloe Balancing Facial Mist",
      sku: "ROSE-MIST-02",
      description: "Hydrating floral waters distilled from organic Damascus rose petals and calming aloe barbadensis leaf juice.",
      price: 999,
      originalPrice: 1499,
      category: beautyCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 70,
      lowStockThreshold: 12,
      images: [
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "Flora Botanics",
      status: "active",
      rating: 4.8,
      reviewsCount: 92,
      aiGeneratedFeatures: ["Pure Organic Distillate", "Refreshes Makeup", "Deeply Calming"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "ProGrip Eco-Friendly Natural Rubber Yoga Mat",
      sku: "PROGRIP-MAT-01",
      description: "High-density 5mm natural tree rubber with moisture-activated laser-etched non-slip alignment markers.",
      price: 2499,
      originalPrice: 3499,
      category: sportsCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 38,
      lowStockThreshold: 6,
      images: [
        "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "PranaFlex",
      status: "active",
      rating: 4.9,
      reviewsCount: 84,
      aiGeneratedFeatures: ["Non-Slip Rubber", "Laser Alignment Grid", "Biodegradable"],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      title: "HydroFlow Thermal Insulated Sport Flask 1L",
      sku: "HYDRO-FLASK-1L",
      description: "Double-wall vacuum-sealed stainless steel bottle keeps beverages iced for 24 hours or piping hot for 12 hours. Leak-proof chug cap included.",
      price: 1299,
      originalPrice: 1899,
      category: sportsCat,
      storeId: defaultStoreId,
      sellerId: defaultSellerId,
      stock: 80,
      lowStockThreshold: 10,
      images: [
        "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80"
      ],
      brand: "HydroFlow",
      status: "active",
      rating: 4.8,
      reviewsCount: 112,
      aiGeneratedFeatures: ["24-Hour Ice Retention", "18/8 Pro Stainless Steel", "BPA Free"],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  console.log('Upserting showcase products...');
  for (const prod of showcaseProducts) {
    if (!prod.category) continue;
    await db.collection('products').updateOne(
      { sku: prod.sku },
      { $set: prod },
      { upsert: true }
    );
  }

  console.log('Seeding completed successfully!');
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
