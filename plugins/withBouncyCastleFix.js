const { withAppBuildGradle } = require('@expo/config-plugins');

// expo-updates pulls org.bouncycastle:bcutil-jdk15to18 (transitively bcprov-jdk15to18),
// while @didit-protocol/sdk-react-native pulls bcprov-jdk18on. Both jars ship the same
// org.bouncycastle classes, which fails :app:checkReleaseDuplicateClasses.
const EXCLUDE_BLOCK = `
configurations.all {
    exclude group: 'org.bouncycastle', module: 'bcprov-jdk15to18'
    exclude group: 'org.bouncycastle', module: 'bcutil-jdk15to18'
    exclude group: 'org.bouncycastle', module: 'bcpkix-jdk15to18'
}

android {
    packagingOptions {
        resources {
            excludes += ['META-INF/versions/9/OSGI-INF/MANIFEST.MF']
        }
    }
}
`;

module.exports = function withBouncyCastleFix(config) {
  return withAppBuildGradle(config, (config) => {
    if (!config.modResults.contents.includes("module: 'bcprov-jdk15to18'")) {
      config.modResults.contents += EXCLUDE_BLOCK;
    }
    return config;
  });
};
