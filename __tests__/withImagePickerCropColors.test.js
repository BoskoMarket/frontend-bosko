const withImagePickerCropColors = require('../plugins/withImagePickerCropColors');

function colorDocument() {
  return {
    resources: {
      color: [
        { $: { name: 'appAccent' }, _: '#123456' },
        { $: { name: 'expoCropToolbarColor' }, _: '#00000000' },
        { $: { name: 'expoCropToolbarColor' }, _: '#FF000000' },
        { $: { name: 'expoCropToolbarActionTextColor' }, _: '#000000' },
        { $: { name: 'expoCropBackgroundColor' }, _: '#FFFFFF' },
      ],
      string: [{ $: { name: 'app_name' }, _: 'Bosko' }],
    },
  };
}

async function runColorMod(config, modName, modResults) {
  const mod = config.mods.android[modName];
  const result = await mod({
    ...config,
    modResults,
    modRequest: { projectRoot: process.cwd() },
  });
  return result.modResults;
}

describe('withImagePickerCropColors', () => {
  it.each([
    ['colors', {
      expoCropToolbarColor: '#FFFFFF',
      expoCropToolbarIconColor: '#000000',
      expoCropToolbarActionTextColor: '#000000',
      expoCropBackButtonIconColor: '#000000',
    }],
    ['colorsNight', {
      expoCropToolbarColor: '#000000',
      expoCropToolbarIconColor: '#FFFFFF',
      expoCropToolbarActionTextColor: '#FFFFFF',
      expoCropBackButtonIconColor: '#FFFFFF',
    }],
  ])('overrides native crop colors in %s while preserving other resources', async (modName, expected) => {
    const config = withImagePickerCropColors({
      name: 'CropColorTest',
      slug: 'crop-color-test',
      mods: { android: { colors: (value) => value, colorsNight: (value) => value } },
    });

    const result = await runColorMod(config, modName, colorDocument());
    const colors = result.resources.color;

    for (const [name, value] of Object.entries(expected)) {
      const matching = colors.filter((item) => item.$.name === name);
      expect(matching).toHaveLength(1);
      expect(matching[0]._).toBe(value);
    }

    expect(colors.find((item) => item.$.name === 'appAccent')).toEqual({ $: { name: 'appAccent' }, _: '#123456' });
    expect(colors.find((item) => item.$.name === 'expoCropBackgroundColor')._).toBe('#FFFFFF');
    expect(result.resources.string).toEqual([{ $: { name: 'app_name' }, _: 'Bosko' }]);

    const repeated = await runColorMod(config, modName, result);
    expect(repeated.resources.color).toEqual(colors);
  });
});
