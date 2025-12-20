const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            is: /^[a-z0-9-]+$/i, // Slugs should be url-safe
        }
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE',
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'), // Matches seed
        defaultValue: 'free',
    }
}, {
    timestamps: true,
    paranoid: true,
});

module.exports = Tenant;
