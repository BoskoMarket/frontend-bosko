/**
 * Service form validation rules, mirroring the backend CreateServiceDto / UpdateServiceDto.
 * The server stays the authority; this only surfaces the known limits before submit.
 */
export const TITLE_MIN = 10;
export const TITLE_MAX = 255;
export const DESCRIPTION_MIN = 20;

export type ServiceFormFieldErrors = {
  title?: string;
  description?: string;
};

export function validateServiceFields(input: { title: string; description: string }): ServiceFormFieldErrors {
  const errors: ServiceFormFieldErrors = {};
  const title = input.title.trim();
  const description = input.description.trim();

  if (!title) {
    errors.title = "El título es obligatorio.";
  } else if (title.length < TITLE_MIN) {
    errors.title = `El título debe tener al menos ${TITLE_MIN} caracteres.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `El título no puede superar los ${TITLE_MAX} caracteres.`;
  }

  if (description.length < DESCRIPTION_MIN) {
    errors.description = `La descripción debe tener al menos ${DESCRIPTION_MIN} caracteres.`;
  }

  return errors;
}
