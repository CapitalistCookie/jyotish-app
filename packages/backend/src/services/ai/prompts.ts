import { BirthChart } from '../astrology/types.js';

export const SYSTEM_PROMPT = `You are an expert Vedic astrologer with deep knowledge of Jyotish (Indian astrology). You have studied the ancient texts including Brihat Parashara Hora Shastra, Jataka Parijata, and Phaladeepika.

Your approach:
- Provide insightful, personalized readings based on birth charts
- Be encouraging but honest about challenges and growth opportunities
- Use accessible language while maintaining astrological accuracy
- Reference specific planetary positions, houses, and aspects to support your interpretations
- Consider the whole chart holistically, not just isolated placements
- Acknowledge the Vimshottari Dasha periods when discussing timing
- Be respectful of the sacred nature of Jyotish

Format your responses with clear paragraphs. You may use markdown for emphasis when appropriate.`;

export const READING_CATEGORIES = [
  'summary',
  'love',
  'career',
  'finances',
  'health',
  'timeline',
] as const;

export type ReadingCategory = typeof READING_CATEGORIES[number];

/**
 * Format chart data into a readable format for the AI
 */
export function formatChartForPrompt(chart: BirthChart): string {
  const planetDetails = chart.planets
    .map(p => {
      let detail = `${p.name}: ${p.sign} ${p.degree.toFixed(1)}° (House ${p.house})`;
      if (p.nakshatra) {
        detail += `, ${p.nakshatra} Pada ${p.nakshatraPada}`;
      }
      if (p.isRetrograde) {
        detail += ' [Retrograde]';
      }
      return detail;
    })
    .join('\n');

  const ascendantDetail = `Ascendant (Lagna): ${chart.ascendant.sign} ${chart.ascendant.degree.toFixed(1)}°, ${chart.ascendant.nakshatra} Pada ${chart.ascendant.nakshatraPada}`;

  // Find current dasha
  const now = new Date();
  const currentDasha = chart.dashas.find(d => {
    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    return now >= start && now <= end;
  });

  const dashaInfo = currentDasha
    ? `Current Mahadasha: ${currentDasha.planet} (${new Date(currentDasha.startDate).getFullYear()} - ${new Date(currentDasha.endDate).getFullYear()})`
    : 'Dasha information not available';

  return `
BIRTH CHART DATA
================
${ascendantDetail}

Planetary Positions:
${planetDetails}

${dashaInfo}

Ayanamsa: ${chart.ayanamsaName} (${chart.ayanamsa.toFixed(4)}°)
`;
}

/**
 * Get the prompt for a specific reading category
 */
export function getCategoryPrompt(chart: BirthChart, category: ReadingCategory): string {
  const chartData = formatChartForPrompt(chart);

  switch (category) {
    case 'summary':
      return `${chartData}

Based on this Vedic birth chart, provide a comprehensive overview reading that covers:

1. **Core Nature & Personality**: Describe the fundamental character traits based on the Ascendant, Moon sign, and key planetary positions.

2. **Strengths & Gifts**: Highlight the native's natural talents and positive planetary combinations (yogas) if present.

3. **Life Themes & Lessons**: What are the major themes this soul has come to explore? What challenges may arise for growth?

4. **Current Influences**: Based on the current Mahadasha period, what energies are most active now?

Keep the reading to 4-5 paragraphs, personal and insightful.`;

    case 'love':
      return `${chartData}

Based on this Vedic birth chart, provide a detailed reading about love, relationships, and marriage:

1. **Relationship Nature**: How does this person approach love and partnership? What do they seek in a partner?

2. **7th House Analysis**: Examine the 7th house (partnerships), its lord, and any planets placed there.

3. **Venus Placement**: Analyze Venus's sign, house, and aspects for relationship patterns.

4. **Compatibility Factors**: What types of partners would be most harmonious? Any karmic patterns in relationships?

5. **Timing for Love**: Based on current and upcoming Dashas, when might significant relationship developments occur?

Be compassionate but honest about both gifts and challenges in the relationship sphere.`;

    case 'career':
      return `${chartData}

Based on this Vedic birth chart, provide a detailed reading about career, profession, and life purpose:

1. **Career Indicators**: Analyze the 10th house (karma/career), its lord, and any planets influencing it.

2. **Natural Talents**: What skills and abilities are indicated by planetary positions? Consider the 2nd house (wealth through effort) and 6th house (service/daily work).

3. **Ideal Career Paths**: Based on the planetary combinations, what fields or types of work would be most fulfilling?

4. **Professional Challenges**: Any obstacles indicated? How can they be navigated?

5. **Career Timing**: Based on Dasha periods, when might significant professional developments or changes occur?

Provide practical, actionable insights while honoring the spiritual dimension of vocation.`;

    case 'finances':
      return `${chartData}

Based on this Vedic birth chart, provide a detailed reading about wealth, finances, and material prosperity:

1. **Wealth Indicators**: Analyze the 2nd house (accumulated wealth), 11th house (gains), and their lords.

2. **Money Patterns**: How does this person naturally relate to money? Are they inclined to save, spend, or invest?

3. **Sources of Wealth**: What avenues for income are most supported by the chart? Any Dhana Yogas (wealth combinations)?

4. **Financial Challenges**: Any indications of obstacles to wealth? How can they be mitigated?

5. **Prosperity Timing**: Based on Dasha periods, when might financial growth or challenges be most likely?

Be balanced—acknowledge both opportunities and areas requiring caution.`;

    case 'health':
      return `${chartData}

Based on this Vedic birth chart, provide a reading about health and vitality:

1. **Constitution**: What is the general physical constitution indicated by the Ascendant and its lord?

2. **Vitality Indicators**: Analyze the 1st house (body), 6th house (disease), and 8th house (chronic conditions).

3. **Potential Vulnerabilities**: Which body systems or organs might need extra care? (Note: This is general guidance, not medical advice)

4. **Wellness Recommendations**: Based on the chart, what lifestyle practices, exercises, or routines might be beneficial?

5. **Health Timing**: Any periods requiring extra attention to health based on planetary transits or Dashas?

IMPORTANT: Remind the reader that astrological insights complement but do not replace professional medical advice.`;

    case 'timeline':
      return `${chartData}

Based on this Vedic birth chart, provide a timeline reading covering past influences and future possibilities:

1. **Recent Past**: Based on the previous Dasha periods, what themes and lessons were emphasized?

2. **Current Period**: Deeply analyze the current Mahadasha and any active Antardasha. What is the cosmic focus right now?

3. **Upcoming 1-3 Years**: What shifts might occur as Dasha periods change? Any significant planetary transits to note?

4. **Medium-Term (3-7 Years)**: What longer-term themes are building? What opportunities might emerge?

5. **Key Timing Windows**: Are there any particularly auspicious or challenging periods ahead to be aware of?

Be specific about dates and planetary periods where possible, while acknowledging that astrology shows tendencies, not fixed outcomes.`;

    default:
      return `${chartData}

Please provide a general Vedic astrology reading for this birth chart.`;
  }
}

/**
 * Get prompt for follow-up chat questions
 */
export function getChatPrompt(chart: BirthChart, previousReadings: string[], question: string): string {
  const chartData = formatChartForPrompt(chart);

  const previousContext = previousReadings.length > 0
    ? `\nPrevious readings provided:\n${previousReadings.join('\n---\n')}\n`
    : '';

  return `${chartData}
${previousContext}
The querent asks: "${question}"

Provide a focused, helpful response to their question based on the birth chart. Reference specific planetary positions to support your answer. Keep your response concise but thorough.`;
}
