const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Event = require('./event.model');
const Contact = require('../contacts/contact.model');

const Registration = sequelize.define('Registration', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    checkInTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    banReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('Registered', 'Confirmed', 'Attended', 'Cancelled', 'NoShow', 'Pending', 'Banned'),
        defaultValue: 'Pending'
    },
    // Snapshot Attributes
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: false },
    company: { type: DataTypes.STRING, allowNull: true },
    jobTitle: { type: DataTypes.STRING, allowNull: true }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['EventId', 'ContactId']
        }
    ]
});

Registration.belongsTo(Event);
Event.hasMany(Registration);

Registration.belongsTo(Contact);
Contact.hasMany(Registration);

module.exports = Registration;
