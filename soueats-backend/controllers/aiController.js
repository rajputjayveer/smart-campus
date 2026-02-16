const asyncHandler = require('../middleware/asyncHandler');
const { AppError } = require('../middleware/errorHandler');
const { pool } = require('../config/database');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

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

    const prompt = [
        'You are SouEats assistant. Keep replies friendly, short, and helpful.',
        'If asked about campus food or orders, provide practical guidance.',
        context ? `Context: ${context}` : '',
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
