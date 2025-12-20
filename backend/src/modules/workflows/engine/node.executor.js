const { buildWhereClause } = require('../../segments/query_builder.utils');
const Contact = require('../../contacts/contact.model');

const executeNode = async (node, contactId, tenantId) => {
    console.log(`[NodeExecutor] Executing Node ${node.id} (${node.type}) for Contact ${contactId}`);

    switch (node.type) {
        case 'email':
            // Mock Email Send
            // In real app: await emailService.send(node.data.campaignId, contactId);
            console.log(`[NodeExecutor] 📧 Sending Email (Campaign ${node.data.campaignId}) to ${contactId}`);
            return { nextNodeId: getNextNodeId(node) };

        case 'delay':
            // Mock Delay
            // In real app: queue job for later
            console.log(`[NodeExecutor] ⏳ Delaying for ${node.data.duration}s`);
            return { nextNodeId: getNextNodeId(node) };

        case 'condition':
            // Evaluate condition
            // node.data.rules = same structure as Segment ruleGroups
            const contact = await Contact.findByPk(contactId);
            // We can reuse buildWhereClause or just check manually.
            // For simplicity, let's use a simpler manual check or fetch count for this specific contact.

            // Check if THIS contact matches the rules
            const where = buildWhereClause(node.data.ruleGroups, 'AND');
            const matchCount = await Contact.count({
                where: {
                    id: contactId,
                    ...where
                }
            });

            const isMatch = matchCount > 0;
            console.log(`[NodeExecutor] ❓ Condition Evaluated: ${isMatch}`);

            return { nextNodeId: isMatch ? getNextNodeId(node, 'true') : getNextNodeId(node, 'false') };

        default:
            console.log(`[NodeExecutor] Unknown node type: ${node.type}`);
            return { nextNodeId: getNextNodeId(node) };
    }
};

const getNextNodeId = (node, handle = null) => {
    // This logic usually depends on the 'edges' array which is passed in the Runner context,
    // NOT stored on the node itself usually.
    // So executor might just return "success" or "true/false" result,
    // and Runner determines next node.

    // For this implementation, let's return the RESULT used to find the edge.
    return { result: handle || 'default' };
};

module.exports = { executeNode };
