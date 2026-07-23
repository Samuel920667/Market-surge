// Static qualitative data — bull/bear reasons, verdicts, AI text, chart seeds.
// Live prices, news, sentiment, and economics all come from the backend APIs.

export const STOCKS: Record<string, {
  name: string;
  sector: string; pe: number; div: number; revGrowth: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  cap: number; roe: number;
  bullish: string[]; bearish: string[];
  verdict: 'BUY' | 'HOLD' | 'AVOID';
  ai: string;
  chart: number[];
  stats: Record<string, string | number>;
  sentiment: number;
}> = {
  AAPL: {
    name: 'Apple Inc.', sector: 'Technology', pe: 29, div: 0.5, revGrowth: 2, risk: 'LOW', cap: 2900, roe: 147,
    bullish: ['Strong brand loyalty and ecosystem lock-in', 'Services revenue growing 16% YoY', 'Massive $90B share buyback programme', 'Consistent dividend growth for 10+ years'],
    bearish: ['iPhone sales growth slowing', 'High valuation vs revenue growth', 'EU regulatory pressure on App Store fees'],
    verdict: 'BUY',
    ai: "Apple's P/E of 29 is moderate for a mega-cap tech company. Strong cash flow and share buybacks support the stock price. Services revenue is growing 16% per year, reducing dependency on iPhone hardware. The dividend is small but consistent — Apple has raised it every year for over a decade.",
    chart: [170, 175, 172, 180, 185, 183, 188, 186, 190, 189],
    stats: { Revenue: '$383B', 'Net Income': '$97B', 'P/E Ratio': 29, 'Market Cap': '$2.9T', Dividend: '0.5%', Debt: '$111B', 'Cash Flow': '$110B', EPS: '$6.13', '52W High': '$199.62', '52W Low': '$164.08' },
    sentiment: 71,
  },
  NVDA: {
    name: 'NVIDIA Corp.', sector: 'Technology', pe: 65, div: 0.03, revGrowth: 122, risk: 'HIGH', cap: 2100, roe: 91,
    bullish: ['AI chip demand growing exponentially', 'Data center revenue up 409% YoY', 'Dominant GPU market position — hard to replicate', 'Every major AI company depends on NVIDIA'],
    bearish: ['P/E of 65 is very expensive', 'Stock could drop sharply if AI spending slows', 'Competition from AMD and custom chips growing'],
    verdict: 'BUY',
    ai: "NVIDIA's P/E of 65 reflects massive AI growth expectations. Data center revenue grew 409% year-over-year. The high valuation carries risk if AI spending slows. However, NVIDIA has a dominant market position in GPU computing that is very difficult to replicate.",
    chart: [400, 450, 500, 600, 700, 750, 800, 820, 870, 875],
    stats: { Revenue: '$60B', 'Net Income': '$30B', 'P/E Ratio': 65, 'Market Cap': '$2.1T', Dividend: '0.03%', Debt: '$9B', 'Cash Flow': '$28B', EPS: '$12.96', '52W High': '$974.00', '52W Low': '$277.77' },
    sentiment: 94,
  },
  TSLA: {
    name: 'Tesla Inc.', sector: 'Technology', pe: 48, div: 0, revGrowth: -5, risk: 'HIGH', cap: 790, roe: 22,
    bullish: ['Full Self-Driving (FSD) could be transformative', 'Energy storage business growing fast', 'Strong brand and loyal customer base'],
    bearish: ['Q1 deliveries missed estimates badly', 'Margins shrinking due to aggressive price cuts', 'Chinese EV competition intensifying', 'CEO distraction risk'],
    verdict: 'HOLD',
    ai: "Tesla's P/E of 48 is very high for an automaker, but reflects investor belief in its energy and AI ambitions. The Q1 delivery miss raised concerns about demand. Margin compression from price cuts is a key risk. Full Self-Driving progress remains the biggest potential catalyst.",
    chart: [250, 230, 220, 200, 190, 210, 230, 240, 255, 248],
    stats: { Revenue: '$97B', 'Net Income': '$15B', 'P/E Ratio': 48, 'Market Cap': '$790B', Dividend: '0%', Debt: '$5B', 'Cash Flow': '$4B', EPS: '$4.73', '52W High': '$299.29', '52W Low': '$138.80' },
    sentiment: 38,
  },
  MSFT: {
    name: 'Microsoft Corp.', sector: 'Technology', pe: 35, div: 0.7, revGrowth: 17, risk: 'LOW', cap: 3100, roe: 38,
    bullish: ['Azure cloud growing 28% YoY', '$13B investment in OpenAI gives AI edge', 'Copilot embedded in all Office products', 'Consistent dividend payer'],
    bearish: ['High valuation at P/E 35', 'Cloud growth may slow as market matures', 'Regulatory scrutiny on AI and acquisitions'],
    verdict: 'BUY',
    ai: "Microsoft's P/E of 35 is justified by consistent double-digit revenue growth. Azure cloud is growing 28% per year. The $13B investment in OpenAI gives Microsoft a massive AI advantage. Copilot is being embedded into every Microsoft product, creating a powerful upgrade cycle.",
    chart: [340, 355, 360, 370, 380, 390, 400, 408, 412, 415],
    stats: { Revenue: '$212B', 'Net Income': '$72B', 'P/E Ratio': 35, 'Market Cap': '$3.1T', Dividend: '0.7%', Debt: '$47B', 'Cash Flow': '$87B', EPS: '$9.72', '52W High': '$430.82', '52W Low': '$309.45' },
    sentiment: 82,
  },
  JPM: {
    name: 'JPMorgan Chase', sector: 'Finance', pe: 12, div: 2.3, revGrowth: 22, risk: 'LOW', cap: 580, roe: 16,
    bullish: ['Cheap valuation — P/E of only 12', 'High interest rates boosting net interest income', 'Strong dividend of 2.3%', 'Best-managed bank in the US'],
    bearish: ['Banks suffer when interest rates fall', 'Recession risk could increase loan defaults', 'Heavy regulation limits growth'],
    verdict: 'BUY',
    ai: "JPMorgan's P/E of 12 makes it one of the cheapest large-cap stocks available. High interest rates are boosting profits significantly. The 2.3% dividend provides steady income. It is widely considered the best-managed bank in the US.",
    chart: [180, 183, 185, 188, 190, 192, 195, 196, 198, 198],
    stats: { Revenue: '$158B', 'Net Income': '$49B', 'P/E Ratio': 12, 'Market Cap': '$580B', Dividend: '2.3%', Debt: '$310B', 'Cash Flow': '$52B', EPS: '$16.23', '52W High': '$200.94', '52W Low': '$135.19' },
    sentiment: 68,
  },
  JNJ: {
    name: 'Johnson & Johnson', sector: 'Healthcare', pe: 15, div: 3.1, revGrowth: 6, risk: 'LOW', cap: 380, roe: 22,
    bullish: ['Defensive stock — people always need medicine', 'High dividend of 3.1% — great for income', 'Diversified across pharma and medical devices', '60+ years of consecutive dividend increases'],
    bearish: ['Talc litigation overhang', 'Slow revenue growth of 6%', 'Patent cliffs on key drugs approaching'],
    verdict: 'BUY',
    ai: "J&J is a classic defensive stock — it performs well even in recessions because people always need healthcare. The 3.1% dividend is one of the most reliable in the market. Slow but steady growth makes it ideal for conservative, income-focused investors.",
    chart: [148, 149, 150, 151, 150, 152, 151, 153, 152, 152],
    stats: { Revenue: '$85B', 'Net Income': '$14B', 'P/E Ratio': 15, 'Market Cap': '$380B', Dividend: '3.1%', Debt: '$28B', 'Cash Flow': '$18B', EPS: '$5.76', '52W High': '$168.00', '52W Low': '$143.13' },
    sentiment: 60,
  },
  XOM: {
    name: 'ExxonMobil', sector: 'Energy', pe: 14, div: 3.4, revGrowth: -5, risk: 'MEDIUM', cap: 450, roe: 18,
    bullish: ['High dividend of 3.4% — excellent income', 'Cheap valuation at P/E 14', 'Benefits from geopolitical oil supply disruptions', 'Strong balance sheet and cash flow'],
    bearish: ['Revenue declining as oil prices fall', 'Long-term risk from energy transition to renewables', 'Highly sensitive to oil price swings'],
    verdict: 'HOLD',
    ai: "ExxonMobil offers one of the highest dividends in the S&P 500 at 3.4%. The cheap P/E of 14 reflects the market's concern about long-term oil demand. Good for income investors but carries energy transition risk over the next decade.",
    chart: [115, 116, 118, 120, 119, 121, 120, 119, 118, 118],
    stats: { Revenue: '$398B', 'Net Income': '$36B', 'P/E Ratio': 14, 'Market Cap': '$450B', Dividend: '3.4%', Debt: '$40B', 'Cash Flow': '$55B', EPS: '$8.89', '52W High': '$123.75', '52W Low': '$95.77' },
    sentiment: 45,
  },
  META: {
    name: 'Meta Platforms', sector: 'Technology', pe: 28, div: 0, revGrowth: 27, risk: 'MEDIUM', cap: 1300, roe: 35,
    bullish: ['Ad revenue rebounding strongly', 'AI investments paying off in engagement', 'WhatsApp and Instagram monetisation growing', 'Reasonable P/E of 28 for growth rate'],
    bearish: ['Reality Labs (metaverse) losing billions', 'Regulatory risk in EU and US', 'Dependence on advertising revenue'],
    verdict: 'BUY',
    ai: "Meta's turnaround has been remarkable. Ad revenue is growing 27% year-over-year and the P/E of 28 is reasonable for that growth rate. The metaverse division is still a drag but the core social media business is very strong.",
    chart: [380, 400, 420, 440, 460, 470, 480, 490, 500, 505],
    stats: { Revenue: '$134B', 'Net Income': '$39B', 'P/E Ratio': 28, 'Market Cap': '$1.3T', Dividend: '0%', Debt: '$18B', 'Cash Flow': '$43B', EPS: '$14.87', '52W High': '$531.49', '52W Low': '$274.38' },
    sentiment: 78,
  },
};

// HEATMAP derives change % from live company API — seeded to 0 until live data loads
export const HEATMAP = Object.keys(STOCKS).map(sym => ({ sym, chg: 0 }));
