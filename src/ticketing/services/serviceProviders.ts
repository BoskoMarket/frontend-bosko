export type ServiceProvider = {
  id: string;
  categoryId: string;
  name: string;
  title: string;
  summary: string;
  rating: number;
  reviews: number;
  location: string;
  rate: {
    amount: number;
    currency: string;
    unit: string;
  };
  avatar: string;
  photo: string;
  heroImage: string;
  bio: string;
  tags: string[];
  recentWorks: {
    id: string;
    title: string;
    image: string;
    timeAgo: string;
  }[];
};

export const SERVICE_PROVIDERS: ServiceProvider[] = [
  {
    id: "ana-rivera",
    categoryId: "tecnologia-desarrollo",
    name: "Ana Rivera",
    title: "Desarrolladora Full Stack",
    summary: "Aplicaciones web escalables y accesibles listas para producción.",
    rating: 4.9,
    reviews: 42,
    location: "Buenos Aires, Argentina",
    rate: {
      amount: 28,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1517430816045-df4b7de11d1d?auto=format&fit=crop&w=900&q=80",
    bio: "Trabajo junto a startups y equipos de producto diseñando soluciones web completas usando React, Node y prácticas modernas de DevOps. Priorizo la comunicación clara y entregas incrementales.",
    tags: ["React", "Node.js", "UI accesible"],
    recentWorks: [
      {
        id: "ana-dashboard",
        title: "Dashboard de métricas para SaaS",
        image:
          "https://images.unsplash.com/photo-1556157382-97eda2d62296?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 semanas atrás",
      },
      {
        id: "ana-audit",
        title: "Auditoría de performance en e-commerce",
        image:
          "https://images.unsplash.com/photo-1517433670267-08bbd4be8903?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 mes atrás",
      },
    ],
  },
  {
    id: "martin-costa",
    categoryId: "tecnologia-desarrollo",
    name: "Martín Costa",
    title: "Técnico de Soporte IT",
    summary: "Instalación y mantenimiento de redes hogareñas y de oficinas pequeñas.",
    rating: 4.7,
    reviews: 31,
    location: "CABA, Argentina",
    rate: {
      amount: 18,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80",
    bio: "Soluciono problemas de conectividad, realizo mantenimiento preventivo y asesoro en la compra de hardware sin complicaciones. Trabajo con agenda flexible.",
    tags: ["Redes", "PC", "Soporte remoto"],
    recentWorks: [
      {
        id: "martin-wifi",
        title: "Optimización de red Wi-Fi en coworking",
        image:
          "https://images.unsplash.com/photo-1555618328-9d3b532fafdb?auto=format&fit=crop&w=600&q=80",
        timeAgo: "5 días atrás",
      },
      {
        id: "martin-setup",
        title: "Setup de 10 estaciones de trabajo",
        image:
          "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
  {
    id: "lucia-ortega",
    categoryId: "diseno-creatividad",
    name: "Lucía Ortega",
    title: "Diseñadora de Marca & UI",
    summary: "Identidades visuales y sistemas de diseño listos para desarrollo.",
    rating: 5,
    reviews: 27,
    location: "Remoto",
    rate: {
      amount: 32,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1523475472560-d2df97ec485c?auto=format&fit=crop&w=900&q=80",
    bio: "Ayudo a equipos a construir marcas memorables, definiendo tono visual, tipografías y componentes UI cohesionados. Entrego archivos organizados y listos para iterar.",
    tags: ["Branding", "UI Kits", "Design Systems"],
    recentWorks: [
      {
        id: "lucia-brand",
        title: "Rebranding para fintech regional",
        image:
          "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 semana atrás",
      },
      {
        id: "lucia-app",
        title: "UI mobile para app de bienestar",
        image:
          "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 mes atrás",
      },
    ],
  },
  {
    id: "federica-suarez",
    categoryId: "marketing-publicidad",
    name: "Federica Suárez",
    title: "Especialista en Paid Media",
    summary: "Campañas orientadas a conversión para pymes de servicios.",
    rating: 4.9,
    reviews: 39,
    location: "Montevideo, Uruguay",
    rate: {
      amount: 30,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=900&q=80",
    bio: "Gestiono pauta en Meta y Google Ads con reportes claros y optimizaciones semanales. Me enfoco en conseguir resultados medibles y escalar campañas rentables.",
    tags: ["Meta Ads", "Google Ads", "Estrategia"],
    recentWorks: [
      {
        id: "fede-leads",
        title: "Generación de leads para coworking",
        image:
          "https://images.unsplash.com/photo-1507209696998-3c532be9b2b6?auto=format&fit=crop&w=600&q=80",
        timeAgo: "6 días atrás",
      },
      {
        id: "fede-ecommerce",
        title: "Campaña remarketing ecommerce retail",
        image:
          "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
  {
    id: "valentina-nadal",
    categoryId: "fotografia-video",
    name: "Valentina Nadal",
    title: "Fotógrafa Lifestyle & Producto",
    summary: "Sesiones ágiles con entrega editada en menos de 72 horas.",
    rating: 5,
    reviews: 33,
    location: "Mar del Plata, Argentina",
    rate: {
      amount: 45,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1516728778615-2d590ea1855e?auto=format&fit=crop&w=900&q=80",
    bio: "Me especializo en fotografía lifestyle para marcas jóvenes y productos de ecommerce. Planifico, produzco y entrego material listo para publicar.",
    tags: ["Lifestyle", "Producto", "Edición"],
    recentWorks: [
      {
        id: "valen-bebidas",
        title: "Campaña fotográfica para bebida saludable",
        image:
          "https://images.unsplash.com/photo-1523365280197-f1783db9fe62?auto=format&fit=crop&w=600&q=80",
        timeAgo: "4 días atrás",
      },
      {
        id: "valen-brand",
        title: "Lookbook moda otoño",
        image:
          "https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 semanas atrás",
      },
    ],
  },
  {
    id: "leo-gomez",
    categoryId: "reparaciones-mantenimiento",
    name: "Leo Gómez",
    title: "Plomero Profesional",
    summary: "Instalaciones y reparaciones de fontanería con garantía escrita.",
    rating: 4.9,
    reviews: 230,
    location: "Buenos Aires, Argentina",
    rate: {
      amount: 35,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1581579186989-07f9049f9c37?auto=format&fit=crop&w=900&q=80",
    bio: "Soy técnico matriculado con más de 8 años de experiencia en soluciones de fontanería para hogares y pequeños comercios. Trabajo limpias y finalizadas el mismo día siempre que sea posible.",
      tags: ["Tuberías", "Grifería", "Desagües"],
      recentWorks: [
        {
          id: "leo-cocina",
          title: "Renovación de cañerías de cocina",
          image:
            "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
          timeAgo: "3 días atrás",
        },
        {
          id: "leo-bano",
          title: "Instalación de ducha con hidromasaje",
          image:
            "https://images.unsplash.com/photo-1560185008-5bf9f2849480?auto=format&fit=crop&w=600&q=80",
          timeAgo: "2 semanas atrás",
        },
      ],
  },
  {
    id: "hugo-lamas",
    categoryId: "construccion-remodelacion",
    name: "Hugo Lamas",
    title: "Maestro Mayor de Obras",
    summary: "Remodelaciones integrales con planificación y seguimiento diario.",
    rating: 4.8,
    reviews: 21,
    location: "La Plata, Argentina",
    rate: {
      amount: 40,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1505843513577-22bb7d21e455?auto=format&fit=crop&w=900&q=80",
    bio: "Coordino remodelaciones residenciales con equipos especializados, cuidando la limpieza del espacio y el cumplimiento de plazos acordados.",
    tags: ["Remodelación", "Dirección de obra", "Planos"],
    recentWorks: [
      {
        id: "hugo-cocina",
        title: "Refacción completa de cocina",
        image:
          "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 semana atrás",
      },
      {
        id: "hugo-oficina",
        title: "Adaptación de oficina en casa",
        image:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 mes atrás",
      },
    ],
  },
  {
    id: "tamara-gil",
    categoryId: "salud-bienestar",
    name: "Tamara Gil",
    title: "Entrenadora Funcional",
    summary: "Planes personalizados en casa o parque con seguimiento semanal.",
    rating: 4.9,
    reviews: 45,
    location: "Córdoba, Argentina",
    rate: {
      amount: 22,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80",
    bio: "Entrenadora certificada especializada en rutinas funcionales que se adaptan a tu nivel y agenda. Incluyo seguimiento de hábitos y recomendaciones de movilidad.",
    tags: ["Funcional", "Movilidad", "Seguimiento"],
    recentWorks: [
      {
        id: "tamara-grupo",
        title: "Programa express para equipo remoto",
        image:
          "https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=600&q=80",
        timeAgo: "4 días atrás",
      },
      {
        id: "tamara-personal",
        title: "Rutina personalizada post-operatoria",
        image:
          "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
  {
    id: "pablo-nunez",
    categoryId: "educacion-tutorias",
    name: "Pablo Núñez",
    title: "Profesor de Matemática Online",
    summary: "Clases dinámicas con material editable y seguimiento semanal.",
    rating: 4.8,
    reviews: 28,
    location: "Remoto",
    rate: {
      amount: 20,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80",
    bio: "Ayudo a estudiantes secundarios y universitarios a comprender matemática aplicada con ejemplos cercanos y ejercicios corregidos en vivo.",
    tags: ["Secundario", "Ingreso", "Clases online"],
    recentWorks: [
      {
        id: "pablo-parcial",
        title: "Preparación para parcial de álgebra",
        image:
          "https://images.unsplash.com/photo-1513258496099-48168024aec0?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 semanas atrás",
      },
      {
        id: "pablo-apoyo",
        title: "Acompañamiento anual tercer año",
        image:
          "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 mes atrás",
      },
    ],
  },
  {
    id: "sofia-vidal",
    categoryId: "belleza-estetica",
    name: "Sofía Vidal",
    title: "Estilista Integral & Nail Artist",
    summary: "Servicios a domicilio con productos hipoalergénicos premium.",
    rating: 4.9,
    reviews: 37,
    location: "Rosario, Argentina",
    rate: {
      amount: 25,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    bio: "Ofrezco estilismo completo para eventos, sesiones de maquillaje y nail art personalizado. Llevo todos los materiales y desinfección garantizada.",
    tags: ["Makeup", "Peinados", "Nail art"],
    recentWorks: [
      {
        id: "sofia-boda",
        title: "Producción para boda civil",
        image:
          "https://images.unsplash.com/photo-1524230572899-a752b3835840?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 semana atrás",
      },
      {
        id: "sofia-shooting",
        title: "Peinados para shooting editorial",
        image:
          "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
  {
    id: "leonel-dj",
    categoryId: "eventos-entretenimiento",
    name: "Leonel DJ",
    title: "DJ para Eventos Privados",
    summary: "Playlists personalizadas y sonido profesional para cada fiesta.",
    rating: 4.7,
    reviews: 19,
    location: "Buenos Aires, Argentina",
    rate: {
      amount: 50,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-432537dc763e?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1533130072444-1030cf1af53d?auto=format&fit=crop&w=900&q=80",
    bio: "Me encargo de musicalizar eventos sociales, cumpleaños y after offices. Llevo cabina, luces básicas y coordino previamente estilos musicales.",
    tags: ["Eventos", "Playlists", "Audio"],
    recentWorks: [
      {
        id: "leo-casamiento",
        title: "DJ casamiento íntimo",
        image:
          "https://images.unsplash.com/photo-1521337580396-0259d9ef2a58?auto=format&fit=crop&w=600&q=80",
        timeAgo: "4 días atrás",
      },
      {
        id: "leo-after",
        title: "After office corporativo",
        image:
          "https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 semanas atrás",
      },
    ],
  },
  {
    id: "mariana-torres",
    categoryId: "legales-contables",
    name: "Mariana Torres",
    title: "Abogada Laboral",
    summary: "Asesoría express por videollamada con pasos claros para reclamos.",
    rating: 5,
    reviews: 16,
    location: "Buenos Aires, Argentina",
    rate: {
      amount: 40,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1454166155302-ef4863c27e70?auto=format&fit=crop&w=900&q=80",
    bio: "Brindo asesoría laboral ágil para empleados y pymes. Analizo cada caso y defino próximos pasos con documentación clara.",
    tags: ["Consultoría", "Reclamos", "Videollamada"],
    recentWorks: [
      {
        id: "mariana-indemnizacion",
        title: "Revisión de acuerdo de indemnización",
        image:
          "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 semana atrás",
      },
      {
        id: "mariana-pyme",
        title: "Capacitación normativa para pyme",
        image:
          "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 mes atrás",
      },
    ],
  },
  {
    id: "carlos-perez",
    categoryId: "transporte-mensajeria",
    name: "Carlos Pérez",
    title: "Fletes y Mudanzas Chicas",
    summary: "Traslados puerta a puerta con asistencia de carga incluida.",
    rating: 4.8,
    reviews: 48,
    location: "GBA, Argentina",
    rate: {
      amount: 30,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1529429617124-aee4bd53ba2d?auto=format&fit=crop&w=900&q=80",
    bio: "Servicio de fletes para mudanzas chicas, entregas de muebles y traslados especiales. Incluye mantas y elementos de sujeción.",
    tags: ["Mudanzas", "Logística", "Embalaje"],
    recentWorks: [
      {
        id: "carlos-mudanza",
        title: "Mudanza depto. 2 ambientes",
        image:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=600&q=80",
        timeAgo: "5 días atrás",
      },
      {
        id: "carlos-oficina",
        title: "Traslado de mobiliario de oficina",
        image:
          "https://images.unsplash.com/photo-1529429617124-aee4bd53ba2d?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
  {
    id: "brenda-pets",
    categoryId: "mascotas-animales",
    name: "Brenda Pets",
    title: "Paseadora y Cuidadora",
    summary: "Guardería de fin de semana y paseos diarios con reportes.",
    rating: 4.9,
    reviews: 52,
    location: "Palermo, Argentina",
    rate: {
      amount: 15,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80",
    bio: "Cuido mascotas en casa y ofrezco paseos personalizados según energía y edad. Envío fotos y reportes después de cada salida.",
    tags: ["Paseos", "Guardería", "Envío de reportes"],
    recentWorks: [
      {
        id: "brenda-paseos",
        title: "Paseos diarios border collie",
        image:
          "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 días atrás",
      },
      {
        id: "brenda-cat",
        title: "Cuidado de gato senior",
        image:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=600&q=80",
        timeAgo: "2 semanas atrás",
      },
    ],
  },
  {
    id: "laura-clean",
    categoryId: "limpieza-hogar",
    name: "Laura Clean",
    title: "Limpieza y Organización",
    summary: "Servicios por hora con productos incluidos y foco en detalles.",
    rating: 4.8,
    reviews: 40,
    location: "Vicente López, Argentina",
    rate: {
      amount: 14,
      currency: "USD",
      unit: "hora",
    },
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=80",
    heroImage:
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
    bio: "Organizo espacios y realizo limpieza profunda de ambientes chicos y medianos. Llevo mis productos y herramientas de trabajo.",
    tags: ["Limpieza", "Organización", "Productos incluidos"],
    recentWorks: [
      {
        id: "laura-profunda",
        title: "Limpieza profunda post mudanza",
        image:
          "https://images.unsplash.com/photo-1581579186989-07f9049f9c37?auto=format&fit=crop&w=600&q=80",
        timeAgo: "1 semana atrás",
      },
      {
        id: "laura-armario",
        title: "Organización de vestidor",
        image:
          "https://images.unsplash.com/photo-1616628182503-65b28d61f60b?auto=format&fit=crop&w=600&q=80",
        timeAgo: "3 semanas atrás",
      },
    ],
  },
];
