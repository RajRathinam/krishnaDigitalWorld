import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = () => {
  const coreScheme = useColorSchemeCore();
  if (!coreScheme || (coreScheme as string) === 'unspecified') {
    return 'light';
  }
  return coreScheme;
};
