/**
 * Sistema de internacionalización (i18n)
 * Carga traducciones desde JSON y proporciona función t()
 */

type Language = 'es' | 'en';

class I18nManager {
  private currentLang: Language = 'es';
  private translations: Record<Language, any> = {
    es: {},
    en: {}
  };
  private isLoaded = false;

  /**
   * Carga traducciones desde el servidor
   */
  async load(): Promise<void> {
    if (this.isLoaded) return;

    try {
      // Cargar español
      const esResponse = await fetch('http://localhost:3000/api/i18n/es');
      const esData = await esResponse.json();
      this.translations.es = esData.translations || {};

      // Cargar inglés
      const enResponse = await fetch('http://localhost:3000/api/i18n/en');
      const enData = await enResponse.json();
      this.translations.en = enData.translations || {};

      this.isLoaded = true;
    } catch (error) {
      console.error('Error cargando i18n:', error);
    }
  }

  /**
   * Obtiene una traducción usando notación de puntos
   * Ejemplo: t('tarea.creada') → "Tarea creada exitosamente"
   */
  t(key: string, defaultValue: string = key): string {
    const keys = key.split('.');
    let value: any = this.translations[this.currentLang];

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return defaultValue;
      }
    }

    return typeof value === 'string' ? value : defaultValue;
  }

  /**
   * Cambia el idioma actual
   */
  setLanguage(lang: Language): void {
    this.currentLang = lang;
    document.documentElement.lang = lang;
  }

  /**
   * Obtiene el idioma actual
   */
  getLanguage(): Language {
    return this.currentLang;
  }
}

export const i18n = new I18nManager();
