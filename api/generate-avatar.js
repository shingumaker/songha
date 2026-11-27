function dataUrlToBlob(dataUrl) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return null;
  const [, mime, b64] = match;
  return new Blob([Buffer.from(b64, 'base64')], { type: mime });
}

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
  const inputImage = typeof req.body?.image === 'string' ? req.body.image : '';
  if (!prompt && !inputImage) {
    res.status(400).json({ error: '설명(prompt)을 입력하거나 사진을 첨부해 주세요.' });
    return;
  }

  const STYLE_PROMPTS = {
    webtoon:
      'A semi-realistic digital illustration headshot portrait — mostly lifelike proportions and lighting, ' +
      'but blended with a soft Korean romance-comic (순정만화) art style: clean line art, smooth cel shading, ' +
      'slightly softened features and gently expressive eyes, subtle good-looking and camera-ready look like a ' +
      'fresh up-and-coming actor. This should clearly read as a stylized AI illustration, not a photograph, but ' +
      'not a flat cartoon either — keep it tasteful and understated, not overly glamorous.',
    pixar:
      'A charming 3D-animated character portrait in the style of modern Pixar/Disney animation — big expressive ' +
      'eyes, smooth stylized 3D shading and soft studio lighting, friendly and warm expression.',
    insta:
      'A hyper-polished, flawless AI-generated profile photo in the trending "AI profile picture" style — ' +
      'glowing even skin, perfectly symmetrical features, glossy studio lighting, high-end fashion-photo finish.',
  };
  const style = STYLE_PROMPTS[req.body?.style] ? req.body.style : 'webtoon';
  const context = typeof req.body?.context === 'string' ? req.body.context.trim().slice(0, 300) : '';

  const fullPrompt =
    `${STYLE_PROMPTS[style]} ` +
    (inputImage
      ? 'Keep the same person, face, and pose as shown in the provided photo — just restyle the artwork and ' +
        'rendering, do not change their identity or composition. '
      : 'Simple clean background, single person centered, head-and-shoulders, no text, no watermark, no logo. ') +
    (prompt ? `Subject: ${prompt.slice(0, 300)}` : '') +
    (context
      ? ` Subtly let this person's profile inform the mood, styling, and expression (do not render any text, ` +
        `props, or literal symbols for it): ${context}.`
      : '');

  try {
    let openaiRes;
    if (inputImage) {
      const blob = dataUrlToBlob(inputImage);
      if (!blob) {
        res.status(400).json({ error: '사진 형식을 읽을 수 없습니다.' });
        return;
      }
      const form = new FormData();
      form.append('model', 'gpt-image-1');
      form.append('image', blob, 'photo.png');
      form.append('prompt', fullPrompt);
      form.append('size', '1024x1024');
      form.append('quality', 'low');
      form.append('n', '1');
      openaiRes = await fetch('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}` },
        body: form,
      });
    } else {
      openaiRes = await fetch('https://api.openai.com/v1/images/generations', {
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
    }

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
