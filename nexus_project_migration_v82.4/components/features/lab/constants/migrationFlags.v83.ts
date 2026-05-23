/**
 * PR-00 SCAFFOLD — NOT IMPORTED BY RUNTIME.
 * Single Runtime Authority: lab.constants.ts APP_VERSION = "v82.6"
 * Wire-up begins PR-07+ per execution plan.
 */

export type CompatModeV83 = 'legacy_read' | 'dual_write' | 'v83_only';

export interface MigrationFlagsV83 {
  enable_v83_pipeline: boolean;
  enable_production_v83_write: boolean;
  enable_legacy_namespace_write: boolean;
  enable_legacy_view_adapter: boolean;
  enable_evidence_ledger: boolean;
  enable_synthetic_fill: boolean;
  enable_summary_calibration: boolean;
  enable_image_app_enrichment_ref: boolean;
  enable_stop_production_namespace_clone: boolean;
  compat_mode: CompatModeV83;
}

/** v82.6 behavior preserved — all v83 paths OFF */
export const MIGRATION_FLAGS_V83_DEFAULT: MigrationFlagsV83 = {
  enable_v83_pipeline: false,
  enable_production_v83_write: false,
  enable_legacy_namespace_write: true,
  enable_legacy_view_adapter: false,
  enable_evidence_ledger: false,
  enable_synthetic_fill: true,
  enable_summary_calibration: true,
  enable_image_app_enrichment_ref: false,
  enable_stop_production_namespace_clone: false,
  compat_mode: 'legacy_read',
} as const;

/** Preset for PR-07 — not active in PR-00 */
export const MIGRATION_FLAGS_V83_DUAL_WRITE: MigrationFlagsV83 = {
  ...MIGRATION_FLAGS_V83_DEFAULT,
  enable_v83_pipeline: true,
  enable_production_v83_write: true,
  enable_legacy_namespace_write: true,
  compat_mode: 'dual_write',
};

/** Preset for PR-18 — not active in PR-00 */
export const MIGRATION_FLAGS_V83_ONLY: MigrationFlagsV83 = {
  ...MIGRATION_FLAGS_V83_DEFAULT,
  enable_v83_pipeline: true,
  enable_production_v83_write: true,
  enable_legacy_namespace_write: false,
  enable_legacy_view_adapter: true,
  enable_evidence_ledger: true,
  enable_synthetic_fill: false,
  enable_summary_calibration: false,
  enable_stop_production_namespace_clone: true,
  compat_mode: 'v83_only',
};
