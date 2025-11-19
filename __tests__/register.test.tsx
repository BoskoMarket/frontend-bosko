import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import RegisterView from "@/app/login/RegisterView";
import { router } from "expo-router";

const mockRegisterUser = jest.fn();
const mockCheckEmailAvailability = jest.fn();
const mockCheckUsernameAvailability = jest.fn();
const mockIsPhoneUnique = jest.fn();

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    registerUser: mockRegisterUser,
    checkEmailAvailability: mockCheckEmailAvailability,
    checkUsernameAvailability: mockCheckUsernameAvailability,
    isPhoneUnique: mockIsPhoneUnique,
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
    mockCheckEmailAvailability.mockResolvedValue(true);
    mockCheckUsernameAvailability.mockResolvedValue(true);
    mockIsPhoneUnique.mockResolvedValue(true);
  });

  it("permite completar el carrusel y registrar al usuario", async () => {
    mockRegisterUser.mockResolvedValueOnce({});

    const { getByPlaceholderText, getByText } = render(
      <RegisterView toLogin={jest.fn()} />
    );

    fireEvent.changeText(
      getByPlaceholderText("nombre@ejemplo.com"),
      "nuevo@bosko.com"
    );
    fireEvent.changeText(
      getByPlaceholderText("Nombre y apellido"),
      "Nuevo Usuario"
    );

    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    await waitFor(() =>
      expect(mockCheckEmailAvailability).toHaveBeenCalledWith("nuevo@bosko.com")
    );

    fireEvent.changeText(getByPlaceholderText("tu_usuario"), "nuevoUsuario");
    fireEvent.changeText(getByPlaceholderText("Ej. Argentina"), "Argentina");

    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    await waitFor(() =>
      expect(mockCheckUsernameAvailability).toHaveBeenCalledWith("nuevoUsuario")
    );

    fireEvent.changeText(
      getByPlaceholderText("Dónde vives actualmente"),
      "Argentina"
    );
    fireEvent.changeText(
      getByPlaceholderText("+54 11 1234 5678"),
      "+54 11 2222 3333"
    );

    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    await waitFor(() =>
      expect(mockIsPhoneUnique).toHaveBeenCalledWith("+54 11 2222 3333")
    );

    fireEvent.changeText(
      getByPlaceholderText("Mínimo 8 caracteres"),
      "Password1!"
    );
    fireEvent.changeText(
      getByPlaceholderText("Repite tu contraseña"),
      "Password1!"
    );

    await act(async () => {
      fireEvent.press(getByText("Crear cuenta"));
    });

    await waitFor(() =>
      expect(mockRegisterUser).toHaveBeenCalledWith({
        email: "nuevo@bosko.com",
        fullName: "Nuevo Usuario",
        username: "nuevoUsuario",
        nationality: "Argentina",
        countryOfResidence: "Argentina",
        phone: "+54 11 2222 3333",
        password: "Password1!",
      })
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith("/login/termsAndConditions")
    );
  });

  it("muestra mensajes cuando el correo ya está registrado", async () => {
    mockCheckEmailAvailability.mockResolvedValueOnce(false);

    const { getByPlaceholderText, getByText, findByText } = render(
      <RegisterView toLogin={jest.fn()} />
    );

    fireEvent.changeText(
      getByPlaceholderText("nombre@ejemplo.com"),
      "repetido@bosko.com"
    );
    fireEvent.changeText(
      getByPlaceholderText("Nombre y apellido"),
      "Usuario Existente"
    );

    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });

    expect(
      await findByText("Este correo electrónico ya está registrado")
    ).toBeTruthy();
    expect(mockRegisterUser).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});
