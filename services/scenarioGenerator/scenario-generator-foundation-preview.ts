import {
  countLivingWorldItems,
  countLivingWorldLibraries,
  loadCharacterSimpleLibrary,
  loadLivingWorldCore,
  loadTimeSettingLibrary,
} from './scenario-generator-foundation.js';

export type ScenarioGeneratorFoundationPreview = {
  character_file_loaded: boolean;
  time_setting_file_loaded: boolean;
  living_world_file_loaded: boolean;
  character_count: number;
  time_setting_count: number;
  living_world_library_count: number;
  living_world_item_count: number;
};

export function buildScenarioGeneratorFoundationPreview(): ScenarioGeneratorFoundationPreview {
  const characterLibrary = loadCharacterSimpleLibrary();
  const timeSettingLibrary = loadTimeSettingLibrary();
  const livingWorldCore = loadLivingWorldCore();

  return {
    character_file_loaded: true,
    time_setting_file_loaded: true,
    living_world_file_loaded: true,
    character_count: characterLibrary.characters.length,
    time_setting_count: timeSettingLibrary.items.length,
    living_world_library_count: countLivingWorldLibraries(livingWorldCore),
    living_world_item_count: countLivingWorldItems(livingWorldCore),
  };
}
