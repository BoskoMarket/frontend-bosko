const { AndroidConfig, withAndroidColors, withAndroidColorsNight } = require('@expo/config-plugins');

const LIGHT_CROP_COLORS = {
  expoCropToolbarColor: '#FFFFFF',
  expoCropToolbarIconColor: '#000000',
  expoCropToolbarActionTextColor: '#000000',
  expoCropBackButtonIconColor: '#000000',
};

const DARK_CROP_COLORS = {
  expoCropToolbarColor: '#000000',
  expoCropToolbarIconColor: '#FFFFFF',
  expoCropToolbarActionTextColor: '#FFFFFF',
  expoCropBackButtonIconColor: '#FFFFFF',
};

function applyCropColors(config, colors) {
  const resources = config.modResults.resources ?? (config.modResults.resources = {});
  const existing = resources.color ?? [];

  resources.color = existing.filter(
    (item) => !Object.prototype.hasOwnProperty.call(colors, item.$?.name),
  );

  for (const [name, value] of Object.entries(colors)) {
    const color = AndroidConfig.Resources.buildResourceItem({ name, value });
    AndroidConfig.Colors.setColorItem(color, config.modResults);
  }

  return config;
}

module.exports = function withImagePickerCropColors(config) {
  config = withAndroidColors(config, (config) => applyCropColors(config, LIGHT_CROP_COLORS));
  return withAndroidColorsNight(config, (config) => applyCropColors(config, DARK_CROP_COLORS));
};
