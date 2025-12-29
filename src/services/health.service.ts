import api from "@/core/api/axiosinstance";


export async function getAppHealth() {
  const { data } = await api.get("/");
  return data;
}
