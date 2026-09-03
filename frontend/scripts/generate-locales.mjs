import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const localesDir = join(__dirname, '..', 'src', 'locales');
import { readFileSync } from 'fs';
const en = JSON.parse(readFileSync(join(localesDir, 'en.json'), 'utf-8'));

const translations = {
  bn: { langName: 'বাংলা', appName: 'কিসানডায়রেক্ট AI', tagline: 'খামার থেকে ক্রেতা সরাসরি। সোজা। ন্যায্য। স্মার্ট।' },
  te: { langName: 'తెలుగు', appName: 'కిసాన్‌డైరెక్ట్ AI', tagline: 'పొలం నుండి కొనుగోలుదారుడికి. నేరుగా. న్యాయంగా. స్మార్ట్‌గా.' },
  mr: { langName: 'मराठी', appName: 'किसानडायरेक्ट AI', tagline: 'शेतापासून खरेदीसदनापर्यंत. थेट. योग्य. स्मार्ट.' },
  ta: { langName: 'தமிழ்', appName: 'கிசான்டைரெக்ட் AI', tagline: 'விவசாயியிடமிருந்து வாங்குபவருக்கு. நேரடியாக. நியாயமாக. புத்திசாலித்தனமாக.' },
  gu: { langName: 'ગુજરાતી', appName: 'કિસાનડાયરેક્ટ AI', tagline: 'ખેતરથી ખરીદદાર સુધી. સીધું. યોગ્ય. સ્માર્ટ.' },
  ur: { langName: 'اردو', appName: 'کسان ڈائریکٹ AI', tagline: 'کھیت سے خریدار تک۔ براہ راست۔ مناسب۔ اسمارٹ۔' },
  kn: { langName: 'ಕನ್ನಡ', appName: 'ಕಿಸಾನ್‌ಡೈರೆಕ್ಟ್ AI', tagline: 'ಹೊಲದಿಂದ ಖರೀದಿದಾರರಿಗೆ. ನೇರವಾಗಿ. ನ್ಯಾಯಯುತವಾಗಿ. ಸ್ಮಾರ್ಟ್‌ಆಗಿ.' },
  or: { langName: 'ଓଡ଼ିଆ', appName: 'କିସାନଡାଇରେକ୍ଟ AI', tagline: 'ଖେତରୁ କ୍ରେତାଙ୍କ ପାଖକୁ। ସିଧାସଳଖ। ଯୋଗ୍ୟ। ସ୍ମାର୍ଟ।' },
  ml: { langName: 'മലയാളം', appName: 'കിസാൻഡയറക്ട് AI', tagline: 'കൃഷിയിടത്തിൽ നിന്ന് ഉപഭോക്താവിലേക്ക്. നേരിട്ട്. ന്യായമായി. സ്മാർട്ടായി.' },
  pa: { langName: 'ਪੰਜਾਬੀ', appName: 'ਕਿਸਾਨਡਾਇਰੈਕਟ AI', tagline: 'ਖੇਤ ਤੋਂ ਖਰੀਦਾਰ ਤੱਕ। ਸਿੱਧਾ। ਇਨਸਾਫ਼। ਸਮਾਰਟ।' },
  as: { langName: 'অসমীয়া', appName: 'কিষানডাইৰেক্ট AI', tagline: 'খেতৰ পৰা ক্ৰেতাৰ লগত। প্ৰত্যক্ষ। ন্যায্য। স্মাৰ্ট।' },
  mai: { langName: 'मैथिली', appName: 'किसानडायरेक्ट AI', tagline: 'खेत से खरिदार तक। सिधा। न्यायोचित। स्मार्ट।' },
  sat: { langName: 'ᱥᱟᱱᱛᱟᱲᱤ', appName: 'KisanDirect AI', tagline: 'ᱥᱚᱨᱚᱢ ᱨᱮ ᱠᱨᱮᱛᱟᱨ ᱠᱷᱚᱱᱟ।' },
  ks: { langName: 'कॉशुर', appName: 'किसानडायरेक्ट AI', tagline: 'बागबान तमस किसान नज़दीक। सिधा। इंसाफ़। स्मार्ट।' },
  ne: { langName: 'नेपाली', appName: 'किसानडायरेक्ट AI', tagline: 'खेतदेखि खरिदारसम्म। सिधै। न्यायोचित। स्मार्ट।' },
  kok: { langName: 'कोंकणी', appName: 'किसानडायरेक्ट AI', tagline: 'शेतांतल्यान खरेदीसदनांक। थेट। योग्य। स्मार्ट।' },
  mni: { langName: 'মৈতৈলোন্', appName: 'KisanDirect AI', tagline: 'লৈ অসিবা খিদোংদা শিংদা।' },
  brx: { langName: 'बड़ो', appName: 'KisanDirect AI', tagline: 'नुन्दा जागिर नि बाय।' },
  doi: { langName: 'डोगरी', appName: 'किसानडायरेक्ट AI', tagline: 'खेत तों खरेदीदार तें। सिद्धा। इंसाफ। स्मार्ट।' },
  sd: { langName: 'سنڌي', appName: 'ڪسنڊائراڪٽ AI', tagline: 'کان شان تائين۔ سڌو۔ مناسب۔ اسمارٽ۔' },
  sa: { langName: 'संस्कृतम्', appName: 'किसानडायरेक्ट AI', tagline: 'कृषिभूमेः उपभोक्तृभ्यः प्रत्यक्षम्।' }
};

for (const [code, t] of Object.entries(translations)) {
  if (code === 'hi') continue; // Already created
  
  // Clone English as base
  const lang = JSON.parse(JSON.stringify(en));
  
  // Override app-level
  lang.app.name = t.appName;
  lang.app.tagline = t.tagline;
  
  // Add language.select translation
  lang.language.select = t.langName;
  lang.language.current = t.langName;
  lang.language.change = t.langName;
  
  const path = join(localesDir, `${code}.json`);
  writeFileSync(path, JSON.stringify(lang, null, 2), 'utf-8');
  console.log(`Created: ${code}.json (${t.langName})`);
}

console.log('All language files generated.');
