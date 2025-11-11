import "whatwg-fetch";
import "@testing-library/jest-native/extend-expect";

import { mockFetch, resetDb } from "./tests/mockApi";

const originalConsoleError = console.error;

beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation((message?: unknown, ...rest) => {
    if (typeof message === "string" && message.includes("not wrapped in act")) {
      return;
    }
    originalConsoleError.call(console, message as any, ...rest);
  });
});

afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

const mockRouter = { push: jest.fn(), back: jest.fn() };
let mockParams: Record<string, any> = {};

(globalThis as any).__router = {
  router: mockRouter,
  setParams: (next: Record<string, any>) => {
    mockParams = next;
  },
  getParams: () => mockParams,
};

jest.mock("expo-router", () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
  Stack: { Screen: ({ children }: { children?: React.ReactNode }) => children ?? null },
}));

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    MotiView: ({ children, ...props }: any) => React.createElement(View, props, children),
  };
});

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock("@/services/service", () => ({
  getMyServices: jest.fn().mockResolvedValue([]),
  createService: jest.fn().mockImplementation(async (payload) => ({
    id: "mock-service",
    ...payload,
  })),
  updateService: jest.fn().mockImplementation(async (id: string, updates) => ({
    id,
    ...updates,
  })),
  deleteService: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@/context/AuthContext", () => {
  const React = require("react");
  const defaultValue = {
    login: jest.fn(),
    register: jest.fn(),
    isLoading: false,
    error: null,
    accessToken: null,
    refreshToken: null,
    authLoaded: true,
    authState: {
      token: null,
      refreshToken: null,
      userEmail: "demo@bosko.app",
      user: { id: "user-1", name: "Alicia Cliente" },
    },
    user: { id: "user-1", name: "Alicia Cliente" },
    logout: jest.fn(),
  };
  const AuthContext = React.createContext(defaultValue);
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => (
      React.createElement(AuthContext.Provider, { value: defaultValue }, children)
    ),
    useAuth: () => React.useContext(AuthContext),
  };
});

(globalThis as any).fetch = jest.fn(mockFetch);

afterEach(() => {
  resetDb();
  mockRouter.push.mockClear();
  mockRouter.back.mockClear();
  (globalThis as any).__router.setParams({});
});
