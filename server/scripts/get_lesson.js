const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const getLesson = async () => {
    const db = mongoose.connection;
    db.once('open', async () => {
        const collection = db.collection('courses');
        const course = await collection.findOne({ _id: new mongoose.Types.ObjectId('6a53b44c3adf14819fe8038d') });
        if (!course) {
            console.log("Course not found");
            process.exit(0);
        }
        let foundLesson = null;
        for (const module of (course.modules || [])) {
            if (!module.lessons) continue;
            for (const lesson of module.lessons) {
                if (lesson._id.toString() === '6a53b44c3adf14819fe8038f') {
                    foundLesson = lesson;
                    break;
                }
            }
        }
        console.log(JSON.stringify(foundLesson, null, 2));
        process.exit(0);
    });
};
getLesson();
