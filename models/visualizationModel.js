const mongoose = require('mongoose')

const VisualizationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user"
    },
    link: {
        type: String
    },
    description: {
        type: Array
    },
    like: {
        type: Array,
        default: []
    },
    deleted_at: {
        type: Date
    },
    shared: {
        type: Boolean,
        default: true
    },
    thumbnail_url: {
        type: String
    },
    type: {
        type: String,
        enum: ['remix', 'single'],
        default: 'single'
    },
    category: {
        type: String,
        enum: ['default', 'user'],
        default: 'user'
    }
}, {
    timestamps: true
})
module.exports = mongoose.model('visualization', VisualizationSchema)
