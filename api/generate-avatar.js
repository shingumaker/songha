export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
    res.status(500).json({ error: '서버에 이미지 생성 API 키가 설정되지 않았습니다.' });
    return;
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    res.status(400).json({ error: '설명(prompt)을 입력해 주세요.' });
    return;
  }

  const fullPrompt =
    'A semi-realistic digital illustration headshot portrait — mostly lifelike proportions and lighting, ' +
    'but blended with a soft Korean romance-comic (순정만화) art style: clean line art, smooth cel shading, ' +
    'slightly softened features and gently expressive eyes, subtle good-looking and camera-ready look like a ' +
    'fresh up-and-coming actor. This should clearly read as a stylized AI illustration, not a photograph, but ' +
    'not a flat cartoon either — keep it tasteful and understated, not overly glamorous. ' +
    'Simple clean background, single person centered, head-and-shoulders, no text, no watermark, no logo. ' +
    `Subject: ${prompt.slice(0, 300)}`;

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: fullPrompt,
        size: '1024x1024',
        quality: 'low',
        n: 1,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI 이미지 생성 실패:', openaiRes.status, errText);
      res.status(502).json({ error: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }

    const data = await openaiRes.json();
    const b64 = data?.data?.[0]?.b64_json;
    if (!b64) {
      console.error('OpenAI 응답에 이미지가 없습니다:', JSON.stringify(data).slice(0, 500));
      res.status(502).json({ error: '이미지 생성 결과가 비어 있습니다.' });
      return;
    }

    res.status(200).json({ image: `data:image/png;base64,${b64}` });
  } catch (err) {
    console.error('이미지 생성 중 오류:', err);
    res.status(500).json({ error: '이미지 생성 중 오류가 발생했습니다.' });
  }
}
