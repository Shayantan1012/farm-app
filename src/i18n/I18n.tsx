import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Text as NativeText, TextProps } from "react-native";

export type Language = "en" | "bn" | "hi" | "as" | "or" | "ne" | "ta" | "te";
export const languages: { code: Language; nativeName: string; englishName: string }[] = [
  { code: "en", nativeName: "English", englishName: "English" },
  { code: "bn", nativeName: "বাংলা", englishName: "Bengali" },
  { code: "hi", nativeName: "हिन्दी", englishName: "Hindi" },
  { code: "as", nativeName: "অসমীয়া", englishName: "Assamese" },
  { code: "or", nativeName: "ଓଡ଼ିଆ", englishName: "Odia" },
  { code: "ne", nativeName: "नेपाली", englishName: "Nepali" },
  { code: "ta", nativeName: "தமிழ்", englishName: "Tamil" },
  { code: "te", nativeName: "తెలుగు", englishName: "Telugu" },
];

type Messages = Record<string, string>;
const bn: Messages = {
  Language: "ভাষা",
  English: "ইংরেজি",
  Bengali: "বাংলা",
  Hindi: "হিন্দি",
  Assamese: "অসমীয়া",
  Odia: "ওড়িয়া",
  Nepali: "নেপালি",
  Tamil: "তামিল",
  Telugu: "তেলুগু",
  Explore: "খুঁজুন",
  "My products": "আমার পণ্য",
  Admin: "অ্যাডমিন",
  Orders: "অর্ডার",
  Account: "অ্যাকাউন্ট",
  "Sign in": "লগ ইন",
  "Sign in / Register": "লগ ইন / নিবন্ধন",
  "Saved products": "সংরক্ষিত পণ্য",
  "Help & support": "সহায়তা",
  Basket: "ঝুড়ি",
  "Welcome to Harvest": "হারভেস্টে স্বাগতম",
  "Sign in to your account or register your farm to sell your produce.": "আপনার অ্যাকাউন্টে লগ ইন করুন অথবা ফসল বিক্রির জন্য খামার নিবন্ধন করুন।",
  Register: "নিবন্ধন",
  "Verify email": "ইমেল যাচাই",
  "Recover account": "অ্যাকাউন্ট পুনরুদ্ধার",
  "Your full name": "আপনার পুরো নাম",
  Farmer: "কৃষক",
  Consumer: "ক্রেতা",
  "Delivery partner": "ডেলিভারি কর্মী",
  "Farm name": "খামারের নাম",
  "Email address": "ইমেল ঠিকানা",
  "Phone number (optional)": "ফোন নম্বর (ঐচ্ছিক)",
  "Address details (optional)": "ঠিকানার বিবরণ (ঐচ্ছিক)",
  "Street / village address": "রাস্তা / গ্রামের ঠিকানা",
  "City / village": "শহর / গ্রাম",
  State: "রাজ্য",
  "Postal / PIN code": "পোস্টাল / পিন কোড",
  "Account security": "অ্যাকাউন্ট নিরাপত্তা",
  "Password (at least 12 characters)": "পাসওয়ার্ড (কমপক্ষে ১২ অক্ষর)",
  "Confirm password": "পাসওয়ার্ড নিশ্চিত করুন",
  "Create account": "অ্যাকাউন্ট তৈরি করুন",
  "First administrator setup": "প্রথম অ্যাডমিন সেটআপ",
  "Please wait…": "অপেক্ষা করুন…",
  "Verify code": "কোড যাচাই করুন",
  "Verification code": "যাচাইকরণ কোড",
  "Fresh from our farmers": "কৃষকের কাছ থেকে টাটকা",
  "DIRECT FROM THE GROWER": "সরাসরি কৃষকের কাছ থেকে",
  "From their farm.": "তাঁদের খামার থেকে।",
  "To your table.": "আপনার টেবিলে।",
  "Discover produce listed by farmers in your community.": "আপনার এলাকার কৃষকদের তালিকাভুক্ত ফসল খুঁজুন।",
  "Search products, farms or locations": "পণ্য, খামার বা স্থান খুঁজুন",
  "All produce": "সব ফসল",
  Vegetables: "সবজি",
  "Leafy greens": "শাকপাতা",
  "Roots & tubers": "মূল ও কন্দ",
  "All methods": "সব পদ্ধতি",
  Organic: "জৈব",
  "Naturally grown": "প্রাকৃতিকভাবে উৎপাদিত",
  "Conventionally grown": "প্রচলিতভাবে উৎপাদিত",
  Newest: "সর্বশেষ",
  "Lowest price": "সর্বনিম্ন দাম",
  "Highest price": "সর্বোচ্চ দাম",
  Freshest: "সবচেয়ে টাটকা",
  "Refresh marketplace": "বাজার রিফ্রেশ করুন",
  "View details": "বিস্তারিত দেখুন",
  "Add to basket": "ঝুড়িতে যোগ করুন",
  Save: "সংরক্ষণ",
  Saved: "সংরক্ষিত",
  Retry: "আবার চেষ্টা করুন",
  "Your account": "আপনার অ্যাকাউন্ট",
  "Full name": "পুরো নাম",
  Address: "ঠিকানা",
  "Phone number": "ফোন নম্বর",
  Notifications: "বিজ্ঞপ্তি",
  "Save profile": "প্রোফাইল সংরক্ষণ",
  "Refresh account": "অ্যাকাউন্ট রিফ্রেশ",
  "Sign out": "লগ আউট",
  Approved: "অনুমোদিত",
  "Awaiting approval": "অনুমোদনের অপেক্ষায়",
  "Add product": "পণ্য যোগ করুন",
  "Add your product": "আপনার পণ্য যোগ করুন",
  "Edit product": "পণ্য সম্পাদনা",
  "Product name": "পণ্যের নাম",
  "Farm location": "খামারের অবস্থান",
  Category: "বিভাগ",
  "Farming method": "চাষের পদ্ধতি",
  "Choose product photo": "পণ্যের ছবি বেছে নিন",
  "Remove photo": "ছবি সরান",
  "Clear expiry date": "মেয়াদ শেষের তারিখ মুছুন",
  "Save product": "পণ্য সংরক্ষণ",
  Cancel: "বাতিল",
  Pause: "বিরতি",
  Reactivate: "পুনরায় চালু",
  "Delete product": "পণ্য মুছুন",
  "Your basket": "আপনার ঝুড়ি",
  "Home delivery": "বাড়িতে ডেলিভারি",
  "Farm pickup": "খামার থেকে সংগ্রহ",
  "Delivery address": "ডেলিভারির ঠিকানা",
  "Delivery destination": "ডেলিভারির গন্তব্য",
  "Place order": "অর্ডার করুন",
  "Remove item": "আইটেম সরান",
  Increase: "বাড়ান",
  Decrease: "কমান",
  "Refresh orders": "অর্ডার রিফ্রেশ",
  "Track on map": "মানচিত্রে দেখুন",
  "Order tracking": "অর্ডার ট্র্যাকিং",
  Pickup: "সংগ্রহস্থল",
  Destination: "গন্তব্য",
  "Navigate to pickup": "সংগ্রহস্থলে যান",
  "Navigate to destination": "গন্তব্যে যান",
  "Start sharing location": "অবস্থান শেয়ার শুরু করুন",
  "Stop sharing location": "অবস্থান শেয়ার বন্ধ করুন",
  "Detect my current location": "আমার বর্তমান অবস্থান শনাক্ত করুন",
  "Detecting your location…": "আপনার অবস্থান শনাক্ত হচ্ছে…",
  "Detected address": "শনাক্ত করা ঠিকানা",
  "Enter coordinates manually": "নিজে স্থানাঙ্ক লিখুন",
  "Hide manual coordinates": "স্থানাঙ্ক লুকান",
  "Map pin selected": "মানচিত্রের পিন নির্বাচিত",
  "Create support ticket": "সহায়তার টিকিট তৈরি করুন",
  "Refresh tickets": "টিকিট রিফ্রেশ",
  "Administration": "প্রশাসন",
  Overview: "সারাংশ",
  Users: "ব্যবহারকারী",
  Farms: "খামার",
  Administrators: "অ্যাডমিনগণ",
  "Create administrator": "অ্যাডমিন তৈরি করুন",
  Products: "পণ্য",
  Deliveries: "ডেলিভারি",
  Support: "সহায়তা",
  Reviews: "রিভিউ",
  Activity: "কার্যকলাপ",
  "Refresh users": "ব্যবহারকারী রিফ্রেশ",
  "Approve account": "অ্যাকাউন্ট অনুমোদন",
  "Revoke approval": "অনুমোদন প্রত্যাহার",
  "Suspend account": "অ্যাকাউন্ট স্থগিত",
  "Reactivate account": "অ্যাকাউন্ট পুনরায় চালু",
  "Previous page": "আগের পৃষ্ঠা",
  "Next page": "পরের পৃষ্ঠা",
  Page: "পৃষ্ঠা",
  Loading: "লোড হচ্ছে",
  "Loading from the farm server…": "ফার্ম সার্ভার থেকে লোড হচ্ছে…",
};

const hi: Messages = {
  Language: "भाषा", English: "अंग्रेज़ी", Bengali: "बांग्ला", Hindi: "हिन्दी", Assamese: "असमिया", Odia: "ओड़िया", Nepali: "नेपाली", Tamil: "तमिल", Telugu: "तेलुगु",
  Explore: "खोजें", "My products": "मेरे उत्पाद", Admin: "प्रशासन", Orders: "ऑर्डर", Account: "खाता", "Sign in": "साइन इन", "Sign in / Register": "साइन इन / पंजीकरण", "Saved products": "सहेजे गए उत्पाद", "Help & support": "सहायता", Notifications: "सूचनाएँ", Basket: "टोकरी",
  "Welcome to Harvest": "हार्वेस्ट में आपका स्वागत है", "Sign in to your account or register your farm to sell your produce.": "अपने खाते में साइन इन करें या उपज बेचने के लिए खेत पंजीकृत करें।", Register: "पंजीकरण", "Verify email": "ईमेल सत्यापित करें", "Recover account": "खाता पुनर्प्राप्त करें", "Your full name": "आपका पूरा नाम", Farmer: "किसान", Consumer: "उपभोक्ता", "Delivery partner": "डिलीवरी पार्टनर", "Farm name": "खेत का नाम", "Email address": "ईमेल पता", "Phone number (optional)": "फ़ोन नंबर (वैकल्पिक)", "Address details (optional)": "पते का विवरण (वैकल्पिक)", "Street / village address": "सड़क / गाँव का पता", "City / village": "शहर / गाँव", State: "राज्य", "Postal / PIN code": "पोस्टल / पिन कोड", "Account security": "खाता सुरक्षा", "Password (at least 12 characters)": "पासवर्ड (कम से कम 12 अक्षर)", "Confirm password": "पासवर्ड की पुष्टि करें", "Create account": "खाता बनाएँ", "First administrator setup": "पहला प्रशासक सेटअप", "Please wait…": "कृपया प्रतीक्षा करें…", "Verify code": "कोड सत्यापित करें", "Verification code": "सत्यापन कोड",
  "Fresh from our farmers": "हमारे किसानों से ताज़ा", "DIRECT FROM THE GROWER": "सीधे किसान से", "From their farm.": "उनके खेत से।", "To your table.": "आपकी मेज़ तक।", "Discover produce listed by farmers in your community.": "अपने क्षेत्र के किसानों की उपज खोजें।", "Search products, farms or locations": "उत्पाद, खेत या स्थान खोजें", "All produce": "सभी उपज", Vegetables: "सब्ज़ियाँ", "Leafy greens": "पत्तेदार सब्ज़ियाँ", "Roots & tubers": "जड़ और कंद", "All methods": "सभी तरीके", Organic: "जैविक", "Naturally grown": "प्राकृतिक रूप से उगाया", "Conventionally grown": "पारंपरिक रूप से उगाया", Newest: "नवीनतम", "Lowest price": "सबसे कम कीमत", "Highest price": "सबसे अधिक कीमत", Freshest: "सबसे ताज़ा", "Refresh marketplace": "बाज़ार रीफ़्रेश करें", "View details": "विवरण देखें", "Add to basket": "टोकरी में जोड़ें", Save: "सहेजें", Saved: "सहेजा गया", Retry: "फिर कोशिश करें",
  "Your account": "आपका खाता", "Full name": "पूरा नाम", Address: "पता", "Phone number": "फ़ोन नंबर", "Save profile": "प्रोफ़ाइल सहेजें", "Refresh account": "खाता रीफ़्रेश करें", "Sign out": "साइन आउट", Approved: "स्वीकृत", "Awaiting approval": "स्वीकृति की प्रतीक्षा",
  "Add product": "उत्पाद जोड़ें", "Add your product": "अपना उत्पाद जोड़ें", "Edit product": "उत्पाद संपादित करें", "Product name": "उत्पाद का नाम", "Farm location": "खेत का स्थान", "Farm pickup": "खेत से प्राप्ति", Category: "श्रेणी", "Farming method": "खेती का तरीका", "Choose product photo": "उत्पाद की तस्वीर चुनें", "Remove photo": "तस्वीर हटाएँ", "Clear expiry date": "समाप्ति तिथि हटाएँ", "Save product": "उत्पाद सहेजें", Cancel: "रद्द करें", Pause: "रोकें", Reactivate: "फिर सक्रिय करें", "Delete product": "उत्पाद हटाएँ",
  "Your basket": "आपकी टोकरी", "Home delivery": "घर पर डिलीवरी", "Delivery address": "डिलीवरी पता", "Delivery destination": "डिलीवरी गंतव्य", "Place order": "ऑर्डर करें", "Remove item": "वस्तु हटाएँ", Increase: "बढ़ाएँ", Decrease: "घटाएँ", "Refresh orders": "ऑर्डर रीफ़्रेश करें", "Track on map": "मानचित्र पर देखें", "Order tracking": "ऑर्डर ट्रैकिंग", Pickup: "पिकअप", Destination: "गंतव्य", "Navigate to pickup": "पिकअप तक जाएँ", "Navigate to destination": "गंतव्य तक जाएँ", "Start sharing location": "स्थान साझा करना शुरू करें", "Stop sharing location": "स्थान साझा करना बंद करें",
  "Detect my current location": "मेरा वर्तमान स्थान पता करें", "Detecting your location…": "आपका स्थान पता किया जा रहा है…", "Detected address": "पता किया गया पता", "Enter coordinates manually": "निर्देशांक स्वयं दर्ज करें", "Hide manual coordinates": "निर्देशांक छिपाएँ",
  "Administration": "प्रशासन", Overview: "अवलोकन", Users: "उपयोगकर्ता", Farms: "खेत", Administrators: "प्रशासक", "Create administrator": "प्रशासक बनाएँ", Products: "उत्पाद", Deliveries: "डिलीवरी", Support: "सहायता", Reviews: "समीक्षाएँ", Activity: "गतिविधि", "Approve account": "खाता स्वीकृत करें", "Revoke approval": "स्वीकृति हटाएँ", "Suspend account": "खाता निलंबित करें", "Reactivate account": "खाता फिर सक्रिय करें", "Previous page": "पिछला पृष्ठ", "Next page": "अगला पृष्ठ", Page: "पृष्ठ", "Loading from the farm server…": "फार्म सर्वर से लोड हो रहा है…",
};

const core = (values: string[]): Messages => Object.fromEntries(
  ["Language", "Explore", "My products", "Orders", "Account", "Sign in", "Register", "Farmer", "Consumer", "Delivery partner", "Products", "Deliveries", "Support", "Save", "Cancel", "Retry"].map((key, index) => [key, values[index]]),
);
const dictionaries: Record<Language, Messages> = {
  en: {}, bn, hi,
  as: core(["ভাষা", "অন্বেষণ", "মোৰ সামগ্ৰী", "অৰ্ডাৰ", "একাউণ্ট", "ছাইন ইন", "পঞ্জীয়ন", "কৃষক", "গ্ৰাহক", "ডেলিভাৰী অংশীদাৰ", "সামগ্ৰী", "ডেলিভাৰী", "সহায়তা", "সংৰক্ষণ", "বাতিল", "পুনৰ চেষ্টা"]),
  or: core(["ଭାଷା", "ଖୋଜନ୍ତୁ", "ମୋ ଉତ୍ପାଦ", "ଅର୍ଡର", "ଆକାଉଣ୍ଟ", "ସାଇନ୍ ଇନ୍", "ପଞ୍ଜୀକରଣ", "ଚାଷୀ", "ଗ୍ରାହକ", "ଡେଲିଭରି ସହଯୋଗୀ", "ଉତ୍ପାଦ", "ଡେଲିଭରି", "ସହାୟତା", "ସଞ୍ଚୟ", "ବାତିଲ", "ପୁନଃ ଚେଷ୍ଟା"]),
  ne: core(["भाषा", "खोज्नुहोस्", "मेरा उत्पादन", "अर्डर", "खाता", "साइन इन", "दर्ता", "किसान", "उपभोक्ता", "डेलिभरी साझेदार", "उत्पादन", "डेलिभरी", "सहायता", "सुरक्षित गर्नुहोस्", "रद्द", "फेरि प्रयास"]),
  ta: core(["மொழி", "தேடுங்கள்", "என் பொருட்கள்", "ஆர்டர்கள்", "கணக்கு", "உள்நுழை", "பதிவு", "விவசாயி", "நுகர்வோர்", "விநியோக கூட்டாளர்", "பொருட்கள்", "விநியோகம்", "உதவி", "சேமி", "ரத்து", "மீண்டும் முயற்சி"]),
  te: core(["భాష", "అన్వేషించండి", "నా ఉత్పత్తులు", "ఆర్డర్లు", "ఖాతా", "సైన్ ఇన్", "నమోదు", "రైతు", "వినియోగదారు", "డెలివరీ భాగస్వామి", "ఉత్పత్తులు", "డెలివరీలు", "సహాయం", "సేవ్", "రద్దు", "మళ్లీ ప్రయత్నించండి"]),
};

const languageScreen: Record<Language, Messages> = {
  en: {},
  bn: {
    "Choose your language": "আপনার ভাষা বেছে নিন",
    "You can change the app language at any time. Your choice is saved on this device and in your account after sign-in.": "আপনি যেকোনো সময় অ্যাপের ভাষা বদলাতে পারেন। আপনার পছন্দ এই ডিভাইসে এবং লগ ইন করার পরে আপনার অ্যাকাউন্টে সংরক্ষিত হবে।",
    Selected: "নির্বাচিত",
    "Use this language": "এই ভাষা ব্যবহার করুন",
    "English is used as a fallback when a new message has not been translated yet.": "নতুন কোনো বার্তা অনুবাদ না হওয়া পর্যন্ত ইংরেজি বিকল্প হিসেবে দেখানো হবে।",
  },
  hi: {
    "Choose your language": "अपनी भाषा चुनें",
    "You can change the app language at any time. Your choice is saved on this device and in your account after sign-in.": "आप ऐप की भाषा कभी भी बदल सकते हैं। आपकी पसंद इस डिवाइस पर और साइन इन के बाद आपके खाते में सहेजी जाती है।",
    Selected: "चयनित",
    "Use this language": "इस भाषा का उपयोग करें",
    "English is used as a fallback when a new message has not been translated yet.": "किसी नए संदेश का अनुवाद उपलब्ध न होने पर अंग्रेज़ी दिखाई जाएगी।",
  },
  as: { "Choose your language": "আপোনাৰ ভাষা বাছক", Selected: "নিৰ্বাচিত", "Use this language": "এই ভাষা ব্যৱহাৰ কৰক" },
  or: { "Choose your language": "ଆପଣଙ୍କ ଭାଷା ବାଛନ୍ତୁ", Selected: "ଚୟନିତ", "Use this language": "ଏହି ଭାଷା ବ୍ୟବହାର କରନ୍ତୁ" },
  ne: { "Choose your language": "आफ्नो भाषा छान्नुहोस्", Selected: "चयन गरिएको", "Use this language": "यो भाषा प्रयोग गर्नुहोस्" },
  ta: { "Choose your language": "உங்கள் மொழியைத் தேர்ந்தெடுக்கவும்", Selected: "தேர்ந்தெடுக்கப்பட்டது", "Use this language": "இந்த மொழியைப் பயன்படுத்து" },
  te: { "Choose your language": "మీ భాషను ఎంచుకోండి", Selected: "ఎంచుకున్నారు", "Use this language": "ఈ భాషను ఉపయోగించండి" },
};
for (const option of languages)
  Object.assign(dictionaries[option.code], languageScreen[option.code]);

const storageKey = "harvest-language";
type I18nValue = {
  language: Language;
  setLanguage: (language: Language) => Promise<void>;
  t: (text: string) => string;
};
const I18nContext = createContext<I18nValue>({
  language: "en",
  setLanguage: async () => {},
  t: (text) => text,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setCurrent] = useState<Language>("en");
  useEffect(() => {
    void AsyncStorage.getItem(storageKey)
      .then((saved) => {
        if (languages.some(({ code }) => code === saved))
          setCurrent(saved as Language);
      })
      .catch(() => {});
  }, []);
  const value = useMemo<I18nValue>(() => ({
    language,
    async setLanguage(next) {
      setCurrent(next);
      await AsyncStorage.setItem(storageKey, next);
    },
    t(text) {
      return dictionaries[language][text.replace(/\s+/g, " ").trim()] || text;
    },
  }), [language]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);

export function LocalizedText({ children, ...props }: TextProps) {
  const { t } = useI18n();
  const translate = (child: ReactNode): ReactNode => {
    if (typeof child !== "string") return child;
    const leading = child.match(/^\s*/)?.[0] || "";
    const trailing = child.match(/\s*$/)?.[0] || "";
    const content = child.slice(leading.length, child.length - trailing.length || undefined);
    return content ? leading + t(content) + trailing : child;
  };
  return <NativeText {...props}>{React.Children.map(children, translate)}</NativeText>;
}
