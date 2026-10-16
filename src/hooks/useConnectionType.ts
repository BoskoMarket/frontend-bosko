import { useNetInfo } from '@react-native-community/netinfo';

/** Current connection type (`wifi`, `cellular`, `unknown`, `none`, ...). */
export function useConnectionType(): string {
  return useNetInfo().type;
}
