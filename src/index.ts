import { rtlLanguages } from './consts.js';

export interface I18NotOptions {
  ns?: string[];
  defaultNS: string;

  /**
   * Fallback language code to use if no other languages match.
   */
  fallbackLng: string;

  /**
   * Default: all.
   */
  load?: 'all' | 'languageOnly';

  loadPath: string;

  localStorageKey?: string;

  languages?: string[];
}

function processLanguageCodes(codes: string[]) {
  const languages = new Set<string>();
  for (const code of codes) {
    const split = code.split('-');
    if (!split[1]) {
      languages.add(split[0]);
      continue;
    }

    if (_options?.load !== 'languageOnly') {
      languages.add(code);
    }
    languages.add(split[0]);
  }

  const out = [...languages];
  if (_options?.languages) {
    return out.filter(code => _options?.languages?.includes(code));
  }

  return out;
}

function detectLanguages(): string[] {
  if (!_options) {
    throw new Error('[i18not] Not initialized');
  }

  const languages: string[] = [];

  if (_options.localStorageKey && typeof localStorage !== 'undefined') {
    const value = localStorage.getItem(_options.localStorageKey);
    if (value) {
      languages.push(value);
    }
  }

  if (typeof navigator !== 'undefined') {
    if (navigator.languages) {
      languages.push(...navigator.languages);
    }

    if ((navigator as any).userLanguage) {
      languages.push((navigator as any).userLanguage);
    }

    if (navigator.language) {
      languages.push(navigator.language);
    }
  }

  if (_options.fallbackLng) {
    languages.push(_options.fallbackLng);
  }

  return processLanguageCodes(languages);
}

export function interpolate(formatStr: string, ...args: any[]) {
  const values =
    typeof args[0] === 'object' && !Array.isArray(args[0])
      ? { ...args[0] }
      : { ...args };

  return formatStr.replace(/{{(\w+)}}/g, (match, key) => {
    return typeof values?.[key] != 'undefined' ? values[key] : match;
  });
}

const loadPromise: Record<string, Promise<void> | undefined> = {};
let _options: I18NotOptions | undefined = undefined;
let _languages: string[] = [];
let _language: string = 'dev';

const _namespaces: Record<string, any> = {};

async function fetchLanguage(namespace: string): Promise<void> {
  if (!_options) {
    throw new Error('[i18not] Not initialized');
  }

  for (const language of _languages) {
    try {
      const url = interpolate(_options.loadPath, {
        lng: language,
        ns: namespace,
      });

      const res = await fetch(url);
      const json = await res.json();
      _namespaces[namespace] = json;
      _language = language;
      return;
    } catch {}
  }

  _namespaces[namespace] = false;
  console.warn(`[i18not] Unable to find json file for namespace ${namespace}.`);
}

export function load(namespace: string): Promise<void> {
  const promise = loadPromise[namespace];
  if (promise) {
    return promise;
  }

  const newPromise = fetchLanguage(namespace);
  loadPromise[namespace] = newPromise;
  return newPromise;
}

export function init(options: I18NotOptions) {
  _options = options;
  _languages = detectLanguages();
  _language = options.fallbackLng;

  if (options.defaultNS) {
    load(options.defaultNS);
  }
}

export type TranslationFn = (key: string, ...args: any[]) => string;

export const t: TranslationFn = (key, ...args) => {
  if (!_options) {
    throw new Error('[i18not] Not initialized');
  }

  if (!key) {
    return '';
  }

  let ns = _options.defaultNS;

  if (key.includes(':')) {
    const split = key.split(':');
    ns = split[0];
    key = split[1];
  }

  let obj = _namespaces[ns];

  if (obj) {
    const path = key.split('.');
    while (obj) {
      const segment = path.shift();

      if (!segment) {
        if (typeof obj === 'string') {
          return interpolate(obj, ...args);
        }

        break;
      }

      if (typeof obj !== 'object') {
        break;
      }
      obj = obj[segment];
    }
  }

  return key;
};

export function getOptions() {
  if (!_options) {
    throw new Error('[i18not] Not initialized');
  }

  return _options;
}

export function getLanguage() {
  return _language;
}

export function getDir(): 'ltr' | 'rtl' {
  const split = _language.split('-');
  return rtlLanguages.includes(split[0]) ? 'rtl' : 'ltr';
}

export function getNamespace(namespace: string) {
  return _namespaces[namespace];
}
