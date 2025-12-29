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
  accent: "#6E0016", // vino oscuro elegante, moderno
},
{
  id: "diseno-creatividad",
  title: "Diseño y Creatividad",
  description: "Diseño gráfico, ilustración, branding, UI/UX",
  icon: "🎨",
  accent: "#B8334F", // borgoña brillante, artístico
},
{
  id: "marketing-publicidad",
  title: "Marketing y Publicidad",
  description: "Redes sociales, SEO y campañas digitales",
  icon: "📣",
  accent: "#E06179", // tono vivo, energético
},
{
  id: "fotografia-video",
  title: "Fotografía y Video",
  description: "Fotógrafos, filmmakers y editores",
  icon: "📸",
  accent: "#A31C3A", // profundo, cinematográfico
},
{
  id: "reparaciones-mantenimiento",
  title: "Reparaciones y Mantenimiento",
  description: "Electricistas, plomeros y técnicos del hogar",
  icon: "🛠️",
  accent: "#590011", // tono burdeos oscuro, fuerte
},
{
  id: "construccion-remodelacion",
  title: "Construcción y Remodelación",
  description: "Albañiles, pintores y carpinteros",
  icon: "🏗️",
  accent: "#2E0008", // sólido, estable
},
{
  id: "salud-bienestar",
  title: "Salud y Bienestar",
  description: "Entrenadores, masajistas y nutricionistas",
  icon: "🧘",
  accent: "#F57A90", // cálido, suave, saludable
},
{
  id: "educacion-tutorias",
  title: "Educación y Tutorías",
  description: "Clases particulares e idiomas",
  icon: "📚",
  accent: "#CC4A64", // vibrante, motivador
},
{
  id: "belleza-estetica",
  title: "Belleza y Estética",
  description: "Peluquería, uñas, maquillaje y barbería",
  icon: "💅",
  accent: "#853041", // elegante, femenino
},
{
  id: "eventos-entretenimiento",
  title: "Eventos y Entretenimiento",
  description: "DJs, organización y animación",
  icon: "🎉",
  accent: "#E06179", // tono festivo, brillante
},
{
  id: "legales-contables",
  title: "Servicios Legales y Contables",
  description: "Abogados, contadores y asesores",
  icon: "⚖️",
  accent: "#43000C", // sobrio, serio
},
{
  id: "transporte-mensajeria",
  title: "Transporte y Mensajería",
  description: "Mudanzas, repartos y traslados",
  icon: "🚚",
  accent: "#85202F", // firme, dinámico
},
{
  id: "mascotas-animales",
  title: "Mascotas y Animales",
  description: "Paseadores, entrenadores y cuidado",
  icon: "🐾",
  accent: "#85405E", // amigable, tierno
},
{
  id: "limpieza-hogar",
  title: "Limpieza y Hogar",
  description: "Limpieza de casas, oficinas y niñeras",
  icon: "🧽",
  accent: "#B8334F", // vibrante, cuidado y energía
},

];
