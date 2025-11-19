import "react-native-gesture-handler/jestSetup";

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
