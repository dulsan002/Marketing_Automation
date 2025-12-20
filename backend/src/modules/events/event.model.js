const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM('Webinar', 'Conference', 'Workshop'),
        defaultValue: 'Webinar'
    },
    status: {
        type: DataTypes.ENUM('Draft', 'Published', 'Completed', 'Cancelled'),
        defaultValue: 'Draft'
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: true
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true // Null means unlimited
    },
    registeredCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    timestamps: true
});

Event.belongsTo(Tenant);
Tenant.hasMany(Event);

module.exports = Event;
