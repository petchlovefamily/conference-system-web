const express = require('express');
const route = express.Router();
const { authenticate, requireAuth, requireRole, getHomePageForRole, canAccessRoute } = require('../middleware/auth');

// Login Page
route.get('/login', (req, res) => {
  if ((req.session && req.session.user) || (req.cookies && req.cookies.auth_token)) {
    // Determine role from session or cookie for redirect
    const user = req.session.user || JSON.parse(req.cookies.auth_token);
    return res.redirect(getHomePageForRole(user.role));
  }
  res.render('auth-login', { title: 'Login', layout: false, error: null });
});

// Login POST
route.post('/login', express.urlencoded({ extended: true }), (req, res) => {
  const { username, password } = req.body;
  const user = authenticate(username, password);

  if (user) {
    req.session.user = user;
    // Set persistent cookie for Vercel
    res.cookie('auth_token', JSON.stringify(user), {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: true, // Required for Vercel HTTPS
      sameSite: 'lax'
    });
    res.redirect(getHomePageForRole(user.role));
  } else {
    res.render('auth-login', { title: 'Login', layout: false, error: 'Invalid username or password' });
  }
});

// Logout
route.get('/logout', (req, res) => {
  req.session.destroy();
  res.clearCookie('auth_token');
  res.redirect('/login');
});

// Auth middleware - apply to all routes below
route.use((req, res, next) => {
  // Check session first, then cookie (for Vercel persistence)
  if (req.session && req.session.user) {
    res.locals.user = req.session.user;
    return next();
  }

  if (req.cookies && req.cookies.auth_token) {
    try {
      // Restore session from cookie
      const user = JSON.parse(req.cookies.auth_token);
      req.session.user = user;
      res.locals.user = user;
      return next();
    } catch (e) {
      // Invalid cookie, clear it
      res.clearCookie('auth_token');
    }
  }

  return res.redirect('/login');
});

route.get('/', (req, res, next) => {
  res.render('index', { title: 'Dashboard' });
})

route.get('/apps-calendar', (req, res, next) => {
  res.render('apps-calendar', { title: 'Calendar' });
})

route.get('/apps-chat', (req, res, next) => {
  res.render('apps-chat', { title: 'Chat' });
})

route.get('/apps-email', (req, res, next) => {
  res.render('apps-email', { title: 'Inbox' });
})

route.get('/apps-file-manager', (req, res, next) => {
  res.render('apps-file-manager', { title: 'File Manager' });
})

route.get('/apps-invoice-create', (req, res, next) => {
  res.render('apps-invoice-create', { title: 'Invoice Create' });
})

route.get('/apps-invoice-details', (req, res, next) => {
  res.render('apps-invoice-details', { title: 'Invoice Details' });
})

route.get('/apps-invoices', (req, res, next) => {
  res.render('apps-invoices', { title: 'Invoices' });
})

route.get('/apps-kanban', (req, res, next) => {
  res.render('apps-kanban', { title: 'Kanban Board' });
})

route.get('/apps-projects', (req, res, next) => {
  res.render('apps-projects', { title: 'Projects' });
})

route.get('/apps-task-details', (req, res, next) => {
  res.render('apps-task-details', { title: 'Task Details' });
})

route.get('/apps-tickets', (req, res, next) => {
  res.render('apps-tickets', { title: 'Tickets' });
})

route.get('/apps-user-contacts', (req, res, next) => {
  res.render('apps-user-contacts', { title: 'User Contacts' });
})

route.get('/apps-user-profile', (req, res, next) => {
  res.render('apps-user-profile', { title: 'User Profile' });
})

route.get('/auth-confirm-mail', (req, res, next) => {
  res.render('auth-confirm-mail', { title: 'Confirm Mail', layout: 'partials/base-layout' });
})

route.get('/auth-createpw', (req, res, next) => {
  res.render('auth-createpw', { title: 'Create Password', layout: 'partials/base-layout' });
})

route.get('/auth-lock-screen', (req, res, next) => {
  res.render('auth-lock-screen', { title: 'Lock Screen', layout: 'partials/base-layout' });
})

route.get('/auth-login-pin', (req, res, next) => {
  res.render('auth-login-pin', { title: 'Login Pin', layout: 'partials/base-layout' });
})

route.get('/auth-login', (req, res, next) => {
  res.render('auth-login', { title: 'Login', layout: 'partials/base-layout' });
})

route.get('/auth-logout', (req, res, next) => {
  res.render('auth-logout', { title: 'Logout', layout: 'partials/base-layout' });
})

route.get('/auth-recoverpw', (req, res, next) => {
  res.render('auth-recoverpw', { title: 'Recover Password', layout: 'partials/base-layout' });
})

route.get('/auth-register', (req, res, next) => {
  res.render('auth-register', { title: 'Sign Up', layout: 'partials/base-layout' });
})

route.get('/charts-apex-area', (req, res, next) => {
  res.render('charts-apex-area', { title: 'Area Charts' });
})

route.get('/charts-apex-bar', (req, res, next) => {
  res.render('charts-apex-bar', { title: 'Bar Charts' });
})

route.get('/charts-apex-boxplot', (req, res, next) => {
  res.render('charts-apex-boxplot', { title: 'Boxplot Charts' });
})

route.get('/charts-apex-bubble', (req, res, next) => {
  res.render('charts-apex-bubble', { title: 'Bubble Charts' });
})

route.get('/charts-apex-candlestick', (req, res, next) => {
  res.render('charts-apex-candlestick', { title: 'Candlestick Charts' });
})

route.get('/charts-apex-column', (req, res, next) => {
  res.render('charts-apex-column', { title: 'Column Charts' });
})

route.get('/charts-apex-funnel', (req, res, next) => {
  res.render('charts-apex-funnel', { title: 'Funnel Charts', subtitle: 'Apex' });
})

route.get('/charts-apex-heatmap', (req, res, next) => {
  res.render('charts-apex-heatmap', { title: 'Heatmap Charts' });
})

route.get('/charts-apex-line', (req, res, next) => {
  res.render('charts-apex-line', { title: 'Line Charts' });
})

route.get('/charts-apex-mixed', (req, res, next) => {
  res.render('charts-apex-mixed', { title: 'Mixed Charts' });
})

route.get('/charts-apex-pie', (req, res, next) => {
  res.render('charts-apex-pie', { title: 'Pie Charts' });
})

route.get('/charts-apex-polar-area', (req, res, next) => {
  res.render('charts-apex-polar-area', { title: 'Polar Area Charts' });
})

route.get('/charts-apex-radar', (req, res, next) => {
  res.render('charts-apex-radar', { title: 'Radar Charts' });
})

route.get('/charts-apex-radialbar', (req, res, next) => {
  res.render('charts-apex-radialbar', { title: 'Radialbar Charts' });
})

route.get('/charts-apex-scatter', (req, res, next) => {
  res.render('charts-apex-scatter', { title: 'Scatter Charts' });
})

route.get('/charts-apex-slope', (req, res, next) => {
  res.render('charts-apex-slope', { title: 'Slope Charts', subtitle: 'Apex' });
})

route.get('/charts-apex-sparklines', (req, res, next) => {
  res.render('charts-apex-sparklines', { title: 'Sparklines Charts' });
})

route.get('/charts-apex-timeline', (req, res, next) => {
  res.render('charts-apex-timeline', { title: 'Timeline Charts' });
})

route.get('/charts-apex-treemap', (req, res, next) => {
  res.render('charts-apex-treemap', { title: 'Treemap Charts' });
})

route.get('/error-400', (req, res, next) => {
  res.render('error-400', { title: 'Error 400', layout: 'partials/base-layout' });
})

route.get('/error-401', (req, res, next) => {
  res.render('error-401', { title: 'Error 401', layout: 'partials/base-layout' });
})

route.get('/error-403', (req, res, next) => {
  res.render('error-403', { title: 'Error 403', layout: 'partials/base-layout' });
})

route.get('/error-404-alt', (req, res, next) => {
  res.render('error-404-alt', { title: 'Error 404' });
})

route.get('/error-404', (req, res, next) => {
  res.render('error-404', { title: 'Error 404', layout: 'partials/base-layout' });
})

route.get('/error-500', (req, res, next) => {
  res.render('error-500', { title: 'Error 500', layout: 'partials/base-layout' });
})

route.get('/error-service-unavailable', (req, res, next) => {
  res.render('error-service-unavailable', { title: 'Error 408', layout: 'partials/base-layout' });
})

route.get('/extended-dragula', (req, res, next) => {
  res.render('extended-dragula', { title: 'Dragula' });
})

route.get('/extended-ratings', (req, res, next) => {
  res.render('extended-ratings', { title: 'Ratings' });
})

route.get('/extended-scrollbar', (req, res, next) => {
  res.render('extended-scrollbar', { title: 'Scrollbar' });
})

route.get('/extended-sweetalerts', (req, res, next) => {
  res.render('extended-sweetalerts', { title: 'Sweet Alerts' });
})

route.get('/form-editors', (req, res, next) => {
  res.render('form-editors', { title: 'Editors' });
})

route.get('/form-elements', (req, res, next) => {
  res.render('form-elements', { title: 'Form Elements' });
})

route.get('/form-fileuploads', (req, res, next) => {
  res.render('form-fileuploads', { title: 'Fileuploads' });
})

route.get('/form-inputmask', (req, res, next) => {
  res.render('form-inputmask', { title: 'Inputmask' });
})

route.get('/form-layouts', (req, res, next) => {
  res.render('form-layouts', { title: 'Layouts' });
})

route.get('/form-picker', (req, res, next) => {
  res.render('form-picker', { title: 'Picker' });
})

route.get('/form-range-slider', (req, res, next) => {
  res.render('form-range-slider', { title: 'Range Slider' });
})

route.get('/form-select', (req, res, next) => {
  res.render('form-select', { title: 'Select' });
})

route.get('/form-validation', (req, res, next) => {
  res.render('form-validation', { title: 'Validation' });
})

route.get('/form-wizard', (req, res, next) => {
  res.render('form-wizard', { title: 'Wizard' });
})

route.get('/icons-remix', (req, res, next) => {
  res.render('icons-remix', { title: 'Remixicon' });
})

route.get('/icons-solar', (req, res, next) => {
  res.render('icons-solar', { title: 'Solar Icons' });
})

route.get('/icons-tabler', (req, res, next) => {
  res.render('icons-tabler', { title: 'Tabler Icons' });
})

route.get('/index', (req, res, next) => {
  res.render('index', { title: 'Dashboard' });
})

route.get('/layouts-compact', (req, res, next) => {
  res.render('layouts-compact', { title: 'Compact' });
})

route.get('/layouts-detached', (req, res, next) => {
  res.render('layouts-detached', { title: 'Detached' });
})

route.get('/layouts-full', (req, res, next) => {
  res.render('layouts-full', { title: 'Full Layouts' });
})

route.get('/layouts-fullscreen', (req, res, next) => {
  res.render('layouts-fullscreen', { title: 'Fullscreen' });
})

route.get('/layouts-horizontal', (req, res, next) => {
  res.render('layouts-horizontal', { title: 'Horizontal Layout', layout: 'partials/base-layout' });
})

route.get('/layouts-hover', (req, res, next) => {
  res.render('layouts-hover', { title: 'Hover' });
})

route.get('/layouts-icon-view', (req, res, next) => {
  res.render('layouts-icon-view', { title: 'Icon View' });
})

route.get('/maps-google', (req, res, next) => {
  res.render('maps-google', { title: 'Google Maps' });
})

route.get('/maps-leaflet', (req, res, next) => {
  res.render('maps-leaflet', { title: 'Leaflet Maps' });
})

route.get('/maps-vector', (req, res, next) => {
  res.render('maps-vector', { title: 'Vector Maps' });
})

route.get('/pages-coming-soon', (req, res, next) => {
  res.render('pages-coming-soon', { title: 'Coming Soon', layout: 'partials/base-layout' });
})

route.get('/pages-faq', (req, res, next) => {
  res.render('pages-faq', { title: 'Faq' });
})

route.get('/pages-maintenance', (req, res, next) => {
  res.render('pages-maintenance', { title: 'Maintenance', layout: 'partials/base-layout' });
})

route.get('/pages-pricing', (req, res, next) => {
  res.render('pages-pricing', { title: 'Pricing' });
})

route.get('/pages-starter', (req, res, next) => {
  res.render('pages-starter', { title: 'Starter Page' });
})

route.get('/pages-terms-conditions', (req, res, next) => {
  res.render('pages-terms-conditions', { title: 'Terms & Conditions' });
})

route.get('/pages-timeline', (req, res, next) => {
  res.render('pages-timeline', { title: 'Timeline' });
})

route.get('/tables-basic', (req, res, next) => {
  res.render('tables-basic', { title: 'Basic Tables ' });
})

route.get('/tables-datatable', (req, res, next) => {
  res.render('tables-datatable', { title: 'Datatable Tables ' });
})

route.get('/tables-gridjs', (req, res, next) => {
  res.render('tables-gridjs', { title: 'Gridjs Tables ' });
})

route.get('/ui-accordions', (req, res, next) => {
  res.render('ui-accordions', { title: 'Accordions' });
})

route.get('/ui-alerts', (req, res, next) => {
  res.render('ui-alerts', { title: 'Alerts' });
})

route.get('/ui-avatars', (req, res, next) => {
  res.render('ui-avatars', { title: 'Avatars' });
})

route.get('/ui-badges', (req, res, next) => {
  res.render('ui-badges', { title: 'Badges' });
})

route.get('/ui-breadcrumb', (req, res, next) => {
  res.render('ui-breadcrumb', { title: 'Breadcrumb' });
})

route.get('/ui-buttons', (req, res, next) => {
  res.render('ui-buttons', { title: 'Buttons' });
})

route.get('/ui-cards', (req, res, next) => {
  res.render('ui-cards', { title: 'Cards' });
})

route.get('/ui-carousel', (req, res, next) => {
  res.render('ui-carousel', { title: 'Carousel' });
})

route.get('/ui-collapse', (req, res, next) => {
  res.render('ui-collapse', { title: 'Collapse' });
})

route.get('/ui-dropdowns', (req, res, next) => {
  res.render('ui-dropdowns', { title: 'Dropdowns' });
})

route.get('/ui-embed-video', (req, res, next) => {
  res.render('ui-embed-video', { title: 'Embed Video' });
})

route.get('/ui-grid', (req, res, next) => {
  res.render('ui-grid', { title: 'Grid' });
})

route.get('/ui-links', (req, res, next) => {
  res.render('ui-links', { title: 'Links' });
})

route.get('/ui-list-group', (req, res, next) => {
  res.render('ui-list-group', { title: 'List Group' });
})

route.get('/ui-modals', (req, res, next) => {
  res.render('ui-modals', { title: 'Modals' });
})

route.get('/ui-notifications', (req, res, next) => {
  res.render('ui-notifications', { title: 'Notifications' });
})

route.get('/ui-offcanvas', (req, res, next) => {
  res.render('ui-offcanvas', { title: 'Offcanvas' });
})

route.get('/ui-pagination', (req, res, next) => {
  res.render('ui-pagination', { title: 'Pagination' });
})

route.get('/ui-placeholders', (req, res, next) => {
  res.render('ui-placeholders', { title: 'Placeholders' });
})

route.get('/ui-popovers', (req, res, next) => {
  res.render('ui-popovers', { title: 'Popovers' });
})

route.get('/ui-progress', (req, res, next) => {
  res.render('ui-progress', { title: 'Progress' });
})

route.get('/ui-ratios', (req, res, next) => {
  res.render('ui-ratios', { title: 'Ratios' });
})

route.get('/ui-scrollspy', (req, res, next) => {
  res.render('ui-scrollspy', { title: 'Scrollspy' });
})

route.get('/ui-spinners', (req, res, next) => {
  res.render('ui-spinners', { title: 'Spinners' });
})

route.get('/ui-tabs', (req, res, next) => {
  res.render('ui-tabs', { title: 'Tabs' });
})

route.get('/ui-tooltips', (req, res, next) => {
  res.render('ui-tooltips', { title: 'Tooltips' });
})

route.get('/ui-typography', (req, res, next) => {
  res.render('ui-typography', { title: 'Typography' });
})

route.get('/ui-utilities', (req, res, next) => {
  res.render('ui-utilities', { title: 'Utilities' });
})

route.get('/widgets', (req, res, next) => {
  res.render('widgets', { title: 'Widgets' });
})

// ============================================
// Conference Management API Routes
// ============================================

// Events - Admin only
route.get('/events-list', requireRole(['admin']), (req, res, next) => {
  res.render('events-list', { title: 'All Events' });
})

route.get('/events-create', requireRole(['admin']), (req, res, next) => {
  res.render('events-create', { title: 'Create Event' });
})

route.get('/events-edit', requireRole(['admin']), (req, res, next) => {
  res.render('events-edit', { title: 'Edit Event' });
})

route.get('/events-sessions', requireRole(['admin']), (req, res, next) => {
  res.render('events-sessions', { title: 'Sessions & Tracks' });
})

route.get('/events-speakers', requireRole(['admin']), (req, res, next) => {
  res.render('events-speakers', { title: 'Speakers' });
})

// Tickets - Admin only
route.get('/tickets-types', requireRole(['admin']), (req, res, next) => {
  res.render('tickets-types', { title: 'Ticket Types' });
})

route.get('/tickets-promo', requireRole(['admin']), (req, res, next) => {
  res.render('tickets-promo', { title: 'Promo Codes' });
})

// Registrations - Admin only
route.get('/registrations', requireRole(['admin']), (req, res, next) => {
  res.render('registrations', { title: 'Registrations' });
})

// Payments - Admin only
route.get('/payments', requireRole(['admin']), (req, res, next) => {
  res.render('payments', { title: 'Payments' });
})

// Abstracts - Admin and Reviewer
route.get('/abstracts', requireRole(['admin', 'reviewer']), (req, res, next) => {
  res.render('abstracts', { title: 'Abstracts' });
})

// Users - Admin only
route.get('/users', requireRole(['admin']), (req, res, next) => {
  res.render('users', { title: 'Users' });
})

// Check-in - Admin and Staff
route.get('/checkin-scanner', requireRole(['admin', 'staff']), (req, res, next) => {
  res.render('checkin-scanner', { title: 'QR Scanner' });
})

// Mobile Scanner - Full screen (Admin and Staff)
route.get('/checkin-mobile', requireRole(['admin', 'staff']), (req, res, next) => {
  res.render('checkin-mobile', { layout: false });
})

// Reports - Admin only
route.get('/reports-revenue', requireRole(['admin']), (req, res, next) => {
  res.render('reports-revenue', { title: 'Revenue Report' });
})

route.get('/reports-registrations', requireRole(['admin']), (req, res, next) => {
  res.render('reports-registrations', { title: 'Registration Stats' });
})

route.get('/reports-attendance', requireRole(['admin']), (req, res, next) => {
  res.render('reports-attendance', { title: 'Attendance Report' });
})

// Settings - Admin only
route.get('/settings-general', requireRole(['admin']), (req, res, next) => {
  res.render('settings-general', { title: 'General Settings' });
})

route.get('/settings-stripe', requireRole(['admin']), (req, res, next) => {
  res.render('settings-stripe', { title: 'Stripe Integration' });
})

route.get('/settings-email', requireRole(['admin']), (req, res, next) => {
  res.render('settings-email', { title: 'Email Settings' });
})

route.get('/settings-notifications', requireRole(['admin']), (req, res, next) => {
  res.render('settings-notifications', { title: 'Notifications' });
})

// API Docs - Admin only
route.get('/api-docs', requireRole(['admin']), (req, res, next) => {
  res.render('api-docs', { title: 'API Documentation' });
})

module.exports = route
