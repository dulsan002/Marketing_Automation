const { connectDB } = require('./src/config/database');
const Account = require('./src/modules/abm/account.model');
const Contact = require('./src/modules/contacts/contact.model');
const IntentSignal = require('./src/modules/abm/intent_signal.model');
const { Op } = require('sequelize');

const run = async () => {
    await connectDB();

    console.log('\n--- Checking Accounts ---');
    const accounts = await Account.findAll({
        where: { name: { [Op.like]: '%Manufacturing%' } }
    });
    accounts.forEach(a => {
        console.log(`ID: ${a.id}, Name: "${a.name}", Score: ${a.intentScore}, Signals: ${a.intentSignals}, Tier: ${a.tier}`);
    });

    console.log('\n--- Checking Contact (Mary) ---');
    const contacts = await Contact.findAll({
        where: { email: { [Op.like]: '%mary.jones%' } },
        include: [Account]
    });
    contacts.forEach(c => {
        console.log(`ID: ${c.id}, Name: ${c.firstName} ${c.lastName}, Email: ${c.email}`);
        console.log(`   -> Linked Account: ${c.Account ? c.Account.name : 'NONE'} (ID: ${c.AccountId})`);
        console.log(`   -> Intent Score: ${c.intentScore}`);
    });

    console.log('\n--- Recent Intent Signals for these Accounts ---');
    const accountIds = accounts.map(a => a.id);
    const signals = await IntentSignal.findAll({
        where: { accountId: { [Op.in]: accountIds } },
        order: [['createdAt', 'DESC']],
        limit: 5
    });
    signals.forEach(s => {
        console.log(`Signal: ${s.activityType} | Source: ${s.source} | Account: ${s.accountId} | Date: ${s.createdAt}`);
    });

    process.exit();
};

run();
