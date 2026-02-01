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

/**
 * Parse file PDF menggunakan Claude Haiku API
 * MathJax akan merender LaTeX secara otomatis dari format $...$ dan $$...$$
 */
export async function parseWordFile(file: File): Promise<ParsedSoal> {
  try {
    // Validasi format file - hanya PDF yang didukung
    const ext = file.name.toLowerCase().split('.').pop();
    
    if (ext !== 'pdf') {
      throw new Error('Format file tidak didukung. Hanya file .pdf yang didukung.');
    }
    
    // Kirim file ke API route Claude
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await fetch('/api/word/parse-claude', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const parsed: ParsedSoal = await response.json();
    
    // Validate structure
    if (!parsed.soalPG || !parsed.soalEssay) {
      throw new Error('Format respons tidak valid: missing soalPG or soalEssay');
    }
    
    // Tidak perlu konversi LaTeX ke HTML
    // MathJax akan merender langsung dari format $...$ dan $$...$$
    // Pastikan MathJaxProvider sudah di-load di layout
    
    return parsed;
  } catch (error) {
    console.error('Error parsing file with Claude:', error);
    throw error instanceof Error 
      ? error 
      : new Error('Gagal memparse file. Pastikan format file sesuai dan API key Claude dikonfigurasi dengan benar.');
  }
}


