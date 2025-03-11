import { useLanguage } from '@/providers/LanguageProvider';

export function useTranslation() {
  const { translations } = useLanguage();

  const t = (key: string) => {
    const keys = key.split('.');
    let value = translations;

    for (const k of keys) {
      if (!value || typeof value !== 'object') {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      value = value[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    return value;
  };

  return { t };
} 