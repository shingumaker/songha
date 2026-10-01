export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OPENAI_API_KEY가 설정되지 않았습니다.');
    res.status(500).json({ error: '서버에 API 키가 설정되지 않았습니다.' });
    return;
  }

  const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const list = (v, max) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max) : []);

  const name = str(req.body?.name, 50);
  const org = str(req.body?.org, 50);
  const role = str(req.body?.role, 50);
  const personality = list(req.body?.personality, 3);
  const favorites = list(req.body?.favorites, 4);

  const contextLines = [
    name && `이름: ${name}`,
    org && `소속: ${org}`,
    role && `직함/역할: ${role}`,
    personality.length && `성격: ${personality.join(', ')}`,
    favorites.length && `좋아하는 것: ${favorites.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  const prompt = contextLines
    ? `다음 정보를 가진 사람의 프로필 카드에 들어갈 한 줄 자기소개를 만들어줘. 15~25자 정도의 자연스럽고 센스있는 한국어 문장 하나만, 따옴표나 설명 없이 본문만 출력해줘.\n${contextLines}`
    : '프로필 카드에 들어갈, 평범하지만 긍정적인 한 줄 자기소개를 15~25자 정도의 자연스러운 한국어 문장 하나만, 따옴표나 설명 없이 본문만 만들어줘.';

  try {
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 60,
        temperature: 0.9,
      }),
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      console.error('OpenAI 문구 생성 실패:', openaiRes.status, errText);
      res.status(502).json({ error: '문구 생성에 실패했습니다. 잠시 후 다시 시도해 주세요.' });
      return;
    }

    const data = await openaiRes.json();
    let intro = data?.choices?.[0]?.message?.content?.trim() || '';
    intro = intro.replace(/^["'“”]+|["'“”]+$/g, '').trim();
    if (!intro) {
      console.error('OpenAI 응답에 문구가 없습니다:', JSON.stringify(data).slice(0, 500));
      res.status(502).json({ error: '생성된 문구가 비어 있습니다.' });
      return;
    }

    res.status(200).json({ intro });
  } catch (err) {
    console.error('문구 생성 중 오류:', err);
    res.status(500).json({ error: '문구 생성 중 오류가 발생했습니다.' });
  }
}
