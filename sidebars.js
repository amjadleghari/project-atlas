"use strict";
exports.__esModule = true;
var sidebars = {
    guidesSidebar: [
        'index',
        {
            type: 'category',
            label: 'Guides',
            collapsed: false,
            items: [
                'guides/publishing-contracts',
                'guides/partner-documentation',
                'guides/canonical-data-model',
                'guides/authentication',
            ]
        },
        {
            type: 'category',
            label: 'Diagrams',
            collapsed: false,
            link: { type: 'doc', id: 'diagrams/index' },
            items: [
                'diagrams/process-and-interaction',
                'diagrams/structure-and-data',
                'diagrams/behaviour',
                'diagrams/planning-and-change',
                'diagrams/analysis',
            ]
        },
    ]
};
exports["default"] = sidebars;
