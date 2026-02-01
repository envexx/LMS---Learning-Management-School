/**
 * Standalone Script untuk Test Word Document Parser
 * 
 * Cara menjalankan:
 * 1. npm install mammoth
 * 2. node scripts/test-word-parser.js path/to/your/file.docx
 * 
 * Output: questions.json
 */

const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

/**
 * Parse table-based format
 */
function parseTableFormat(html, numbers, parts) {
  // Look for section markers anywhere in HTML (in <p>, <li>, <h1>, etc.)
  // Support formats:
  // - "A. Pilihan Ganda"
  // - "Pilihan Ganda / Multiple Choice" (without letter prefix)
  // - Inside any HTML tag
  
  let currentSection = 'multiple-choice';
  let sectionCount = 0;
  let questionNum = 1;
  
  // Find all tables in the document
  const tableMatches = Array.from(html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi));
  
  if (tableMatches.length === 0) {
    console.log('  No tables found in document\n');
    return;
  }
  
  console.log(`  Found ${tableMatches.length} table(s) in document\n`);
  
  // Check for section markers before each table
  let lastSectionEnd = 0;
  
  for (const tableMatch of tableMatches) {
    const tableStart = tableMatch.index || 0;
    const tableContent = tableMatch[1];
    
    // Check text between last table and this table for section markers
    const betweenText = html.substring(lastSectionEnd, tableStart);
    
    // Debug: log betweenText
    console.log(`\n--- Between text (${betweenText.length} chars): ---`);
    console.log(betweenText.substring(0, 300));
    console.log('--- End between text ---');
    
    // Extract text from <li>, <p>, <h1>, <strong>, etc.
    // Remove all HTML tags to get clean text for detection
    const betweenClean = betweenText.replace(/<[^>]*>/g, ' ').toLowerCase().trim();
    
    console.log(`Clean between text: "${betweenClean}"`);
    
    if (betweenClean.includes('pilihan ganda') || betweenClean.includes('multiple choice')) {
      currentSection = 'multiple-choice';
      sectionCount++;
      questionNum = 1; // Reset numbering for new section
      console.log(`=== SECTION ${sectionCount}: Multiple Choice ===\n`);
    } else if (betweenClean.includes('essay') && !betweenClean.includes('pilihan')) {
      currentSection = 'essay';
      sectionCount++;
      questionNum = 1; // Reset numbering for new section
      console.log(`=== SECTION ${sectionCount}: Essay ===\n`);
    }
    
    // Parse this table's rows
    const rowMatches = [...tableContent.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
    
    let currentQuestion = null;
    
    for (const rowMatch of rowMatches) {
      const rowContent = rowMatch[1];
      
      // Extract cells
      const cellMatches = [...rowContent.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)];
      
      if (cellMatches.length >= 2) {
        const firstCellRaw = cellMatches[0][1];
        const secondCellRaw = cellMatches[1][1];
        
        // Clean cell content
        const firstCell = cleanHTML(firstCellRaw).trim();
        const secondCell = secondCellRaw.trim(); // Keep HTML for images
        
        // Check if first cell is a question number (1., 2., 3., etc.)
        const questionNumMatch = firstCell.match(/^(\d+)\.$/);
        
        if (questionNumMatch) {
          // This is a new question
          if (currentQuestion) {
            // Save previous question with options appended
            numbers.push(currentQuestion.number);
            
            let contentWithOptions = currentQuestion.content;
            if (currentQuestion.options.length > 0) {
              const optionsText = ' ' + currentQuestion.options
                .map(opt => {
                  // Preserve bold marker for correct answer detection
                  const text = opt.text;
                  return opt.isCorrect ? `${opt.letter}. <strong>${text}</strong>` : `${opt.letter}. ${text}`;
                })
                .join(' ');
              contentWithOptions += optionsText;
            }
            
            parts.push(contentWithOptions);
          }
          
          // Start new question
          currentQuestion = {
            number: questionNumMatch[1],
            content: `<!--SECTION:${currentSection}-->${secondCell}`,
            options: []
          };
          
          console.log(`  [${currentSection.toUpperCase()}] Question ${questionNumMatch[1]}`);
          questionNum++;
          
        } else if (currentQuestion && firstCell.match(/^[A-Da-d]\.$/)) {
          // This is an option row
          const optionLetter = firstCell.match(/^([A-Da-d])\.$/)?.[1];
          if (optionLetter) {
            // Check if this option is marked as correct (red color, bold, or strong tag)
            const isCorrect = 
              secondCellRaw.includes('color:red') ||
              secondCellRaw.includes('color:#FF0000') ||
              secondCellRaw.includes('color:#ff0000') ||
              secondCellRaw.includes('color:rgb(255,0,0)') ||
              secondCellRaw.includes('<strong>') ||
              secondCellRaw.includes('<b>');
            
            currentQuestion.options.push({ 
              letter: optionLetter.toUpperCase(), 
              text: cleanHTML(secondCell),
              isCorrect: isCorrect || undefined // Only add if true
            });
          }
        }
      }
    }
    
    // Save last question from this table
    if (currentQuestion) {
      // Append options to content so parseQuestionContent() can extract them later
      numbers.push(currentQuestion.number);
      
      let contentWithOptions = currentQuestion.content;
      if (currentQuestion.options.length > 0) {
        const optionsText = ' ' + currentQuestion.options
          .map(opt => {
            // Preserve bold marker for correct answer detection
            const text = opt.text;
            return opt.isCorrect ? `${opt.letter}. <strong>${text}</strong>` : `${opt.letter}. ${text}`;
          })
          .join(' ');
        contentWithOptions += optionsText;
      }
      
      parts.push(contentWithOptions);
    }
    
    lastSectionEnd = (tableMatch.index || 0) + tableMatch[0].length;
  }
  
  console.log(`\nFound ${numbers.length} total questions from tables\n`);
}

/**
 * Parse HTML content into structured questions
 */
function parseQuestionsFromHTML(html) {
  const questions = [];
  
  console.log('\n=== RAW HTML PREVIEW ===');
  console.log('Total HTML length:', html.length);
  console.log(html.substring(0, 3000));
  console.log('=== END PREVIEW ===\n');
  
  if (html.length > 5000) {
    console.log('=== MIDDLE SAMPLE (2000-4000) ===');
    console.log(html.substring(2000, 4000));
    console.log('=== END SAMPLE ===\n');
  }
  
  // Remove header/instructions (everything before section A/B/etc or first question)
  let cleanHtml = html;
  
  // Find where actual questions start
  const sectionMatch = html.match(/<p[^>]*>.*?[A-Z]\.\s*Choose.*?<\/p>/i);
  if (sectionMatch && sectionMatch.index !== undefined) {
    cleanHtml = html.substring(sectionMatch.index);
    console.log('✓ Found section marker\n');
  }
  
  // Alternative: look for first "1. " pattern
  const firstQuestionMatch = cleanHtml.match(/(?:<p[^>]*>|\n)\s*1\.\s+/);
  if (firstQuestionMatch && firstQuestionMatch.index !== undefined) {
    cleanHtml = cleanHtml.substring(firstQuestionMatch.index);
    console.log('✓ Found first question\n');
  }
  
  // Check format type
  const hasOrderedList = cleanHtml.includes('<ol>') && cleanHtml.includes('<li>');
  const hasTable = cleanHtml.includes('<table>') && cleanHtml.includes('<tr>');
  
  const parts = [];
  const numbers = [];
  
  if (hasTable) {
    console.log('✓ Detected <table> structure (Word table format)\n');
    
    // Parse table format (implement below)
    parseTableFormat(cleanHtml, numbers, parts);
    
  } else if (hasOrderedList) {
    console.log('✓ Detected <ol><li> structure (Word numbered list)\n');
    
    // Split by section markers
    const sectionPattern = /(Multiple\s*Choice|Pilihan\s*Ganda|Essay\s*Question|Essay)/gi;
    const sections = cleanHtml.split(sectionPattern);
    
    console.log(`  Found ${sections.length} sections\n`);
    
    let currentSection = 'multiple-choice';
    let questionNum = 1;
    
    for (let i = 0; i < sections.length; i++) {
      const sectionContent = sections[i];
      const sectionLower = sectionContent.toLowerCase().trim();
      
      // Detect section type
      if (sectionLower.includes('multiple') || sectionLower.includes('pilihan ganda')) {
        console.log('=== SECTION: Multiple Choice / Pilihan Ganda ===\n');
        currentSection = 'multiple-choice';
        continue;
      } else if (sectionLower.includes('essay')) {
        console.log('=== SECTION: Essay ===\n');
        currentSection = 'essay';
        questionNum = 1;
        continue;
      }
      
      // Extract <ol> from this section
      const olMatches = sectionContent.matchAll(/<ol[^>]*>([\s\S]*?)<\/ol>/gi);
      
      for (const olMatch of olMatches) {
        const olContent = olMatch[1];
        
        // Extract <li> items
        const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        let liMatch;
        
        while ((liMatch = liPattern.exec(olContent)) !== null) {
          const content = liMatch[1];
          
          // Skip instruction
          if (content.toLowerCase().includes('choose the right answer') ||
              content.toLowerCase().includes('pilihlah jawaban') ||
              content.toLowerCase().includes('jawablah pertanyaan')) {
            console.log('  Skipping instruction <li>');
            continue;
          }
          
          // Skip short
          if (content.trim().length < 10) continue;
          
          numbers.push(String(questionNum));
          // Mark section type
          parts.push(`<!--SECTION:${currentSection}-->${content}`);
          
          console.log(`  [${currentSection.toUpperCase()}] Question ${questionNum}`);
          questionNum++;
        }
      }
    }
    
    console.log(`\nFound ${numbers.length} total questions\n`);
  } else {
    console.log('Trying manual numbering patterns...\n');
    
    const questionPattern = /(?:^|<p[^>]*>|<\/p>|\n)\s*(?:<[^>]*>)*\s*(\d+)\.\s*/g;
    const positions = [];
    
    let match;
    while ((match = questionPattern.exec(cleanHtml)) !== null) {
      numbers.push(match[1]);
      positions.push(match.index);
      console.log(`  Found question ${match[1]} at ${match.index}`);
    }
    
    if (numbers.length === 0) {
      console.log('Trying simple pattern...');
      const altPattern = /(\d+)\.\s+/g;
      while ((match = altPattern.exec(cleanHtml)) !== null) {
        const num = parseInt(match[1]);
        if (num >= 1 && num <= 100) {
          numbers.push(match[1]);
          positions.push(match.index);
        }
      }
    }
    
    console.log(`\nFound ${numbers.length} questions: ${numbers.join(', ')}\n`);
    
    // Build parts from positions
    for (let i = 0; i < positions.length; i++) {
      const start = positions[i];
      const end = positions[i + 1] || cleanHtml.length;
      let content = cleanHtml.substring(start, end);
      content = content.replace(/(?:^|<p[^>]*>|<\/p>|\n)\s*(?:<[^>]*>)*\s*\d+\.\s*/, '');
      parts.push(content);
    }
  }
  
  // Parse each question
  for (let i = 0; i < numbers.length; i++) {
    const questionNumber = numbers[i];
    const questionContent = parts[i] || '';
    
    if (!questionContent.trim()) {
      console.log(`Skipping question ${questionNumber} - no content\n`);
      continue;
    }
    
    console.log(`Parsing question ${questionNumber}...`);
    console.log(`  Preview: ${questionContent.substring(0, 100).replace(/\n/g, ' ')}...`);
    
    const question = parseQuestionContent(questionNumber, questionContent);
    if (question) {
      questions.push(question);
      console.log(`  ✓ Success\n`);
    } else {
      console.log(`  ✗ Failed\n`);
    }
  }
  
  return questions;
}

/**
 * Parse individual question content
 */
function parseQuestionContent(questionNumber, content) {
  try {
    // Check section marker
    const sectionMatch = content.match(/<!--SECTION:(.*?)-->/);
    const sectionType = sectionMatch ? sectionMatch[1] : null;
    
    if (sectionType) {
      console.log(`    Section type: ${sectionType}`);
      content = content.replace(/<!--SECTION:.*?-->/, '');
    }
    
    // Extract ALL images
    const imgMatches = [...content.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi)];
    const images = imgMatches.map(m => m[1]);
    const image = images[0];
    
    if (images.length > 0) {
      console.log(`    Found ${images.length} image(s)`);
    }
    
    // Remove images from content for text processing
    const textContent = content.replace(/<img[^>]*>/gi, '');
    
    // Extract options - support both inline and newline formats
    // Format 1: "a. Tea b. coffee c. milk" (inline)
    // Format 2: "A. Tea\nB. coffee" (with newlines)
    // Also detect <strong> tags for correct answer
    const optionPattern = /([A-Da-d])\.\s*([\s\S]+?)(?=\s+[A-Da-d]\.|<\/|<br|$)/gi;
    const options = [];
    const optionMap = new Map();
    const correctAnswerMap = new Map(); // Track which options are bold
    let match;
    
    while ((match = optionPattern.exec(textContent)) !== null) {
      const optionLetter = match[1].toUpperCase();
      let optionTextRaw = match[2]; // Keep HTML for bold detection
      
      // Check if option has <strong> or <b> tag (indicates correct answer)
      const isBold = optionTextRaw.includes('<strong>') || optionTextRaw.includes('<b>');
      
      // Clean HTML tags, newlines, and extra whitespace
      let optionText = optionTextRaw
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // Remove trailing punctuation
      optionText = optionText.replace(/[,;.]*$/, '').trim();
      
      if (optionText && optionText.length > 0) {
        optionMap.set(optionLetter, optionText);
        if (isBold) {
          correctAnswerMap.set(optionLetter, true);
          console.log(`    ✓ Option ${optionLetter} is marked as correct (bold)`);
        }
      }
    }
    
    // Order options A, B, C, D and track correct answer index
    let correctAnswerIndex = undefined;
    ['A', 'B', 'C', 'D'].forEach((letter, index) => {
      if (optionMap.has(letter)) {
        options.push(optionMap.get(letter));
        if (correctAnswerMap.has(letter)) {
          correctAnswerIndex = index; // 0-based index
        }
      }
    });
    
    console.log(`    Found ${options.length} options`);
    
    // Find where options start (if any)
    let optionsStartIndex = -1;
    if (options.length > 0) {
      // More aggressive regex that finds options even without <p> tags
      const firstOptionMatch = textContent.match(/\s*[A-Da-d]\.\s*/i);
      if (firstOptionMatch && firstOptionMatch.index !== undefined) {
        optionsStartIndex = firstOptionMatch.index;
      }
    }
    
    // Get question text (everything before options)
    let questionText = textContent;
    if (optionsStartIndex >= 0) {
      questionText = textContent.substring(0, optionsStartIndex);
    }
    
    questionText = cleanHTML(questionText);
    
    // Extract context (text after image but before options)
    let context = '';
    if (image) {
      const parts = content.split(/<img[^>]*>/i);
      const textAfterImage = parts.slice(1).join('').replace(/<img[^>]*>/gi, '');
      
      // Find options in the text after image
      let contextText = textAfterImage;
      if (options.length > 0) {
        // Find "A." directly in the HTML text
        const firstOptionMatch = textAfterImage.match(/[^>]\s*[A-Da-d]\.\s*/i);
        if (firstOptionMatch && firstOptionMatch.index !== undefined) {
          // Cut at the position where option starts
          contextText = textAfterImage.substring(0, firstOptionMatch.index + 1);
        }
      }
      
      context = cleanHTML(contextText);
    }
    
    if (!questionText.trim()) {
      return null;
    }
    
    // Apply section-based classification
    let finalOptions = options;
    
    if (sectionType === 'essay') {
      finalOptions = [];
      correctAnswerIndex = undefined;
      console.log(`    [ESSAY SECTION] Forcing no options`);
    } else if (sectionType === 'multiple-choice') {
      if (options.length === 0) {
        console.log(`    ⚠️  Warning: No options in MC section`);
      } else {
        console.log(`    [MC SECTION] Options: ${options.length}`);
        if (correctAnswerIndex !== undefined) {
          console.log(`    ✓ Correct answer: ${String.fromCharCode(65 + correctAnswerIndex)} (index ${correctAnswerIndex})`);
        }
      }
    } else {
      console.log(`    Options: ${options.length} (auto-classify)`);
    }
    
    return {
      questionNumber,
      questionText: questionText.trim(),
      image: image ? (image.length > 100 ? `${image.substring(0, 100)}...` : image) : undefined,
      imageSize: image ? `${(image.length * 0.75 / 1024).toFixed(2)} KB` : undefined,
      context: (context && context.trim()) || undefined,
      options: finalOptions,
      correctAnswer: correctAnswerIndex,
    };
  } catch (error) {
    console.error('Error parsing question:', error);
    return null;
  }
}

/**
 * Clean HTML tags but preserve important formatting
 */
function cleanHTML(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newline
    .replace(/<\/p>/gi, '\n') // Convert </p> to newline
    .replace(/<p[^>]*>/gi, '') // Remove <p> tags
    .replace(/<[^>]*>/g, '') // Remove other HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/\n\s*\n/g, '\n') // Remove multiple newlines
    .trim();
}

/**
 * Main function to parse Word document
 */
async function parseWordDocument(filePath) {
  try {
    console.log(`\n📄 Reading file: ${filePath}\n`);
    
    // Read file
    const buffer = fs.readFileSync(filePath);
    
    // Convert to HTML with embedded images as Base64
    console.log('🔄 Converting Word to HTML with Mammoth...\n');
    const result = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          // Extract image as Base64
          const buffer = await image.read();
          const base64 = buffer.toString('base64');
          const contentType = image.contentType || 'image/png';
          
          console.log(`  🖼️  Found image: ${contentType}, ${(buffer.length / 1024).toFixed(2)} KB`);
          
          return {
            src: `data:${contentType};base64,${base64}`
          };
        })
      }
    );
    
    const html = result.value;
    const messages = result.messages;
    
    if (messages.length > 0) {
      console.log('\n⚠️  Warnings from Mammoth:');
      messages.forEach(msg => {
        console.log(`  - ${msg.message}`);
      });
    }
    
    // Parse questions
    console.log('\n🔍 Parsing questions from HTML...\n');
    const questions = parseQuestionsFromHTML(html);
    
    // Save to JSON
    const outputPath = path.join(__dirname, 'questions.json');
    fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2));
    
    // Print summary
    console.log(`\n✅ Success! Found ${questions.length} questions\n`);
    console.log('Summary:');
    console.log(`  - Multiple Choice: ${questions.filter(q => q.options.length > 0).length}`);
    console.log(`  - Essay: ${questions.filter(q => q.options.length === 0).length}`);
    console.log(`  - With Images: ${questions.filter(q => q.image).length}`);
    console.log(`  - With Context: ${questions.filter(q => q.context).length}`);
    console.log(`\n📦 Output saved to: ${outputPath}\n`);
    
    // Print first question as preview
    if (questions.length > 0) {
      console.log('Preview of first question:');
      console.log(JSON.stringify(questions[0], null, 2));
    }
    
    return questions;
  } catch (error) {
    console.error('\n❌ Error parsing document:', error.message);
    throw error;
  }
}

// Run script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                  Word Document Parser Test                    ║
╚═══════════════════════════════════════════════════════════════╝

Usage:
  node scripts/test-word-parser.js <path-to-docx-file>

Example:
  node scripts/test-word-parser.js sample-questions.docx

Features:
  ✅ Extracts questions with numbers (1., 2., 3., etc.)
  ✅ Detects multiple choice options (A., B., C., D.)
  ✅ Extracts images as Base64
  ✅ Handles "In Line with Text" image placement
  ✅ Separates question text, images, context, and options

Output:
  questions.json - Structured questions in JSON format
    `);
    process.exit(1);
  }
  
  const filePath = args[0];
  
  if (!fs.existsSync(filePath)) {
    console.error(`\n❌ File not found: ${filePath}\n`);
    process.exit(1);
  }
  
  if (!filePath.endsWith('.docx')) {
    console.error(`\n❌ File must be .docx format\n`);
    process.exit(1);
  }
  
  parseWordDocument(filePath)
    .then(() => {
      console.log('✅ Done!\n');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Failed:', error.message);
      process.exit(1);
    });
}

module.exports = { parseWordDocument, parseQuestionsFromHTML };


