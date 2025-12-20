const producer = {
    connect: jest.fn().mockResolvedValue(true),
    send: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
};

const consumer = {
    connect: jest.fn().mockResolvedValue(true),
    subscribe: jest.fn().mockResolvedValue(true),
    run: jest.fn().mockResolvedValue(true),
    disconnect: jest.fn(),
};

const kafka = {
    producer: () => producer,
    consumer: () => consumer,
};

module.exports = { Kafka: jest.fn(() => kafka) };
