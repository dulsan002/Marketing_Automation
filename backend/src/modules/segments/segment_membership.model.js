const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Segment = require('./segment.model');
const Contact = require('../contacts/contact.model');

const SegmentMembership = sequelize.define('SegmentMembership', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    metadata: {
        type: DataTypes.JSON,
        defaultValue: {}
        // e.g. { reason: 'Rule Match', ruleId: 'r1', timestamp: ... }
    },
    enteredAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    exitedAt: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['SegmentId', 'ContactId'],
            where: {
                exitedAt: null
            }
        }
    ]
});

// Associations
Segment.belongsToMany(Contact, { through: SegmentMembership });
Contact.belongsToMany(Segment, { through: SegmentMembership });

module.exports = SegmentMembership;
