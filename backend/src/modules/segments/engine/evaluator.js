const BehavioralService = require('./behavioral.service');

/**
 * Enterprise Rule Evaluator.
 * Supports:
 * - Sync Attribute matching
 * - Async Behavioral matching (ClickHouse)
 */

const evaluateCondition = async (contact, condition) => {
    // 1. Behavioral Rule?
    // Convention: If 'eventType' is present, it's behavioral.
    if (condition.eventType) {
        // e.g. { eventType: 'EMAIL_OPENED', operator: 'greater_than', value: 2, windowDays: 7 }
        return await BehavioralService.checkCondition(contact.id, condition);
    }

    // 2. Attribute Rule
    const { field, operator, value } = condition;

    // Resolve field value
    const contactValue = contact[field] || (contact.attributes && contact.attributes[field]);

    switch (operator) {
        case 'equals':
            return contactValue == value;
        case 'not_equals':
            return contactValue != value;
        case 'contains':
            return (contactValue || '').toString().includes(value);
        case 'greater_than':
            return Number(contactValue) > Number(value);
        case 'less_than':
            return Number(contactValue) < Number(value);
        case 'is_set':
            return contactValue !== null && contactValue !== undefined;
        default:
            return false;
    }
};

const evaluateRuleGroup = async (contact, ruleGroup) => {
    if (!ruleGroup || !ruleGroup.conditions) return false;

    if (ruleGroup.type === 'OR') {
        const results = await Promise.all(ruleGroup.conditions.map(c => evaluateCondition(contact, c)));
        return results.some(r => r === true);
    }

    // Default AND
    const results = await Promise.all(ruleGroup.conditions.map(c => evaluateCondition(contact, c)));
    return results.every(r => r === true);
};

const evaluateContact = async (contact, segmentRules) => {
    if (!segmentRules) return false;

    // Support Array of RuleGroups (OR logic between groups)
    if (Array.isArray(segmentRules)) {
        if (segmentRules.length === 0) return false;

        for (const group of segmentRules) {
            const alignedGroup = {
                type: group.condition || 'AND',
                conditions: group.rules || []
            };
            const match = await evaluateRuleGroup(contact, alignedGroup);
            if (match) return true;
        }
        return false;
    }

    return await evaluateRuleGroup(contact, segmentRules);
};

module.exports = {
    evaluateContact
};
