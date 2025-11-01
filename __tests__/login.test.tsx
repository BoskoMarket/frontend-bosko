import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import LogInView from "@/app/login/LogInView";
import { router } from "expo-router";

const mockLogin = jest.fn();

jest.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
  }),
}));

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));

describe("LogInView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("permite iniciar sesión y navegar al área protegida", async () => {
    mockLogin.mockResolvedValueOnce({});

    const { getByTestId, getByText } = render(
      <LogInView toLogin={jest.fn()} />
    );

    fireEvent.changeText(getByTestId("login-email"), "user@example.com");
    fireEvent.changeText(getByTestId("login-password"), "Password1!");

    await act(async () => {
      fireEvent.press(getByText("Iniciar sesión"));
    });

    await waitFor(() =>
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Password1!",
      })
    );

    await waitFor(() => expect(router.replace).toHaveBeenCalledWith("/(tabs)"));
  });

  it("muestra mensajes de error cuando el backend falla", async () => {
    mockLogin.mockRejectedValueOnce(new Error("Credenciales inválidas"));

    const { getByTestId, getByText, findByText } = render(
      <LogInView toLogin={jest.fn()} />
    );

    fireEvent.changeText(getByTestId("login-email"), "user@example.com");
    fireEvent.changeText(getByTestId("login-password"), "Password1!");

    await act(async () => {
      fireEvent.press(getByText("Iniciar sesión"));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());

    expect(
      await findByText(
        "No se pudo iniciar sesión, usuario o contraseña incorrectos"
      )
    ).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
