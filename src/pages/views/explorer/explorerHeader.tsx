import { Title, TitleSizes } from '@patternfly/react-core';
import { Providers, ProviderType } from 'api/providers';
import { getProvidersQuery } from 'api/queries/providersQuery';
import { getQuery, parseQuery, Query } from 'api/queries/query';
import { getUserAccessQuery } from 'api/queries/userAccessQuery';
import { UserAccess, UserAccessType } from 'api/userAccess';
import { AxiosError } from 'axios';
import { CostType } from 'components/costType/costType';
import { Currency } from 'components/currency/currency';
import messages from 'locales/messages';
import { GroupBy } from 'pages/views/components/groupBy/groupBy';
import { Perspective } from 'pages/views/components/perspective/perspective';
import { hasCloudProvider } from 'pages/views/utils/providers';
import React from 'react';
import { injectIntl, WrappedComponentProps } from 'react-intl';
import { connect } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router-dom';
import { createMapStateToProps, FetchStatus } from 'store/common';
import {
  awsProvidersQuery,
  azureProvidersQuery,
  gcpProvidersQuery,
  ibmProvidersQuery,
  ocpProvidersQuery,
  providersSelectors,
} from 'store/providers';
import { allUserAccessQuery, ibmUserAccessQuery, userAccessSelectors } from 'store/userAccess';
import { getIdKeyForGroupBy } from 'utils/computedReport/getComputedExplorerReportItems';
import { getLast60DaysDate } from 'utils/dateRange';
import { isAwsAvailable, isAzureAvailable, isGcpAvailable, isIbmAvailable, isOcpAvailable } from 'utils/userAccess';

import { ExplorerFilter } from './explorerFilter';
import { styles } from './explorerHeader.styles';
import {
  baseQuery,
  getGroupByDefault,
  getGroupByOptions,
  getOrgReportPathsType,
  getResourcePathsType,
  getRouteForQuery,
  getTagReportPathsType,
  infrastructureAwsOcpOptions,
  infrastructureAwsOptions,
  infrastructureAzureOcpOptions,
  infrastructureAzureOptions,
  infrastructureGcpOptions,
  infrastructureIbmOptions,
  infrastructureOcpCloudOptions,
  ocpOptions,
  PerspectiveType,
} from './explorerUtils';

interface ExplorerHeaderOwnProps {
  groupBy?: string;
  onFilterAdded(filterType: string, filterValue: string);
  onFilterRemoved(filterType: string, filterValue?: string);
  onGroupBySelected(value: string);
  onPerspectiveClicked(value: string);
  perspective: PerspectiveType;
}

interface ExplorerHeaderStateProps {
  awsProviders: Providers;
  awsProvidersFetchStatus: FetchStatus;
  awsProvidersQueryString: string;
  azureProviders: Providers;
  azureProvidersFetchStatus: FetchStatus;
  azureProvidersQueryString: string;
  gcpProviders: Providers;
  gcpProvidersFetchStatus: FetchStatus;
  gcpProvidersQueryString: string;
  ibmProviders: Providers;
  ibmProvidersFetchStatus: FetchStatus;
  ibmProvidersQueryString: string;
  ibmUserAccess: UserAccess;
  ibmUserAccessError: AxiosError;
  ibmUserAccessFetchStatus: FetchStatus;
  ibmUserAccessQueryString: string;
  ocpProviders: Providers;
  ocpProvidersFetchStatus: FetchStatus;
  ocpProvidersQueryString: string;
  query: Query;
  queryString: string;
  userAccess: UserAccess;
  userAccessError: AxiosError;
  userAccessFetchStatus: FetchStatus;
  userAccessQueryString: string;
}

interface ExplorerHeaderState {
  currentPerspective?: PerspectiveType;
}

type ExplorerHeaderProps = ExplorerHeaderOwnProps &
  ExplorerHeaderStateProps &
  RouteComponentProps<void> &
  WrappedComponentProps;

class ExplorerHeaderBase extends React.Component<ExplorerHeaderProps> {
  protected defaultState: ExplorerHeaderState = {
    // TBD...
  };
  public state: ExplorerHeaderState = { ...this.defaultState };

  public componentDidMount() {
    this.setState({
      currentPerspective: this.props.perspective,
    });
  }

  public componentDidUpdate(prevProps: ExplorerHeaderProps) {
    const { perspective } = this.props;

    if (prevProps.perspective !== perspective) {
      this.setState({
        currentPerspective: this.props.perspective,
      });
    }
  }

  private getPerspective = (isDisabled: boolean) => {
    const { awsProviders, azureProviders, gcpProviders, ibmProviders, ocpProviders } = this.props;
    const { currentPerspective } = this.state;

    const aws = this.isAwsAvailable();
    const azure = this.isAzureAvailable();
    const gcp = this.isGcpAvailable();
    const ibm = this.isIbmAvailable();
    const ocp = this.isOcpAvailable();

    if (!(aws || azure || gcp || ibm || ocp)) {
      return null;
    }

    const hasAwsProvider = hasCloudProvider(awsProviders, ocpProviders);
    const hasAzureProvider = hasCloudProvider(azureProviders, ocpProviders);
    const hasGcpProvider = hasCloudProvider(gcpProviders, ocpProviders);
    const hasIbmProvider = hasCloudProvider(ibmProviders, ocpProviders);

    // Dynamically show options if providers are available
    const options = [];
    if (ocp) {
      options.push(...ocpOptions);
    }
    if (hasAwsProvider || hasAzureProvider || hasGcpProvider || hasIbmProvider) {
      options.push(...infrastructureOcpCloudOptions);
    }
    if (aws) {
      options.push(...infrastructureAwsOptions);
    }
    if (hasAwsProvider) {
      options.push(...infrastructureAwsOcpOptions);
    }
    if (gcp) {
      options.push(...infrastructureGcpOptions);
    }
    // Todo: Temp disabled -- see https://issues.redhat.com/browse/COST-1705
    //
    // if (hasGcpProvider) {
    //   options.push(...infrastructureGcpOcpOptions);
    // }
    if (ibm) {
      options.push(...infrastructureIbmOptions);
    }
    if (azure) {
      options.push(...infrastructureAzureOptions);
    }
    if (hasAzureProvider) {
      options.push(...infrastructureAzureOcpOptions);
    }

    return (
      <Perspective
        currentItem={currentPerspective || options[0].value}
        isDisabled={isDisabled}
        onSelected={this.handlePerspectiveSelected}
        options={options}
      />
    );
  };

  private handlePerspectiveSelected = (value: string) => {
    const { history, onPerspectiveClicked, query } = this.props;

    const newQuery = {
      ...JSON.parse(JSON.stringify(query)),
      filter_by: undefined,
      group_by: { [getGroupByDefault(value)]: '*' },
      order_by: undefined, // Clear sort
      perspective: value,
    };
    history.replace(getRouteForQuery(history, newQuery, true));
    this.setState({ currentPerspective: value }, () => {
      if (onPerspectiveClicked) {
        onPerspectiveClicked(value);
      }
    });
  };

  private handleCostTypeSelected = (value: string) => {
    const { history, query } = this.props;

    history.replace(getRouteForQuery(history, query, true));
  };

  private isAwsAvailable = () => {
    const { awsProviders, awsProvidersFetchStatus, userAccess } = this.props;
    return isAwsAvailable(userAccess, awsProviders, awsProvidersFetchStatus);
  };

  private isAzureAvailable = () => {
    const { azureProviders, azureProvidersFetchStatus, userAccess } = this.props;
    return isAzureAvailable(userAccess, azureProviders, azureProvidersFetchStatus);
  };

  private isGcpAvailable = () => {
    const { gcpProviders, gcpProvidersFetchStatus, userAccess } = this.props;
    return isGcpAvailable(userAccess, gcpProviders, gcpProvidersFetchStatus);
  };

  private isIbmAvailable = () => {
    const { ibmProviders, ibmProvidersFetchStatus, ibmUserAccess } = this.props;
    return isIbmAvailable(ibmUserAccess, ibmProviders, ibmProvidersFetchStatus);
  };

  private isOcpAvailable = () => {
    const { ocpProviders, ocpProvidersFetchStatus, userAccess } = this.props;
    return isOcpAvailable(userAccess, ocpProviders, ocpProvidersFetchStatus);
  };

  public render() {
    const {
      awsProviders,
      azureProviders,
      gcpProviders,
      ibmProviders,
      ocpProviders,
      awsProvidersFetchStatus,
      azureProvidersFetchStatus,
      ibmProvidersFetchStatus,
      ibmUserAccess,
      groupBy,
      gcpProvidersFetchStatus,
      ocpProvidersFetchStatus,
      onFilterAdded,
      onFilterRemoved,
      onGroupBySelected,
      perspective,
      query,
      intl,
      userAccess,
    } = this.props;

    // Test for no providers
    const noProviders = !(
      isAwsAvailable(userAccess, awsProviders, awsProvidersFetchStatus) ||
      isAzureAvailable(userAccess, azureProviders, azureProvidersFetchStatus) ||
      isGcpAvailable(userAccess, gcpProviders, gcpProvidersFetchStatus) ||
      isIbmAvailable(ibmUserAccess, ibmProviders, ibmProvidersFetchStatus) ||
      isOcpAvailable(userAccess, ocpProviders, ocpProvidersFetchStatus)
    );

    const groupByOptions = getGroupByOptions(perspective);
    const orgReportPathsType = getOrgReportPathsType(perspective);
    const resourcePathsType = getResourcePathsType(perspective);
    const tagReportPathsType = getTagReportPathsType(perspective);

    // Fetch tags with largest date range available
    const { start_date, end_date } = getLast60DaysDate();

    return (
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Title headingLevel="h1" style={styles.title} size={TitleSizes['2xl']}>
            {intl.formatMessage(messages.ExplorerTitle)}
          </Title>
          <Currency />
        </div>
        <div style={styles.perspectiveContainer}>
          {this.getPerspective(noProviders)}
          <div style={styles.groupBy}>
            <GroupBy
              endDate={end_date}
              getIdKeyForGroupBy={getIdKeyForGroupBy}
              groupBy={groupBy}
              isDisabled={noProviders}
              onSelected={onGroupBySelected}
              options={groupByOptions}
              orgReportPathsType={orgReportPathsType}
              perspective={perspective}
              showOrgs={orgReportPathsType}
              showTags={tagReportPathsType}
              startDate={start_date}
              tagReportPathsType={tagReportPathsType}
            />
          </div>
          {perspective === PerspectiveType.aws && (
            <div style={styles.costType}>
              <CostType onSelect={this.handleCostTypeSelected} />
            </div>
          )}
        </div>
        <ExplorerFilter
          groupBy={groupBy}
          isDisabled={noProviders}
          onFilterAdded={onFilterAdded}
          onFilterRemoved={onFilterRemoved}
          perspective={perspective}
          query={query}
          resourcePathsType={resourcePathsType}
        />
      </header>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<ExplorerHeaderOwnProps, ExplorerHeaderStateProps>(
  (state, { perspective }) => {
    const userAccessQueryString = getUserAccessQuery(allUserAccessQuery);
    const userAccess = userAccessSelectors.selectUserAccess(state, UserAccessType.all, userAccessQueryString);
    const userAccessError = userAccessSelectors.selectUserAccessError(state, UserAccessType.all, userAccessQueryString);
    const userAccessFetchStatus = userAccessSelectors.selectUserAccessFetchStatus(
      state,
      UserAccessType.all,
      userAccessQueryString
    );

    const queryFromRoute = parseQuery<Query>(location.search);

    // Ensure group_by key is not undefined
    let groupBy = queryFromRoute.group_by;
    if (!groupBy && perspective) {
      groupBy = { [getGroupByDefault(perspective)]: '*' };
    }

    const query = {
      filter: {
        ...baseQuery.filter,
        ...queryFromRoute.filter,
      },
      filter_by: queryFromRoute.filter_by || baseQuery.filter_by,
      group_by: groupBy,
      order_by: queryFromRoute.order_by,
      perspective,
    };
    const queryString = getQuery({
      ...query,
      perspective: undefined,
    });

    const awsProvidersQueryString = getProvidersQuery(awsProvidersQuery);
    const awsProviders = providersSelectors.selectProviders(state, ProviderType.aws, awsProvidersQueryString);
    const awsProvidersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.aws,
      awsProvidersQueryString
    );

    const azureProvidersQueryString = getProvidersQuery(azureProvidersQuery);
    const azureProviders = providersSelectors.selectProviders(state, ProviderType.azure, azureProvidersQueryString);
    const azureProvidersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.azure,
      azureProvidersQueryString
    );

    const gcpProvidersQueryString = getProvidersQuery(gcpProvidersQuery);
    const gcpProviders = providersSelectors.selectProviders(state, ProviderType.gcp, gcpProvidersQueryString);
    const gcpProvidersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.gcp,
      gcpProvidersQueryString
    );

    const ibmProvidersQueryString = getProvidersQuery(ibmProvidersQuery);
    const ibmProviders = providersSelectors.selectProviders(state, ProviderType.ibm, ibmProvidersQueryString);
    const ibmProvidersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.ibm,
      ibmProvidersQueryString
    );

    const ocpProvidersQueryString = getProvidersQuery(ocpProvidersQuery);
    const ocpProviders = providersSelectors.selectProviders(state, ProviderType.ocp, ocpProvidersQueryString);
    const ocpProvidersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.ocp,
      ocpProvidersQueryString
    );

    // Todo: temporarily request IBM separately with beta flag.
    const ibmUserAccessQueryString = getUserAccessQuery(ibmUserAccessQuery);
    const ibmUserAccess = userAccessSelectors.selectUserAccess(state, UserAccessType.ibm, ibmUserAccessQueryString);
    const ibmUserAccessError = userAccessSelectors.selectUserAccessError(
      state,
      UserAccessType.ibm,
      ibmUserAccessQueryString
    );
    const ibmUserAccessFetchStatus = userAccessSelectors.selectUserAccessFetchStatus(
      state,
      UserAccessType.ibm,
      ibmUserAccessQueryString
    );

    return {
      awsProviders,
      awsProvidersFetchStatus,
      awsProvidersQueryString,
      azureProviders,
      azureProvidersFetchStatus,
      azureProvidersQueryString,
      gcpProviders,
      gcpProvidersFetchStatus,
      gcpProvidersQueryString,
      ibmProviders,
      ibmProvidersFetchStatus,
      ibmProvidersQueryString,
      ibmUserAccess,
      ibmUserAccessError,
      ibmUserAccessFetchStatus,
      ibmUserAccessQueryString,
      ocpProviders,
      ocpProvidersFetchStatus,
      ocpProvidersQueryString,
      perspective,
      query,
      queryString,
      userAccess,
      userAccessError,
      userAccessFetchStatus,
      userAccessQueryString,
    };
  }
);

const ExplorerHeader = injectIntl(withRouter(connect(mapStateToProps, {})(ExplorerHeaderBase)));

export { ExplorerHeader, ExplorerHeaderProps };
