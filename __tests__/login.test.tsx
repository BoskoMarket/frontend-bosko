import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import LogInView from "@/features/auth/screens/LogInView";
import { router } from "expo-router";

const mockLogin = jest.fn();
const mockClearError = jest.fn();

jest.mock("@/features/auth/state/AuthContext", () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
    clearError: mockClearError,
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
    jest.useFakeTimers();
  });

  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it("permite iniciar sesión y navegar al área protegida", async () => {
    mockLogin.mockResolvedValueOnce({});

    const { getByTestId, getByText } = render(
      <LogInView toRegister={jest.fn()} />
    );

    fireEvent.changeText(getByTestId("login-email"), "user@example.com");
    fireEvent.changeText(getByTestId("login-password"), "Password1!");

    await act(async () => {
      fireEvent.press(getByText("Ingresar"));
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
    mockLogin.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { code: "INVALID_CREDENTIALS", message: "Invalid credentials", statusCode: 401 },
      },
    });

    const { getByTestId, getByText, findByText } = render(
      <LogInView toRegister={jest.fn()} />
    );

    fireEvent.changeText(getByTestId("login-email"), "user@example.com");
    fireEvent.changeText(getByTestId("login-password"), "Password1!");

    await act(async () => {
      fireEvent.press(getByText("Ingresar"));
    });

    await waitFor(() => expect(mockLogin).toHaveBeenCalled());

    expect(await findByText("Email o contraseña incorrectos")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
  });
});
