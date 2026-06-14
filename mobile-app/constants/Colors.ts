const tintColorLight = '#FFC107'; // Accent (Golden Yellow)
const tintColorDark = '#FFC107';

export default {
  light: {
    text: '#212529', // Dark Gray Foreground
    background: '#F8F9FA', // Off-white Background
    tint: tintColorLight,
    tabIconDefault: '#DEE2E6', // Border color for inactive
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F8F9FA',
    background: '#212529',
    tint: tintColorDark,
    tabIconDefault: '#DEE2E6',
    tabIconSelected: tintColorDark,
  },
};
