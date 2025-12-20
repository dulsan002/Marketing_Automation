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
    status: {
        type: DataTypes.ENUM('Registered', 'Attended', 'Cancelled', 'NoShow', 'Pending'),
        defaultValue: 'Pending'
    },
    checkInTime: {
        type: DataTypes.DATE,
        allowNull: true
    },
    // Snapshot Attributes
    firstName: { type: DataTypes.STRING, allowNull: true },
    lastName: { type: DataTypes.STRING, allowNull: true },
    email: { type: DataTypes.STRING, allowNull: true },
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
