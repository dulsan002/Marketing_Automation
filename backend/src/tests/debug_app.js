try {
    console.log('Requiring app...');
    const app = require('../app');
    console.log('app loaded successfully');
} catch (error) {
    console.error('Failed to require app:', error);
}
