import { Pagination, PaginationVariant } from '@patternfly/react-core';
import type { OcpQuery } from 'api/queries/ocpQuery';
import type { Query } from 'api/queries/query';
import { getQuery, getQueryState, parseQuery } from 'api/queries/query';
import type { OcpReport } from 'api/reports/ocpReports';
import { ReportPathsType } from 'api/reports/report';
import { ReportType } from 'api/reports/report';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import type { AnyAction } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import { NotAvailable } from 'routes/components/page/notAvailable';
import { LoadingState } from 'routes/components/state/loadingState';
import { getGroupById, getGroupByValue } from 'routes/utils/groupBy';
import * as queryUtils from 'routes/utils/query';
import type { RootState } from 'store';
import { FetchStatus } from 'store/common';
import { reportActions, reportSelectors } from 'store/reports';

import { styles } from './pvcContent.styles';
import { PvcTable } from './pvcTable';
import { PvcToolbar } from './pvcToolbar';

interface PvcContentOwnProps {
  // TBD...
}

export interface PvcContentStateProps {
  report: OcpReport;
  reportError: AxiosError;
  reportFetchStatus: FetchStatus;
  reportQueryString: string;
}

export interface PvcContentMapProps {
  query?: OcpQuery;
}

type PvcContentProps = PvcContentOwnProps;

const baseQuery: OcpQuery = {
  filter: {
    time_scope_units: 'month',
    time_scope_value: -1,
    resolution: 'monthly',
  },
  filter_by: {},
  limit: 10,
  offset: 0,
  order_by: {
    request: 'desc',
  },
};

const reportType = ReportType.volume;
const reportPathsType = ReportPathsType.ocp;

const PvcContent: React.FC<PvcContentProps> = () => {
  const intl = useIntl();
  const location = useLocation();

  const queryState = getQueryState(location, 'optimizations');
  const [query, setQuery] = useState({ ...baseQuery, ...(queryState && queryState) });
  const { report, reportError, reportFetchStatus, reportQueryString } = useMapToProps({
    query,
  });

  const getPagination = (isDisabled = false, isBottom = false) => {
    const count = report && report.meta ? report.meta.count : 0;
    const limit = report && report.meta ? report.meta.limit : baseQuery.limit;
    const offset = report && report.meta ? report.meta.offset : baseQuery.offset;
    const page = Math.trunc(offset / limit + 1);

    return (
      <Pagination
        isCompact={!isBottom}
        isDisabled={isDisabled}
        itemCount={count}
        onPerPageSelect={(event, perPage) => handleOnPerPageSelect(perPage)}
        onSetPage={(event, pageNumber) => handleOnSetPage(pageNumber)}
        page={page}
        perPage={limit}
        titles={{
          paginationAriaLabel: intl.formatMessage(messages.paginationTitle, {
            title: intl.formatMessage(messages.openShift),
            placement: isBottom ? 'bottom' : 'top',
          }),
        }}
        variant={isBottom ? PaginationVariant.bottom : PaginationVariant.top}
        widgetId={`exports-pagination${isBottom ? '-bottom' : ''}`}
      />
    );
  };

  const getTable = () => {
    return (
      <PvcTable
        filterBy={query.filter_by}
        isLoading={reportFetchStatus === FetchStatus.inProgress}
        onSort={(sortType, isSortAscending) => handleOnSort(sortType, isSortAscending)}
        orderBy={query.order_by}
        report={report}
        reportQueryString={reportQueryString}
      />
    );
  };

  const getToolbar = () => {
    const itemsPerPage = report && report.meta ? report.meta.limit : 0;
    const itemsTotal = report && report.meta ? report.meta.count : 0;
    const isDisabled = itemsTotal === 0;

    return (
      <PvcToolbar
        isDisabled={isDisabled}
        isProject
        itemsPerPage={itemsPerPage}
        itemsTotal={itemsTotal}
        onFilterAdded={filter => handleOnFilterAdded(filter)}
        onFilterRemoved={filter => handleOnFilterRemoved(filter)}
        pagination={getPagination(isDisabled)}
        query={query}
      />
    );
  };

  const handleOnFilterAdded = filter => {
    const newQuery = queryUtils.handleOnFilterAdded(query, filter);
    setQuery(newQuery);
  };

  const handleOnFilterRemoved = filter => {
    const newQuery = queryUtils.handleOnFilterRemoved(query, filter);
    setQuery(newQuery);
  };

  const handleOnPerPageSelect = perPage => {
    const newQuery = queryUtils.handleOnPerPageSelect(query, perPage, true);
    setQuery(newQuery);
  };

  const handleOnSetPage = pageNumber => {
    const newQuery = queryUtils.handleOnSetPage(query, report, pageNumber, true);
    setQuery(newQuery);
  };

  const handleOnSort = (sortType, isSortAscending) => {
    const newQuery = queryUtils.handleOnSort(query, sortType, isSortAscending);
    setQuery(newQuery);
  };

  const itemsTotal = report && report.meta ? report.meta.count : 0;
  const isDisabled = itemsTotal === 0;
  const title = intl.formatMessage(messages.optimizations);

  if (reportError) {
    return <NotAvailable title={title} />;
  }
  return (
    <div style={styles.container}>
      {getToolbar()}
      {reportFetchStatus === FetchStatus.inProgress ? (
        <div style={styles.loading}>
          <LoadingState
            body={intl.formatMessage(messages.optimizationsLoadingStateDesc)}
            heading={intl.formatMessage(messages.optimizationsLoadingStateTitle)}
          />
        </div>
      ) : (
        <>
          {getTable()}
          <div style={styles.pagination}>{getPagination(isDisabled, true)}</div>
        </>
      )}
    </div>
  );
};

const useQueryFromRoute = () => {
  const location = useLocation();
  return parseQuery<Query>(location.search);
};

const useQueryState = () => {
  const location = useLocation();
  return getQueryState(location, 'details');
};

// eslint-disable-next-line no-empty-pattern
const useMapToProps = ({ query }: PvcContentMapProps): PvcContentStateProps => {
  const dispatch: ThunkDispatch<RootState, any, AnyAction> = useDispatch();
  const queryFromRoute = useQueryFromRoute();
  const queryState = useQueryState();

  const groupBy = getGroupById(queryFromRoute);
  const groupByValue = getGroupByValue(queryFromRoute);

  const reportQuery: Query = {
    filter: {
      ...query.filter,
      limit: query.limit,
      offset: query.offset,
    },
    filter_by: {
      // Add filters here to apply logical OR/AND
      ...(queryState && queryState.filter_by && queryState.filter_by),
      // Omit filters associated with the current group_by -- see https://issues.redhat.com/browse/COST-1131 and https://issues.redhat.com/browse/COST-3642
      ...(groupBy && groupByValue !== '*' && { [groupBy]: groupByValue }), // Note: We're not inserting PVC information for the Platform project
      ...query.filter_by,
    },
    exclude: {
      ...(queryState && queryState.exclude && queryState.exclude),
    },
    group_by: { persistentvolumeclaim: '*' },
    order_by: query.order_by,
  };

  const reportQueryString = getQuery(reportQuery);
  const report = useSelector((state: RootState) =>
    reportSelectors.selectReport(state, reportPathsType, reportType, reportQueryString)
  );
  const reportFetchStatus = useSelector((state: RootState) =>
    reportSelectors.selectReportFetchStatus(state, reportPathsType, reportType, reportQueryString)
  );
  const reportError = useSelector((state: RootState) =>
    reportSelectors.selectReportError(state, reportPathsType, reportType, reportQueryString)
  );

  useEffect(() => {
    if (!reportError && reportFetchStatus !== FetchStatus.inProgress) {
      dispatch(reportActions.fetchReport(reportPathsType, reportType, reportQueryString));
    }
  }, [query]);

  return {
    report,
    reportError,
    reportFetchStatus,
    reportQueryString,
  };
};

export { PvcContent };
