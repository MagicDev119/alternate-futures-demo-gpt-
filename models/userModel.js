const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        unique: true
    },
    password: {
        type: String
    },
    password_text: {
        type: String
    },
    birthday: {
        type: Date
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Nonbinary", "Decline to answer"]
    },
    race: {
        type: String,
        enum: ['Black or African', 'American', 'Asian', 'Hispanic or Latino', 'White', 'Other', 'Multiracial']
    },
    visionStatus: {
        type: Object
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('user', UserSchema)