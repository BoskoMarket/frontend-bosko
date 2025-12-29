const tintColorLight = '#2f95dc';
const tintColorDark = '#fff';

const Colors = {
  light: {
    text: '#000',
    background: '#fff',
    tint: tintColorLight,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#fff',
    background: '#000',
    tint: tintColorDark,
    tabIconDefault: '#ccc',
    tabIconSelected: tintColorDark,
  },

  title: {
    fontSize: 30,
    fontFamily: 'Poppins_500Medium',
    color: '#000',
    textAlign: 'center',
    marginBottom: 10,
  },
  colorPrimary: '#850221',
  colorPrimaryDark: '#5c0117',
  white: '#FFFFFF',

  // Premium Theme (Bosko Gold & Dark)
  premium: {
    background: '#0f0f0f',
    card: '#1e1e1e', // Lighter dark for cards
    gold: '#FFD700', // Classic Gold
    goldLight: 'rgba(255, 215, 0, 0.1)', // Tint for backgrounds
    goldBorder: 'rgba(255, 215, 0, 0.2)',
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.7)',
    textTertiary: 'rgba(255, 255, 255, 0.4)',
    borderSubtle: 'rgba(255, 255, 255, 0.1)',
    inputBackground: 'rgba(255, 255, 255, 0.05)',
    shadows: {
      small: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 2,
      },
      medium: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.30,
        shadowRadius: 4.65,
        elevation: 8,
      },
      large: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 20,
      },
      gold: {
        shadowColor: "#FFD700",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 16,
      },
      global: {
        shadowColor: "#000",
        shadowOffset: { width: 6, height: 2 },
        shadowOpacity: 0.7,
        shadowRadius: 5,
        elevation: 15, // High elevation for Android depth
      }
    }
  }
};

export default Colors;
