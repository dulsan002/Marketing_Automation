const { syncDb } = require('./test_helper');

(async () => {
    try {
        await syncDb();
        console.log('Database sync successful.');
        process.exit(0);
    } catch (error) {
        console.error('Database sync failed:', error);
        process.exit(1);
    }
})();
