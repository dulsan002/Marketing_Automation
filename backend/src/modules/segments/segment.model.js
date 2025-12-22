const { DataTypes } = require('sequelize');
const { sequelize } = require('../../config/database');
const Tenant = require('../tenants/tenant.model');

const Segment = sequelize.define('Segment', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    type: {
        type: DataTypes.ENUM('Dynamic', 'Static'),
        defaultValue: 'Dynamic'
    },
    // Aligned with Frontend ProspectSegment interface
    ruleGroups: {
        type: DataTypes.JSON,
        defaultValue: []
        // Structure: [{ condition: 'AND', rules: [{ field, operator, value }] }]
    },
    rulesCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    members: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    memberChange: {
        type: DataTypes.INTEGER,
        defaultValue: 0 // Percentage
    },
    lastCalculated: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    timestamps: true,
    hooks: {
        beforeSave: (segment) => {
            // Auto-calculate rulesCount if ruleGroups changes
            if (segment.changed('ruleGroups') && Array.isArray(segment.ruleGroups)) {
                let count = 0;
                segment.ruleGroups.forEach(group => {
                    if (group.rules && Array.isArray(group.rules)) {
                        count += group.rules.length;
                    }
                });
                segment.rulesCount = count;
            }
        }
    }
});

// Associations
Segment.belongsTo(Tenant, { foreignKey: { allowNull: false } });
Tenant.hasMany(Segment);

module.exports = Segment;
