import { createTheme, type ThemeOptions } from '@mui/material/styles';

const brand = {
  orange: '#E8895A',
  green: '#4C9A6E',
  gold: '#D6A44A',
};

const shared: ThemeOptions = {
  shape: { borderRadius: 14 },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 700 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12 },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: { borderRadius: 16 },
      },
    },
  },
};

export function buildTheme(mode: 'light' | 'dark') {
  const isDark = mode === 'dark';
  return createTheme({
    ...shared,
    palette: {
      mode,
      primary: { main: brand.orange, contrastText: '#fff' },
      secondary: { main: brand.green, contrastText: '#fff' },
      warning: { main: brand.gold },
      background: isDark
        ? { default: '#15130F', paper: '#1F1C17' }
        : { default: '#FFF9F3', paper: '#FFFFFF' },
      text: isDark
        ? { primary: '#F5EFE6', secondary: '#C9BFAF' }
        : { primary: '#2B2620', secondary: '#6B6055' },
    },
  });
}

// Chart tooltip styling helper (used by Recharts <Tooltip contentStyle=... />)
export function chartTooltipStyle(mode: 'light' | 'dark') {
  return {
    backgroundColor: mode === 'dark' ? '#26221C' : '#FFFFFF',
    border: `1px solid ${mode === 'dark' ? '#3A3428' : '#E7DFD2'}`,
    borderRadius: 10,
    color: mode === 'dark' ? '#F5EFE6' : '#2B2620',
    fontSize: 13,
  };
}

export const CHART_COLORS = [brand.orange, brand.green, brand.gold, '#4A7FBF', '#9B6BB0', '#C25B5B', '#5A8FA0', '#8B5E3C'];

export const BRAND = brand;
