import './optimizations.scss';

import {
  Bullseye,
  Spinner,
  TextContent,
  TextList,
  TextListItem,
  TextListItemVariants,
  TextListVariants,
} from '@patternfly/react-core';
import { TableComposable, TableVariant, Tbody, Td, Th, Thead, Tr } from '@patternfly/react-table';
import type { RecommendationItem, RecommendationReportData } from 'api/ros/recommendations';
import { RosPathsType, RosType } from 'api/ros/ros';
import type { AxiosError } from 'axios';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { routes } from 'routes';
import { EmptyValueState } from 'routes/components/state/emptyValueState';
import { getBreakdownPath } from 'routes/views/utils/paths';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { rosActions, rosSelectors } from 'store/ros';
import { uiSelectors } from 'store/ui';
import { getTimeFromNow } from 'utils/dates';
import { formatPath } from 'utils/paths';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';

import { styles } from './optimizations.styles';
import { OptimizationsToolbar } from './optimizationsToolbar';

interface OptimizationsContentOwnProps extends RouterComponentProps {
  onClose();
}

interface OptimizationsContentStateProps {
  report?: RecommendationReportData;
  reportError?: AxiosError;
  reportFetchStatus?: FetchStatus;
  reportQueryString?: string;
}

interface OptimizationsContentDispatchProps {
  fetchRosReport: typeof rosActions.fetchRosReport;
}

interface OptimizationsContentState {
  currentInterval: string;
}

type OptimizationsContentProps = OptimizationsContentOwnProps &
  OptimizationsContentStateProps &
  OptimizationsContentDispatchProps &
  WrappedComponentProps;

// eslint-disable-next-line no-shadow
export const enum Interval {
  short_term = 'short_term', // last 24 hrs
  medium_term = 'medium_term', // last 7 days
  long_term = 'long_term', // last 15 days
}

const reportType = RosType.ros as any;
const reportPathsType = RosPathsType.recommendation as any;

class OptimizationsContentBase extends React.Component<OptimizationsContentProps, any> {
  protected defaultState: OptimizationsContentState = {
    currentInterval: Interval.short_term,
  };
  public state: OptimizationsContentState = { ...this.defaultState };

  public componentDidMount() {
    const { fetchRosReport, reportQueryString } = this.props;

    fetchRosReport(reportPathsType, reportType, reportQueryString);
    this.setState({ currentInterval: this.getDefaultTerm() });
  }

  private getDefaultTerm = () => {
    const { report } = this.props;

    let result = Interval.short_term;
    if (!(report && report.recommendations)) {
      return result;
    }
    if (report.recommendations.short_term) {
      result = Interval.short_term;
    } else if (report.recommendations.medium_term) {
      result = Interval.medium_term;
    } else if (report.recommendations.long_term) {
      result = Interval.long_term;
    }
    return result;
  };

  private getDescription = () => {
    const { intl, report } = this.props;

    const clusterAlias = report && report.cluster_alias ? report.cluster_alias : undefined;
    const clusterUuid = report && report.cluster_uuid ? report.cluster_uuid : '';
    const cluster = clusterAlias ? clusterAlias : clusterUuid;

    const lastReported = report ? getTimeFromNow(report.last_reported) : '';
    const project = report && report.project ? report.project : '';
    const workload = report && report.workload ? report.workload : '';
    const workloadType = report && report.workload_type ? report.workload_type : '';

    return (
      <TextContent>
        <TextList component={TextListVariants.dl}>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'last_reported' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{lastReported}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'cluster' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{cluster}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'project' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{project}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'workload_type' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{workload}</TextListItem>
          <TextListItem component={TextListItemVariants.dt}>
            {intl.formatMessage(messages.optimizationsValues, { value: 'workload' })}
          </TextListItem>
          <TextListItem component={TextListItemVariants.dd}>{workloadType}</TextListItem>
        </TextList>
      </TextContent>
    );
  };

  private getChangeValue = value => {
    if (value === 0) {
      return <EmptyValueState />;
    }

    // Show icon opposite of month over month
    let iconOverride = 'iconOverride';
    if (value !== null && value < 0) {
      iconOverride += ' decrease';
    } else if (value !== null && value > 0) {
      iconOverride += ' increase';
    }
    return (
      <div className="optimizationsOverride">
        <div className={iconOverride}>
          {value < 0 ? (
            <>
              {value}
              <span className="fa fa-sort-down" />
            </>
          ) : (
            <>
              {value}
              <span className="fa fa-sort-up" />
            </>
          )}
        </div>
      </div>
    );
  };

  private getLimitsTable = () => {
    const { intl, report } = this.props;

    if (!report) {
      return null;
    }
    const recommendations = this.getRecommendations();
    const cpuConfig = recommendations.config.limits.cpu.amount;
    const cpuConfigUnits = recommendations.config.limits.cpu.format;
    const cpuVariation = recommendations.variation.limits.cpu.amount;
    const memConfig = recommendations.config.limits.memory.amount;
    const memConfigUnits = recommendations.config.limits.memory.format;
    const memVariation = recommendations.variation.limits.memory.amount;

    return (
      <TableComposable
        aria-label={intl.formatMessage(messages.recommendationsTableAriaLabel)}
        borders={false}
        hasSelectableRowCaption
        variant={TableVariant.compact}
      >
        <Thead>
          <Tr>
            <Th>{intl.formatMessage(messages.limits)}</Th>
            <Th>{intl.formatMessage(messages.current)}</Th>
            <Th>{intl.formatMessage(messages.recommended)}</Th>
            <Th>{intl.formatMessage(messages.change)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.cpuUnits, { units: cpuConfigUnits })}</Td>
            <Td>{this.getOriginalValue(cpuConfig, cpuVariation)}</Td>
            <Td hasRightBorder>{cpuConfig.toFixed(1)}</Td>
            <Td>{this.getChangeValue(cpuVariation)}</Td>
          </Tr>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.memoryUnits, { units: memConfigUnits })}</Td>
            <Td>{this.getOriginalValue(memConfig, memVariation)}</Td>
            <Td hasRightBorder>{memConfig.toFixed(1)}</Td>
            <Td>{this.getChangeValue(memVariation)}</Td>
          </Tr>
        </Tbody>
      </TableComposable>
    );
  };

  private getOriginalValue = (amount, variation) => {
    return (amount - variation).toFixed(1);
  };

  private getRecommendations = (): RecommendationItem => {
    const { report } = this.props;
    const { currentInterval } = this.state;

    if (!report) {
      return undefined;
    }

    let result;
    switch (currentInterval) {
      case Interval.short_term:
        result = report.recommendations.short_term;
        break;
      case Interval.medium_term:
        result = report.recommendations.medium_term;
        break;
      case Interval.long_term:
        result = report.recommendations.long_term;
        break;
    }
    return result;
  };

  private getRequestsTable = () => {
    const { intl, report } = this.props;

    if (!report) {
      return null;
    }
    const recommendations = this.getRecommendations();
    const cpuConfig = recommendations.config.requests.cpu.amount;
    const cpuConfigUnits = recommendations.config.requests.cpu.format;
    const cpuVariation = recommendations.variation.requests.cpu.amount;
    const memConfig = recommendations.config.requests.memory.amount;
    const memConfigUnits = recommendations.config.requests.memory.format;
    const memVariation = recommendations.variation.requests.memory.amount;

    return (
      <TableComposable
        aria-label={intl.formatMessage(messages.recommendationsTableAriaLabel)}
        borders={false}
        hasSelectableRowCaption
        variant={TableVariant.compact}
      >
        <Thead>
          <Tr>
            <Th>{intl.formatMessage(messages.requests)}</Th>
            <Th>{intl.formatMessage(messages.current)}</Th>
            <Th>{intl.formatMessage(messages.recommended)}</Th>
            <Th>{intl.formatMessage(messages.change)}</Th>
          </Tr>
        </Thead>
        <Tbody>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.cpuUnits, { units: cpuConfigUnits })}</Td>
            <Td>{this.getOriginalValue(cpuConfig, cpuVariation)}</Td>
            <Td hasRightBorder>{cpuConfig.toFixed(1)}</Td>
            <Td>{this.getChangeValue(cpuVariation)}</Td>
          </Tr>
          <Tr>
            <Td style={styles.firstColumn}>{intl.formatMessage(messages.memoryUnits, { units: memConfigUnits })}</Td>
            <Td>{this.getOriginalValue(memConfig, memVariation)}</Td>
            <Td hasRightBorder>{memConfig.toFixed(1)}</Td>
            <Td>{this.getChangeValue(memVariation)}</Td>
          </Tr>
        </Tbody>
      </TableComposable>
    );
  };

  private getViewAllLink = () => {
    const { intl, report, router } = this.props;

    if (!report) {
      return null;
    }
    return (
      <Link
        to={getBreakdownPath({
          basePath: formatPath(routes.ocpDetailsBreakdown.path),
          groupBy: 'project',
          id: report.project,
          isOptimizationsPath: true,
          isOptimizationsTab: true,
          router,
          title: report.project,
        })}
      >
        {intl.formatMessage(messages.recommendationsViewAll)}
      </Link>
    );
  };

  private handleOnSelected = (value: string) => {
    this.setState({ currentInterval: value });
  };

  public render() {
    const { report, reportFetchStatus } = this.props;
    const { currentInterval } = this.state;

    const isLoading = reportFetchStatus === FetchStatus.inProgress;

    return (
      <div style={styles.content}>
        <div>{this.getDescription()}</div>
        <div style={styles.toolbarContainer}>
          <OptimizationsToolbar
            currentInterval={currentInterval}
            isDisabled={isLoading}
            recommendations={report ? report.recommendations : undefined}
            onSelected={this.handleOnSelected}
          />
        </div>
        {isLoading ? (
          <Bullseye style={styles.bullseye}>
            <Spinner size="lg" />
          </Bullseye>
        ) : (
          <>
            <div style={styles.tableContainer}>{this.getRequestsTable()}</div>
            <div style={styles.tableContainer}>{this.getLimitsTable()}</div>
            <div style={styles.viewAllContainer}>{this.getViewAllLink()}</div>
          </>
        )}
      </div>
    );
  }
}

const mapStateToProps = createMapStateToProps<OptimizationsContentOwnProps, OptimizationsContentStateProps>(state => {
  const payload = uiSelectors.selectOptimizationsDrawerPayload(state);

  const reportQueryString = payload ? payload.id : '';
  const report: any = rosSelectors.selectRos(state, reportPathsType, reportType, reportQueryString);
  const reportError = rosSelectors.selectRosError(state, reportPathsType, reportType, reportQueryString);
  const reportFetchStatus = rosSelectors.selectRosFetchStatus(state, reportPathsType, reportType, reportQueryString);

  return {
    report,
    reportError,
    reportFetchStatus,
    reportQueryString,
  };
});

const mapDispatchToProps: OptimizationsContentDispatchProps = {
  fetchRosReport: rosActions.fetchRosReport,
};

const OptimizationsContent = injectIntl(
  withRouter(connect(mapStateToProps, mapDispatchToProps)(OptimizationsContentBase))
);

export { OptimizationsContent };