const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('./tenant.model');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: Tenant,
            key: 'id',
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    role: {
        type: DataTypes.ENUM('ADMIN', 'MARKETER', 'VIEWER'),
        defaultValue: 'VIEWER',
        allowNull: false,
    },
    status: {
        type: DataTypes.ENUM('active', 'disabled'),
        defaultValue: 'active',
    },
    lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    refreshToken: {
        type: DataTypes.STRING,
        allowNull: true,
    },
}, {
    timestamps: true,
    paranoid: true, // Soft deletes
    indexes: [
        {
            unique: true,
            fields: ['email', 'tenantId'] // Email is unique PER tenant
        }
    ]
});

// Associations
User.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
Tenant.hasMany(User, { foreignKey: 'tenantId', as: 'users' });

module.exports = User;
