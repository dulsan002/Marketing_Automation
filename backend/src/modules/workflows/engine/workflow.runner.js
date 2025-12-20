const { executeNode } = require('./node.executor');

class WorkflowRunner {
    constructor(workflow, contactId, tenantId) {
        this.workflow = workflow;
        this.contactId = contactId;
        this.tenantId = tenantId;
        this.nodes = workflow.nodes || [];
        this.edges = workflow.edges || [];
    }

    async run() {
        console.log(`[WorkflowRunner] Starting Workflow "${this.workflow.name}" for Contact ${this.contactId}`);

        // Find Start Node
        // Assumption: There is a node of type 'trigger' or we look for a node with no incoming edges?
        // Simpler: The trigger in 'workflow.trigger' might map to a Start Node ID, or we just find type='trigger'.
        const startNode = this.nodes.find(n => n.type === 'trigger');

        if (!startNode) {
            console.error('[WorkflowRunner] No Start Node found.');
            return;
        }

        await this.traverse(startNode);
    }

    async traverse(currentNode) {
        if (!currentNode) return;

        // Execute current node logic
        const { result } = await executeNode(currentNode, this.contactId, this.tenantId);

        // Find outgoing edge based on result
        // If result.result is 'default', find any edge from this source.
        // If 'true'/'false', find edge where sourceHandle matches.

        const edge = this.edges.find(e => {
            if (e.source !== currentNode.id) return false;
            // logic for branching
            if (result && result !== 'default') {
                return e.sourceHandle === result; // e.g. 'true' or 'false'
            }
            return true; // default path
        });

        if (edge) {
            const nextNode = this.nodes.find(n => n.id === edge.target);
            if (nextNode) {
                // Async recursion or loop? Recursion is fine for shallow flows.
                // In production, this would be a queue push to avoid stack overflow or timeouts.
                await this.traverse(nextNode);
            }
        } else {
            console.log(`[WorkflowRunner] End of flow reached at Node ${currentNode.id}`);
        }
    }
}

module.exports = WorkflowRunner;
