const User = require('./user.model');

const createUser = async (userData) => {
    return await User.create(userData);
};

const findUserByEmail = async (email) => {
    return await User.findOne({ where: { email } });
};

const findUserById = async (id) => {
    return await User.findByPk(id);
};

module.exports = {
    createUser,
    findUserByEmail,
    findUserById
};
