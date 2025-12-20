try {
    console.log('Requiring database...');
    const db = require('../config/database');
    console.log('database loaded');
} catch (error) {
    console.error('Failed to require database:', error);
}
