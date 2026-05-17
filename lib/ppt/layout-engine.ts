export const PRES_W = 10;
export const PRES_H = 5.625;

export interface LayoutCalculations {
  baseFontSize: number;
  hindiFontSize: number;
  optionsFontSize: number;
  englishHeight: number;
  hindiHeight: number;
}

export function calculateStandardLayout(english: string, hindi: string, usableW: number): LayoutCalculations {
  const totalLen = english.length + (hindi?.length || 0);
  let baseFontSize = 14; 
  
  if (totalLen > 1000) baseFontSize = 12;
  if (totalLen > 2000) baseFontSize = 10;

  // English: More compact chars per line estimates
  const charsPerLineEng = Math.floor(usableW * (100 / baseFontSize) * 0.7); 
  const engLines = Math.ceil((english.length + 5) / charsPerLineEng) || 1;
  const englishHeight = (engLines * (baseFontSize / 72) * 1.4) + 0.1;

  const hindiFontSize = Math.max(baseFontSize * 0.95, 10);
  const charsPerLineHindi = Math.floor(usableW * (100 / hindiFontSize) * 0.6); 
  const hindiLines = Math.ceil((hindi?.length || 0) / charsPerLineHindi) || 1;
  const hindiHeight = (hindiLines * (hindiFontSize / 72) * 1.5) + 0.15;

  return {
    baseFontSize,
    hindiFontSize,
    optionsFontSize: Math.max(baseFontSize * 0.85, 11),
    englishHeight,
    hindiHeight
  };
}

export function calculateSolvingLayout(english: string, hindi: string, usableW: number): LayoutCalculations {
  const totalLen = english.length + (hindi?.length || 0);
  let baseFontSize = 13;
  
  if (totalLen > 800) baseFontSize = 12;
  if (totalLen > 1500) baseFontSize = 10;

  const charsPerLineEng = Math.floor(usableW * (100 / baseFontSize) * 0.7);
  const engLines = Math.ceil((english.length + 5) / charsPerLineEng) || 1;
  const englishHeight = (engLines * (baseFontSize / 72) * 1.4) + 0.1;

  const hindiFontSize = Math.max(baseFontSize * 0.95, 9);
  const charsPerLineHindi = Math.floor(usableW * (100 / hindiFontSize) * 0.6);
  const hindiLines = Math.ceil((hindi?.length || 0) / charsPerLineHindi) || 1;
  const hindiHeight = (hindiLines * (hindiFontSize / 72) * 1.5) + 0.15;

  return {
    baseFontSize,
    hindiFontSize,
    optionsFontSize: Math.max(baseFontSize * 0.85, 10),
    englishHeight,
    hindiHeight
  };
}
