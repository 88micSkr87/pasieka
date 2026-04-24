const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static('public'));

const GEMINI_KEY = process.env.GEMINI_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_KEY}`;

app.post('/analyze', async (req, res) => {
  const { text } = req.body;
  const prompt = `Jesteś asystentem pszczelarza. Analizujesz notatkę głosową z przeglądu ula i zwracasz TYLKO czysty JSON bez markdown.

Typy ramek: węza, susz, jaja, czerw, matecznik, miód
Typy korpusów: korpus, półkorpus
Zdarzenia: osypanie, łączenie rodzin, wymiana matki, nowa matka, karmienie, ciasto, rojenie, leczenie

Format JSON:
{"ul":number|null,"sila":1-5|null,"matka":"tak"|"nie"|"niewidoczna"|"trutówka"|null,"czerw":"tak"|"nie"|null,"ramkiDodane":[{"typ":"węza","ilosc":2}],"ramkiZabrane":[],"korpusyDodane":[],"korpusyZabrane":[],"zdarzenia":[],"pogoda":string|null,"temperatura":number|null,"uwagi":string|null,"alert":string|null}

Alert gdy: brak matki, trutówka, osypanie, rojenie, choroba. Zwróć TYLKO JSON.

Notatka: ${text}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
      })
    });
    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text
      .trim().replace(/```json/g,'').replace(/```/g,'').trim();
    res.json(JSON.parse(raw));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/weather', async (req, res) => {
  const { text } = req.body;
  const prompt = `Wyciągnij dane pogodowe z tekstu i zwróć TYLKO czysty JSON bez markdown: {"pogoda":string|null,"temperatura":number|null}. Temperatura jako liczba całkowita. Tekst: ${text}`;

  try {
    const response = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 100 }
      })
    });
    const data = await response.json();
    const raw = data.candidates[0].content.parts[0].text
      .trim().replace(/```json/g,'').replace(/```/g,'').trim();
    res.json(JSON.parse(raw));
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Pasieka server running on port ${PORT}`));
