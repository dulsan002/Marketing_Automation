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

const previewCount = async (ruleGroups, matchType, tenantId) => {
    // Stateless calculation for preview
    const whereClause = buildWhereClause(ruleGroups, matchType || 'AND');

    const finalWhere = {
        ...whereClause,
        TenantId: tenantId
    };

    return await Contact.count({ where: finalWhere });
};

module.exports = {
    createSegment,
    getSegments,
    getSegmentById,
    updateSegment,
    deleteSegment,
    calculateMembers,
    previewCount
};
