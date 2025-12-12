// Unified Design System for PGO Record Management

export const DESIGN_SYSTEM = {
  // Colors
  colors: {
    primary: 'indigo-600',
    primaryHover: 'indigo-700',
    primaryLight: 'indigo-50',
    secondary: 'gray-600',
    success: 'green-600',
    successBg: 'green-100',
    successText: 'green-800',
    warning: 'yellow-600',
    warningBg: 'yellow-100',
    warningText: 'yellow-800',
    danger: 'red-600',
    dangerBg: 'red-100',
    dangerText: 'red-800',
    info: 'blue-600',
    infoBg: 'blue-100',
    infoText: 'blue-800',
  },

  // Typography
  typography: {
    pageTitle: 'text-2xl font-bold text-gray-900',
    pageSubtitle: 'text-sm text-gray-600',
    sectionTitle: 'text-xl font-bold text-gray-900',
    cardTitle: 'text-lg font-semibold text-gray-900',
    label: 'text-sm font-medium text-gray-700',
    body: 'text-sm text-gray-700',
    bodySmall: 'text-xs text-gray-600',
    tableHeader: 'font-semibold py-1 px-1 text-center text-xs',
    tableCell: 'text-xs py-1 px-1 text-center wrap-break-word whitespace-normal',
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    xxl: '3rem',
  },

  // Border radius
  borderRadius: {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  },

  // Shadows
  shadows: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  },

  // Layout
  layout: {
    sidebarWidth: 'w-64',
    contentPadding: 'p-6',
    headerPadding: 'px-6 py-4',
    cardPadding: 'p-6',
  },

  // Common styles
  commonStyles: {
    pageContainer: 'flex h-screen bg-gray-50',
    sidebar: 'h-full flex flex-col bg-white',
    sidebarBorder: 'border-b border-gray-200',
    topBar: 'bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between',
    contentArea: 'flex-1 overflow-auto p-6 bg-linear-to-br from-gray-100 via-gray-50 to-gray-100',
    card: 'bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden',
    cardHeader: 'px-6 py-4 border-b border-gray-200 flex items-center justify-between',
    table: 'bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden',
    tableHeader: 'bg-gray-50',
    dialog: 'sm:max-w-lg z-50 max-h-[90vh] overflow-y-auto overflow-x-hidden',
    button: {
      primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
      danger: 'bg-red-600 hover:bg-red-700 text-white',
      outline: 'border border-gray-300 hover:bg-gray-50',
    },
  },
};

// Status badge styles
export const getStatusBadgeStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'active':
      return 'bg-blue-100 text-blue-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Font family
export const FONT_FAMILY = 'font-sans';
