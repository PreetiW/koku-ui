import { getQuery, OcpQuery, parseQuery } from 'api/queries/ocpQuery';
import { Query } from 'api/queries/query';
import { Report, ReportPathsType, ReportType } from 'api/reports/report';
import { AxiosError } from 'axios';
import BreakdownBase from 'pages/details/components/breakdown/breakdownBase';
import {
  getGroupById,
  getGroupByValue,
} from 'pages/details/components/utils/groupBy';
import React from 'react';
import { InjectedTranslateProps, translate } from 'react-i18next';
import { connect } from 'react-redux';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { reportActions, reportSelectors } from 'store/reports';
import { CostOverview } from './costOverview';
import { HistoricalData } from './historicalData';

type AwsBreakdownOwnProps = InjectedTranslateProps;

interface AwsBreakdownStateProps {
  CostOverview?: React.ReactNode;
  detailsURL: string;
  HistoricalData?: React.ReactNode;
  query: Query;
  queryString: string;
  report: Report;
  reportError: AxiosError;
  reportFetchStatus: FetchStatus;
  reportType: ReportType;
  reportPathsType: ReportPathsType;
}

interface BreakdownDispatchProps {
  fetchReport?: typeof reportActions.fetchReport;
}

const detailsURL = '/details/aws';
const reportType = ReportType.cost;
const reportPathsType = ReportPathsType.aws;

const mapStateToProps = createMapStateToProps<
  AwsBreakdownOwnProps,
  AwsBreakdownStateProps
>(state => {
  const queryFromRoute = parseQuery<OcpQuery>(location.search);
  const query = queryFromRoute;
  const queryString = getQuery(query);
  const report = reportSelectors.selectReport(
    state,
    reportPathsType,
    reportType,
    queryString
  );
  const reportError = reportSelectors.selectReportError(
    state,
    reportPathsType,
    reportType,
    queryString
  );
  const reportFetchStatus = reportSelectors.selectReportFetchStatus(
    state,
    reportPathsType,
    reportType,
    queryString
  );
  const filterBy = getGroupByValue(query);
  const groupBy = getGroupById(query);

  return {
    costOverviewComponent: (
      <CostOverview
        filterBy={filterBy}
        groupBy={groupBy}
        query={query}
        report={report}
      />
    ),
    detailsURL,
    filterBy,
    groupBy,
    historicalDataComponent: (
      <HistoricalData filterBy={filterBy} groupBy={groupBy} query={query} />
    ),
    query,
    queryString,
    report,
    reportError,
    reportFetchStatus,
    reportType,
    reportPathsType,
  };
});

const mapDispatchToProps: BreakdownDispatchProps = {
  fetchReport: reportActions.fetchReport,
};

const AwsBreakdown = translate()(
  connect(mapStateToProps, mapDispatchToProps)(BreakdownBase)
);

export default AwsBreakdown;
