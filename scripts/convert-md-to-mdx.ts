#!/usr/bin/env bun
/**
 * Convert markdown files to MDX with frontmatter
 * 
 * Usage: bun run scripts/convert-md-to-mdx.ts
 */

import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname, basename, relative } from 'path';
import { existsSync } from 'fs';

const SOURCE_DIR = './documentation';
const TARGET_DIR = './content/docs';

// Map source folders to target folders
const FOLDER_MAP: Record<string, string> = {
  'concepts': 'concepts',
  'design': 'design',
  'evolution': 'evolution',
  'overview': 'overview',
  'recipes': 'recipes',
  'reference/field-types': 'reference/field-types',
  'schema': 'schema',
  'test-schemas': 'test-schemas',
};

// Files in root documentation folder that should go to specific locations
const ROOT_FILE_MAP: Record<string, string> = {
  'README.md': 'index.mdx',
  'SUMMARY.md': '', // Skip
  'schema-properties.md': 'reference/schema-properties.mdx',
  'ai-development-guide.md': 'development/ai-development-guide.mdx',
  'KMM_V2_RUNTIME_DEVELOPMENT_PLAN.md': 'development/v2-runtime-plan.mdx',
  'v2-runtime-development-strategy.md': 'development/v2-runtime-strategy.mdx',
};

interface ConversionResult {
  source: string;
  target: string;
  title: string;
  success: boolean;
  error?: string;
}

/**
 * Extract title from markdown content (first H1 header)
 */
function extractTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : 'Untitled';
}

/**
 * Extract description from markdown content (first paragraph after title)
 */
function extractDescription(content: string): string {
  // Remove the title line
  const withoutTitle = content.replace(/^#\s+.+\n+/, '');
  
  // Find first paragraph (non-empty line that's not a header or code block)
  const lines = withoutTitle.split('\n');
  let description = '';
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines, headers, code blocks, lists
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('```') || 
        trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('>') ||
        trimmed.startsWith('|')) {
      if (description) break; // We found content and hit a break
      continue;
    }
    description += (description ? ' ' : '') + trimmed;
    // Take first sentence or first ~150 chars
    if (description.length > 150 || description.includes('. ')) {
      break;
    }
  }
  
  // Clean up and truncate
  description = description
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links
    .replace(/`([^`]+)`/g, '$1') // Remove inline code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
    .replace(/\*([^*]+)\*/g, '$1') // Remove italic
    .trim();
  
  // Truncate to first sentence or 160 chars
  const firstSentence = description.match(/^[^.!?]+[.!?]/);
  if (firstSentence && firstSentence[0].length < 200) {
    return firstSentence[0].trim();
  }
  
  if (description.length > 160) {
    return description.slice(0, 157) + '...';
  }
  
  return description || 'Documentation page';
}

function escapeAngleBracketsOutsideCodeBlocks(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let inInlineCode = false;

  for (const line of lines) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock;
      result.push(line);
      continue;
    }

    if (inCodeBlock) {
      result.push(line);
      continue;
    }

    let processedLine = '';
    let i = 0;
    while (i < line.length) {
      if (line[i] === '`') {
        inInlineCode = !inInlineCode;
        processedLine += line[i];
        i++;
        continue;
      }

      if (!inInlineCode && line[i] === '<') {
        const rest = line.slice(i);
        if (/^<\d/.test(rest) || /^<[A-Z][a-z]+,/.test(rest) || /^<String/.test(rest)) {
          processedLine += '\\<';
          i++;
          continue;
        }
      }

      if (!inInlineCode && line[i] === '{') {
        const rest = line.slice(i);
        if (/^\{[A-Z]\}/.test(rest)) {
          processedLine += '\\{';
          i++;
          continue;
        }
      }

      processedLine += line[i];
      i++;
    }
    result.push(processedLine);
  }

  return result.join('\n');
}

function convertGitHubAlerts(content: string): string {
  const alertMap: Record<string, string> = {
    'NOTE': 'info',
    'TIP': 'info', 
    'WARNING': 'warn',
    'IMPORTANT': 'error',
    'CAUTION': 'error',
  };

  // Pattern: > [!TYPE]\n> content lines
  const alertPattern = /^>\s*\[!(NOTE|TIP|WARNING|IMPORTANT|CAUTION)\]\s*\n((?:>.*\n?)*)/gm;
  
  return content.replace(alertPattern, (match, type, body) => {
    const calloutType = alertMap[type] || 'info';
    // Remove > prefix from each line and trim
    const cleanBody = body
      .split('\n')
      .map((line: string) => line.replace(/^>\s?/, ''))
      .join('\n')
      .trim();
    
    return `<Callout type="${calloutType}">\n${cleanBody}\n</Callout>\n`;
  });
}

/**
 * Add frontmatter to content
 */
function addFrontmatter(content: string, title: string, description: string): string {
  // Escape quotes in title and description
  const safeTitle = title.replace(/"/g, '\\"');
  const safeDesc = description.replace(/"/g, '\\"');
  
  const frontmatter = `---
title: "${safeTitle}"
description: "${safeDesc}"
---

`;
  
  // Remove the H1 title from content since it's in frontmatter now
  const contentWithoutTitle = content.replace(/^#\s+.+\n+/, '');
  
  return frontmatter + contentWithoutTitle;
}

/**
 * Process a single markdown file
 */
async function processFile(sourcePath: string, targetPath: string): Promise<ConversionResult> {
  const result: ConversionResult = {
    source: sourcePath,
    target: targetPath,
    title: '',
    success: false,
  };

  try {
    const content = await readFile(sourcePath, 'utf-8');
    
    // Extract metadata
    result.title = extractTitle(content);
    const description = extractDescription(content);
    
    let converted = convertGitHubAlerts(content);
    converted = escapeAngleBracketsOutsideCodeBlocks(converted);
    converted = addFrontmatter(converted, result.title, description);
    
    // Ensure target directory exists
    const targetDir = dirname(targetPath);
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true });
    }
    
    // Write file
    await writeFile(targetPath, converted, 'utf-8');
    result.success = true;
    
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error);
  }
  
  return result;
}

/**
 * Get all markdown files recursively
 */
async function getMarkdownFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  
  async function walk(currentDir: string) {
    const entries = await readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

/**
 * Determine target path for a source file
 */
function getTargetPath(sourcePath: string): string | null {
  const relativePath = relative(SOURCE_DIR, sourcePath);
  const fileName = basename(sourcePath);
  const dirPath = dirname(relativePath);
  
  // Handle root files
  if (dirPath === '.') {
    const mapping = ROOT_FILE_MAP[fileName];
    if (mapping === '') return null; // Skip
    if (mapping) return join(TARGET_DIR, mapping);
    // Default: put in root with .mdx extension
    return join(TARGET_DIR, fileName.replace('.md', '.mdx'));
  }
  
  // Handle README.md files in subdirectories -> index.mdx
  if (fileName === 'README.md') {
    return join(TARGET_DIR, dirPath, 'index.mdx');
  }
  
  // Normal files
  return join(TARGET_DIR, relativePath.replace('.md', '.mdx'));
}

/**
 * Main conversion function
 */
async function main() {
  console.log('🔄 Converting markdown to MDX...\n');
  
  const sourceFiles = await getMarkdownFiles(SOURCE_DIR);
  console.log(`Found ${sourceFiles.length} markdown files\n`);
  
  const results: ConversionResult[] = [];
  
  for (const sourcePath of sourceFiles) {
    const targetPath = getTargetPath(sourcePath);
    
    if (!targetPath) {
      console.log(`⏭️  Skipping: ${sourcePath}`);
      continue;
    }
    
    const result = await processFile(sourcePath, targetPath);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${relative('.', result.source)} → ${relative('.', result.target)}`);
    } else {
      console.log(`❌ ${relative('.', result.source)}: ${result.error}`);
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Converted: ${successful}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${sourceFiles.length - results.length}`);
}

main().catch(console.error);
