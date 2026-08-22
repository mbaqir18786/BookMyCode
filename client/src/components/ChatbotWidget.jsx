import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, Loader2, ChevronDown } from 'lucide-react';
import { useCurrentUser } from '../context/CurrentUserContext';
import { useNavigate } from 'react-router-dom';

// ── Language detection ────────────────────────────────────────────────────────
function detectLanguage(text) {
  if (/[\u0900-\u097F]/.test(text)) return 'hi';  // Devanagari (Hindi)
  if (/[\u0A00-\u0A7F]/.test(text)) return 'pa';  // Gurmukhi (Punjabi)
  return 'en';
}

// ── HTML-safe renderer ────────────────────────────────────────────────────────
function HtmlMessage({ html }) {
  return (
    <div
      className="text-xs leading-relaxed"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-green-500"
          style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </div>
  );
}

// ── Knowledge Base ────────────────────────────────────────────────────────────
const KB = {
  contact_support: {
    keywords: ['contact', 'support', 'phone', 'whatsapp', 'email', 'help desk',
               'संपर्क', 'सपोर्ट', 'सहायता', 'फोन', 'ईमेल', 'ਸੰਪਰਕ', 'ਸਪੋਰਟ', 'ਮਦਦ', 'ਫੋਨ', 'ਈਮੇਲ',
               'contact support','contact our support','help'],
    en: `📞 <strong>Contact Our Support Team</strong><br><br>We are here to help you with any queries regarding the CSBP platform.<br><br>• <strong>Phone:</strong> +91 67676767676<br>• <strong>WhatsApp:</strong> +91 67676767676<br>• <strong>Email:</strong> csbp@gmail.com<br><br>Our team is available during standard business hours.`,
    hi: `📞 <strong>हमारी सपोर्ट टीम से संपर्क करें</strong><br><br>• <strong>फोन:</strong> +91 67676767676<br>• <strong>व्हाट्सएप:</strong> +91 67676767676<br>• <strong>ईमेल:</strong> csbp@gmail.com`,
    pa: `📞 <strong>ਸਾਡੀ ਸਪੋਰਟ ਟੀਮ ਨਾਲ ਸੰਪਰਕ ਕਰੋ</strong><br><br>• <strong>ਫੋਨ:</strong> +91 67676767676<br>• <strong>ਵ੍ਹਾਟਸਐਪ:</strong> +91 67676767676<br>• <strong>ਈਮੇਲ:</strong> csbp@gmail.com`,
    action: { label: '📧 Email Support', path: 'mailto:csbp@gmail.com' }
  },

  sign_in: {
    keywords: ['sign in', 'signin', 'login', 'log in', 'access account',
               'साइन इन', 'लॉगिन', 'प्रवेश', 'ਸਾਈਨ ਇਨ', 'ਲੌਗਇਨ'],
    en: `To sign in to your account:<br><br><strong>Step 1:</strong> Click <strong>"Sign In"</strong> at the top-right<br><strong>Step 2:</strong> Enter your registered email/phone<br><strong>Step 3:</strong> Enter your password<br><strong>Step 4:</strong> Click <strong>"Login"</strong><br><br>Don't have an account? Register as a <strong>Farmer</strong> or <strong>Seller</strong>.`,
    hi: `अपने अकाउंट में साइन इन करने के लिए:<br><br><strong>स्टेप 1:</strong> ऊपर दाईं ओर <strong>"Sign In"</strong> बटन पर क्लिक करें<br><strong>स्टेप 2:</strong> ईमेल/फोन दर्ज करें<br><strong>स्टेप 3:</strong> पासवर्ड दर्ज करें<br><strong>स्टेप 4:</strong> <strong>"Login"</strong> पर क्लिक करें`,
    pa: `ਆਪਣੇ ਖਾਤੇ ਵਿੱਚ ਸਾਈਨ ਇਨ ਕਰਨ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> ਉੱਪਰ ਸੱਜੇ <strong>"Sign In"</strong> ਬਟਨ 'ਤੇ ਕਲਿੱਕ ਕਰੋ<br><strong>ਕਦਮ 2:</strong> ਈਮੇਲ/ਫੋਨ ਦਰਜ ਕਰੋ<br><strong>ਕਦਮ 3:</strong> ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ`,
    action: { label: '🔐 Sign In', path: '/signin' }
  },

  sign_up: {
    keywords: ['sign up', 'signup', 'register', 'create account', 'new account',
               'साइन अप', 'रजिस्टर', 'खाता बनाएं', 'ਸਾਈਨ ਅੱਪ', 'ਰਜਿਸਟਰ', 'ਖਾਤਾ ਬਣਾਓ'],
    en: `To create a new account:<br><br><strong>Step 1:</strong> Click <strong>"Sign Up"</strong><br><strong>Step 2:</strong> Choose your role — <strong>Farmer</strong> or <strong>Seller</strong><br><strong>Step 3:</strong> Fill in your details<br><strong>Step 4:</strong> Verify your phone/email via OTP<br><br>✅ Your account will be ready immediately!`,
    hi: `नया खाता बनाने के लिए:<br><br><strong>स्टेप 1:</strong> <strong>"Sign Up"</strong> पर क्लिक करें<br><strong>स्टेप 2:</strong> भूमिका चुनें — <strong>किसान</strong> या <strong>विक्रेता</strong><br><strong>स्टेप 3:</strong> विवरण भरें<br><strong>स्टेप 4:</strong> OTP से सत्यापन करें`,
    pa: `ਨਵਾਂ ਖਾਤਾ ਬਣਾਉਣ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>"Sign Up"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ<br><strong>ਕਦਮ 2:</strong> ਭੂਮਿਕਾ ਚੁਣੋ — <strong>ਕਿਸਾਨ</strong> ਜਾਂ <strong>ਵਿਕਰੇਤਾ</strong>`,
    action: { label: '✨ Sign Up', path: '/signup' }
  },

  register_farmer: {
    keywords: ['register as farmer', 'farmer registration', 'become farmer', 'join as farmer', 'register farmer',
               'किसान के रूप में रजिस्टर', 'किसान पंजीकरण', 'ਕਿਸਾਨ ਵਜੋਂ ਰਜਿਸਟਰ', 'kisan registration'],
    en: `To register as a <strong>Farmer</strong>:<br><br><strong>Step 1:</strong> Go to <strong>Sign Up</strong> and select "Farmer"<br><strong>Step 2:</strong> Enter your personal details<br><strong>Step 3:</strong> Verify via OTP<br><strong>Step 4:</strong> Add your first land plot<br><br>✅ Access Farmer Dashboard, rent machinery, and sell stubble!`,
    hi: `<strong>किसान</strong> के रूप में रजिस्टर करने के लिए:<br><br><strong>स्टेप 1:</strong> <strong>Sign Up</strong> पर जाएं और "Farmer" चुनें<br><strong>स्टेप 2:</strong> विवरण दर्ज करें<br><strong>स्टेप 3:</strong> OTP से सत्यापन करें`,
    pa: `<strong>ਕਿਸਾਨ</strong> ਵਜੋਂ ਰਜਿਸਟਰ ਕਰਨ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>Sign Up</strong> 'ਤੇ ਜਾਓ ਅਤੇ "Farmer" ਚੁਣੋ`,
    action: { label: '🌾 Register as Farmer', path: '/register/farmer' }
  },

  register_seller: {
    keywords: ['register as seller', 'seller registration', 'become seller', 'join as seller', 'register seller',
               'विक्रेता के रूप में रजिस्टर', 'विक्रेता पंजीकरण', 'ਵਿਕਰੇਤਾ ਵਜੋਂ ਰਜਿਸਟਰ', 'seller registration'],
    en: `To register as a <strong>Seller</strong>:<br><br><strong>Step 1:</strong> Go to <strong>Sign Up</strong> and select "Seller"<br><strong>Step 2:</strong> Enter business details<br><strong>Step 3:</strong> Upload KYC documents<br><strong>Step 4:</strong> Wait for admin verification (24-48 hours)<br><br>✅ Approved sellers can list equipment and receive farmer bookings.`,
    hi: `<strong>विक्रेता</strong> के रूप में रजिस्टर करने के लिए:<br><br><strong>स्टेप 1:</strong> "Seller" भूमिका चुनें<br><strong>स्टेप 2:</strong> व्यावसायिक विवरण दर्ज करें<br><strong>स्टेप 3:</strong> KYC दस्तावेज़ अपलोड करें`,
    pa: `<strong>ਵਿਕਰੇਤਾ</strong> ਵਜੋਂ ਰਜਿਸਟਰ ਕਰਨ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> "Seller" ਭੂਮਿਕਾ ਚੁਣੋ<br><strong>ਕਦਮ 2:</strong> ਕਾਰੋਬਾਰੀ ਵੇਰਵੇ ਦਰਜ ਕਰੋ`,
    action: { label: '🏭 Register as Seller', path: '/register/seller' }
  },

  farmer_dashboard: {
    keywords: ['farmer dashboard', 'my dashboard', 'farmer home', 'farmer panel',
               'किसान डैशबोर्ड', 'मेरा डैशबोर्ड', 'ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ', 'kisan dashboard', 'farmer', 'kisan'],
    en: `The <strong>Farmer Dashboard</strong> is your main control center.<br><br><strong>Here you can:</strong><br>• View all your registered land plots<br>• Access machinery marketplace<br>• Connect with stubble buyers<br>• Receive AI-powered recommendations<br>• Track your bookings`,
    hi: `<strong>किसान डैशबोर्ड</strong> आपका मुख्य नियंत्रण केंद्र है।<br><br><strong>यहाँ आप कर सकते हैं:</strong><br>• सभी खेत देखें<br>• मशीनरी बाज़ार एक्सेस करें<br>• पराली खरीददारों से जुड़ें<br>• AI सुझाव प्राप्त करें`,
    pa: `<strong>ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ</strong> ਤੁਹਾਡਾ ਮੁੱਖ ਕੰਟਰੋਲ ਸੈਂਟਰ ਹੈ।<br><br>• ਸਾਰੇ ਖੇਤ ਵੇਖੋ<br>• ਮਸ਼ੀਨਰੀ ਬਾਜ਼ਾਰ ਐਕਸੈਸ ਕਰੋ`,
    action: { label: '📊 Farmer Dashboard', path: '/farmer/dashboard' }
  },

  view_plots: {
    keywords: ['my plots', 'my farms', 'view farms', 'list of farms', 'all farms', 'plots', 'land', 'lands',
               'मेरे खेत', 'खेत देखें', 'ਮੇਰੇ ਖੇਤ', 'khet', 'mere khet', 'registered plots'],
    en: `To view all your <strong>registered land plots</strong>:<br><br><strong>Step 1:</strong> Go to your <strong>Farmer Dashboard</strong><br><strong>Step 2:</strong> Click on <strong>"My Land Plots"</strong><br><strong>Step 3:</strong> See all farms with plot name, area, crop type, harvest date, and GPS location.`,
    hi: `अपने सभी <strong>रजिस्टर किए गए खेत</strong> देखने के लिए:<br><br><strong>स्टेप 1:</strong> <strong>किसान डैशबोर्ड</strong> पर जाएं<br><strong>स्टेप 2:</strong> <strong>"My Land Plots"</strong> पर क्लिक करें`,
    pa: `ਆਪਣੇ ਸਾਰੇ <strong>ਰਜਿਸਟਰਡ ਖੇਤ</strong> ਵੇਖਣ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ</strong> 'ਤੇ ਜਾਓ`,
    action: { label: '🌾 View My Plots', path: '/farmer/plots' }
  },

  add_farm: {
    keywords: ['add land plot', 'add new farm', 'register farm', 'new plot', 'add plot', 'add farm', 'add land', 'register land',
               'नया खेत जोड़ें', 'खेत जोड़ें', 'ਖੇਤ ਜੋੜੋ', 'ਨਵਾਂ ਖੇਤ', 'naya khet', 'khet add karo'],
    en: `To <strong>add a new land plot</strong>:<br><br><strong>Step 1:</strong> Go to <strong>Farmer Dashboard → My Land Plots</strong><br><strong>Step 2:</strong> Click <strong>"+ Add New Farm"</strong><br><strong>Step 3:</strong> Fill in: Plot name, Crop type, Area, GPS location, Harvest date<br><strong>Step 4:</strong> Click <strong>"Save"</strong><br><br>✅ You'll receive AI recommendations for it!`,
    hi: `<strong>नया खेत जोड़ने</strong> के लिए:<br><br><strong>स्टेप 1:</strong> <strong>"+ Add New Farm"</strong> पर क्लिक करें<br><strong>स्टेप 2:</strong> विवरण भरें (नाम, फसल, एकड़, GPS, कटाई की तारीख)<br><strong>स्टेप 3:</strong> <strong>"Save"</strong> करें`,
    pa: `<strong>ਨਵਾਂ ਖੇਤ ਜੋੜਨ</strong> ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>"+ Add New Farm"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ`,
    action: { label: '➕ Add New Farm', path: '/farmer/farms/new' }
  },

  sell_stubble: {
    keywords: ['sell stubble', 'sell paddy straw', 'sell residue', 'sell biomass', 'find buyers',
               'पराली बेचें', 'पराली', 'अवशेष', 'ਪਰਾਲੀ ਵੇਚੋ', 'parali becho', 'parali'],
    en: `To <strong>sell your stubble/paddy straw</strong>:<br><br><strong>Step 1:</strong> Go to <strong>Farmer Dashboard</strong><br><strong>Step 2:</strong> Click on <strong>"Sell Stubble"</strong><br><strong>Step 3:</strong> Browse buyers near you (Biofuel Plants, Paper Mills, Composting Units)<br><strong>Step 4:</strong> Select a buyer and send a booking request<br><br>💰 Typical earnings: ₹2,500 - ₹3,500 per tonne`,
    hi: `<strong>पराली बेचने</strong> के लिए:<br><br><strong>स्टेप 1:</strong> <strong>किसान डैशबोर्ड → "Sell Stubble"</strong><br><strong>स्टेप 2:</strong> नज़दीकी खरीददार ब्राउज़ करें<br><strong>स्टेप 3:</strong> बुकिंग अनुरोध भेजें<br>💰 ₹2,500 - ₹3,500 प्रति टन`,
    pa: `<strong>ਪਰਾਲੀ ਵੇਚਣ</strong> ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>"Sell Stubble"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ<br>💰 ₹2,500 - ₹3,500 ਪ੍ਰਤੀ ਟਨ`,
    action: { label: '💰 Find Buyers', path: '/farmer/sell-stubble' }
  },

  rent_machinery: {
    keywords: ['rent machinery', 'book machine', 'hire equipment', 'rent equipment', 'happy seeder rent',
               'मशीनरी किराए', 'मशीन बुक', 'ਮਸ਼ੀਨਰੀ ਕਿਰਾਏ', 'machinery rent', 'book machinery'],
    en: `To <strong>rent machinery</strong> from the marketplace:<br><br><strong>Step 1:</strong> Go to <strong>Farmer Dashboard → Marketplace</strong><br><strong>Step 2:</strong> Browse: Happy Seeder, Super Seeder, Baler, Mulcher, Rotavator<br><strong>Step 3:</strong> Filter by type, price, or distance<br><strong>Step 4:</strong> Select a machine and click <strong>"Book Now"</strong><br><strong>Step 5:</strong> Confirm booking details`,
    hi: `<strong>मशीनरी किराए</strong> पर लेने के लिए:<br><br><strong>स्टेप 1:</strong> <strong>Marketplace</strong> पर जाएं<br><strong>स्टेप 2:</strong> उपलब्ध मशीनें ब्राउज़ करें<br><strong>स्टेप 3:</strong> <strong>"Book Now"</strong> पर क्लिक करें`,
    pa: `<strong>ਮਸ਼ੀਨਰੀ ਕਿਰਾਏ</strong> 'ਤੇ ਲੈਣ ਲਈ:<br><br><strong>ਕਦਮ 1:</strong> <strong>Marketplace</strong> 'ਤੇ ਜਾਓ<br><strong>ਕਦਮ 2:</strong> <strong>"Book Now"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ`,
    action: { label: '🚜 Browse Marketplace', path: '/farmer/marketplace' }
  },

  recommendations: {
    keywords: ['recommendations', 'recommendation', 'ai suggestion', 'best option', 'what should i do',
               'सुझाव', 'सिफारिशें', 'ਸੁਝਾਅ', 'ਸਿਫਾਰਸ਼', 'suggestion', 'salah'],
    en: `To receive <strong>AI-powered stubble management recommendations</strong>:<br><br><strong>Step 1:</strong> Go to <strong>Farmer Dashboard</strong><br><strong>Step 2:</strong> Select a registered land plot<br><strong>Step 3:</strong> Click on <strong>"Get Recommendations"</strong><br><strong>Step 4:</strong> AI analyzes your plot size, crop type, nearby machinery, and buyer demand<br><strong>Step 5:</strong> Get personalized suggestions for best machinery and buyers`,
    hi: `<strong>AI सुझाव</strong> पाने के लिए:<br><br><strong>स्टेप 1:</strong> <strong>किसान डैशबोर्ड</strong> पर जाएं<br><strong>स्टेप 2:</strong> एक खेत चुनें<br><strong>स्टेप 3:</strong> <strong>"Get Recommendations"</strong> पर क्लिक करें`,
    pa: `<strong>AI ਸੁਝਾਅ</strong> ਪ੍ਰਾਪਤ ਕਰਨ ਲਈ:<br><br><strong>"Get Recommendations"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ`,
    action: { label: '🤖 Get Recommendations', path: '/farmer/recommendations' }
  },

  buyer_dashboard: {
    keywords: ['buyer dashboard', 'seller dashboard', 'seller home', 'seller panel', 'buyer', 'seller', 'kyc',
               'विक्रेता डैशबोर्ड', 'खरीदार', 'ਵਿਕਰੇਤਾ ਡੈਸ਼ਬੋਰਡ', 'ਖਰੀਦਦਾਰ', 'vikreta'],
    en: `The <strong>Seller/Buyer Dashboard</strong> is your business control center.<br><br><strong>Here you can:</strong><br>• View your business profile and KYC status<br>• Manage equipment listings<br>• Add biomass buyer requirements<br>• Track received farmer bookings<br>• Monitor earnings`,
    hi: `<strong>विक्रेता/खरीददार डैशबोर्ड</strong> आपका व्यावसायिक नियंत्रण केंद्र है।<br><br>• KYC स्थिति देखें<br>• उपकरण लिस्टिंग प्रबंधित करें<br>• किसान बुकिंग ट्रैक करें`,
    pa: `<strong>ਵਿਕਰੇਤਾ/ਖਰੀਦਦਾਰ ਡੈਸ਼ਬੋਰਡ</strong> ਤੁਹਾਡਾ ਕਾਰੋਬਾਰੀ ਕੰਟਰੋਲ ਸੈਂਟਰ ਹੈ।`,
    action: { label: '🏭 Seller Dashboard', path: '/seller/dashboard' }
  },

  add_equipment: {
    keywords: ['add equipment', 'list equipment', 'add machine listing', 'equipment listing', 'add listing',
               'उपकरण जोड़ें', 'मशीन जोड़ें', 'ਉਪਕਰਣ ਜੋੜੋ', 'machine add karo', 'equipment add karo'],
    en: `To <strong>add an equipment listing</strong> as a seller:<br><br><strong>Step 1:</strong> Go to <strong>Seller Dashboard</strong><br><strong>Step 2:</strong> Click on <strong>"Add Equipment Listing"</strong><br><strong>Step 3:</strong> Fill in: Equipment type, Rental price/acre, Availability, Location<br><strong>Step 4:</strong> Submit for review<br><br>✅ Once approved, farmers can book your equipment!`,
    hi: `<strong>उपकरण लिस्टिंग जोड़ने</strong> के लिए:<br><br><strong>स्टेप 1:</strong> <strong>विक्रेता डैशबोर्ड</strong> पर जाएं<br><strong>स्टेप 2:</strong> <strong>"Add Equipment Listing"</strong> पर क्लिक करें`,
    pa: `<strong>ਉਪਕਰਣ ਲਿਸਟਿੰਗ ਜੋੜਨ</strong> ਲਈ:<br><br><strong>"Add Equipment Listing"</strong> 'ਤੇ ਕਲਿੱਕ ਕਰੋ`,
    action: { label: '🚜 Add Equipment', path: '/seller/equipment/new' }
  },

  pm_pranam: {
    keywords: ['pm pranam', 'pm-pranam', 'incentive', 'scheme', 'government scheme', 'subsidy',
               'पीएम प्रणाम', 'सब्सिडी', 'ਪੀਐਮ ਪ੍ਰਣਾਮ', 'incentive'],
    en: `🌟 <strong>PM-PRANAM Scheme</strong><br><br>PM-PRANAM promotes alternative use of crop residue:<br><br>• <strong>Incentive:</strong> ₹1,000 - ₹2,000 per acre for not burning stubble<br>• <strong>Equipment subsidy:</strong> Up to 80% on Happy Seeder and other machines<br>• <strong>Eligibility:</strong> All registered farmers in Punjab & Haryana<br>• <strong>How to apply:</strong> Via Farmer Dashboard → PM-PRANAM`,
    hi: `🌟 <strong>PM-PRANAM योजना</strong><br><br>• <strong>प्रोत्साहन:</strong> ₹1,000 - ₹2,000 प्रति एकड़ (पराली न जलाने पर)<br>• <strong>उपकरण सब्सिडी:</strong> हैपी सीडर पर 80% तक`,
    pa: `🌟 <strong>PM-PRANAM ਯੋਜਨਾ</strong><br><br>• <strong>ਪ੍ਰੋਤਸਾਹਨ:</strong> ₹1,000 - ₹2,000 ਪ੍ਰਤੀ ਏਕੜ<br>• <strong>ਉਪਕਰਣ ਸਬਸਿਡੀ:</strong> 80% ਤੱਕ`,
    action: { label: '💰 PM-PRANAM Details', path: '/farmer/schemes' }
  },

  burning_penalty: {
    keywords: ['penalty', 'fine', 'burning fine', 'stubble burning', 'burn stubble', 'punishment',
               'जुर्माना', 'दंड', 'पराली जलाना', 'ਜੁਰਮਾਨਾ', 'parali jalana', 'parali burning'],
    en: `⚖️ <strong>Penalty for Stubble Burning</strong><br><br>• First offense: ₹2,500 fine<br>• Repeat: ₹5,000 - ₹15,000 fine<br>• Severe cases: Up to 2 years jail<br><br>💡 It is better to use machinery or sell straw through our platform.`,
    hi: `⚖️ <strong>पराली जलाने पर जुर्माना</strong><br><br>• पहली बार: ₹2,500 जुर्माना<br>• दोबारा: ₹5,000 - ₹15,000 जुर्माना<br>• गंभीर मामलों में: 2 साल तक जेल`,
    pa: `⚖️ <strong>ਪਰਾਲੀ ਸਾੜਨ 'ਤੇ ਜੁਰਮਾਨਾ</strong><br><br>• ਪਹਿਲੀ ਵਾਰ: ₹2,500 ਜੁਰਮਾਨਾ<br>• ਦੁਬਾਰਾ: ₹5,000 - ₹15,000 ਜੁਰਮਾਨਾ`,
    action: { label: '🌾 Explore Alternatives', path: '/farmer/dashboard' }
  },

  machinery_info: {
    keywords: ['machinery', 'machine', 'happy seeder', 'baler', 'mulcher', 'rotavator', 'super seeder',
               'मशीनरी', 'मशीन', 'हैप्पी सीडर', 'ਮਸ਼ੀਨਰੀ', 'ਹੈਪੀ ਸੀਡਰ', 'available machinery'],
    en: `🚜 <strong>Available Machinery on CSBP</strong><br><br><strong>1. Happy Seeder</strong> (₹1,200-1,800/acre)<br><strong>2. Super Seeder</strong> (₹1,500-2,200/acre)<br><strong>3. Baler</strong> (₹1,000-1,500/acre)<br><strong>4. Mulcher</strong> (₹800-1,200/acre)<br><strong>5. Rotavator</strong> (₹900-1,400/acre)<br><br>💡 All machinery is eligible for PM-PRANAM incentive!`,
    hi: `🚜 <strong>CSBP पर उपलब्ध मशीनरी</strong><br><br><strong>1. हैपी सीडर</strong> (₹1,200-1,800/एकड़)<br><strong>2. सुपर सीडर</strong> (₹1,500-2,200/एकड़)<br><strong>3. बेलर</strong> (₹1,000-1,500/एकड़)`,
    pa: `🚜 <strong>CSBP 'ਤੇ ਉਪਲਬਧ ਮਸ਼ੀਨਰੀ</strong><br><br><strong>1. ਹੈਪੀ ਸੀਡਰ</strong> (₹1,200-1,800/ਏਕੜ)<br><strong>2. ਸੁਪਰ ਸੀਡਰ</strong> (₹1,500-2,200/ਏਕੜ)`,
    action: { label: '🔍 Browse Marketplace', path: '/farmer/marketplace' }
  },

  buyer_info: {
    keywords: ['who buys', 'types of buyers', 'biomass buyers',
               'खरीदार कौन हैं', 'ਖਰੀਦਦਾਰ ਕੌਣ ਹਨ', 'buyer kaun hain', 'who buys stubble'],
    en: `💰 <strong>Types of Biomass Buyers on CSBP</strong><br><br>• <strong>Biofuel Plants:</strong> ₹2,500-3,500/tonne<br>• <strong>Paper Mills:</strong> ₹2,000-3,000/tonne<br>• <strong>Composting Units:</strong> ₹1,500-2,500/tonne<br>• <strong>Animal Feed Producers:</strong> ₹2,000-2,800/tonne<br>• <strong>Thermal Power Plants:</strong> ₹1,800-2,500/tonne`,
    hi: `💰 <strong>CSBP पर बायोमास खरीददारों के प्रकार</strong><br><br>• <strong>बायोफ्यूल प्लांट:</strong> ₹2,500-3,500/टन<br>• <strong>कागज़ मिल:</strong> ₹2,000-3,000/टन<br>• <strong>कम्पोस्ट इकाई:</strong> ₹1,500-2,500/टन`,
    pa: `💰 <strong>CSBP 'ਤੇ ਬਾਇਓਮਾਸ ਖਰੀਦਦਾਰਾਂ ਦੀਆਂ ਕਿਸਮਾਂ</strong><br><br>• <strong>ਬਾਇਓਫਿਊਲ ਪਲਾਂਟ:</strong> ₹2,500-3,500/ਟਨ`,
    action: { label: '💰 Find Buyers', path: '/farmer/sell-stubble' }
  },

  weather: {
    keywords: ['weather', 'temperature', 'rain', 'forecast', 'मौसम', 'बारिश', 'ਮੌਸਮ', 'ਮੀਂਹ', 'mausam', 'barish'],
    en: `🌤️ <strong>Weather (Ludhiana, Punjab)</strong><br><br>• Temperature: 28°C<br>• Partly Cloudy<br>• Humidity: 65%<br>• Good for harvesting!`,
    hi: `🌤️ <strong>मौसम (लुधियाना, पंजाब)</strong><br><br>• तापमान: 28°C<br>• आंशिक बादल<br>• आर्द्रता: 65%`,
    pa: `🌤️ <strong>ਮੌਸਮ (ਲੁਧਿਆਣਾ, ਪੰਜਾਬ)</strong><br><br>• ਤਾਪਮਾਨ: 28°C<br>• ਅੰਸ਼ਕ ਬੱਦਲ<br>• ਨਮੀ: 65%`
  },

  greeting: {
    keywords: ['hello', 'hi', 'hey', 'hii', 'good morning', 'morning', 'good afternoon', 'good evening',
               'namaste', 'namaskar', 'नमस्ते', 'नमस्कार', 'हेलो', 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ', 'ਨਮਸਤੇ', 'ਹੈਲੋ'],
    en: `👋 <strong>Hello!</strong><br><br>Welcome to <strong>CSBP (Crop Stubble Burning Prevention)</strong>.<br><br>I can help you with:<br>• Farm and land plot registration<br>• Agricultural machinery rentals<br>• Stubble and biomass buyers<br>• Marketplace listings<br>• Recommendations<br><br>How can I help you today?`,
    hi: `👋 <strong>नमस्ते!</strong><br><br><strong>CSBP</strong> में आपका स्वागत है।<br><br>मैं आपकी इन कार्यों में सहायता कर सकता हूँ:<br>• खेत पंजीकरण<br>• मशीनरी किराया<br>• पराली बेचना<br>• मार्केटप्लेस<br><br>आज मैं आपकी कैसे मदद कर सकता हूँ?`,
    pa: `👋 <strong>ਸਤ ਸ੍ਰੀ ਅਕਾਲ!</strong><br><br><strong>CSBP</strong> ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ।<br><br>ਅੱਜ ਮੈਂ ਤੁਹਾਡੀ ਕਿਵੇਂ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ?`,
    action: { label: '🏠 Go to Dashboard', path: '/' }
  },

  goodbye: {
    keywords: ['bye', 'goodbye', 'see you', 'take care', 'अलविदा', 'ਅਲਵਿਦਾ', 'bye ji', 'phir milenge'],
    en: `👋 <strong>Goodbye!</strong><br><br>Thank you for using <strong>CSBP</strong>.<br>Feel free to come back anytime! 🌱`,
    hi: `👋 <strong>अलविदा!</strong><br><br><strong>CSBP</strong> का उपयोग करने के लिए धन्यवाद। 🌱`,
    pa: `👋 <strong>ਅਲਵਿਦਾ!</strong><br><br><strong>CSBP</strong> ਦੀ ਵਰਤੋਂ ਲਈ ਧੰਨਵਾਦ। 🌱`,
    action: { label: '🏠 Go to Home', path: '/' }
  },

  calculate: {
    keywords: ['calculate', 'estimate', 'how much', 'कितना', 'गणना', 'ਗਿਣ', 'kitna', 'hisab', 'calculate karo'],
    en: (acres) => {
      if (!acres) return "🤔 Please specify acres. Example: <em>'Calculate for 10 acres'</em>";
      const straw = (acres * 1.8).toFixed(2);
      const cost = Math.round(acres * 1500);
      const earning = Math.round(straw * 3000);
      return `📊 <strong>Calculation for ${acres} acres:</strong><br><br>🌾 <strong>Straw:</strong> ${straw} tonnes<br>🚜 <strong>Machinery Cost:</strong> ₹${cost.toLocaleString()}<br>💰 <strong>Sell Straw Earnings:</strong> ₹${earning.toLocaleString()}<br>💡 <strong>Best:</strong> Sell to biofuel plant!`;
    },
    hi: (acres) => {
      if (!acres) return "🤔 कृपया एकड़ बताएं। उदाहरण: <em>'10 एकड़ के लिए गणना करें'</em>";
      const straw = (acres * 1.8).toFixed(2);
      const cost = Math.round(acres * 1500);
      const earning = Math.round(straw * 3000);
      return `📊 <strong>${acres} एकड़ की गणना:</strong><br><br>🌾 <strong>पराली:</strong> ${straw} टन<br>🚜 <strong>मशीनरी लागत:</strong> ₹${cost.toLocaleString()}<br>💰 <strong>बेचने पर:</strong> ₹${earning.toLocaleString()}`;
    },
    pa: (acres) => {
      if (!acres) return "🤔 ਕਿਰਪਾ ਕਰਕੇ ਏਕੜ ਦੱਸੋ।";
      const straw = (acres * 1.8).toFixed(2);
      const cost = Math.round(acres * 1500);
      const earning = Math.round(straw * 3000);
      return `📊 <strong>${acres} ਏਕੜ ਦੀ ਗਿਣਤੀ:</strong><br><br>🌾 <strong>ਪਰਾਲੀ:</strong> ${straw} ਟਨ<br>🚜 <strong>ਮਸ਼ੀਨਰੀ ਖਰਚਾ:</strong> ₹${cost.toLocaleString()}`;
    }
  },

  default: {
    en: `I apologize, but I don't have information on that topic.<br><br>I can help you with:<br>• Farm and land plot registration<br>• Agricultural machinery rentals<br>• Connecting with residue buyers<br>• Government schemes & incentives`,
    hi: `क्षमा करें, इस विषय की जानकारी नहीं है।<br><br>मैं आपकी इन में सहायता कर सकता हूँ:<br>• खेत पंजीकरण<br>• मशीनरी किराया<br>• पराली खरीददारों से जुड़ना`,
    pa: `ਮਾਫ਼ ਕਰਨਾ, ਮੇਰੇ ਕੋਲ ਇਸ ਵਿਸ਼ੇ ਬਾਰੇ ਜਾਣਕਾਰੀ ਨਹੀਂ ਹੈ।`,
    action: { label: '📧 Contact Support', path: '/contact' }
  }
};

// ── KB matching engine ────────────────────────────────────────────────────────
function getResponse(message, lang) {
  const msg = message.toLowerCase();

  // Check for calculation
  if (KB.calculate.keywords.some(k => msg.includes(k))) {
    const match = msg.match(/(\d+(?:\.\d+)?)\s*(acre|acres|एकड़|ਏਕੜ)/i);
    const acres = match ? parseFloat(match[1]) : null;
    const fn = KB.calculate[lang] || KB.calculate.en;
    return { reply: fn(acres) };
  }

  // Check all other entries
  for (const [key, entry] of Object.entries(KB)) {
    if (key === 'default' || key === 'calculate') continue;
    if (entry.keywords && entry.keywords.some(k => msg.includes(k.toLowerCase()))) {
      const reply = entry[lang] || entry.en;
      return { reply, action: entry.action };
    }
  }

  return { reply: KB.default[lang] || KB.default.en, action: KB.default.action };
}

// ── Welcome message ───────────────────────────────────────────────────────────
function getWelcomeMessage(lang) {
  const msgs = {
    en: `👋 <strong>Namaste!</strong> I'm your navigation assistant.<br><br>I can help you with:<br>• 🧭 Finding pages<br>• 📚 Explaining schemes<br>• 🧮 Calculating earnings<br>• 🌤️ Weather info<br><br>💡 <em>Type in English, Hindi, or Punjabi!</em>`,
    hi: `👋 <strong>नमस्ते!</strong> मैं आपका नेविगेशन सहायक हूं।<br><br>• 🧭 पेज खोजने में<br>• 📚 योजनाएं समझाने में<br>• 🧮 कमाई की गणना में<br>• 🌤️ मौसम की जानकारी`,
    pa: `👋 <strong>ਸਤ ਸ੍ਰੀ ਅਕਾਲ!</strong> ਮੈਂ ਤੁਹਾਡਾ ਨੈਵੀਗੇਸ਼ਨ ਸਹਾਇਕ ਹਾਂ।<br><br>• 🧭 ਪੇਜ ਲੱਭਣ ਵਿੱਚ<br>• 📚 ਯੋਜਨਾਵਾਂ ਸਮਝਾਉਣ ਵਿੱਚ<br>• 🧮 ਕਮਾਈ ਦੀ ਗਿਣਤੀ ਵਿੱਚ`
  };
  return msgs[lang] || msgs.en;
}

// ── Quick chips ───────────────────────────────────────────────────────────────
const CHIPS = [
  'Which machine is best?',
  'ਮੇਰੇ ਖੇਤ ਲਈ ਕਿਹੜੀ ਮਸ਼ੀਨ?',
  'Can I sell my parali?',
  'PM-PRANAM scheme?',
  'Calculate for 10 acres'
];

// ── Main Widget ───────────────────────────────────────────────────────────────
export default function ChatbotWidget() {
  const { currentUser } = useCurrentUser();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'bot', html: getWelcomeMessage(lang) }]);
    }
  }, [isOpen]);

  useEffect(() => {
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  }, [messages, loading]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 80);
  };

  const changeLanguage = (newLang) => {
    setLang(newLang);
    setMessages([{ role: 'bot', html: getWelcomeMessage(newLang) }]);
  };

  const sendMessage = (text) => {
    const userText = (text || input).trim();
    if (!userText || loading) return;
    setInput('');
    inputRef.current?.focus();

    const detectedLang = detectLanguage(userText);
    const responseLang = detectedLang !== 'en' ? detectedLang : lang;

    setMessages(prev => [...prev, { role: 'user', html: userText }]);
    setLoading(true);

    setTimeout(() => {
      const { reply, action } = getResponse(userText, responseLang);
      setMessages(prev => [...prev, { role: 'bot', html: reply, action }]);
      setLoading(false);
    }, 400);
  };

  const handleActionClick = (path) => {
    if (path.startsWith('mailto:')) {
      window.location.href = path;
    } else {
      navigate(path);
      setIsOpen(false);
    }
  };

  return (
    <>
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
        .chat-scroll::-webkit-scrollbar { width: 4px; }
        .chat-scroll::-webkit-scrollbar-track { background: #f1f5f9; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #86efac; border-radius: 4px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {/* Open button */}
        {!isOpen && (
          <button
            onClick={() => { setIsOpen(true); setTimeout(() => inputRef.current?.focus(), 300); }}
            className="neo-btn bg-[#15803D] text-white px-5 py-3 shadow-[5px_5px_0px_#0F172A] flex items-center gap-2 text-sm font-black hover:scale-105 transition-transform"
          >
            <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            NEED HELP?
          </button>
        )}

        {/* Chat window */}
        {isOpen && (
          <div className="w-[360px] sm:w-[420px] h-[600px] flex flex-col border-4 border-[#0F172A] shadow-[8px_8px_0px_#0F172A] bg-white overflow-hidden rounded-none relative">
            
            {/* Header */}
            <div className="bg-[#15803D] text-white px-4 py-3 border-b-4 border-[#0F172A] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-yellow-400 border-2 border-black flex items-center justify-center">
                  <Bot className="w-5 h-5 text-black" />
                </div>
                <div>
                  <p className="font-black text-sm uppercase leading-none">Navigation Assistant</p>
                  <p className="text-[10px] text-green-200 font-semibold">EN · हिंदी · ਪੰਜਾਬੀ</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="neo-btn bg-yellow-400 text-black p-1.5 hover:bg-yellow-300">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Language bar */}
            <div className="flex gap-1 px-3 py-2 bg-white border-b-2 border-dashed border-[#0F172A] shrink-0">
              {[['en', 'English'], ['hi', 'हिंदी'], ['pa', 'ਪੰਜਾਬੀ']].map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => changeLanguage(code)}
                  className={`flex-1 py-1 text-xs font-bold border-2 border-[#0F172A] transition-all ${
                    lang === code ? 'bg-[#EAB308] shadow-[2px_2px_0px_#0F172A]' : 'bg-white hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Messages area */}
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              onWheel={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAF5] chat-scroll"
              style={{ minHeight: 0 }}
            >
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
                  {m.role === 'bot' && (
                    <div className="w-6 h-6 bg-green-600 border-2 border-black flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="flex flex-col gap-1 max-w-[82%]">
                    <div
                      className={`px-3 py-2.5 border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] ${
                        m.role === 'user'
                          ? 'bg-[#15803D] text-white font-semibold text-xs ml-auto'
                          : 'bg-white text-gray-900'
                      }`}
                    >
                      {m.role === 'user'
                        ? <p className="text-xs">{m.html}</p>
                        : <HtmlMessage html={m.html} />
                      }
                    </div>
                    {m.action && m.role === 'bot' && (
                      <button
                        onClick={() => handleActionClick(m.action.path)}
                        className="self-start text-[11px] font-bold bg-[#0F172A] text-[#EAB308] border-2 border-[#0F172A] px-3 py-1 hover:bg-[#EAB308] hover:text-[#0F172A] transition-colors shadow-[2px_2px_0px_#EAB308]"
                      >
                        {m.action.label} →
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-600 border-2 border-black flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="bg-white border-2 border-black shadow-[2px_2px_0px_#000] px-3 py-2">
                    <TypingDots />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Scroll-to-bottom */}
            {showScrollBtn && (
              <button
                onClick={() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="absolute bottom-32 right-4 bg-white border-2 border-black shadow-[2px_2px_0px_#000] p-1.5 rounded-full hover:bg-yellow-100 z-10"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            )}

            {/* Quick chips */}
            {!loading && (
              <div className="px-3 py-2 bg-yellow-50 border-t-2 border-black flex gap-1.5 overflow-x-auto shrink-0 no-scrollbar">
                {CHIPS.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => sendMessage(chip)}
                    className="shrink-0 text-[10px] font-bold bg-white border border-black px-2 py-1 hover:bg-yellow-200 transition-colors whitespace-nowrap shadow-[1px_1px_0px_#000]"
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
              className="p-3 bg-white border-t-4 border-[#0F172A] flex gap-2 shrink-0 items-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask in English, ਪੰਜਾਬੀ, or हिंदी..."
                className="flex-1 text-xs border-2 border-[#0F172A] px-3 py-2 outline-none font-medium bg-gray-50 focus:bg-white focus:border-green-600"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="neo-btn bg-[#15803D] text-white p-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
