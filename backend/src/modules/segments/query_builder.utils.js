const { Op } = require('sequelize');

/**
 * Translates a single rule into a Sequelize condition
 * @param {Object} rule - { field, operator, value }
 */
const mapRuleToCondition = (rule) => {
    const { field, operator, value } = rule;

    // Robustness: Trim strings
    const safeValue = (typeof value === 'string') ? value.trim() : value;

    // Security: Whitelist allowed fields or check against model attributes?
    // For now, allow known contact fields. In production, validate against model schema.

    switch (operator) {
        case 'equals':
            return { [field]: { [Op.eq]: safeValue } };
        case 'not_equals':
            return { [field]: { [Op.ne]: safeValue } };
        case 'contains':
            return { [field]: { [Op.like]: `%${safeValue}%` } };
        case 'not_contains':
            return { [field]: { [Op.notLike]: `%${safeValue}%` } };
        case 'starts_with':
            return { [field]: { [Op.startsWith]: safeValue } };
        case 'ends_with':
            return { [field]: { [Op.endsWith]: safeValue } };
        case 'gt':
            return { [field]: { [Op.gt]: safeValue } };
        case 'lt':
            return { [field]: { [Op.lt]: safeValue } };
        case 'gte':
            return { [field]: { [Op.gte]: safeValue } };
        case 'lte':
            return { [field]: { [Op.lte]: safeValue } };
        case 'is_empty':
            return {
                [Op.or]: [
                    { [field]: null },
                    { [field]: '' }
                ]
            };
        case 'is_not_empty':
            return {
                [Op.and]: [
                    { [field]: { [Op.ne]: null } },
                    { [field]: { [Op.ne]: '' } }
                ]
            };
        default:
            console.warn(`Unknown operator: ${operator} for field ${field}`);
            return {};
    }
};

/**
 * Translates a group of rules into a Sequelize AND/OR clause
 * @param {Object} group - { condition: 'AND' | 'OR', rules: [] }
 */
const mapGroupToClause = (group) => {
    if (!group.rules || group.rules.length === 0) return {};

    const conditions = group.rules.map(mapRuleToCondition);

    if (group.condition === 'OR') {
        return { [Op.or]: conditions };
    }
    // Default to AND
    return { [Op.and]: conditions };
};

/**
 * Main builder function
 * @param {Array} ruleGroups - Array of rule groups
 * @param {String} matchType - 'AND' (all groups must match) or 'OR' (any group)
 * @returns {Object} Sequelize Where Clause
 */
const buildWhereClause = (ruleGroups, matchType = 'AND') => {
    if (!ruleGroups || ruleGroups.length === 0) return {};

    const groupClauses = ruleGroups.map(mapGroupToClause);

    if (matchType === 'OR') {
        return { [Op.or]: groupClauses };
    }
    return { [Op.and]: groupClauses };
};

module.exports = {
    buildWhereClause
};
