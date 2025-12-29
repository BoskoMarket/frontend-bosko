export type ServiceCategory = {
  id: string;
  title: string;
  description: string;
  icon: string;
  accent: string;
};

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "tecnologia-desarrollo",
    title: "Tecnología y Desarrollo",
    description: "Desarrolladores, técnicos, soporte y más",
    icon: "💻",
    accent: "#E6F0FF",
  },
  {
    id: "diseno-creatividad",
    title: "Diseño y Creatividad",
    description: "Diseño gráfico, ilustración, branding, UI/UX",
    icon: "🎨",
    accent: "#F5ECFF",
  },
  {
    id: "marketing-publicidad",
    title: "Marketing y Publicidad",
    description: "Redes sociales, SEO y campañas digitales",
    icon: "📣",
    accent: "#FFF4E5",
  },
  {
    id: "fotografia-video",
    title: "Fotografía y Video",
    description: "Fotógrafos, filmmakers y editores",
    icon: "📸",
    accent: "#FFEFF3",
  },
  {
    id: "reparaciones-mantenimiento",
    title: "Reparaciones y Mantenimiento",
    description: "Electricistas, plomeros y técnicos del hogar",
    icon: "🛠️",
    accent: "#F1F8F0",
  },
  {
    id: "construccion-remodelacion",
    title: "Construcción y Remodelación",
    description: "Albañiles, pintores y carpinteros",
    icon: "🏗️",
    accent: "#F0F4F9",
  },
  {
    id: "salud-bienestar",
    title: "Salud y Bienestar",
    description: "Entrenadores, masajistas y nutricionistas",
    icon: "🧘",
    accent: "#EFFFF5",
  },
  {
    id: "educacion-tutorias",
    title: "Educación y Tutorías",
    description: "Clases particulares e idiomas",
    icon: "📚",
    accent: "#FFF4FA",
  },
  {
    id: "belleza-estetica",
    title: "Belleza y Estética",
    description: "Peluquería, uñas, maquillaje y barbería",
    icon: "💅",
    accent: "#FFF0F6",
  },
  {
    id: "eventos-entretenimiento",
    title: "Eventos y Entretenimiento",
    description: "DJs, organización y animación",
    icon: "🎉",
    accent: "#F7F1FF",
  },
  {
    id: "legales-contables",
    title: "Servicios Legales y Contables",
    description: "Abogados, contadores y asesores",
    icon: "⚖️",
    accent: "#EEF4FF",
  },
  {
    id: "transporte-mensajeria",
    title: "Transporte y Mensajería",
    description: "Mudanzas, repartos y traslados",
    icon: "🚚",
    accent: "#EFFFFB",
  },
  {
    id: "mascotas-animales",
    title: "Mascotas y Animales",
    description: "Paseadores, entrenadores y cuidado",
    icon: "🐾",
    accent: "#FFF5EC",
  },
  {
    id: "limpieza-hogar",
    title: "Limpieza y Hogar",
    description: "Limpieza de casas, oficinas y niñeras",
    icon: "🧽",
    accent: "#ECF7FF",
  },
];
