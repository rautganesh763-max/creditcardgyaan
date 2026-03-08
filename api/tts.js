export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided' });

  // Try Sarvam AI with bulbul:v2 (v1 deprecated April 2025)
  try {
    const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-subscription-key': process.env.SARVAM_API_KEY
      },
      body: JSON.stringify({
        inputs: [text.slice(0, 500)],
        target_language_code: 'hi-IN',
        speaker: 'anushka',
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 22050,
        enable_preprocessing: true,
        model: 'bulbul:v2'
      }),
    });
    const sarvamData = await sarvamRes.json();
    if (sarvamData.audios?.[0]) {
      return res.status(200).json({ audio: sarvamData.audios[0], source: 'sarvam', format: 'wav' });
    }
    console.log('Sarvam error:', JSON.stringify(sarvamData));
  } catch (e) {
    console.log('Sarvam exception:', e.message);
  }

  // Fallback: ElevenLabs
  try {
    const elevenRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': process.env.ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text.slice(0, 500),
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.75 }
      }),
    });
    const audioBuffer = await elevenRes.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString('base64');
    return res.status(200).json({ audio: base64, source: 'elevenlabs', format: 'mp3' });
  } catch (e) {
    console.log('ElevenLabs exception:', e.message);
  }

  return res.status(500).json({ error: 'TTS failed' });
}
