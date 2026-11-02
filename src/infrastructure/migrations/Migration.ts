import type { IDatabaseDriver } from '../database/IDatabaseDriver';

export interface Migration {
  version: number;
  name: string;
  up: (driver: IDatabaseDriver) => Promise<void>;
}
