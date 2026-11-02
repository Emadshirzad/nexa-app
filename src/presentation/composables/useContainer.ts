import { getAppContainer, type AppContainer } from '@/app/providers/container';

export function useContainer(): AppContainer {
  return getAppContainer();
}
