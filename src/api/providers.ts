import axios from 'axios';

import type { PagedMetaData, PagedResponse } from './api';

export interface ProviderAdditionalContext {
  operator_version?: string;
  operator_airgapped?: boolean;
  operator_certified?: boolean;
  operator_update_available?: boolean;
}

export interface ProviderAuthentication {
  credentials?: {
    cluster_id?: string;
  };
  uuid?: string;
  provider_resource_name: string;
}

export interface ProviderBillingSource {
  uuid?: string;
  bucket: string;
}

export interface ProviderCreatedBy {
  uuid?: string;
  username?: string;
  email?: string;
}

export interface ProviderCustomer {
  uuid?: string;
  name?: string;
  owner?: ProviderCreatedBy;
  date_created?: string;
}

export interface ProviderCostModel {
  name: string;
  uuid: string;
}

export interface ProviderInfrastructure {
  type?: string;
  uuid?: string;
}

export interface Provider {
  active?: boolean;
  additional_context?: ProviderAdditionalContext;
  authentication?: ProviderAuthentication;
  billing_source?: ProviderBillingSource;
  created_by?: ProviderCreatedBy;
  created_timestamp?: Date;
  cost_models?: ProviderCostModel[];
  current_month_data?: boolean;
  customer?: ProviderCustomer;
  has_data?: boolean;
  id?: string;
  infrastructure?: ProviderInfrastructure;
  last_payload_received_at?: string;
  name?: string;
  paused?: boolean;
  previous_month_data?: boolean;
  source_type?: string;
  status?: {
    download?: string;
    processing?: string;
    summary?: string;
  };
  type?: string;
  uuid?: string;
}

export interface Providers extends PagedResponse<Provider, PagedMetaData> {}

// eslint-disable-next-line no-shadow
export const enum ProviderType {
  all = 'all',
  aws = 'aws',
  azure = 'azure',
  gcp = 'gcp',
  ibm = 'ibm',
  oci = 'oci',
  ocp = 'ocp',
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  rhel = 'ocp', // Todo: Update to use rhel when APIs are available
  // eslint-disable-next-line @typescript-eslint/no-duplicate-enum-values
  ros = 'ocp', // Todo: Update to use rhel when APIs are available
  uuid = 'uuid',
}

export function fetchProviders(query: string, reportType: ProviderType = undefined) {
  const separator = reportType === ProviderType.uuid ? '' : '?';
  const queryString = query ? `${separator}${query}` : '';
  return axios.get<Providers>(`sources/${queryString}`);
}
