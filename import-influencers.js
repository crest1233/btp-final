// const axios = require('axios'); // Uncomment when using the import function

// Configuration
const API_BASE_URL = 'http://localhost:4000/api';
const ADMIN_TOKEN = 'YOUR_ADMIN_JWT_TOKEN_HERE'; // Replace with your admin JWT token

// Helper function to extract Instagram handle from URL
function extractInstagramHandle(instagramLink) {
  const s = String(instagramLink || '').trim().replace(/[`'\"]/g, '');
  if (!s) return null;
  const clean = s.replace(/\s+/g, '');
  const match = clean.match(/instagram\.com\/([^/?#]+)/i);
  return match ? match[1].split('?')[0] : null;
}

// Helper function to convert follower range to approximate number
function convertFollowerRange(range) {
  if (range === undefined || range === null) return null;
  const text = String(range).trim().replace(/[–—]/g, '-');
  const parts = text.split('-').map((p) => p.trim());
  const parseUnit = (s) => {
    const m = String(s).toUpperCase().match(/([0-9]*\.?[0-9]+)\s*([KM]?)/);
    if (!m) return null;
    let n = parseFloat(m[1]);
    if (m[2] === 'K') n *= 1000;
    if (m[2] === 'M') n *= 1000000;
    return Math.round(n);
  };
  if (parts.length === 2) {
    const a = parseUnit(parts[0]);
    const b = parseUnit(parts[1]);
    if (a && b) return Math.round((a + b) / 2);
  }
  return parseUnit(text);
}

// Helper function to extract gender from gender_ratio
function extractGender(genderRatio) {
  if (genderRatio === undefined || genderRatio === null) return null;
  const ratio = String(genderRatio).toLowerCase();
  const femaleMatch = ratio.match(/(\d+\.?\d*)%?\s*female/);
  const maleMatch = ratio.match(/(\d+\.?\d*)%?\s*male/);
  if (femaleMatch && maleMatch) {
    const femalePercent = parseFloat(femaleMatch[1]);
    const malePercent = parseFloat(maleMatch[1]);
    if (!Number.isNaN(femalePercent) && !Number.isNaN(malePercent)) {
      return femalePercent > malePercent ? 'FEMALE' : 'MALE';
    }
  }
  return null;
}

// Convert your JSON format to database format
function convertToCreatorFormat(influencerData) {
  const instagramHandle = extractInstagramHandle(influencerData.instagram_link);
  const instagramFollowers = convertFollowerRange(influencerData.follower_range);
  const gender = extractGender(influencerData.gender_ratio);
  
  let username = influencerData.name
    ? influencerData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    : instagramHandle;
  if (!username) {
    username = `creator_${Math.random().toString(36).slice(2, 10)}`;
  }

  const avgEngagementRate = (() => {
    const er = influencerData.engagement_rate;
    if (er === undefined || er === null) return 3.5;
    const numEr = Number(er);
    if (instagramFollowers && numEr > 100) {
      return +((numEr / instagramFollowers) * 100).toFixed(2);
    }
    if (numEr <= 1) {
      return +(numEr * 100).toFixed(2);
    }
    return +numEr.toFixed(2);
  })();

  return {
    displayName: influencerData.name || 'Unknown Creator',
    username: username,
    email: influencerData.email || `${username}@import.local`,
    instagramHandle: instagramHandle,
    instagramFollowers: instagramFollowers,
    bio: `${influencerData.niche || 'Content Creator'} | ${instagramFollowers ? `${Math.floor(instagramFollowers/1000)}K followers` : 'Growing audience'} | Based in India`,
    avgEngagementRate: avgEngagementRate,
    basePrice: influencerData.commercial_rate || 1000,
    age: Math.floor(Math.random() * 10) + 22,
    gender: gender,
    location: 'India',
    categories: influencerData.niche ? [String(influencerData.niche).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')] : ['lifestyle'],
    isVerified: instagramFollowers ? instagramFollowers > 10000 : false,
    isActive: true,
    tiktokHandle: null,
    tiktokFollowers: null,
    youtubeHandle: null,
    youtubeFollowers: null
  };
}

// Main import function
async function importInfluencers(influencersArray) {
  const axios = require('axios'); // Import axios only when needed
  try {
    console.log(`Converting ${influencersArray.length} influencer(s) to creator format...`);
    
    // Convert each influencer to creator format
    const creators = influencersArray.map(convertToCreatorFormat);
    
    console.log('Sample converted data:', JSON.stringify(creators[0], null, 2));
    
    // Send to import API
    const response = await axios.post(`${API_BASE_URL}/creators/import`, {
      items: creators
    }, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`✅ Successfully imported ${response.data.imported} creators!`);
    console.log('Created creators:', response.data.creators);
    
    return response.data;
  } catch (error) {
    console.error('❌ Import failed:', error.response?.data || error.message);
    throw error;
  }
}

// Example usage with your data format
const sampleData = [
  {
    "id": 1,
    "timestamp": "2025-03-20 13:38:45",
    "name": "Kanak Sharma",
    "email": "parkikanak@gmail.com",
    "mobile_number": 6207398818,
    "instagram_link": "https://www.instagram.com/kanaksharm.a?igsh=dmNoNXl3ZzM1amNx",
    "follower_range": "1K-5K",
    "niche": "Fashion & Beauty",
    "engagement_rate": 2000,
    "dashboard_screenshot": "https://drive.google.com/open?id=17i2SbS7TStRXx2rQfIGdpOM3GJDomS64",
    "gender_ratio": "70% Female 30% Male",
    "commercial_rate": 1000
  }
];

// Export functions for use
module.exports = {
  importInfluencers,
  convertToCreatorFormat,
  extractInstagramHandle,
  convertFollowerRange,
  extractGender
};

// If running directly, import sample data
if (require.main === module) {
  console.log('🚀 Starting influencer import...');
  console.log('⚠️  Make sure to replace ADMIN_TOKEN with your actual admin JWT token!');
  
  // Uncomment the line below to run the import
  // importInfluencers(sampleData);
  
  console.log('📝 To use this script:');
  console.log('1. Replace ADMIN_TOKEN with your admin JWT');
  console.log('2. Replace sampleData with your JSON array');
  console.log('3. Uncomment the importInfluencers(sampleData) line');
  console.log('4. Run: node import-influencers.js');
}