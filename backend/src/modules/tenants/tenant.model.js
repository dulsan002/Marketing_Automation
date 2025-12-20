const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');

const Tenant = sequelize.define('Tenant', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    slug: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true
    },
    domain: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'SUSPENDED'),
        defaultValue: 'ACTIVE'
    },
    subscriptionPlan: {
        type: DataTypes.ENUM('free', 'pro', 'enterprise'),
        defaultValue: 'free'
    }
}, {
    timestamps: true,
    paranoid: true
});

module.exports = Tenant;
