// 내려받기: 엑셀(.xlsx) / 보고서(.docx — 한글에서 열어 .hwpx로 저장 가능)
import * as C from "./config.js";
import { STATUS, dateLabel, fmtTime, actorLabel, ymd, toast } from "./common.js";

const at = (r, s) => fmtTime((r.history || []).find((h) => h.status === s)?.at);
const safe = (v) => { const s = String(v ?? ""); return /^[=+\-@]/.test(s) ? "'" + s : s; };   // 수식 주입 방지

export async function exportXlsx(rows) {
  const XLSX = await import("https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm");
  const recs = rows.map((r) => ({
    접수번호: r.id, 상태: STATUS[r.status]?.label, 예약일: r.date, 시간: r.time, 학번: r.studentNo, 이름: r.name, 자격증: r.cert,
    학과: r.record?.dept, 파일수: r.files, 장비: (r.record?.printers || []).map((n) => n + "번").join(", "), 출력물: r.record?.title,
    목적: r.record?.purpose, 재료: r.record?.material, 수량: r.record?.qty, 출력시작: r.record?.start, 출력종료: r.record?.end,
    결과: r.record?.result, 처리자: actorLabel(r.record?.by), 출력완료: at(r, "done"), 수령: at(r, "received"), 활용사진: r.usagePhotoCount || 0,
    활용내용: r.usageNote, 만족도: r.survey?.rating, 재이용: r.survey?.again, 의견: r.survey?.comment, 메모: r.record?.memo
  })).map((o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, typeof v === "number" ? v : safe(v)])));
  const ns = {};
  rows.filter((r) => r.status === "noshow").forEach((r) => { (ns[r.studentNo] ||= { 학번: r.studentNo, 이름: r.name, 횟수: 0, 날짜: [] }); ns[r.studentNo].횟수++; ns[r.studentNo].날짜.push(`${r.date} ${r.time}`); });
  const month = {};
  rows.filter((r) => r.status !== "canceled").forEach((r) => {
    const m = r.date.slice(0, 7), x = (month[m] ||= { 월: m, 예약: 0, 노쇼: 0, 출력파일: 0, 자격증소지: 0, 만족도합: 0, 응답: 0 });
    x.예약++; if (r.status === "noshow") x.노쇼++; if (r.record?.result) x.출력파일 += r.files; if (r.cert === "소지") x.자격증소지++;
    if (r.survey) { x.만족도합 += r.survey.rating; x.응답++; }
  });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(recs), "이용기록");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(ns).map((x) => ({ ...x, 날짜: x.날짜.join(" / ") }))), "노쇼");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(Object.values(month).sort((a, b) => a.월.localeCompare(b.월))
    .map(({ 만족도합, 응답, ...x }) => ({ ...x, 평균만족도: 응답 ? +(만족도합 / 응답).toFixed(2) : "" }))), "월별 집계");
  XLSX.writeFile(wb, `3D프린터_이용기록_${ymd(new Date())}.xlsx`);
}

export async function exportReport(rows, format, loadPhotos) {
  toast("보고서를 만드는 중입니다…");
  const D = await import("https://cdn.jsdelivr.net/npm/docx@8.5.0/+esm");
  const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, ImageRun, HeadingLevel, AlignmentType } = D;
  const P = (t, o = {}) => new Paragraph({ children: [new TextRun({ text: String(t ?? ""), ...o })] });
  const cell = (t, bold) => new TableCell({ children: [P(t, { bold })], width: { size: 25, type: WidthType.PERCENTAGE } });
  const table = (pairs) => new Table({ width: { size: 100, type: WidthType.PERCENTAGE },
    rows: pairs.map((row) => new TableRow({ children: row.map((v, i) => cell(v, i % 2 === 0)) })) });
  const used = rows.filter((r) => r.record);
  const sv = rows.filter((r) => r.survey), avg = sv.length ? (sv.reduce((a, r) => a + r.survey.rating, 0) / sv.length).toFixed(1) : "-";
  const dates = rows.map((r) => r.date).sort();
  const body = [
    new Paragraph({ text: C.CENTER_NAME, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `${C.SPACE_NAME} 3D프린터 운영 보고서`, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: `기간 ${dates[0] || "-"} ~ ${dates[dates.length - 1] || "-"} · 작성일 ${ymd(new Date())}`, alignment: AlignmentType.CENTER }),
    new Paragraph({ text: "1. 운영 요약", heading: HeadingLevel.HEADING_1 }),
    table([["예약 건수", rows.filter((r) => r.status !== "canceled").length, "이용 학생 수", new Set(rows.map((r) => r.studentNo)).size],
      ["출력 파일 수", used.reduce((a, r) => a + r.files, 0), "노쇼", rows.filter((r) => r.status === "noshow").length],
      ["자격증 소지 예약", rows.filter((r) => r.cert === "소지").length, "평균 만족도", avg]]),
    new Paragraph({ text: "2. 이용기록 상세", heading: HeadingLevel.HEADING_1 })
  ];
  for (const r of used) {
    body.push(new Paragraph({ text: `${dateLabel(r.date)} ${r.time} · ${r.record.title || ""}`, heading: HeadingLevel.HEADING_2 }));
    body.push(table([["학번", r.studentNo, "이름", r.name], ["학과", r.record.dept, "자격증", r.cert],
      ["장비", (r.record.printers || []).map((n) => n + "번").join(", "), "파일 수", r.files], ["목적", r.record.purpose, "결과", r.record.result],
      ["활용 내용", r.usageNote || "-", "만족도", r.survey ? `★${r.survey.rating}` : "-"]]));
    const photos = await loadPhotos(r.id).catch(() => []);
    const imgs = [];
    for (const p of photos.slice(0, 4)) {
      const bin = Uint8Array.from(atob(p.data.split(",")[1]), (c) => c.charCodeAt(0));
      imgs.push(new ImageRun({ data: bin, transformation: { width: 220, height: 165 } }), new TextRun("  "));
    }
    if (imgs.length) body.push(new Paragraph({ children: imgs }), P("왼쪽부터 출력 완료 사진 → 활용 사진", { size: 16, color: "666666" }));
  }
  body.push(new Paragraph({ text: "3. 노쇼 기록", heading: HeadingLevel.HEADING_1 }));
  rows.filter((r) => r.status === "noshow").forEach((r) => body.push(P(`${r.date} ${r.time} · ${r.studentNo} ${r.name}`)));
  body.push(new Paragraph({ text: "4. 만족도 의견", heading: HeadingLevel.HEADING_1 }));
  sv.filter((r) => r.survey.comment).forEach((r) => body.push(P(`★${r.survey.rating} · ${r.survey.comment}`)));
  const blob = await Packer.toBlob(new Document({ styles: { default: { document: { run: { font: "맑은 고딕" } } } }, sections: [{ children: body }] }));
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `3D프린터_운영보고서_${ymd(new Date())}.docx`;
  a.click();
  if (format === "hwpx") toast("한글에서 이 파일을 열고 '다른 이름으로 저장 → HWPX'로 저장하세요.");
}
