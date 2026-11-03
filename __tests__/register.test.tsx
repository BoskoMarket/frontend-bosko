import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import RegisterView from "@/features/auth/screens/RegisterView";
import { router } from "expo-router";

const mockRegisterUser = jest.fn();
const mockClearError = jest.fn();

jest.mock("@/features/auth/state/AuthContext", () => ({
  useAuth: () => ({
    registerUser: mockRegisterUser,
    isLoading: false,
    error: null,
    clearError: mockClearError,
  }),
}));

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

describe("RegisterView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it("permite completar los 4 pasos y registrar al usuario", async () => {
    mockRegisterUser.mockResolvedValueOnce({});

    const { getByPlaceholderText, getByText, getAllByText } = render(
      <RegisterView toRegister={jest.fn()} />
    );

    // Paso 1: Nombre
    fireEvent.changeText(getByPlaceholderText("Tu nombre"), "Nuevo");
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    // Paso 2: Apellido
    fireEvent.changeText(getByPlaceholderText("Tu apellido"), "Usuario");
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    // Paso 3: Email
    fireEvent.changeText(
      getByPlaceholderText("tucorreo@ejemplo.com"),
      "nuevo@bosko.com"
    );
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    // Paso 4: Contraseña
    fireEvent.changeText(
      getByPlaceholderText("Mínimo 8 caracteres"),
      "Password1!"
    );
    await act(async () => {
      fireEvent.press(getAllByText("Crear cuenta")[1]);
    });

    await waitFor(() =>
      expect(mockRegisterUser).toHaveBeenCalledWith({
        firstName: "Nuevo",
        lastName: "Usuario",
        email: "nuevo@bosko.com",
        password: "Password1!",
      })
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/auth/verify-email",
        params: { email: "nuevo@bosko.com" },
      })
    );
  });

  it("enlaza los términos y condiciones solo en el último paso", async () => {
    const { getByPlaceholderText, getByText, queryByText } = render(
      <RegisterView toRegister={jest.fn()} />
    );
    expect(queryByText("Términos y condiciones")).toBeNull();

    const steps: [string, string][] = [
      ["Tu nombre", "Nuevo"],
      ["Tu apellido", "Usuario"],
      ["tucorreo@ejemplo.com", "nuevo@bosko.com"],
    ];
    for (const [placeholder, value] of steps) {
      fireEvent.changeText(getByPlaceholderText(placeholder), value);
      await act(async () => {
        fireEvent.press(getByText("Siguiente"));
      });
    }

    expect(getByText(/Al registrarte aceptás los/)).toBeTruthy();
    fireEvent.press(getByText("Términos y condiciones"));
    expect(router.push).toHaveBeenCalledWith("/terms");
  });

  it("no avanza si el campo del paso actual está vacío", async () => {
    const { getByText, findByText } = render(
      <RegisterView toRegister={jest.fn()} />
    );

    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    expect(await findByText("Este campo es obligatorio")).toBeTruthy();
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("muestra el error del backend cuando falla el registro", async () => {
    mockRegisterUser.mockRejectedValueOnce({
      response: { data: { message: "El correo ya está registrado" } },
    });

    const { getByPlaceholderText, getByText, getAllByText } = render(
      <RegisterView toRegister={jest.fn()} />
    );

    fireEvent.changeText(getByPlaceholderText("Tu nombre"), "Nuevo");
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });
    fireEvent.changeText(getByPlaceholderText("Tu apellido"), "Usuario");
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });
    fireEvent.changeText(
      getByPlaceholderText("tucorreo@ejemplo.com"),
      "repetido@bosko.com"
    );
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });
    fireEvent.changeText(
      getByPlaceholderText("Mínimo 8 caracteres"),
      "Password1!"
    );
    await act(async () => {
      fireEvent.press(getAllByText("Crear cuenta")[1]);
    });

    await waitFor(() => expect(mockRegisterUser).toHaveBeenCalled());
    expect(router.replace).not.toHaveBeenCalled();
  });
});
