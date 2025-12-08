import { Category } from "./category";
import { Provider } from "./provider";
import { Service } from "./service";

export interface SearchResponse {
  query: string;
  services?: Service[];
  providers?: Provider[];
  categories?: Category[];
  // TODO: confirmar con backend estructura exacta de resultados de búsqueda
}
