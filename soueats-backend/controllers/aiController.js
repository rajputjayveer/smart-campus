const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/database');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
let knowledgeCache = { value: '', ts: 0 };

const callGemini = async (prompt) => {
    if (!GEMINI_API_KEY) {
        throw new AppError('GEMINI_API_KEY is not configured', 500);
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 300
            }
        })
    });

    const data = await response.json();
    if (!response.ok) {
        throw new AppError(data.error?.message || 'Gemini API error', response.status || 500);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return text.trim();
};

const getKnowledgeContext = async () => {
    const now = Date.now();
    if (knowledgeCache.value && now - knowledgeCache.ts < 5 * 60 * 1000) {
        return knowledgeCache.value;
    }

    let stalls = [];
    let menuItems = [];
    let feedbackRows = [];

    try {
        const [stallData] = await pool.execute(
            `SELECT id, stallName, specialty, rating
             FROM stalls
             ORDER BY rating DESC
             LIMIT 25`
        );
        stalls = stallData || [];
    } catch (e) {
        stalls = [];
    }

    try {
        const [menuData] = await pool.execute(
            `SELECT m.name, m.price, m.popular, s.stallName
             FROM menu m
             JOIN stalls s ON m.stallId = s.id
             ORDER BY m.popular DESC, m.name ASC
             LIMIT 80`
        );
        menuItems = menuData || [];
    } catch (e) {
        menuItems = [];
    }

    try {
        const [feedbackData] = await pool.execute(
            `SELECT f.rating, f.comments, f.timestamp,
                    COALESCE(s.stallName, f.stall) AS stallName
             FROM feedbacks f
             LEFT JOIN stalls s ON f.stallId = s.id
             ORDER BY f.timestamp DESC
             LIMIT 80`
        );
        feedbackRows = feedbackData || [];
    } catch (e) {
        feedbackRows = [];
    }

    const stallText = stalls.length
        ? stalls.map(s => `${s.stallName} (${s.specialty || 'General'}, rating: ${s.rating ?? 'N/A'})`).join('\n')
        : 'No stall data.';

    const menuText = menuItems.length
        ? menuItems.map(m => `${m.name} - INR ${m.price} @ ${m.stallName}${m.popular ? ' [popular]' : ''}`).join('\n')
        : 'No menu data.';

    const feedbackText = feedbackRows.length
        ? feedbackRows.map(f => `[${f.stallName || 'Unknown'}] ${f.rating || 'N/A'}/5 - ${String(f.comments || '').slice(0, 160)}`).join('\n')
        : 'No feedback data.';

    const context = [
        'STALL DATA:',
        stallText,
        '',
        'MENU DATA:',
        menuText,
        '',
        'RECENT FEEDBACK SUMMARY:',
        feedbackText
    ].join('\n');

    knowledgeCache = { value: context, ts: now };
    return context;
};

// @desc    Get suggestions based on feedback
// @route   POST /api/ai/feedback-suggestions
// @access  Public
const getFeedbackSuggestions = asyncHandler(async (req, res, next) => {
    const { stall, item, rating, comments } = req.body || {};

    if (!comments && !item && !stall) {
        return next(new AppError('Feedback content is required', 400));
    }

    const prompt = [
        'You are a canteen improvement assistant.',
        'Based on the feedback, provide 3-5 short, actionable suggestions.',
        'Return only bullet points without extra text.',
        '',
        `Stall: ${stall || 'N/A'}`,
        `Item: ${item || 'N/A'}`,
        `Rating: ${rating || 'N/A'}`,
        `Feedback: ${comments || 'N/A'}`
    ].join('\n');

    const text = await callGemini(prompt);
    const suggestions = text
        .split('\n')
        .map(line => line.replace(/^[\-\*\d\.\)\s]+/, '').trim())
        .filter(Boolean);

    res.json({
        success: true,
        data: {
            suggestions: suggestions.length > 0 ? suggestions : [text]
        }
    });
});

// @desc    Chatbot for normal conversation
// @route   POST /api/ai/chat
// @access  Public
const chat = asyncHandler(async (req, res, next) => {
    const { message, context } = req.body || {};

    if (!message) {
        return next(new AppError('Message is required', 400));
    }

    const dataContext = await getKnowledgeContext();

    const prompt = [
        'You are SouEats assistant. Keep replies friendly, short, and helpful.',
        'Use only the provided data context for stall/menu/feedback based answers.',
        'If the user asks for recommendations, suggest options based on ratings, menu popularity, and feedback sentiment from the provided context.',
        context ? `Conversation Context:\n${context}` : '',
        `Data Context:\n${dataContext}`,
        `User: ${message}`,
        'Assistant:'
    ].filter(Boolean).join('\n');

    const reply = await callGemini(prompt);

    res.json({
        success: true,
        data: { reply }
    });
});

// @desc    Analyze all feedback and provide general insights
// @route   GET /api/ai/feedback-analysis
// @access  Admin (or public if you allow)
const getFeedbackAnalysis = asyncHandler(async (req, res, next) => {
    let rows = [];

    try {
        const [result] = await pool.execute(
            `SELECT f.rating, f.comments, f.timestamp,
                    s.stallName AS stallName,
                    m.name AS itemName
             FROM feedbacks f
             LEFT JOIN stalls s ON f.stallId = s.id
             LEFT JOIN menu m ON f.menuItemId = m.id
             ORDER BY f.timestamp DESC
             LIMIT 200`
        );
        rows = result;
    } catch (error) {
        if (error && error.code === 'ER_BAD_FIELD_ERROR') {
            const [result] = await pool.execute(
                `SELECT rating, comments, timestamp,
                        stall AS stallName,
                        item AS itemName
                 FROM feedbacks
                 ORDER BY timestamp DESC
                 LIMIT 200`
            );
            rows = result;
        } else {
            throw error;
        }
    }

    const feedbackText = rows
        .map((row) => {
            const stall = row.stallName || 'Unknown Stall';
            const item = row.itemName || 'General';
            const rating = row.rating ?? 'N/A';
            const comments = row.comments || '';
            return `Stall: ${stall} | Item: ${item} | Rating: ${rating} | Feedback: ${comments}`;
        })
        .join('\n');

    const prompt = [
        'You are a canteen analytics assistant.',
        'Summarize the overall feedback into:',
        '1) Top recurring issues (3-5 bullets)',
        '2) What users love (2-4 bullets)',
        '3) Recommended actions (3-5 bullets)',
        'Keep it short and practical.',
        '',
        feedbackText || 'No feedback available.'
    ].join('\n');

    const text = await callGemini(prompt);

    res.json({
        success: true,
        data: {
            count: rows.length,
            insights: text.trim(),
            recent: rows
        }
    });
});

module.exports = {
    getFeedbackSuggestions,
    chat,
    getFeedbackAnalysis
};
