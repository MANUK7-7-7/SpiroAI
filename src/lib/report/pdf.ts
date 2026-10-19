import PDFDocument from "pdfkit";
import type { ReportModel } from "./model";

// Built-in PDF fonts are WinAnsi: replace glyphs they cannot draw.
const ascii = (s: string) => s.replace(/₁/g, "1").replace(/≥/g, ">=").replace(/→/g, "->").replace(/[↑↗]/g, "up").replace(/↓/g, "down").replace(/[✓]/g, "").replace(/[–—]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/…/g, "...").replace(/·/g, "-").replace(/[^\x20-\x7EÀ-ÿ\n]/g, "");

const COBALT = "#2450E5";
const INK = "#111214";
const MUTED = "#6B7079";
const LINE = "#E4E6EB";
const TINT = "#E8EDFD";
const HIGH = "#D2393F";

/** Renders the same ReportModel as the live preview. The disclaimer footer is on every page and cannot be removed. */
export function renderPdf(model: ReportModel): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48, info: { Title: ascii(model.title), Author: "SpiroAI", Subject: "Screening support, not a diagnosis" } });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
    const W = doc.page.width - 96;
    let page = 1;

    const footer = () => {
      // Drawing near the page edge must not trigger an automatic page break.
      const keep = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;
      const y = doc.page.height - 92;
      doc.roundedRect(48, y, W, 52, 8).fill(TINT);
      doc.fillColor(COBALT).font("Helvetica-Bold").fontSize(9).text(ascii(model.disclaimer.title), 60, y + 9, { width: W - 24 });
      doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(ascii(model.disclaimer.body), 60, y + 22, { width: W - 24 });
      doc.fillColor(MUTED).fontSize(7).text(`${page} / ${model.pages}`, 48, doc.page.height - 30, { width: W, align: "right" });
      doc.page.margins.bottom = keep;
    };
    const header = () => {
      doc.circle(60, 62, 12).fill(COBALT);
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(15).text("SpiroAI", 78, 54);
      doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(ascii(model.label), 48, 52, { width: W, align: "right" });
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(20).text(ascii(model.title), 48, 96);
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(ascii(model.meta1), 48, 128).text(ascii(model.meta2), 48, 141);
      doc.y = 170;
    };

    header();
    if (model.headline) {
      const h = model.headline;
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(30).text(`${h.score} / 100`, 48, doc.y);
      const color = h.band === "high" ? HIGH : h.band === "moderate" ? COBALT : MUTED;
      doc.fillColor(color).fontSize(11).text(ascii(h.bandLabel), 48, doc.y - 24, { width: W, align: "right" });
      doc.fillColor(MUTED).font("Helvetica").fontSize(9).text(`${ascii(h.conf)}     ${ascii(h.quality)}`, 48, doc.y + 10);
      doc.fillColor(COBALT).font("Helvetica-Bold").text(ascii(h.disclaimer));
      doc.fillColor(MUTED).font("Helvetica").text(ascii(h.final));
      doc.moveDown(0.8);
    }
    if (model.patientLine) doc.fillColor(INK).font("Helvetica").fontSize(10).text(ascii(model.patientLine), 48, doc.y, { width: W }).moveDown(0.8);

    if (model.chart) {
      const c = model.chart;
      const x0 = 80, y0 = doc.y + 8, w = W - 40, h = 150;
      const X = (t: number) => x0 + ((t - c.from) / Math.max(1, c.to - c.from)) * w;
      const Y = (v: number) => y0 + (1 - v / 100) * h;
      doc.rect(x0, Y(c.baseline[1]), w, Math.max(2, Y(c.baseline[0]) - Y(c.baseline[1]))).fill(TINT);
      for (const v of [100, 75, 50, 25]) {
        doc.moveTo(x0, Y(v)).lineTo(x0 + w, Y(v)).lineWidth(0.5).stroke(LINE);
        doc.fillColor(MUTED).font("Courier").fontSize(7).text(String(v), 52, Y(v) - 3, { width: 24, align: "right" });
      }
      const pts = c.points.filter((p) => !p.excluded);
      doc.lineWidth(1.6);
      pts.slice(1).forEach((p, i) => {
        const a = pts[i];
        const dashed = (p.t - a.t) / 86_400_000 > 10;
        if (dashed) doc.dash(4, { space: 4 }); else doc.undash();
        doc.moveTo(X(a.t), Y(a.v)).lineTo(X(p.t), Y(p.v)).stroke(COBALT);
      });
      doc.undash();
      pts.forEach((p) => doc.circle(X(p.t), Y(p.v), 2).fill(COBALT));
      c.axis.forEach((a, i) => doc.fillColor(MUTED).font("Helvetica").fontSize(7).text(ascii(a.label), i === c.axis.length - 1 ? x0 + w - 30 : X(a.t) - 12, y0 + h + 6, { width: 40 }));
      doc.fillColor(MUTED).fontSize(8).text(ascii(c.baselineLegend), x0, y0 + h + 22).text(ascii(c.dashedNote), x0, y0 + h + 34);
      doc.y = y0 + h + 56;
    }
    if (model.latestMetrics) doc.fillColor(INK).font("Helvetica").fontSize(9).text(ascii(model.latestMetrics), 48, doc.y, { width: W });
    if (model.doctorNote) doc.moveDown(0.4).text(ascii(model.doctorNote), 48, doc.y, { width: W });
    footer();

    if (model.tests) {
      doc.addPage(); page += 1; header();
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(ascii(model.tests.title), 48, doc.y);
      doc.moveDown(0.6);
      model.tests.rows.forEach((r) => {
        if (doc.y > doc.page.height - 130) { footer(); doc.addPage(); page += 1; header(); }
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(9).text(`${ascii(r.when)}   ${ascii(r.risk)}`, 48, doc.y);
        doc.fillColor(MUTED).font("Helvetica").fontSize(8).text(`${ascii(r.meta)} - ${ascii(r.judgment)}`);
        doc.moveDown(0.5);
      });
      footer();
    }
    if (model.alerts || model.notes) {
      doc.addPage(); page += 1; header();
      for (const block of [model.alerts && { title: model.alerts.title, lines: model.alerts.rows }, model.notes && { title: model.notes.title, lines: model.notes.rows.map((n) => `${n.when} - ${n.text}`) }]) {
        if (!block) continue;
        doc.fillColor(INK).font("Helvetica-Bold").fontSize(13).text(ascii(block.title), 48, doc.y);
        doc.moveDown(0.4);
        doc.fillColor(INK).font("Helvetica").fontSize(9);
        block.lines.forEach((l) => doc.text(ascii(l), 48, doc.y, { width: W }).moveDown(0.3));
        doc.moveDown(0.8);
      }
      footer();
    }
    doc.end();
  });
}
