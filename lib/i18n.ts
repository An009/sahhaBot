export const languages = {
  ar: 'العربية',
  fr: 'Français',
  da: 'الدارجة'
} as const;

export type Language = keyof typeof languages;

export const translations = {
  ar: {
    appName: 'صحة بوت',
    welcome: 'مرحبا بكم في صحة بوت',
    describeSymptoms: 'صف أعراضك',
    emergency: 'طوارئ',
    findHealthcare: 'البحث عن مرافق صحية',
    symptoms: 'الأعراض',
    analysis: 'التحليل',
    recommendations: 'التوصيات',
    nearbyFacilities: 'المرافق القريبة',
    speakSymptoms: 'تحدث عن أعراضك',
    listening: 'أستمع...',
    severity: {
      low: 'منخفض',
      moderate: 'متوسط',
      high: 'عالي',
      emergency: 'طوارئ'
    },
    offline: 'غير متصل',
    syncWhenOnline: 'سيتم المزامنة عند الاتصال'
  },
  fr: {
    appName: 'SahhaBot',
    welcome: 'Bienvenue sur SahhaBot',
    describeSymptoms: 'Décrivez vos symptômes',
    emergency: 'Urgence',
    findHealthcare: 'Trouver des établissements de santé',
    symptoms: 'Symptômes',
    analysis: 'Analyse',
    recommendations: 'Recommandations',
    nearbyFacilities: 'Établissements à proximité',
    speakSymptoms: 'Parlez de vos symptômes',
    listening: 'Écoute...',
    severity: {
      low: 'Faible',
      moderate: 'Modéré',
      high: 'Élevé',
      emergency: 'Urgence'
    },
    offline: 'Hors ligne',
    syncWhenOnline: 'Synchronisation à la connexion'
  },
  da: {
    appName: 'صحة بوت',
    welcome: 'أهلا و سهلا فـ صحة بوت',
    describeSymptoms: 'وصف الأعراض ديالك',
    emergency: 'طوارئ',
    findHealthcare: 'البحث على المستشفيات',
    symptoms: 'الأعراض',
    analysis: 'التحليل',
    recommendations: 'النصائح',
    nearbyFacilities: 'المستشفيات القريبة',
    speakSymptoms: 'هدر على الأعراض ديالك',
    listening: 'كنسمع...',
    severity: {
      low: 'قليل',
      moderate: 'متوسط',
      high: 'كبير',
      emergency: 'طوارئ'
    },
    offline: 'ماشي متصل',
    syncWhenOnline: 'غيتسينك ملي تتصل'
  }
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}