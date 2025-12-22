const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');
const Account = require('../abm/account.model');

const Contact = sequelize.define('Contact', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    company: {
        type: DataTypes.STRING,
        allowNull: true
    },
    jobTitle: {
        type: DataTypes.STRING,
        allowNull: true
    },
    score: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    engagementScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    intentScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    lastScoredAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    tags: {
        type: DataTypes.JSON, // Storing tags as a JSON array ["vip", "lead"]
        defaultValue: []
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['email', 'TenantId'] // Email must be unique per tenant
        }
    ]
});

// Explicit FK Definition for Constraints
Contact.belongsTo(Tenant, { foreignKey: { allowNull: false } });
Tenant.hasMany(Contact);

Contact.belongsTo(Account, { foreignKey: { allowNull: true } }); // Changed to allow contacts without ABM accounts
Account.hasMany(Contact);

module.exports = Contact;
