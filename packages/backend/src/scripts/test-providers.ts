#!/usr/bin/env npx tsx
/**
 * AI Provider Test Script
 *
 * Tests all configured AI providers with a sample birth chart
 * and compares response time, token usage, and output quality.
 *
 * Run with: npx tsx src/scripts/test-providers.ts
 */

import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from packages/backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

import { BirthChart, Planet, House, DashaPeriod } from '../services/astrology/types.js';
import { SYSTEM_PROMPT, getCategoryPrompt, ReadingCategory } from '../services/ai/prompts.js';
import {
  createProvider,
  getAvailableProviders,
  AIProvider,
} from '../services/ai/providers/index.js';
import { AIConfig } from '../services/ai/providers/types.js';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Sample birth chart for testing (a realistic example)
function createSampleChart(): BirthChart {
  const birthDate = new Date('1990-05-15T14:30:00');

  const ascendant: Planet = {
    name: 'Sun', // Placeholder for ascendant representation
    sign: 'Virgo',
    signIndex: 5,
    degree: 12.5,
    longitude: 162.5,
    nakshatra: 'Hasta',
    nakshatraPada: 2,
    house: 1,
    isRetrograde: false,
  };

  const planets: Planet[] = [
    {
      name: 'Sun',
      sign: 'Taurus',
      signIndex: 1,
      degree: 0.8,
      longitude: 30.8,
      nakshatra: 'Krittika',
      nakshatraPada: 2,
      house: 9,
      isRetrograde: false,
    },
    {
      name: 'Moon',
      sign: 'Scorpio',
      signIndex: 7,
      degree: 18.3,
      longitude: 228.3,
      nakshatra: 'Jyeshtha',
      nakshatraPada: 1,
      house: 3,
      isRetrograde: false,
    },
    {
      name: 'Mars',
      sign: 'Aquarius',
      signIndex: 10,
      degree: 5.7,
      longitude: 305.7,
      nakshatra: 'Dhanishta',
      nakshatraPada: 3,
      house: 6,
      isRetrograde: false,
    },
    {
      name: 'Mercury',
      sign: 'Aries',
      signIndex: 0,
      degree: 22.1,
      longitude: 22.1,
      nakshatra: 'Bharani',
      nakshatraPada: 4,
      house: 8,
      isRetrograde: false,
    },
    {
      name: 'Jupiter',
      sign: 'Cancer',
      signIndex: 3,
      degree: 8.9,
      longitude: 98.9,
      nakshatra: 'Pushya',
      nakshatraPada: 1,
      house: 11,
      isRetrograde: false,
    },
    {
      name: 'Venus',
      sign: 'Gemini',
      signIndex: 2,
      degree: 15.4,
      longitude: 75.4,
      nakshatra: 'Ardra',
      nakshatraPada: 2,
      house: 10,
      isRetrograde: false,
    },
    {
      name: 'Saturn',
      sign: 'Capricorn',
      signIndex: 9,
      degree: 28.6,
      longitude: 298.6,
      nakshatra: 'Dhanishta',
      nakshatraPada: 1,
      house: 5,
      isRetrograde: true,
    },
    {
      name: 'Rahu',
      sign: 'Aquarius',
      signIndex: 10,
      degree: 12.3,
      longitude: 312.3,
      nakshatra: 'Shatabhisha',
      nakshatraPada: 1,
      house: 6,
      isRetrograde: true,
    },
    {
      name: 'Ketu',
      sign: 'Leo',
      signIndex: 4,
      degree: 12.3,
      longitude: 132.3,
      nakshatra: 'Magha',
      nakshatraPada: 4,
      house: 12,
      isRetrograde: true,
    },
  ];

  const houses: House[] = Array.from({ length: 12 }, (_, i) => ({
    number: i + 1,
    sign: ['Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius',
           'Pisces', 'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo'][i] as any,
    signIndex: (5 + i) % 12,
    degree: 12.5,
    longitude: ((5 + i) * 30 + 12.5) % 360,
  }));

  const now = new Date();
  const dashas: DashaPeriod[] = [
    {
      planet: 'Jupiter',
      startDate: new Date(now.getFullYear() - 5, 0, 1),
      endDate: new Date(now.getFullYear() + 11, 0, 1),
      level: 'maha',
    },
  ];

  return {
    id: 'test-chart-001',
    name: 'Test Subject',
    birthDate,
    birthTime: '14:30',
    place: 'New York, NY, USA',
    latitude: 40.7128,
    longitude: -74.006,
    timezone: 'America/New_York',
    ascendant,
    planets,
    houses,
    dashas,
    ayanamsa: 23.7487,
    ayanamsaName: 'Lahiri',
    calculatedAt: new Date(),
  };
}

interface TestResult {
  provider: string;
  model: string;
  success: boolean;
  responseTime: number;
  outputLength: number;
  wordCount: number;
  output?: string;
  error?: string;
  estimatedTokens?: {
    input: number;
    output: number;
    total: number;
  };
}

// Rough token estimation (approximately 4 characters per token for English)
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

async function testProvider(
  providerName: AIConfig['provider'],
  chart: BirthChart,
  category: ReadingCategory
): Promise<TestResult> {
  const result: TestResult = {
    provider: providerName,
    model: '',
    success: false,
    responseTime: 0,
    outputLength: 0,
    wordCount: 0,
  };

  try {
    const provider = createProvider({ provider: providerName });
    result.model = provider.model;

    if (!provider.isAvailable()) {
      result.error = 'Provider not available (API key not configured)';
      return result;
    }

    const prompt = getCategoryPrompt(chart, category);
    const inputTokenEstimate = estimateTokens(SYSTEM_PROMPT + prompt);

    console.log(`  ${colors.dim}Starting request...${colors.reset}`);
    const startTime = performance.now();

    const output = await provider.generateReading(chart, category, SYSTEM_PROMPT, prompt);

    const endTime = performance.now();
    result.responseTime = Math.round(endTime - startTime);
    result.success = true;
    result.output = output;
    result.outputLength = output.length;
    result.wordCount = output.split(/\s+/).filter(w => w.length > 0).length;

    const outputTokenEstimate = estimateTokens(output);
    result.estimatedTokens = {
      input: inputTokenEstimate,
      output: outputTokenEstimate,
      total: inputTokenEstimate + outputTokenEstimate,
    };
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }

  return result;
}

function printSeparator() {
  console.log('\n' + '═'.repeat(80) + '\n');
}

function printHeader(text: string) {
  console.log(`${colors.bright}${colors.cyan}${text}${colors.reset}`);
}

function printResult(result: TestResult, index: number) {
  const statusIcon = result.success ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;

  console.log(`\n${colors.bright}${index}. ${result.provider.toUpperCase()}${colors.reset} ${statusIcon}`);
  console.log(`   Model: ${colors.dim}${result.model || 'N/A'}${colors.reset}`);

  if (result.success) {
    console.log(`   Response Time: ${colors.yellow}${(result.responseTime / 1000).toFixed(2)}s${colors.reset}`);
    console.log(`   Output Length: ${colors.blue}${result.outputLength} chars${colors.reset} (${result.wordCount} words)`);

    if (result.estimatedTokens) {
      console.log(`   Estimated Tokens: ${colors.magenta}~${result.estimatedTokens.total}${colors.reset} (input: ~${result.estimatedTokens.input}, output: ~${result.estimatedTokens.output})`);
    }
  } else {
    console.log(`   ${colors.red}Error: ${result.error}${colors.reset}`);
  }
}

function printComparisonTable(results: TestResult[]) {
  const successfulResults = results.filter(r => r.success);

  if (successfulResults.length === 0) {
    console.log(`${colors.red}No successful results to compare.${colors.reset}`);
    return;
  }

  console.log('\n┌' + '─'.repeat(78) + '┐');
  console.log('│' + ' COMPARISON TABLE'.padEnd(78) + '│');
  console.log('├' + '─'.repeat(14) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┬' + '─'.repeat(15) + '┤');
  console.log('│' + ' Provider'.padEnd(14) + '│' + ' Time (s)'.padEnd(15) + '│' + ' Words'.padEnd(15) + '│' + ' Est. Tokens'.padEnd(15) + '│' + ' Chars'.padEnd(15) + '│');
  console.log('├' + '─'.repeat(14) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┼' + '─'.repeat(15) + '┤');

  // Sort by response time
  const sorted = [...successfulResults].sort((a, b) => a.responseTime - b.responseTime);

  sorted.forEach((result, i) => {
    const isFastest = i === 0;
    const timeStr = (result.responseTime / 1000).toFixed(2);
    const tokensStr = result.estimatedTokens?.total?.toString() || 'N/A';

    const row = '│' +
      ` ${result.provider}`.padEnd(14) + '│' +
      ` ${timeStr}${isFastest ? ' ⚡' : ''}`.padEnd(15) + '│' +
      ` ${result.wordCount}`.padEnd(15) + '│' +
      ` ~${tokensStr}`.padEnd(15) + '│' +
      ` ${result.outputLength}`.padEnd(15) + '│';

    console.log(row);
  });

  console.log('└' + '─'.repeat(14) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┴' + '─'.repeat(15) + '┘');

  // Statistics
  if (successfulResults.length > 1) {
    const times = successfulResults.map(r => r.responseTime);
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);

    console.log(`\n${colors.dim}Statistics:${colors.reset}`);
    console.log(`  Average response time: ${(avgTime / 1000).toFixed(2)}s`);
    console.log(`  Fastest: ${(fastest / 1000).toFixed(2)}s | Slowest: ${(slowest / 1000).toFixed(2)}s`);
    console.log(`  Variance: ${((slowest - fastest) / 1000).toFixed(2)}s`);
  }
}

function printOutputSamples(results: TestResult[]) {
  const successfulResults = results.filter(r => r.success && r.output);

  if (successfulResults.length === 0) return;

  console.log('\n' + '─'.repeat(80));
  printHeader('\nOUTPUT SAMPLES (First 500 chars)');
  console.log('─'.repeat(80));

  successfulResults.forEach((result, i) => {
    console.log(`\n${colors.bright}${result.provider.toUpperCase()}:${colors.reset}`);
    const sample = result.output!.substring(0, 500);
    console.log(`${colors.dim}${sample}${result.output!.length > 500 ? '...' : ''}${colors.reset}`);
  });
}

async function main() {
  console.clear();
  console.log(`
${colors.bright}${colors.cyan}╔═══════════════════════════════════════════════════════════════╗
║          AI PROVIDER TEST SCRIPT                               ║
║          Jyotish Backend - Provider Comparison                 ║
╚═══════════════════════════════════════════════════════════════╝${colors.reset}
`);

  // Check available providers
  const availableProviders = getAvailableProviders();
  console.log(`${colors.green}Available providers:${colors.reset} ${availableProviders.map(p => p.name).join(', ') || 'None'}\n`);

  if (availableProviders.length === 0) {
    console.log(`${colors.red}No AI providers available. Please configure at least one API key.${colors.reset}`);
    console.log('\nRequired environment variables:');
    console.log('  - ANTHROPIC_API_KEY for Claude');
    console.log('  - DEEPSEEK_API_KEY for DeepSeek');
    console.log('  - GOOGLE_AI_API_KEY for Gemini');
    console.log('  - OPENAI_API_KEY for OpenAI');
    process.exit(1);
  }

  // Create sample chart
  const chart = createSampleChart();
  console.log(`${colors.dim}Using sample birth chart for: ${chart.name}${colors.reset}`);
  console.log(`${colors.dim}Birth: ${chart.birthDate.toDateString()} at ${chart.birthTime}, ${chart.place}${colors.reset}`);

  printSeparator();
  printHeader('TESTING PROVIDERS');
  console.log(`${colors.dim}Category: summary${colors.reset}`);

  const providers: AIConfig['provider'][] = ['claude', 'deepseek', 'gemini', 'openai'];
  const results: TestResult[] = [];

  for (const providerName of providers) {
    console.log(`\n${colors.yellow}Testing ${providerName}...${colors.reset}`);
    const result = await testProvider(providerName, chart, 'summary');
    results.push(result);
    printResult(result, results.length);
  }

  printSeparator();
  printHeader('COMPARISON RESULTS');
  printComparisonTable(results);

  printOutputSamples(results);

  printSeparator();

  // Summary
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`${colors.bright}Summary:${colors.reset}`);
  console.log(`  ${colors.green}✓ Successful:${colors.reset} ${successful.length}/${results.length}`);
  if (failed.length > 0) {
    console.log(`  ${colors.red}✗ Failed:${colors.reset} ${failed.map(r => r.provider).join(', ')}`);
  }

  if (successful.length > 0) {
    const fastest = successful.reduce((a, b) => a.responseTime < b.responseTime ? a : b);
    console.log(`  ${colors.cyan}⚡ Fastest:${colors.reset} ${fastest.provider} (${(fastest.responseTime / 1000).toFixed(2)}s)`);

    const mostVerbose = successful.reduce((a, b) => a.wordCount > b.wordCount ? a : b);
    console.log(`  ${colors.magenta}📝 Most verbose:${colors.reset} ${mostVerbose.provider} (${mostVerbose.wordCount} words)`);
  }

  console.log('\n');
}

// Run the test
main().catch(console.error);
