
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/thai-learning';

// Define schemas (minimal)
const lessonSchema = new mongoose.Schema({ content: String }, { strict: false });
const Lesson = mongoose.model('Lesson', lessonSchema);

const testSchema = new mongoose.Schema({ content: String }, { strict: false }); // Tests usually don't have content with images, but questions do
const Test = mongoose.model('Test', testSchema);

const questionSchema = new mongoose.Schema({
    question: String,
    explanation: String,
    imageUrl: String
}, { strict: false });
const Question = mongoose.model('Question', questionSchema);

const gameSchema = new mongoose.Schema({
    settings: Object // settings might contain images
}, { strict: false });
const Game = mongoose.model('Game', gameSchema);

async function fixPaths() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('Connected.');

        const oldPath = '/คำศัพท์บท1-4/';
        const newPath = '/คำศัพท์บท1-8/';

        // 1. Fix Lessons
        console.log('Fixing Lessons...');
        const lessons = await Lesson.find({ content: { $regex: oldPath } });
        for (const lesson of lessons) {
            console.log(`Updating Lesson ${lesson._id}...`);
            lesson.content = lesson.content.replaceAll(oldPath, newPath);
            await lesson.save();
        }
        console.log(`Fixed ${lessons.length} lessons.`);

        // 2. Fix Questions
        console.log('Fixing Questions...');
        // Fix imageUrl
        const questionsImg = await Question.find({ imageUrl: { $regex: oldPath } });
        for (const q of questionsImg) {
            q.imageUrl = q.imageUrl.replaceAll(oldPath, newPath);
            await q.save();
        }
        // Fix in explanation or question text? Unlikely but possible
        const questionsText = await Question.find({
            $or: [
                { question: { $regex: oldPath } },
                { explanation: { $regex: oldPath } }
            ]
        });
        for (const q of questionsText) {
            if (q.question && q.question.includes(oldPath)) q.question = q.question.replaceAll(oldPath, newPath);
            if (q.explanation && q.explanation.includes(oldPath)) q.explanation = q.explanation.replaceAll(oldPath, newPath);
            await q.save();
        }
        console.log(`Fixed ${questionsImg.length + questionsText.length} questions.`);

        // 3. Fix Games
        console.log('Fixing Games...');
        const games = await Game.find({});
        let gameCount = 0;
        for (const game of games) {
            let modified = false;
            // Deep stringify and replace is easiest for unexpected nested structures in settings
            let json = JSON.stringify(game.toObject());
            if (json.includes(oldPath)) {
                console.log(`Updating Game ${game._id}...`);
                json = json.replaceAll(oldPath, newPath);
                const newObj = JSON.parse(json);
                // Mongoose replaceOne or just update the fields
                await Game.replaceOne({ _id: game._id }, newObj);
                gameCount++;
            }
        }
        console.log(`Fixed ${gameCount} games.`);

        console.log('All done!');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

fixPaths();
