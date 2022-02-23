import global_BackgroundColor_light_100 from '@patternfly/react-tokens/dist/js/global_BackgroundColor_light_100';
import global_danger_color_200 from '@patternfly/react-tokens/dist/js/global_danger_color_200';
import global_FontSize_sm from '@patternfly/react-tokens/dist/js/global_FontSize_sm';
import global_spacer_3xl from '@patternfly/react-tokens/dist/js/global_spacer_3xl';
import global_spacer_md from '@patternfly/react-tokens/dist/js/global_spacer_md';
import React from 'react';

export const styles = {
  download: {
    marginLeft: '-15px',
  },
  emptyState: {
    backgroundColor: global_BackgroundColor_light_100.value,
    display: 'flex',
    justifyContent: 'center',
    paddingTop: global_spacer_3xl.value,
    height: '35vh',
    width: '100%',
  },
  failed: {
    color: global_danger_color_200.value,
  },
  failedButton: {
    fontSize: global_FontSize_sm.value,
    marginLeft: '-10px',
  },
  failedHeader: {
    marginLeft: global_spacer_md.value,
  },
} as { [className: string]: React.CSSProperties };