import { CardBody, CardFooter } from '@patternfly/react-core';
import { mount } from 'enzyme';
import React from 'react';
import { FetchStatus } from 'store/common';
import {
  OcpOnAwsReportSummary,
  OcpOnAwsReportSummaryProps,
} from './ocpOnAwsReportSummary';

const props: OcpOnAwsReportSummaryProps = {
  title: 'report title',
  status: FetchStatus.complete,
  t: jest.fn(v => `t(${v})`),
};

test('on fetch status in progress show loading text', () => {
  const view = mount(
    <OcpOnAwsReportSummary {...props} status={FetchStatus.inProgress} />
  );
  expect(view.find(CardBody).text()).toEqual('t(loading)...');
});

test('on fetch status complete display reports', () => {
  const view = mount(
    <OcpOnAwsReportSummary {...props}>hello world</OcpOnAwsReportSummary>
  );
  expect(view.find(CardBody).text()).toEqual('hello world');
});

test('show subtitle if given', () => {
  const view = mount(
    <OcpOnAwsReportSummary {...props} subTitle={'sub-title'} />
  );
  expect(view.find('p').length).toBe(1);
  expect(view.find('p').text()).toEqual('sub-title');
});

test('show details link in card footer if given', () => {
  const view = mount(
    <OcpOnAwsReportSummary {...props} detailsLink={<a href="#">link</a>} />
  );
  expect(view.find(CardFooter).length).toBe(1);
  expect(view.find(CardFooter).text()).toEqual('link');
});
