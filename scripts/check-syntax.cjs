try {
    const controller = require('../backend/src/modules/abm/account.controller');
    console.log('Syntax check passed. Controller loaded.');
    if (typeof controller.getAnalytics !== 'function') {
        console.error('getAnalytics is NOT a function!');
        process.exit(1);
    } else {
        console.log('getAnalytics is exported correctly.');
    }
} catch (e) {
    console.error('Syntax or Load Error:', e);
    process.exit(1);
}
