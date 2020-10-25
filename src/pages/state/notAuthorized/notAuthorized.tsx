import { Main } from '@redhat-cloud-services/frontend-components/components/Main';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/components/PageHeader';
import React from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { NotAuthorizedState } from './notAuthorizedState';

interface NotAuthorizedOwnProps {
  serviceName?: string;
  title?: string;
}

type NotAuthorizedProps = NotAuthorizedOwnProps & RouteComponentProps<void>;

const NotAuthorized = ({ serviceName, title }: NotAuthorizedProps) => {
  return (
    <>
      {title && (
        <PageHeader>
          <PageHeaderTitle title={title} />
        </PageHeader>
      )}
      <Main>
        <NotAuthorizedState serviceName={serviceName} />
      </Main>
    </>
  );
};

export default withRouter(NotAuthorized);
