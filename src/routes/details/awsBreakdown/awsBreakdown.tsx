import { ProviderType } from 'api/providers';
import { getProvidersQuery } from 'api/queries/providersQuery';
import type { Query } from 'api/queries/query';
import { getQuery, parseQuery, parseQueryState } from 'api/queries/query';
import { ReportPathsType, ReportType } from 'api/reports/report';
import { TagPathsType } from 'api/tags/tag';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { routes } from 'routes';
import type { BreakdownStateProps } from 'routes/details/components/breakdown';
import { BreakdownBase } from 'routes/details/components/breakdown';
import { getGroupById, getGroupByOrgValue, getGroupByValue } from 'routes/utils/groupBy';
import { filterProviders } from 'routes/utils/providers';
import { createMapStateToProps } from 'store/common';
import { providersQuery, providersSelectors } from 'store/providers';
import { reportActions, reportSelectors } from 'store/reports';
import { getCostType, getCurrency } from 'utils/localStorage';
import { formatPath } from 'utils/paths';
import { breakdownDescKey, breakdownTitleKey, logicalAndPrefix, logicalOrPrefix, orgUnitIdKey } from 'utils/props';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { CostOverview } from './costOverview';
import { HistoricalData } from './historicalData';

interface BreakdownDispatchProps {
  fetchReport?: typeof reportActions.fetchReport;
}

type AwsBreakdownOwnProps = RouterComponentProps & WrappedComponentProps;

const detailsURL = formatPath(routes.awsDetails.path);
const reportType = ReportType.cost;
const reportPathsType = ReportPathsType.aws;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<AwsBreakdownOwnProps, BreakdownStateProps>((state, { intl, router }) => {
  const queryFromRoute = parseQuery<Query>(router.location.search);
  const queryState = parseQueryState<Query>(queryFromRoute);

  const groupByOrgValue = getGroupByOrgValue(queryFromRoute);
  const groupBy = groupByOrgValue ? orgUnitIdKey : getGroupById(queryFromRoute);
  const groupByValue = groupByOrgValue ? groupByOrgValue : getGroupByValue(queryFromRoute);
  const costType = getCostType();
  const currency = getCurrency();

  const query = { ...queryFromRoute };
  const reportQuery = {
    cost_type: costType,
    currency,
    filter: {
      resolution: 'monthly',
      time_scope_units: 'month',
      time_scope_value: -1,
    },
    filter_by: {
      // Add filters here to apply logical OR/AND
      ...(queryState && queryState.filter_by && queryState.filter_by),
      ...(queryFromRoute &&
        queryFromRoute.filter &&
        queryFromRoute.filter.account && { [`${logicalAndPrefix}account`]: queryFromRoute.filter.account }),
      // Omit filters associated with the current group_by -- see https://issues.redhat.com/browse/COST-1131 and https://issues.redhat.com/browse/COST-3642
      ...(groupBy && groupBy !== orgUnitIdKey && groupByValue !== '*' && { [groupBy]: undefined }),
      // Workaround for https://issues.redhat.com/browse/COST-1189
      ...(queryState &&
        queryState.filter_by &&
        queryState.filter_by[orgUnitIdKey] && {
          [`${logicalOrPrefix}${orgUnitIdKey}`]: queryState.filter_by[orgUnitIdKey],
          [orgUnitIdKey]: undefined,
        }),
    },
    exclude: {
      ...(queryState && queryState.exclude && queryState.exclude),
    },
    group_by: {
      ...(groupBy && { [groupBy]: groupByValue }),
    },
  };

  const reportQueryString = getQuery(reportQuery);
  const report = reportSelectors.selectReport(state, reportPathsType, reportType, reportQueryString);
  const reportError = reportSelectors.selectReportError(state, reportPathsType, reportType, reportQueryString);
  const reportFetchStatus = reportSelectors.selectReportFetchStatus(
    state,
    reportPathsType,
    reportType,
    reportQueryString
  );

  const providersQueryString = getProvidersQuery(providersQuery);
  const providers = providersSelectors.selectProviders(state, ProviderType.all, providersQueryString);
  const providersError = providersSelectors.selectProvidersError(state, ProviderType.all, providersQueryString);
  const providersFetchStatus = providersSelectors.selectProvidersFetchStatus(
    state,
    ProviderType.all,
    providersQueryString
  );

  const title = queryFromRoute[breakdownTitleKey] ? queryFromRoute[breakdownTitleKey] : groupByValue;

  return {
    costOverviewComponent: (
      <CostOverview costType={costType} currency={currency} groupBy={groupBy} query={queryFromRoute} report={report} />
    ),
    costType,
    currency,
    description: queryFromRoute[breakdownDescKey],
    detailsURL,
    emptyStateTitle: intl.formatMessage(messages.awsDetailsTitle),
    groupBy,
    groupByValue,
    historicalDataComponent: <HistoricalData costType={costType} currency={currency} />,
    providers: filterProviders(providers, ProviderType.aws),
    providersError,
    providersFetchStatus,
    providerType: ProviderType.aws,
    query,
    report,
    reportError,
    reportFetchStatus,
    reportType,
    reportPathsType,
    reportQueryString,
    showCostType: true,
    tagPathsType: TagPathsType.aws,
    title,
  };
});

const mapDispatchToProps: BreakdownDispatchProps = {
  fetchReport: reportActions.fetchReport,
};

const AwsBreakdown = injectIntl(withRouter(connect(mapStateToProps, mapDispatchToProps)(BreakdownBase)));

export default AwsBreakdown;