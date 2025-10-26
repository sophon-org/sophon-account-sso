import {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';
import en from './locales/en.json';
import es from './locales/es.json';

type PathImpl<T, Key extends keyof T> = Key extends string
  ? T[Key] extends Record<string, unknown>
    ?
        | `${Key}.${PathImpl<T[Key], Exclude<keyof T[Key], keyof unknown[]>> & string}`
        | `${Key}`
    : `${Key}`
  : never;

type Path<T> = PathImpl<T, keyof T> | keyof T;

type DefaultTranslationKeys = Path<typeof en>;

// Ensure both locales have the same structure
type TranslationKeys = DefaultTranslationKeys;

/**
 * Locale code (ISO 639-1 or BCP-47).
 * Examples:
 *  - "en" (English, default)
 */
export type SupportedLocaleCode = 'en' | 'es';

export const defaultResources: Record<SupportedLocaleCode, typeof en> = {
  en,
  es,
};

export type TranslationFunction = (
  key: TranslationKeys,
  variables?: Record<string, string | number>,
) => string;

export interface LocalizationProviderProps {
  /** Locale code for translations (default: "en") */
  locale?: SupportedLocaleCode;
}

export interface LocalizationContextProps extends LocalizationProviderProps {
  t: TranslationFunction;
}

const TranslationContext = createContext<LocalizationContextProps>({
  locale: 'en',
  t: (key) => key,
});

export const useTranslation = () => useContext(TranslationContext);

/**
 * Provider for handling translations inside the library.
 */
export function LocalizationProvider({
  locale = 'en',
  children,
}: PropsWithChildren<LocalizationProviderProps>) {
  const dict = useMemo(() => defaultResources[locale || 'en'], [locale]);

  const t: TranslationFunction = useMemo(
    () => (key, variables) => {
      const translation = key
        .split('.')
        .reduce<string | Record<string, unknown>>(
          (acc, part) => {
            if (acc && typeof acc === 'object' && part in acc) {
              return acc[part] as string | Record<string, unknown>;
            }
            return key;
          },
          dict as Record<string, unknown>,
        );

      let result = typeof translation === 'string' ? translation : key;

      if (variables) {
        for (const [varKey, varValue] of Object.entries(variables)) {
          result = result.replace(
            new RegExp(`{{${varKey}}}`, 'g'),
            String(varValue),
          );
        }
      }

      return result;
    },
    [dict],
  );

  return (
    <TranslationContext.Provider value={{ locale, t }}>
      {children}
    </TranslationContext.Provider>
  );
}
