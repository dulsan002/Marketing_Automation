const Segment = require('./segment.model');
const Contact = require('../contacts/contact.model');
const { buildWhereClause } = require('./query_builder.utils');

const calculateMembers = async (segmentId, tenantId) => {
    const segment = await Segment.findOne({ where: { id: segmentId, TenantId: tenantId } });
    if (!segment) throw new Error('Segment not found');

    if (segment.type === 'Static') {
        // For static segments, we might just count associated contacts (if using a join table)
        // For now, return existing count or implementation for static lists
        return segment.members;
    }

    const whereClause = buildWhereClause(segment.ruleGroups, segment.matchType || 'AND');

    // Ensure we only count contacts for this tenant
    const finalWhere = {
        ...whereClause,
        TenantId: tenantId
    };

    const count = await Contact.count({ where: finalWhere });

    await segment.update({
        members: count,
        lastCalculated: new Date()
    });

    return count;
};

const createSegment = async (segmentData) => {
    // initialize with 0
    const segment = await Segment.create({
        ...segmentData,
        members: 0,
        memberChange: 0,
        lastCalculated: new Date()
    });

    // Calculate immediately
    if (segment.type === 'Dynamic') {
        await calculateMembers(segment.id, segmentData.TenantId);
        await segment.reload();
    }

    return segment;
};

const getSegments = async (tenantId) => {
    return await Segment.findAll({ where: { TenantId: tenantId }, order: [['updatedAt', 'DESC']] });
};

const getSegmentById = async (id, tenantId) => {
    const segment = await Segment.findOne({ where: { id, TenantId: tenantId } });
    if (!segment) throw new Error('Segment not found');
    return segment;
};

const updateSegment = async (id, tenantId, updates) => {
    const segment = await getSegmentById(id, tenantId);

    await segment.update(updates);

    // If rules changed, recalculate
    if (updates.ruleGroups) {
        await calculateMembers(id, tenantId);
        await segment.reload();
    }

    return segment;
};

const deleteSegment = async (id, tenantId) => {
    const segment = await getSegmentById(id, tenantId);
    return await segment.destroy();
};

const previewData = async (ruleGroups, matchType, tenantId) => {
    // Stateless calculation for preview
    const whereClause = buildWhereClause(ruleGroups, matchType || 'AND');

    const finalWhere = {
        ...whereClause,
        TenantId: tenantId
    };

    // Parallel fetch
    const [count, samples] = await Promise.all([
        Contact.count({ where: finalWhere }),
        Contact.findAll({
            where: finalWhere,
            limit: 5,
            attributes: ['id', 'firstName', 'lastName', 'email', 'company'] // minimal fields
        })
    ]);

    return { count, samples };
};

const recalculateAllSegments = async (tenantId) => {
    // Find all dynamic segments for this tenant
    const segments = await Segment.findAll({
        where: { TenantId: tenantId, type: 'Dynamic' }
    });

    // Recalculate each
    // Optimization: In a real system, we might queue this or check which segments are affected.
    // For now, simple loop is fine.
    for (const segment of segments) {
        await calculateMembers(segment.id, tenantId);
    }
};
const recalculateEverything = async () => {
    try {
        // 1. Find ALL dynamic segments (across all tenants)
        const segments = await Segment.findAll({
            where: { type: 'Dynamic' }
        });

        if (segments.length === 0) return;

        console.log(`[Auto-Recalc] Updating ${segments.length} segments...`);

        // 2. Update each
        for (const segment of segments) {
            // We need the tenantId to scope the Contact query correctly
            if (segment.TenantId) {
                await calculateMembers(segment.id, segment.TenantId);
            }
        }
    } catch (err) {
        console.error('[Auto-Recalc] Failed:', err.message);
    }
};

module.exports = {
    createSegment,
    getSegments,
    getSegmentById,
    updateSegment,
    deleteSegment,
    calculateMembers,
    previewData,
    recalculateAllSegments,
    recalculateEverything
};
