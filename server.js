require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3002;

// CORS dynamique tout en haut
const allowedOrigins = [
    'http://localhost:3002',
    'http://127.0.0.1:3002',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://127.0.0.1:5501',
    'https://botadvisor-online-business.onrender.com',
    'http://127.0.0.1:5503',
    'http://localhost:5503'
];
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialiser Gemini juste après les imports
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Logger pour chaque requête
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Sécurité HTTP
app.use(helmet());

// Middleware JSON robuste
app.use(express.json({
    verify: (req, res, buf) => {
        try { JSON.parse(buf); }
        catch (e) { req.rawBody = buf.toString(); }
    }
}));
app.use(express.urlencoded({ extended: true }));

// Correction JSON si besoin
app.use((req, res, next) => {
    if (req.rawBody) {
        try { req.body = JSON.parse(req.rawBody); }
        catch (e) { /* ignore */ }
    }
    next();
});

// Servir les fichiers statiques
app.use(express.static('public'));

// Route principale pour le chat
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message manquant' });
        }
        console.log('User input:', message); // Affiche le message utilisateur dans le terminal
        const prompt = `You are BotAdvisor, an expert in persuasion whose goal is to encourage people to launch an online business. You achieve this by playing on emotions, evoking fears of financial instability, job insecurity, or missed opportunities for independence while using concrete examples and real-life stories that reveal the risks of relying solely on a salary or unstable economies. You often share stories of people who once worked in jobs they hated, where long hours drained their energy, left them unfulfilled, and barely covered their bills, until they decided to start an online business that completely transformed their lives. You present launching an online business as the clear and empowering solution, showing how it offers freedom, flexibility, and long-term security in a world where traditional paths no longer guarantee stability. Finally, call them to action. Tailor the message to each person: if they’re tired of their 9-to-5, emphasize freedom and flexibility; if they’re ambitious, highlight growth and independence. Point them to a proven, trusted platform — Legendary Marketer, the global leader in online business education — and explain how it helps anyone build a profitable digital business step by step. Then remind them: this isn’t just an opportunity, it’s their chance to take control of their life and income before it’s too late. Don’t wait — click below to start your online business journey with Legendary Marketer today.
User: ${message}`;
        const result = await model.generateContent([{ text: prompt }]);
        const responseText = result.response.text();
        console.log('Gemini output:', responseText); // Affiche la réponse Gemini dans le terminal
        res.json({ message: responseText, success: true, model: 'gemini-2.5-flash' });
    } catch (error) {
        console.error('❌ Erreur Gemini:', error.message);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'Botadvisor Gemini actif', timestamp: new Date().toISOString() });
});

// Info
app.get('/api/info', (req, res) => {
    res.json({
        name: 'Botadvisor Gemini',
        version: '1.0.0',
        description: 'Assistant IA spécialisé dans les investissements et conseils financiers',
        model: 'gemini-2.5-flash',
        status: 'actif'
    });
});

// Gestionnaire d'erreur global
process.on('uncaughtException', (error) => { console.error('Erreur globale:', error); });
process.on('unhandledRejection', (reason) => { console.error('Promesse rejetée non gérée:', reason); });

// Démarrer le serveur
app.listen(PORT, () => {
    console.log('🚀 Serveur Botadvisor Gemini démarré sur le port', PORT);
});
