const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Account = require('./account.model');

const IntentSignal = sequelize.define('IntentSignal', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    accountId: {
        type: DataTypes.UUID,
        allowNull: false
    },
    contactId: {
        type: DataTypes.UUID,
        allowNull: true
    },
    source: {
        type: DataTypes.STRING, // e.g., 'G2', 'Website', 'Email'
        allowNull: false
    },
    activityType: {
        type: DataTypes.STRING, // e.g., 'email_open', 'page_visit'
        allowNull: false
    },
    occurredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    dedupeKey: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false
    }
}, {
    timestamps: true,
    tableName: 'IntentSignals',
    indexes: [
        {
            unique: true,
            fields: ['dedupeKey']
        }
    ]
});

IntentSignal.belongsTo(Account, { foreignKey: 'accountId' });
Account.hasMany(IntentSignal, { foreignKey: 'accountId' });

module.exports = IntentSignal;
