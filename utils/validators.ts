/**
 * Utility validation helpers shared across authentication flows.
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export interface PasswordValidationResult extends ValidationResult {
  strength: number; // value between 0 and 1
  unmetRequirements: string[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FULL_NAME_REGEX = /^[A-Za-zÀ-ÿ'\s]{3,}$/;
const USERNAME_REGEX = /^(?=.{3,20}$)[a-zA-Z0-9._-]+$/;
const PHONE_REGEX = /^\+?[0-9()\s-]{7,}$/;

export const isValidEmail = (email: string): ValidationResult => {
  if (!email?.trim()) {
    return { valid: false, error: "El correo electrónico es obligatorio" };
  }

  if (!EMAIL_REGEX.test(email.trim())) {
    return { valid: false, error: "Ingresa un correo electrónico válido" };
  }

  return { valid: true };
};

export const isValidFullName = (fullName: string): ValidationResult => {
  if (!fullName?.trim()) {
    return { valid: false, error: "El nombre completo es obligatorio" };
  }

  if (!FULL_NAME_REGEX.test(fullName.trim())) {
    return {
      valid: false,
      error: "Ingresa nombre y apellido usando solo letras",
    };
  }

  if (!fullName.trim().includes(" ")) {
    return {
      valid: false,
      error: "Incluye al menos un apellido",
    };
  }

  return { valid: true };
};

export const isValidUsername = (username: string): ValidationResult => {
  if (!username?.trim()) {
    return { valid: false, error: "El nombre de usuario es obligatorio" };
  }

  if (!USERNAME_REGEX.test(username.trim())) {
    return {
      valid: false,
      error:
        "Usa entre 3 y 20 caracteres, solo letras, números, puntos o guiones",
    };
  }

  return { valid: true };
};

export const isValidPhone = (phone: string): ValidationResult => {
  if (!phone?.trim()) {
    return { valid: false, error: "El teléfono es obligatorio" };
  }

  if (!PHONE_REGEX.test(phone.trim())) {
    return {
      valid: false,
      error: "Ingresa un teléfono válido incluyendo código de país",
    };
  }

  return { valid: true };
};

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      valid: false,
      error: "La contraseña es obligatoria",
      strength: 0,
      unmetRequirements: [
        "Debe tener al menos 8 caracteres",
        "Debe incluir mayúsculas y minúsculas",
        "Debe incluir un número",
        "Debe incluir un carácter especial",
      ],
    };
  }

  const requirements: { test: RegExp; message: string }[] = [
    { test: /.{8,}/, message: "Debe tener al menos 8 caracteres" },
    { test: /[A-Z]/, message: "Incluye al menos una mayúscula" },
    { test: /[a-z]/, message: "Incluye al menos una minúscula" },
    { test: /[0-9]/, message: "Incluye al menos un número" },
    { test: /[^A-Za-z0-9]/, message: "Incluye un carácter especial" },
  ];

  const unmetRequirements = requirements
    .filter(({ test }) => !test.test(password))
    .map(({ message }) => message);

  const strength = 1 - unmetRequirements.length / requirements.length;

  return {
    valid: unmetRequirements.length === 0,
    error:
      unmetRequirements.length === 0
        ? undefined
        : "La contraseña no cumple con todos los requisitos",
    strength,
    unmetRequirements,
  };
};
