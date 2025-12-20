const { sequelize } = require('../backend/src/config/database');
const IntentSignal = require('../backend/src/modules/abm/intent_signal.model');

async function checkDuplicates() {
    try {
        console.log('Checking Intent Signals...');
        const allSignals = await IntentSignal.findAll();
        console.log(`Total Signals: ${allSignals.length}`);

        // Group by likely duplicate fields
        const counts = {};
        for (const s of allSignals) {
            const key = `${s.AccountId}-${s.signalType}-${s.source}`;
            counts[key] = (counts[key] || 0) + 1;
        }

        let dupes = 0;
        for (const [key, count] of Object.entries(counts)) {
            if (count > 1) {
                dupes++;
                // console.log(`Duplicate found: ${key} (Count: ${count})`);
            }
        }

        console.log(`Found ${dupes} sets of duplicates (same Account + Link + Source).`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkDuplicates();
