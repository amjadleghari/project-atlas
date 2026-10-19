import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  guidesSidebar: [
    'index',
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: ['guides/publishing-contracts', 'guides/canonical-data-model', 'guides/authentication'],
    },
  ],
};

export default sidebars;
