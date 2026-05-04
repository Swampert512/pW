/**
 * Gestor de internacionalización (i18n) simple.
 * Carga archivos JSON de traducciones y proporciona una API para acceder a ellas.
 */
import es from '../../../shared/i18n/es.json';
import en from '../../../shared/i18n/en.json';

type Language = 'es' | 'en';

type Translations = Record<Language, any>;

class I18nManager {
  private translations: Translations = {
    es,
    en
  };

  /**
   * Obtiene una traducción usando notación de puntos.
   * Ejemplo: i18n.t('es', 'proyecto.creado') → "Proyecto creado exitosamente"
   *
   * @param lang - Idioma ('es' o 'en')
   * @param key - Clave de traducción con notación de puntos
   * @param defaultValue - Valor por defecto si no encuentra la clave
   */
  public t(
    lang: Language,
    key: string,
    defaultValue: string = key
  ): string {
    const keys = key.split('.');
    let value: any = this.translations[lang];

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
   * Obtiene todas las traducciones de un idioma.
   */
  public getAll(lang: Language): any {
    return this.translations[lang];
  }
}

export const i18n = new I18nManager();