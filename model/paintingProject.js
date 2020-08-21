const mongoose = require('mongoose');

const PaintingProject = new mongoose.Schema(
    {
        user_Id: String,
        name: String,
        layers: [
            {
                name: String,
                visible: Boolean,
                shapes: [mongoose.Schema.Types.Mixed]
            }
        ]
    }
)


module.exports = mongoose.model('paintingProject', PaintingProject);