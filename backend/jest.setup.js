jest.mock('kafkajs');
jest.mock('redis', () => ({
    createClient: () => ({
        on: jest.fn(),
        connect: jest.fn(),
        get: jest.fn(),
        set: jest.fn(),
        zAdd: jest.fn(),
        zRange: jest.fn(),
        zRem: jest.fn(),
    })
}));
jest.mock('@clickhouse/client', () => ({
    createClient: () => ({
        insert: jest.fn(),
        query: jest.fn(),
    })
}));
