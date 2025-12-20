const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'map-backend',
    brokers: [(process.env.KAFKA_BROKER || 'localhost:9092')]
});

const producer = kafka.producer();

const connectKafka = async () => {
    try {
        await producer.connect();
        console.log('✅ Kafka Producer Connected');
    } catch (error) {
        console.error('❌ Kafka Connection Failed:', error.message);
        // Do not throw in dev/test without docker, just warn
        if (process.env.NODE_ENV === 'production') throw error;
    }
};

module.exports = { kafka, producer, connectKafka };
