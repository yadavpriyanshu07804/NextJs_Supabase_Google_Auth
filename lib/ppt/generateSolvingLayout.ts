import pptxgen from "pptxgenjs";
import { RenderedSlide } from "../slide-utils";
import { PPTConfig } from "./types";
import { SLIDE_THEME } from "../presentation-constants";

import { calculateSolvingLayout } from "./layout-engine";

export function addSolvingQuestionSlide(pres: pptxgen, s: RenderedSlide, config: PPTConfig) {
  const slide = pres.addSlide();
  const { questionSlide: qTheme } = SLIDE_THEME;
  const layout = qTheme.layouts.solving;

  const marginX = layout.body.x;
  const usableW = layout.body.w;

  // Add a vertical dashed line for solving area
  slide.addShape(pres.ShapeType.line, {
    x: marginX - 0.2,
    y: 0,
    w: 0,
    h: 5.625,
    line: { color: "cccccc", dashType: "dash", width: 1 }
  });

  if (s.english && s.type === 'question' && !s.isContinuation) {
    const { baseFontSize, hindiFontSize, optionsFontSize } = calculateSolvingLayout(s.english, s.hindi || "", usableW);

    const textObjects = [
      { text: s.qNum && !s.isContinuation ? `${s.qNum}. ` : "", options: { bold: true, color: "#111827", fontSize: baseFontSize, fontFace: "Nirmala UI" } },
      { text: s.english, options: { bold: false, color: "#1f2937", fontSize: baseFontSize, fontFace: "Nirmala UI" } }
    ];

    if (s.hindi) {
      textObjects.push({ text: "\n", options: { fontSize: Math.floor(baseFontSize/2) } } as any);
      textObjects.push({ text: s.hindi, options: { color: "#374151", fontSize: hindiFontSize, fontFace: "Nirmala UI" } } as any);
    }

    slide.addText(textObjects, {
      x: marginX,
      y: layout.body.y,
      w: usableW,
      h: layout.body.h,
      valign: "top",
      wrap: true,
      lineSpacing: Math.round(baseFontSize * 1.3),
      fit: 'shrink'
    });

    // 3. Options 2x2 Grid
    if (s.optionList && s.optionList.length >= 4) {
      const optY = layout.options.y;
      const optW = layout.options.w / 2 - 0.05;
      const optH = layout.options.h / 2 - 0.1;
      
      const optStyle = { 
        fontSize: optionsFontSize, 
        fontFace: "Nirmala UI", 
        color: "#4b5563",
        fit: 'shrink' as const,
        valign: 'middle' as const
      };

      slide.addText(s.optionList[0], { x: layout.options.x, y: optY, w: optW, h: optH, ...optStyle });
      slide.addText(s.optionList[1], { x: layout.options.x + optW + 0.1, y: optY, w: optW, h: optH, ...optStyle });
      slide.addText(s.optionList[2], { x: layout.options.x, y: optY + optH + 0.1, w: optW, h: optH, ...optStyle });
      slide.addText(s.optionList[3], { x: layout.options.x + optW + 0.1, y: optY + optH + 0.1, w: optW, h: optH, ...optStyle });
    }
  } else {
    slide.addText(s.content, {
      x: marginX,
      y: layout.body.y,
      w: usableW,
      h: layout.body.h,
      fontSize: 16,
      fontFace: "Nirmala UI",
      color: "#1f2937",
      align: "left",
      valign: "top",
      wrap: true,
      fit: 'shrink'
    });
  }
}
