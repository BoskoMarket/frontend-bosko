import "react-native-gesture-handler/jestSetup";
process.env.EXPO_PUBLIC_API_URL = 'https://example.test/api/v1';

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

definePropertyOnGlobal("TextEncoder", () => require("util").TextEncoder);

definePropertyOnGlobal("TextDecoder", () => require("util").TextDecoder);

jest.mock("expo-image", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    Image: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock("expo-blur", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    BlurView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock("expo-linear-gradient", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    LinearGradient: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

jest.mock("moti", () => {
  const React = require("react");
  const { View } = require("react-native");
  return {
    AnimatePresence: ({ children }: { children: React.ReactNode }) =>
      React.createElement(React.Fragment, null, children),
    MotiView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

function definePropertyOnGlobal(key: string, getter: () => any) {
  if (!(global as any)[key]) {
    Object.defineProperty(global, key, {
      configurable: true,
      get: getter,
    });
  }
}

jest.mock("@react-native-community/netinfo", () =>
  require("@react-native-community/netinfo/jest/netinfo-mock.js")
);
