import { rankResults } from "@/src/shared/utils/ranking";
import { Service, User } from "@/src/types";

describe("rankResults", () => {
  const users: User[] = [
    { id: "u1", name: "Ana", avatar: "", bio: "", zone: "" },
    { id: "u2", name: "Bruno", avatar: "", bio: "", zone: "" },
  ];
  const services: Service[] = [
    {
      id: "s1",
      userId: "u1",
      name: "Clases de Yoga",
      description: "Yoga en casa",
      price: 100,
      area: "",
      availability: "",
      keywords: ["yoga"],
      photos: [],
    },
    {
      id: "s2",
      userId: "u2",
      name: "Jardinería",
      description: "Plantas",
      price: 100,
      area: "",
      availability: "",
      keywords: ["plantas"],
      photos: [],
    },
  ];

  it("prioriza coincidencia en nombre de usuario", () => {
    const results = rankResults(users, services, "ana");
    expect(results[0].user.name).toBe("Ana");
  });

  it("devuelve vacío si no hay coincidencias", () => {
    expect(rankResults(users, services, "zzz")).toEqual([]);
  });
});
