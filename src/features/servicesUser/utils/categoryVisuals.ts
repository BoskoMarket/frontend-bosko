import type { ImageSourcePropType } from 'react-native';

export interface CategoryVisual {
  image?: ImageSourcePropType;
  /** Transparent cut-out of the trade in action (category screen hero). */
  detailImage?: ImageSourcePropType;
  subtitle: string;
}

export const HERO_IMAGE: ImageSourcePropType = require('../../../../assets/images/categories/hero.png');

/** Photo for services that have none (e.g. ServiceCard `fallbackImage`). */
export const SERVICE_FALLBACK_IMAGE: ImageSourcePropType = require('../../../../assets/images/services/service-fallback.jpg');

const FALLBACK_SUBTITLE = 'Profesionales verificados cerca tuyo.';

const VISUALS: Record<string, CategoryVisual> = {
  plomeria: {
    image: require('../../../../assets/images/categories/plomeria.png'),
    detailImage: require('../../../../assets/images/categories/detail/plomeria.png'),
    subtitle: 'Pérdidas, destapes e instalaciones, rápido y prolijo.',
  },
  electricidad: {
    image: require('../../../../assets/images/categories/electricidad.png'),
    detailImage: require('../../../../assets/images/categories/detail/electricidad.png'),
    subtitle: 'Instalaciones, tableros y arreglos con matriculados.',
  },
  gas: {
    image: require('../../../../assets/images/categories/gas.png'),
    detailImage: require('../../../../assets/images/categories/detail/gas.png'),
    subtitle: 'Gasistas matriculados para instalaciones y controles.',
  },
  construccion: {
    image: require('../../../../assets/images/categories/construccion.png'),
    detailImage: require('../../../../assets/images/categories/detail/construccion.png'),
    subtitle: 'Obras, reformas y albañilería de confianza.',
  },
  fotografia: {
    image: require('../../../../assets/images/categories/fotografia.png'),
    detailImage: require('../../../../assets/images/categories/detail/fotografia.png'),
    subtitle: 'Eventos, retratos y producto con fotógrafos locales.',
  },
  'clases-particulares': {
    image: require('../../../../assets/images/categories/clases-particulares.png'),
    detailImage: require('../../../../assets/images/categories/detail/clases-particulares.png'),
    subtitle: 'Profes para todos los niveles, presencial u online.',
  },
};

/** "Clases particulares" -> "clases-particulares" (lowercase, no accents, spaces to dashes). */
export function normalizeCategoryName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-');
}

export function categoryVisual(name: string): CategoryVisual {
  return VISUALS[normalizeCategoryName(name)] ?? { subtitle: FALLBACK_SUBTITLE };
}
