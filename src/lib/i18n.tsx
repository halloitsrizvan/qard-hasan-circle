import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type Language = 'en' | 'ml' | 'hi';

export interface Translations {
  appName: string;
  tagline: string;
  circleOverview: string;
  contributions: string;
  loans: string;
  ledger: string;
  members: string;
  committee: string;
  rules: string;
  settings: string;
  contribute: string;
  requestLoan: string;
  poolBalance: string;
  totalContributed: string;
  currentlyLent: string;
  principalRepaid: string;
  availableToLend: string;
  repaymentHealth: string;
  interestFreeAlways: string;
  noInterest: string;
  noFees: string;
  noPenalties: string;
  hardshipEase: string;
  demoRole: string;
  guarantor: string;
  committeeAdmin: string;
  member: string;
  auditor: string;
  quickDemoTour: string;
  wealthAndChit: string;
}

const translations: Record<Language, Translations> = {
  en: {
    appName: 'Qard Hasan Circles',
    tagline: 'A little from each of us. A world of difference for one of us.',
    circleOverview: 'Circle Overview',
    contributions: 'Contributions',
    wealthAndChit: 'Wealth & Chit Fund',
    loans: 'Community Loans',
    ledger: 'Transparent Ledger',
    members: 'Members',
    committee: 'Committee Console',
    rules: 'Rules & Principles',
    settings: 'Settings',
    contribute: 'Contribute',
    requestLoan: 'Request Loan',
    poolBalance: 'Available pool balance',
    totalContributed: 'Total Contributed',
    currentlyLent: 'Currently Lent Out',
    principalRepaid: 'Principal Repaid',
    availableToLend: 'Available to Lend',
    repaymentHealth: 'Repayment health',
    interestFreeAlways: 'Interest-free. Always.',
    noInterest: 'Zero Interest (Riba-free)',
    noFees: 'No Lender Processing Fees',
    noPenalties: 'No Late Payment Fines',
    hardshipEase: 'Ease & Dignity in Hardship',
    demoRole: 'Demo role',
    guarantor: 'Guarantor',
    committeeAdmin: 'Committee Admin',
    member: 'Member',
    auditor: 'Auditor',
    quickDemoTour: '5-Min Demo Tour'
  },
  ml: {
    appName: 'ഖർദ് ഹസൻ സർക്കിൾ',
    tagline: 'നമ്മളിൽ ഓരോരുത്തരിലും നിന്നും ഒരു ചെറിയ വിഹിതം. ഒരു കുടുംബത്തിന് വലിയ ആശ്വാസം.',
    circleOverview: 'സർക്കിൾ അവലോകനം',
    contributions: 'വിഹിതങ്ങൾ',
    wealthAndChit: 'സമ്പാദ്യവും ചിട്ടിയും',
    loans: 'പലിശരഹിത വായ്പകൾ',
    ledger: 'സുതാര്യമായ ലെഡ്ജർ',
    members: 'അംഗങ്ങൾ',
    committee: 'കമ്മിറ്റി കൺസോൾ',
    rules: 'നിയമങ്ങളും തത്വങ്ങളും',
    settings: 'ക്രമീകരണങ്ങൾ',
    contribute: 'വിഹിതം നൽകുക',
    requestLoan: 'വായ്പ അപേക്ഷിക്കുക',
    poolBalance: 'ലഭ്യമായ പൂൾ ഫണ്ട്',
    totalContributed: 'ആകെ സമാഹരിച്ചത്',
    currentlyLent: 'നൽകിയ വായ്പകൾ',
    principalRepaid: 'തിരിച്ചടച്ച തുക',
    availableToLend: 'ലഭ്യമായ തുക',
    repaymentHealth: 'തിരിച്ചടവ് നിരക്ക്',
    interestFreeAlways: 'പലിശരഹിതം. എപ്പോഴും.',
    noInterest: 'പലിശ പൂർണ്ണമായും ഒഴിവാക്കപ്പെട്ടു',
    noFees: 'പ്രോസസ്സിംഗ് ഫീസുകളില്ല',
    noPenalties: 'പിഴ പലിശകളില്ല',
    hardshipEase: 'പ്രയാസങ്ങളിൽ ഇളവും കാരുണ്യവും',
    demoRole: 'ഡെമോ റോൾ',
    guarantor: 'ഗ്യാരന്റർ',
    committeeAdmin: 'കമ്മിറ്റി അഡ്മിൻ',
    member: 'അംഗം',
    auditor: 'ഓഡിറ്റർ',
    quickDemoTour: 'ഡെമോ ടൂർ'
  },
  hi: {
    appName: 'क़र्द हसन सर्कल्स',
    tagline: 'हम सब की थोड़ी सी मदद, किसी एक के लिए बड़ी राहत।',
    circleOverview: 'सर्कल विवरण',
    contributions: 'योगदान',
    wealthAndChit: 'धन और चिट फंड',
    loans: 'ब्याज-मुक्त ऋण',
    ledger: 'पारदर्शी बहीखाता',
    members: 'सदस्य',
    committee: 'कमेटी कंसोल',
    rules: 'नियम और सिद्धांत',
    settings: 'सेटिंग्स',
    contribute: 'योगदान करें',
    requestLoan: 'ऋण का अनुरोध करें',
    poolBalance: 'उपलब्ध पूल बैलेंस',
    totalContributed: 'कुल एकत्रित राशि',
    currentlyLent: 'वर्तमान ऋण',
    principalRepaid: 'वापस किया गया मूलधन',
    availableToLend: 'ऋण के लिए उपलब्ध',
    repaymentHealth: 'पुनर्भुगतान दर',
    interestFreeAlways: 'ब्याज मुक्त। हमेशा।',
    noInterest: 'शून्य ब्याज (रिबा-मुक्त)',
    noFees: 'कोई प्रोसेसिंग शुल्क नहीं',
    noPenalties: 'देरी पर कोई जुर्माना नहीं',
    hardshipEase: 'कठिनाई में राहत और सम्मान',
    demoRole: 'डेमो रोल',
    guarantor: 'जमानतदार',
    committeeAdmin: 'कमेटी एडमिन',
    member: 'सदस्य',
    auditor: 'ऑडिटर',
    quickDemoTour: 'डेमो टूर'
  }
};

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('qard-lang') as Language;
      if (saved && (saved === 'en' || saved === 'ml' || saved === 'hi')) {
        setLanguageState(saved);
      }
    } catch {}
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('qard-lang', lang);
    } catch {}
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t: translations[language] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used within LanguageProvider');
  return context;
}
