import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import { intl as defaultIntl } from 'components/i18n';
import HookIntoProps from 'hook-into-props';
import messages from 'locales/messages';
import React from 'react';
import { injectIntl } from 'react-intl';
import { CreateCostModelButton } from 'routes/costModels/costModelsDetails/createCostModelButton';

import EmptyStateBase from './emptyStateBase';

// defaultIntl required for testing
const NoCostModels = HookIntoProps(({ intl = defaultIntl }) => {
  return {
    title: intl.formatMessage(messages.costModelsEmptyState),
    description: intl.formatMessage(messages.costModelsEmptyStateDesc),
    icon: PlusCircleIcon,
    actions: (
      <>
        <CreateCostModelButton />
        <br />
        <br />
        <a href={intl.formatMessage(messages.docsConfigCostModels)} rel="noreferrer" target="_blank">
          {intl.formatMessage(messages.costModelsEmptyStateLearnMore)}
        </a>
      </>
    ),
  };
})(EmptyStateBase);

export default injectIntl(NoCostModels);