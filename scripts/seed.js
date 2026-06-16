require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!url || !key) {
  console.error('❌ Missing env vars. Make sure .env.local exists with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
  process.exit(1)
}

console.log('📡 Connecting to:', url)

const supabase = createClient(url, key)

const listings = [
  {
    project_name: 'The Pinnacle@Duxton',
    district: 11,
    area: 'Newton',
    floor_level: 28,
    unit_size_sqft: 1150,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'SE',
    asking_price: 1950000,
    psf: 1696,
    tenure: 'freehold',
    top_year: 2009,
    listing_url: 'https://www.propertyguru.com.sg/pinnacle-duxton',
    agent_name: 'John Tan',
    agent_contact: '9123 4567',
  },
  {
    project_name: 'Marina Bay Residences',
    district: 1,
    area: 'Downtown',
    floor_level: 35,
    unit_size_sqft: 1320,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'E',
    asking_price: 3200000,
    psf: 2424,
    tenure: 'freehold',
    top_year: 2020,
    listing_url: 'https://www.propertyguru.com.sg/marina-bay-residences',
    agent_name: 'Sarah Lim',
    agent_contact: '9812 5678',
  },
  {
    project_name: 'The Sail @ Marina Bay',
    district: 4,
    area: 'Marina Bay',
    floor_level: 12,
    unit_size_sqft: 980,
    bedrooms: 2,
    bathrooms: 2,
    facing: 'N',
    asking_price: 1680000,
    psf: 1714,
    tenure: '999yr',
    top_year: 2012,
    listing_url: 'https://www.propertyguru.com.sg/sail-marina-bay',
    agent_name: 'Michael Ng',
    agent_contact: '8765 4321',
  },
  {
    project_name: 'Bishan Park View',
    district: 20,
    area: 'Bishan',
    floor_level: 8,
    unit_size_sqft: 1100,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'N',
    asking_price: 1420000,
    psf: 1291,
    tenure: '99yr',
    top_year: 1998,
    listing_url: 'https://www.propertyguru.com.sg/bishan-park-view',
    agent_name: 'David Wong',
    agent_contact: '9234 5678',
  },
  {
    project_name: 'The Interlace',
    district: 5,
    area: 'Buona Vista',
    floor_level: 18,
    unit_size_sqft: 1450,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'W',
    asking_price: 2100000,
    psf: 1448,
    tenure: 'freehold',
    top_year: 2014,
    listing_url: 'https://www.propertyguru.com.sg/interlace',
    agent_name: 'Emily Chua',
    agent_contact: '9456 7890',
  },
  {
    project_name: 'Panorama Towers',
    district: 15,
    area: 'Marine Parade',
    floor_level: 22,
    unit_size_sqft: 1250,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'SE',
    asking_price: 2350000,
    psf: 1880,
    tenure: 'freehold',
    top_year: 2006,
    listing_url: 'https://www.propertyguru.com.sg/panorama-towers',
    agent_name: 'Peter Lee',
    agent_contact: '9567 8901',
  },
  {
    project_name: 'Lakeville Condo',
    district: 19,
    area: 'Sengkang',
    floor_level: 5,
    unit_size_sqft: 850,
    bedrooms: 2,
    bathrooms: 1,
    facing: 'N',
    asking_price: 695000,
    psf: 818,
    tenure: '99yr',
    top_year: 2005,
    listing_url: 'https://www.propertyguru.com.sg/lakeville',
    agent_name: 'Amy Tan',
    agent_contact: '8234 5678',
  },
  {
    project_name: 'Holland Vue',
    district: 10,
    area: 'Holland',
    floor_level: 15,
    unit_size_sqft: 1600,
    bedrooms: 4,
    bathrooms: 3,
    facing: 'NE',
    asking_price: 2750000,
    psf: 1719,
    tenure: 'freehold',
    top_year: 2008,
    listing_url: 'https://www.propertyguru.com.sg/holland-vue',
    agent_name: 'James Koh',
    agent_contact: '9678 9012',
  },
  {
    project_name: 'Pinnacle in the Sky',
    district: 9,
    area: 'Orchard',
    floor_level: 42,
    unit_size_sqft: 1350,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'E',
    asking_price: 4200000,
    psf: 3111,
    tenure: 'freehold',
    top_year: 2019,
    listing_url: 'https://www.propertyguru.com.sg/pinnacle-sky',
    agent_name: 'Linda Chua',
    agent_contact: '9789 0123',
  },
  {
    project_name: 'Lentor Modern',
    district: 26,
    area: 'Lentor',
    floor_level: 7,
    unit_size_sqft: 1050,
    bedrooms: 3,
    bathrooms: 2,
    facing: 'W',
    asking_price: 1150000,
    psf: 1095,
    tenure: '99yr',
    top_year: 2017,
    listing_url: 'https://www.propertyguru.com.sg/lentor-modern',
    agent_name: 'Tom Lim',
    agent_contact: '9890 1234',
  },
]

async function seed() {
  try {
    console.log('🌱 Inserting 10 listings...')
    const { data, error } = await supabase.from('listings').insert(listings)

    if (error) {
      console.error('❌ Error:', error)
      process.exit(1)
    }

    console.log('✅ Success! Inserted 10 listings.')
    console.log('Refresh your browser at http://localhost:3000 to see them.')
    process.exit(0)
  } catch (e) {
    console.error('❌ Exception:', e)
    process.exit(1)
  }
}

seed()
