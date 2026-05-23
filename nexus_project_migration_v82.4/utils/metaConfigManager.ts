import type { MetaConfig } from '../types';
import { saveJson } from './fs';

/**
 * Manages the collection of MetaConfig objects.
 * This can be expanded to include more complex logic for updating,
 * merging, or evolving configurations.
 */
class MetaConfigManager {
  private configs: MetaConfig[];

  constructor(initialConfigs: MetaConfig[]) {
    this.configs = initialConfigs;
  }

  /**
   * Returns all current configurations.
   */
  public getAllConfigs(): MetaConfig[] {
    return this.configs;
  }

  /**
   * Adds a new configuration to the collection.
   * @param config - The MetaConfig to add.
   */
  public addConfig(config: MetaConfig): void {
    this.configs.push(config);
  }

  /**
   * Exports the current set of configurations to a JSON file.
   * @param filename - The name for the downloaded file.
   */
  public exportConfigs(filename: string = 'meta-configs.json'): void {
    saveJson(filename, this.configs);
  }
}

export default MetaConfigManager;
