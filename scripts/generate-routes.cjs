// Expo Router's generator shipped with the installed SDK; same source as Metro.
const fs = require('node:fs');
const path = require('node:path');
process.env.EXPO_ROUTER_APP_ROOT = path.resolve('app');
const target = path.resolve('.expo/types');
fs.mkdirSync(target, { recursive: true });
require('expo-router/build/typed-routes').regenerateDeclarations(target);
