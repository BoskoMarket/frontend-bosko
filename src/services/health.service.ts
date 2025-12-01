import http from "../lib/http";

export async function getAppHealth() {
  const { data } = await http.get("/");
  return data;
}
