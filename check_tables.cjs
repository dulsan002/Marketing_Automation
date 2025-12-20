const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'backend/database.sqlite', // running from root
    logging: false
});

async function check() {
    try {
        await sequelize.authenticate();
        console.log('Connected.');
        const [results, metadata] = await sequelize.query("SELECT name FROM sqlite_master WHERE type='table';");
        console.log('Tables:', results.map(r => r.name));
    } catch (e) {
        console.error(e);
    }
}
check();
