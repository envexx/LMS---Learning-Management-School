import mammoth from 'mammoth';

interface ParsedSoalPG {
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  kunciJawaban: string;
}

interface ParsedSoalEssay {
  pertanyaan: string;
  kunciJawaban: string;
}

interface ParsedSoal {
  soalPG: ParsedSoalPG[];
  soalEssay: ParsedSoalEssay[];
}

export async function parseWordFile(file: File): Promise<ParsedSoal> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    const text = result.value;
    return parseText(text);
  } catch (error) {
    console.error('Error parsing Word file:', error);
    throw new Error('Gagal memparse file Word');
  }
}

function parseText(text: string): ParsedSoal {
  const soalPG: ParsedSoalPG[] = [];
  const soalEssay: ParsedSoalEssay[] = [];
  
  const normalizedText = text.replace(/\t/g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  let pgText = '';
  let essayText = '';
  
  const pgPatterns = [
    /A\.\s*PILIHAN\s*GANDA([\s\S]*?)(?=B\.\s*ESSAY|$)/i,
    /PILIHAN\s*GANDA([\s\S]*?)(?=ESSAY|$)/i,
  ];
  
  for (const pattern of pgPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      pgText = match[1];
      break;
    }
  }
  
  const essayPatterns = [
    /B\.\s*ESSAY([\s\S]*?)$/i,
    /ESSAY([\s\S]*?)$/i,
  ];
  
  for (const pattern of essayPatterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      essayText = match[1];
      break;
    }
  }
  
  if (pgText) {
    const pgSoals = parsePilihanGanda(pgText);
    soalPG.push(...pgSoals);
  }
  
  if (essayText) {
    const essaySoals = parseEssay(essayText);
    soalEssay.push(...essaySoals);
  }
  
  return { soalPG, soalEssay };
}

function parsePilihanGanda(text: string): ParsedSoalPG[] {
  const soals: ParsedSoalPG[] = [];
  const trimmedText = text.trim();
  
  const questionPattern = /(\d+)\.\s*([^\n]+(?:\n(?!A\.|B\.|C\.|D\.|Kunci)[^\n]+)*)\s*A\.\s*([^\n]+)\s*B\.\s*([^\n]+)\s*C\.\s*([^\n]+)\s*D\.\s*([^\n]+)\s*Kunci\s+Jawaban\s*:\s*([A-D])/gi;
  
  let match;
  while ((match = questionPattern.exec(trimmedText)) !== null) {
    const [, , pertanyaan, opsiA, opsiB, opsiC, opsiD, kunciJawaban] = match;
    
    soals.push({
      pertanyaan: pertanyaan.trim(),
      opsiA: opsiA.trim(),
      opsiB: opsiB.trim(),
      opsiC: opsiC.trim(),
      opsiD: opsiD.trim(),
      kunciJawaban: kunciJawaban.toUpperCase(),
    });
  }
  
  return soals;
}

function parseEssay(text: string): ParsedSoalEssay[] {
  const soals: ParsedSoalEssay[] = [];
  const normalizedText = text.replace(/\t/g, ' ').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const questions = normalizedText.split(/\n(?=\d+\.\s)/);
  
  for (const question of questions) {
    if (!question.trim() || question.match(/B\.\s*ESSAY/i)) continue;
    
    try {
      const lines = question.split('\n');
      const questionMatch = lines[0].match(/^\d+\.\s*(.+)/);
      if (!questionMatch) continue;
      
      const pertanyaan = questionMatch[1].trim();
      let kunciJawaban = '';
      let foundKunci = false;
      
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        
        if (/Kunci\s+Jawaban\s*:/i.test(line)) {
          foundKunci = true;
          const afterKunci = line.replace(/Kunci\s+Jawaban\s*:\s*/i, '').trim();
          if (afterKunci) {
            kunciJawaban = afterKunci;
          }
        } else if (foundKunci) {
          if (line.trim()) {
            kunciJawaban += (kunciJawaban ? '\n' : '') + line.trim();
          }
        }
      }
      
      if (pertanyaan && kunciJawaban) {
        soals.push({
          pertanyaan,
          kunciJawaban,
        });
      }
    } catch (error) {
      console.error('Error parsing Essay question:', error);
      continue;
    }
  }
  
  return soals;
}
