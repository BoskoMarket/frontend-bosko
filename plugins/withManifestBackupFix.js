const { withAndroidManifest } = require('@expo/config-plugins');

// expo-secure-store sets android:dataExtractionRules / android:fullBackupContent on
// <application>, and com.reown:sign (WalletConnect, pulled in by the didit KYC SDK)
// ships its own conflicting values for the same attributes. tools:replace forces ours.
module.exports = function withManifestBackupFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    manifest['$']['xmlns:tools'] = 'http://schemas.android.com/tools';

    const application = manifest.application[0];
    const existing = application['$']['tools:replace'];
    const needed = ['android:dataExtractionRules', 'android:fullBackupContent'];
    const merged = new Set((existing ? existing.split(',') : []).concat(needed));
    application['$']['tools:replace'] = Array.from(merged).join(',');

    return config;
  });
};
