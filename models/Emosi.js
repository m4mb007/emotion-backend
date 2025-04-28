const mongoose = require('mongoose');

const EmosiSchema = new mongoose.Schema({
    emosiHariIni: {
        type: String,
        required: true
    },
    tarikh: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Emosi', EmosiSchema);
