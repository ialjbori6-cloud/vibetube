const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection String (fallback to local or env)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibetube';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas successfully!'))
    .catch((err) => console.error('MongoDB connection error:', err));

// Schemas & Models
const videoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    channel: { type: String, required: true },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' },
    views: { type: String, default: '1 ألف مشاهدة' },
    timestamp: { type: String, default: 'قبل يومين' },
    duration: { type: String, default: '10:00' },
    videoUrl: { type: String, required: true },
    thumbnail: { type: String, required: true },
    category: { type: String, default: 'عام' },
    likes: { type: Number, default: 0 },
    subscribers: { type: String, default: '100 ألف' },
    description: { type: String, default: '' }
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
    user: { type: String, default: 'مستخدم VibeTube' },
    avatar: { type: String, default: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' },
    text: { type: String, required: true },
    time: { type: String, default: 'الآن' },
    likes: { type: Number, default: 0 }
}, { timestamps: true });

const Video = mongoose.model('Video', videoSchema);
const Comment = mongoose.model('Comment', commentSchema);

// Seed initial data if empty
async function seedDatabase() {
    try {
        const count = await Video.countDocuments();
        if (count === 0) {
            await Video.insertMany([
                {
                    title: 'تعلم البرمجة من الصفر حتى الاحتراف | دليل شامل 2026',
                    channel: 'عالم البرمجة',
                    views: '125 ألف مشاهدة',
                    timestamp: 'قبل يومين',
                    duration: '18:45',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                    thumbnail: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80',
                    category: 'برمجة',
                    likes: 14000,
                    subscribers: '450 ألف',
                    description: 'في هذا الفيديو الشامل، سنستعرض خطة طريق تعلم البرمجة وكيف تبدأ مسيرتك المهنية كمطور محترف في عام 2026.'
                },
                {
                    title: 'جولة في أحدث استوديو لتطوير الألعاب والذكاء الاصطناعي',
                    channel: 'تقنية بلا حدود',
                    views: '82 ألف مشاهدة',
                    timestamp: 'قبل 4 أيام',
                    duration: '12:30',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
                    category: 'تقنية',
                    likes: 9200,
                    subscribers: '1.2 مليون',
                    description: 'نأخذكم في جولة حصرية داخل أحد أقوى استوديوهات تطوير الألعاب المعتمدة على أدوات الذكاء الاصطناعي.'
                },
                {
                    title: 'أروع مقطوعات العزف على البيانو للاسترخاء والتركيز',
                    channel: 'موسيقى الهدوء',
                    views: '1.4 مليون مشاهدة',
                    timestamp: 'قبل أسبوعين',
                    duration: '3:45:10',
                    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
                    thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
                    category: 'موسيقى',
                    likes: 120000,
                    subscribers: '3.4 مليون',
                    description: 'مجموعة مختارة بعناية من أفضل مقطوعات البيانو الهادئة لمساعدتك على التركيز والدراسة.'
                }
            ]);
            console.log('Database seeded with initial videos!');
        }
    } catch (err) {
        console.error('Error seeding database:', err);
    }
}

mongoose.connection.once('open', () => {
    seedDatabase();
});

// Routes

// 1. Get all videos
app.get('/api/videos', async (req, res) => {
    try {
        const { search, category } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { channel: { $regex: search, $options: 'i' } }
            ];
        }

        if (category && category !== 'الكل') {
            query.category = category;
        }

        const videos = await Video.find(query).sort({ createdAt: -1 });
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في الخادم أثناء جلب الفيديوهات' });
    }
});

// 2. Get video by ID
app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'الفيديو غير موجود' });
        res.json(video);
    } catch (err) {
        res.status(400).json({ error: 'معرف الفيديو غير صالح' });
    }
});

// 3. Add new video
app.post('/api/videos', async (req, res) => {
    try {
        const { title, channel, videoUrl, thumbnail, category, description } = req.body;
        if (!title || !videoUrl) {
            return res.status(400).json({ error: 'العنوان ورابط الفيديو مطلوبان' });
        }

        const newVideo = new Video({
            title,
            channel: channel || 'قناة جديدة',
            videoUrl,
            thumbnail: thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
            category: category || 'عام',
            description: description || ''
        });

        const savedVideo = await newVideo.save();
        res.status(201).json(savedVideo);
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء حفظ الفيديو' });
    }
});

// 4. Get comments for a video
app.get('/api/videos/:id/comments', async (req, res) => {
    try {
        const comments = await Comment.find({ videoId: req.params.id }).sort({ createdAt: -1 });
        res.json(comments);
    } catch (err) {
        res.status(500).json({ error: 'خطأ في جلب التعليقات' });
    }
});

// 5. Add a comment
app.post('/api/videos/:id/comments', async (req, res) => {
    try {
        const { text, user } = req.body;
        if (!text) return res.status(400).json({ error: 'نص التعليق مطلوب' });

        const newComment = new Comment({
            videoId: req.params.id,
            user: user || 'مستخدم VibeTube',
            text
        });

        const savedComment = await newComment.save();
        res.status(201).json(savedComment);
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء إضافة التعليق' });
    }
});

// 6. Like a video
app.post('/api/videos/:id/like', async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);
        if (!video) return res.status(404).json({ error: 'الفيديو غير موجود' });

        video.likes += 1;
        await video.save();
        res.json({ likes: video.likes });
    } catch (err) {
        res.status(500).json({ error: 'خطأ أثناء تسجيل الإعجاب' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.send('VibeTube Backend API with MongoDB Atlas is running!');
});

app.listen(PORT, () => {
    console.log(`VibeTube Server is running on port ${PORT}`);
});
