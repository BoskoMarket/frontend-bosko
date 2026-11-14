import React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import RegisterView from "@/features/auth/screens/RegisterView";
import { router } from "expo-router";
import { TERMS_VERSION } from "@/core/config/terms";
import { DialogRoot } from "@/core/design-system";

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

const mockCities = jest.fn();
jest.mock("@/hooks/queries/useCitiesQuery", () => ({ useCitiesQuery: () => mockCities() }));
const CITIES = [
  { id: "tandil", name: "Tandil", countryCode: "AR", currency: "ARS", phonePrefix: "+54" },
  { id: "barranquilla", name: "Barranquilla", countryCode: "CO", currency: "COP", phonePrefix: "+57" },
];

jest.mock("expo-router", () => ({
  router: {
    push: jest.fn(),
    replace: jest.fn(),
  },
}));

async function fillUntilCityStep(api: ReturnType<typeof render>, email = "nuevo@bosko.com") {
  const { getByPlaceholderText, getByText } = api;
  const steps: [string, string][] = [
    ["Tu nombre", "Nuevo"],
    ["Tu apellido", "Usuario"],
    ["tucorreo@ejemplo.com", email],
    ["Mínimo 8 caracteres", "Password1!"],
  ];
  for (const [placeholder, value] of steps) {
    fireEvent.changeText(getByPlaceholderText(placeholder), value);
    await act(async () => {
      fireEvent.press(getByText("Siguiente"));
    });
  }
}

describe("RegisterView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCities.mockReturnValue({ data: CITIES, isPending: false, isError: false, refetch: jest.fn() });
    jest.useFakeTimers();
  });

  afterEach(() => { jest.clearAllTimers(); jest.useRealTimers(); });

  it("completa los 5 pasos y envía ciudad y aceptación de términos", async () => {
    mockRegisterUser.mockResolvedValueOnce({});
    const api = render(<RegisterView toRegister={jest.fn()} />);
    await fillUntilCityStep(api);

    fireEvent.press(api.getByText("Barranquilla"));
    fireEvent.press(api.getByLabelText("Acepto los términos y la política de privacidad"));
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    await waitFor(() =>
      expect(mockRegisterUser).toHaveBeenCalledWith({
        firstName: "Nuevo",
        lastName: "Usuario",
        email: "nuevo@bosko.com",
        password: "Password1!",
        cityId: "barranquilla",
        acceptedTerms: true,
        termsVersion: TERMS_VERSION,
      })
    );

    await waitFor(() =>
      expect(router.push).toHaveBeenCalledWith({
        pathname: "/auth/verify-email",
        params: { email: "nuevo@bosko.com" },
      })
    );
  });

  it("no registra sin ciudad ni términos y muestra un mensaje por campo", async () => {
    const api = render(<RegisterView toRegister={jest.fn()} />);
    await fillUntilCityStep(api);

    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    expect(api.getByText("Elige tu ciudad")).toBeTruthy();
    expect(api.getByText("Debes aceptar los términos y la política de privacidad")).toBeTruthy();
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("no registra con ciudad pero sin aceptar los términos", async () => {
    const api = render(<RegisterView toRegister={jest.fn()} />);
    await fillUntilCityStep(api);

    fireEvent.press(api.getByText("Tandil"));
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    expect(api.queryByText("Elige tu ciudad")).toBeNull();
    expect(api.getByText("Debes aceptar los términos y la política de privacidad")).toBeTruthy();
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("bloquea el envío y ofrece reintentar cuando falla la carga de ciudades", async () => {
    const refetch = jest.fn();
    mockCities.mockReturnValue({ data: undefined, isPending: false, isError: true, refetch });
    const api = render(<RegisterView toRegister={jest.fn()} />);
    await fillUntilCityStep(api);

    expect(api.getByText(/No pudimos cargar las ciudades/)).toBeTruthy();
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });
    expect(mockRegisterUser).not.toHaveBeenCalled();

    fireEvent.press(api.getByText("Reintentar"));
    expect(refetch).toHaveBeenCalled();
  });

  it("enlaza los términos solo en el último paso", async () => {
    const api = render(<RegisterView toRegister={jest.fn()} />);
    expect(api.queryByText("términos y la política de privacidad")).toBeNull();

    await fillUntilCityStep(api);

    fireEvent.press(api.getByText("términos y la política de privacidad"));
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
      isAxiosError: true,
      response: {
        status: 409,
        data: { success: false, statusCode: 409, code: "ACCOUNT_CONFLICT", message: "Conflict" },
      },
    });

    const api = render(<><RegisterView toRegister={jest.fn()} /><DialogRoot /></>);
    await fillUntilCityStep(api, "repetido@bosko.com");

    fireEvent.press(api.getByText("Tandil"));
    fireEvent.press(api.getByLabelText("Acepto los términos y la política de privacidad"));
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    await waitFor(() => expect(mockRegisterUser).toHaveBeenCalled());
    expect(api.queryByText(/todavía no está verificada/)).toBeNull();
    expect(api.getByText("Error")).toBeTruthy();
    expect(router.replace).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/auth/verify-email" }));
    fireEvent.press(api.getByText("OK"));
  });

  it("offers verification for EMAIL_ALREADY_IN_USE and opens it only after confirmation", async () => {
    mockRegisterUser.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { success: false, statusCode: 409, code: "EMAIL_ALREADY_IN_USE", message: "Email already in use" },
      },
    });
    const api = render(<><RegisterView toRegister={jest.fn()} /><DialogRoot /></>);
    await fillUntilCityStep(api, " Repetido@Ejemplo.com ");

    fireEvent.press(api.getByText("Barranquilla"));
    fireEvent.press(api.getByLabelText("Acepto los términos y la política de privacidad"));
    mockClearError.mockClear();
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    expect(mockRegisterUser).toHaveBeenCalledWith(expect.objectContaining({ email: "repetido@ejemplo.com" }));
    expect(api.getByText("Si tu cuenta todavía no está verificada, puedes solicitar un nuevo código de verificación.")).toBeTruthy();
    expect(router.push).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/auth/verify-email" }));
    expect(mockRegisterUser).toHaveBeenCalledTimes(1);
    expect(mockClearError).toHaveBeenCalled();

    fireEvent.press(api.getByText("Verificar correo"));
    expect(router.push).toHaveBeenCalledWith({
      pathname: "/auth/verify-email",
      params: { email: "repetido@ejemplo.com" },
    });
    expect(mockRegisterUser).toHaveBeenCalledTimes(1);
  });

  it("keeps the user on registration when canceling existing-account recovery", async () => {
    mockRegisterUser.mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        status: 409,
        data: { success: false, statusCode: 409, code: "EMAIL_ALREADY_IN_USE", message: "Email already in use" },
      },
    });
    const api = render(<><RegisterView toRegister={jest.fn()} /><DialogRoot /></>);
    await fillUntilCityStep(api, "repetido@bosko.com");

    fireEvent.press(api.getByText("Tandil"));
    fireEvent.press(api.getByLabelText("Acepto los términos y la política de privacidad"));
    await act(async () => {
      fireEvent.press(api.getAllByText("Crear cuenta")[1]);
    });

    fireEvent.press(api.getByText("Cancelar"));
    expect(router.push).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: "/auth/verify-email" }));
    expect(mockRegisterUser).toHaveBeenCalledTimes(1);
  });
});
