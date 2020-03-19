import { Tooltip } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { Report } from 'api/reports/report';
import { EmptyValueState } from 'components/state/emptyValueState/emptyValueState';
import React from 'react';
import { InjectedTranslateProps, translate } from 'react-i18next';
import {
  DashboardChartType,
  DashboardPerspective,
} from 'store/dashboard/common/dashboardCommon';
import {
  FormatOptions,
  unitLookupKey,
  ValueFormatter,
} from 'utils/formatValue';
import { styles } from './reportSummaryDetails.styles';

interface ReportSummaryDetailsProps extends InjectedTranslateProps {
  chartType?: DashboardChartType;
  costLabel?: string;
  formatValue?: ValueFormatter;
  formatOptions?: FormatOptions;
  perspective: DashboardPerspective;
  report: Report;
  requestFormatOptions?: FormatOptions;
  requestLabel?: string;
  showUnits?: boolean;
  showUsageFirst?: boolean;
  units?: string;
  usageFormatOptions?: FormatOptions;
  usageLabel?: string;
}

const ReportSummaryDetailsBase: React.SFC<ReportSummaryDetailsProps> = ({
  chartType,
  costLabel,
  formatValue,
  formatOptions,
  perspective,
  report,
  requestFormatOptions,
  requestLabel,
  showUnits = false,
  showUsageFirst = false,
  t,
  units,
  usageFormatOptions,
  usageLabel,
}) => {
  let cost: string | React.ReactNode = <EmptyValueState />;
  let supplementaryCost: string | React.ReactNode = <EmptyValueState />;
  let infrastructureCost: string | React.ReactNode = <EmptyValueState />;
  let request: string | React.ReactNode = <EmptyValueState />;
  let usage: string | React.ReactNode = <EmptyValueState />;

  const hasTotal = report && report.meta && report.meta.total;
  const hasCost = hasTotal && report.meta.total.cost;
  const hasCount = hasTotal && report.meta.total.count;
  const hasSupplementaryCost =
    hasTotal &&
    report.meta.total.supplementary &&
    report.meta.total.supplementary.total &&
    report.meta.total.supplementary.total.value;
  const hasInfrastructureCost =
    hasTotal &&
    report.meta.total.infrastructure &&
    report.meta.total.infrastructure.total &&
    report.meta.total.infrastructure.total.value;
  const hasRequest = hasTotal && report.meta.total.request;
  const hasUsage = hasTotal && report.meta.total.usage;

  if (hasTotal) {
    cost = formatValue(
      hasCost ? report.meta.total.cost.total.value : 0,
      hasCost ? report.meta.total.cost.total.units : 'USD',
      formatOptions
    );
    supplementaryCost = formatValue(
      hasSupplementaryCost ? report.meta.total.supplementary.total.value : 0,
      hasSupplementaryCost
        ? report.meta.total.supplementary.total.units
        : 'USD',
      formatOptions
    );
    infrastructureCost = formatValue(
      hasInfrastructureCost ? report.meta.total.infrastructure.total.value : 0,
      hasInfrastructureCost
        ? report.meta.total.infrastructure.total.units
        : 'USD',
      formatOptions
    );
    request = formatValue(
      hasRequest ? report.meta.total.request.value : 0,
      hasRequest ? report.meta.total.request.units : '',
      requestFormatOptions ? usageFormatOptions : formatOptions
    );

    if (hasUsage && report.meta.total.usage.value >= 0) {
      usage = formatValue(
        hasUsage ? report.meta.total.usage.value : 0,
        hasUsage ? report.meta.total.usage.units : '',
        usageFormatOptions ? usageFormatOptions : formatOptions
      );
    } else {
      // Workaround for https://github.com/project-koku/koku-ui/issues/1058
      usage = formatValue(
        hasUsage ? (report.meta.total.usage as any) : 0,
        hasCount ? report.meta.total.count.units : '',
        usageFormatOptions ? usageFormatOptions : formatOptions
      );
    }
  }

  const getCostLayout = () => (
    <div className={css(styles.valueContainer)}>
      {Boolean(
        perspective === DashboardPerspective.ocp ||
          perspective === DashboardPerspective.ocpCloud
      ) ? (
        <Tooltip
          content={t(
            `${perspective}_dashboard.total_cost_tooltip`,
            perspective === DashboardPerspective.ocp
              ? { infrastructureCost, supplementaryCost }
              : { infrastructureCost, supplementaryCost }
          )}
          enableFlip
        >
          <div className={css(styles.value)}>{cost}</div>
        </Tooltip>
      ) : (
        <div className={css(styles.value)}>{cost}</div>
      )}
      <div className={css(styles.text)}>
        <div>{costLabel}</div>
      </div>
    </div>
  );

  const getRequestLayout = () => {
    if (!usageLabel) {
      return null;
    }
    const usageUnits: string = hasRequest
      ? report.meta.total.request.units
      : '';
    const _units = unitLookupKey(usageUnits);
    const unitsLabel = t(`units.${_units}`);

    return (
      <div className={css(styles.valueContainer)}>
        <div className={css(styles.value)}>
          {request}
          {Boolean(
            showUnits && hasRequest && report.meta.total.request.value >= 0
          ) && <span className={css(styles.text)}>{unitsLabel}</span>}
        </div>
        <div className={css(styles.text)}>
          <div>{requestLabel}</div>
        </div>
      </div>
    );
  };

  const getUsageLayout = () => {
    if (!usageLabel) {
      return null;
    }
    const usageUnits: string = hasUsage ? report.meta.total.usage.units : '';
    // added as a work-around for azure #1079
    const _units = unitLookupKey(units ? units : usageUnits);
    const unitsLabel = t(`units.${_units}`);

    return (
      <div className={css(styles.valueContainer)}>
        <div className={css(styles.value)}>
          {usage}
          {Boolean(
            showUnits && hasUsage && report.meta.total.usage.value >= 0
          ) && <span className={css(styles.text)}>{unitsLabel}</span>}
        </div>
        <div className={css(styles.text)}>
          <div>{usageLabel}</div>
        </div>
      </div>
    );
  };

  if (chartType === DashboardChartType.cost) {
    return <>{getCostLayout()}</>;
  } else if (chartType === DashboardChartType.trend) {
    if (showUsageFirst) {
      return (
        <>
          {getUsageLayout()}
          {getCostLayout()}
        </>
      );
    }
    return (
      <>
        {getCostLayout()}
        {getUsageLayout()}
      </>
    );
  } else if (chartType === DashboardChartType.usage) {
    if (showUsageFirst) {
      return (
        <>
          {getUsageLayout()}
          {getRequestLayout()}
        </>
      );
    }
    return (
      <>
        {getRequestLayout()}
        {getUsageLayout()}
      </>
    );
  } else {
    return null;
  }
};

const ReportSummaryDetails = translate()(ReportSummaryDetailsBase);

export { ReportSummaryDetails, ReportSummaryDetailsProps };