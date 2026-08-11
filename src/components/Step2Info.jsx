import { useCard } from '../context/CardContext';

export default function Step2Info() {
  const {
    step,
    template,
    templateCopy,
    fields,
    updateField,
    links,
    addLink,
    updateLink,
    removeLink,
    portfolio,
    addPortfolioItem,
    updatePortfolioItem,
    removePortfolioItem,
    goStep,
  } = useCard();

  const nameValid = fields.name.trim().length > 0;

  return (
    <div className={`panel${step === 2 ? ' active' : ''}`}>
      <label>
        이름 <span className="req">*</span>
      </label>
      <input
        type="text"
        placeholder="홍길동"
        value={fields.name}
        onChange={(e) => updateField('name', e.target.value)}
      />

      <div className="row2">
        <div>
          <label>소속</label>
          <input
            type="text"
            placeholder="OO대학교 / OO팀"
            value={fields.org}
            onChange={(e) => updateField('org', e.target.value)}
          />
        </div>
        <div>
          <label>직함 · 역할</label>
          <input
            type="text"
            placeholder="학생 / 창업가 / 개발자"
            value={fields.role}
            onChange={(e) => updateField('role', e.target.value)}
          />
        </div>
      </div>

      <label>
        {templateCopy?.introLabel || '한줄소개'}
        {templateCopy?.introOptional && (
          <span style={{ color: 'var(--slate)', fontWeight: 400 }}> (선택)</span>
        )}
      </label>
      <textarea
        placeholder={templateCopy?.introPlaceholder || '아이디어를 현실로 만드는 사람'}
        value={fields.intro}
        onChange={(e) => updateField('intro', e.target.value)}
      />
      <div className="hint">비워두면 발급 시 AI가 자동으로 한 줄을 만들어 드립니다.</div>

      <label>
        연락처 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(선택 공개)</span>
      </label>
      <input
        type="text"
        placeholder="이메일 또는 전화번호"
        value={fields.contact}
        onChange={(e) => updateField('contact', e.target.value)}
      />

      <label>
        SNS · 링크 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(최대 3개)</span>
      </label>
      <div id="link-list">
        {links.map((link, idx) => (
          <div className="link-row" key={idx}>
            <input
              type="text"
              placeholder="instagram.com/..."
              value={link}
              onChange={(e) => updateLink(idx, e.target.value)}
            />
            <button onClick={() => removeLink(idx)}>삭제</button>
          </div>
        ))}
      </div>
      <button className="add-link" onClick={addLink} disabled={links.length >= 3}>
        + 링크 추가
      </button>

      {template === 'portfolio' && (
        <div id="portfolio-block">
          <label>
            프로젝트 <span style={{ color: 'var(--slate)', fontWeight: 400 }}>(최대 2개)</span>
          </label>
          <div id="portfolio-list">
            {portfolio.map((item, idx) => (
              <div className="portfolio-item" key={idx}>
                <input
                  type="text"
                  placeholder="프로젝트명"
                  style={{ marginBottom: 8 }}
                  value={item.title}
                  onChange={(e) => updatePortfolioItem(idx, 'title', e.target.value)}
                />
                <textarea
                  placeholder="한 줄 설명"
                  value={item.desc}
                  onChange={(e) => updatePortfolioItem(idx, 'desc', e.target.value)}
                />
                <button
                  className="item-remove"
                  style={{ marginTop: 8 }}
                  onClick={() => removePortfolioItem(idx)}
                >
                  프로젝트 삭제
                </button>
              </div>
            ))}
          </div>
          <button className="add-link" onClick={addPortfolioItem} disabled={portfolio.length >= 2}>
            + 프로젝트 추가
          </button>
        </div>
      )}

      <div className="nav-row">
        <button className="ghost" onClick={() => goStep(1)}>
          이전
        </button>
        <button className="primary" disabled={!nameValid} onClick={() => goStep(3)}>
          다음
        </button>
      </div>
    </div>
  );
}
