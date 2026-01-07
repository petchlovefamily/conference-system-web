// Auth Middleware - Role-Based Access Control

// Mock users for demo (in production, use database)
const mockUsers = {
    admin: { id: 1, username: 'admin', password: 'admin123', name: 'Administrator', role: 'admin' },
    organizer: { id: 2, username: 'organizer', password: 'org123', name: 'Event Organizer', role: 'organizer' },
    staff: { id: 3, username: 'staff', password: 'staff123', name: 'Check-in Staff', role: 'staff' },
    reviewer: { id: 4, username: 'reviewer', password: 'rev123', name: 'Abstract Reviewer', role: 'reviewer' }
};

// Role-based access definitions
const roleAccess = {
    admin: ['*'], // All routes
    organizer: ['/', '/index', '/dashboard'],
    staff: ['/checkin-scanner'],
    reviewer: ['/abstracts']
};

// Get user by credentials
function authenticate(username, password) {
    const user = mockUsers[username];
    if (user && user.password === password) {
        const { password: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    return null;
}

// Middleware: Check if user is logged in
function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
        next();
    } else {
        res.redirect('/login');
    }
}

// Middleware: Check if user has required role
function requireRole(allowedRoles) {
    return function (req, res, next) {
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }

        const userRole = req.session.user.role;

        // Admin has access to everything
        if (userRole === 'admin') {
            return next();
        }

        // Check if user's role is in allowed roles
        if (allowedRoles.includes(userRole)) {
            return next();
        }

        // Access denied
        res.status(403).render('auth-403', {
            title: 'Access Denied',
            layout: 'partials/layout-auth'
        });
    };
}

// Check if user can access a specific route
function canAccessRoute(userRole, route) {
    if (userRole === 'admin') return true;

    const allowedRoutes = roleAccess[userRole] || [];
    return allowedRoutes.some(allowed => {
        if (allowed === '*') return true;
        return route === allowed || route.startsWith(allowed + '/') || route.startsWith(allowed + '?');
    });
}

// Get home page based on role
function getHomePageForRole(role) {
    switch (role) {
        case 'admin': return '/';
        case 'organizer': return '/';
        case 'staff': return '/checkin-scanner';
        case 'reviewer': return '/abstracts';
        default: return '/';
    }
}

module.exports = {
    mockUsers,
    roleAccess,
    authenticate,
    requireAuth,
    requireRole,
    canAccessRoute,
    getHomePageForRole
};
