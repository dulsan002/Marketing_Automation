try {
    console.log('Requiring auth.utils...');
    const utils = require('../modules/auth/auth.utils');
    console.log('auth.utils loaded:', Object.keys(utils));
} catch (error) {
    console.error('Failed to require auth.utils:', error);
}
