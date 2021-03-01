jest.mock('date-fns').mock('date-fns/format');

import { ChartType } from 'components/charts/common/chartDatumUtils';
import { format, getDate, getMonth, startOfMonth } from 'date-fns';
import { shallow } from 'enzyme';
import { DashboardWidgetBase, DashboardWidgetProps } from 'pages/views/overview/components/dashboardWidgetBase';
import React from 'react';
import { FetchStatus } from 'store/common';
import { mockDate } from 'testUtils';

const props: DashboardWidgetProps = {
  widgetId: 1,
  id: 1,
  t: jest.fn(v => v),
  current: { data: [] },
  previous: { data: [] },
  tabs: { data: [] },
  fetchReports: jest.fn(),
  updateTab: jest.fn(),
  titleKey: 'title',
  trend: {
    type: ChartType.rolling,
    titleKey: 'trend title',
    formatOptions: {},
  },
  status: FetchStatus.none,
  currentQuery: '',
  previousQuery: '',
  tabsQuery: '',
  details: {
    breakdownDescKeyRange: 'detail description range',
    breakdownDescKeySingle: 'detail description single',
    formatOptions: {},
  },
  topItems: { formatOptions: {} },
} as any;

const getDateMock = getDate as jest.Mock;
const formatMock = format as jest.Mock;
const startOfMonthMock = startOfMonth as jest.Mock;
const getMonthMock = getMonth as jest.Mock;

beforeEach(() => {
  mockDate();
  getDateMock.mockReturnValue(1);
  formatMock.mockReturnValue('formated date');
  startOfMonthMock.mockReturnValue(1);
  getMonthMock.mockReturnValue(1);
});

test('reports are fetched on mount', () => {
  shallow(<DashboardWidgetBase {...props} />);
  expect(props.fetchReports).toBeCalledWith(props.widgetId);
});

test('title is translated', () => {
  shallow(<DashboardWidgetBase {...props} />);
  expect(getTranslateCallForKey(props.titleKey)).toMatchSnapshot();
});

test('subtitle is translated with single date', () => {
  shallow(<DashboardWidgetBase {...props} />);
  expect(getTranslateCallForKey('dashboard.widget_subtitle')).toMatchSnapshot();
});

test('subtitle is translated with date range', () => {
  getDateMock.mockReturnValueOnce(2);
  shallow(<DashboardWidgetBase {...props} />);
  expect(getTranslateCallForKey('dashboard.widget_subtitle')).toMatchSnapshot();
});

test('trend title is translated', () => {
  shallow(<DashboardWidgetBase {...props} />);
  expect(getTranslateCallForKey(props.trend.titleKey)).toMatchSnapshot();
});

function getTranslateCallForKey(key: string) {
  return (props.t as jest.Mock).mock.calls.find(([k]) => k === key);
}