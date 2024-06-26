import { createAction } from 'typesafe-actions';

export interface FeatureToggleActionMeta {
  isAwsEc2InstancesToggleEnabled?: boolean;
  isDebugToggleEnabled?: boolean;
  isExportsToggleEnabled?: boolean;
  isFinsightsToggleEnabled?: boolean;
  isIbmToggleEnabled?: boolean;
  isOcpCloudNetworkingToggleEnabled?: boolean;
  isOcpProjectStorageToggleEnabled?: boolean;
  isRosToggleEnabled?: boolean;
}

export const setFeatureToggle = createAction('feature/init_feature_toggle')<FeatureToggleActionMeta>();
export const resetState = createAction('feature/reset_state')();
