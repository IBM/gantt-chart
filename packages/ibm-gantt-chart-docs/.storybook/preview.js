import { create } from '@storybook/theming';

const preview = {
  parameters: {
    options: {
      theme: create({
        base: 'light',
        brandTitle: `${NAME}@${VERSION}`,
        brandUrl: REPOSITORY,
      }),
      showPanel: true,
    },
    viewport: {
      viewports: {
        mx: { name: 'View Max', styles: { width: '1584px', height: '100%' } },
        xl: { name: 'View XL', styles: { width: '1312px', height: '100%' } },
        lg: { name: 'View L', styles: { width: '1056px', height: '100%' } },
        md: { name: 'View M', styles: { width: '672px', height: '100%' } },
        sm: { name: 'View S', styles: { width: '320px', height: '100%' } },
      },
    },
  },
};

export default preview;
