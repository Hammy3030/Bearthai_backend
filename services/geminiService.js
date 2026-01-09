/**
 * Google Gemini API Service for Handwriting Detection
 * Uses Google's Gemini Vision API for Thai handwritten character recognition
 */

export class GeminiService {
  static apiKey = null;
  static modelName = 'gemini-2.5-flash'; // Fast and cost-effective (updated model)

  /**
   * Check if Gemini API is configured
   */
  static isConfigured() {
    return !!process.env.GEMINI_API_KEY;
  }

  /**
   * Detect handwriting using Gemini Vision API
   * @param {string} imageData - Base64 encoded image (data:image/png;base64,...)
   * @param {string} targetWord - Target character to detect
   * @returns {Promise<Object>} Detection result
   */
  static async detectHandwriting(imageData, targetWord) {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY in .env file');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    // Extract base64 data
    const base64Data = imageData.includes(',') 
      ? imageData.split(',')[1] 
      : imageData;

    // Prepare prompt (similar to Claude but optimized for Gemini)
    const prompt = this.buildPrompt(targetWord);

    try {
      console.log('🤖 Calling Gemini API for handwriting detection...');
      console.log(`   Model: ${modelName}`);
      console.log(`   Target: ${targetWord}`);

      // Call Gemini API - Try v1 first, fallback to v1beta
      // Use v1 endpoint for newer models like gemini-2.5-flash
      const apiVersion = modelName.includes('2.5') ? 'v1' : 'v1beta';
      const response = await fetch(
        `https://generativelanguage.googleapis.com/${apiVersion}/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt
                  },
                  {
                    inline_data: {
                      mime_type: 'image/png',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.1, // Low temperature for consistent results
              topK: 40,
              topP: 0.95,
              maxOutputTokens: 2048, // Increased to prevent truncation
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Gemini API Error Response:', errorData);
        throw new Error(errorData.error?.message || `Gemini API request failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini API Response:', JSON.stringify(data, null, 2));

      // Extract text from response
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      
      if (!textContent) {
        throw new Error('No response from Gemini API');
      }

      console.log('Raw text from Gemini:', textContent);

      // Check if response was truncated (MAX_TOKENS finish reason)
      const finishReason = data.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
        console.warn('⚠️ Gemini response was truncated (MAX_TOKENS). Attempting to fix JSON...');
      }

      // Parse JSON response - handle truncated JSON
      let cleanText = textContent.replaceAll('```json', '').replaceAll('```', '').trim();
      
      // Extract JSON object (handle incomplete JSON)
      const jsonMatch = cleanText.match(/\{[\s\S]*/);
      if (jsonMatch) {
        cleanText = jsonMatch[0];
        
        // If JSON is incomplete (unterminated string), try to fix it
        if (!cleanText.match(/\}$/)) {
          // Count open braces
          const openBraces = (cleanText.match(/\{/g) || []).length;
          const closeBraces = (cleanText.match(/\}/g) || []).length;
          
          // Close missing braces
          for (let i = 0; i < openBraces - closeBraces; i++) {
            cleanText += '}';
          }
          
          // If there's an unterminated string in explanation field, close it
          if (cleanText.includes('"explanation":') && !cleanText.match(/"explanation"\s*:\s*"[^"]*"/)) {
            // Find the last quote and ensure string is closed
            const lastQuoteIndex = cleanText.lastIndexOf('"');
            if (lastQuoteIndex > 0) {
              // Check if it's part of an unterminated string
              const beforeQuote = cleanText.substring(0, lastQuoteIndex);
              const quoteCount = (beforeQuote.match(/"/g) || []).length;
              if (quoteCount % 2 === 1) {
                // Odd number of quotes means unterminated string - add closing quote
                cleanText = cleanText.substring(0, lastQuoteIndex + 1) + '"';
              }
            }
            // Ensure explanation field is properly closed
            if (!cleanText.match(/"explanation"\s*:\s*"[^"]*"\s*\}/)) {
              cleanText = cleanText.replace(/"explanation"\s*:\s*"([^"]*)$/, '"explanation": "$1"');
            }
          }
        }
      }

      let result;
      try {
        result = JSON.parse(cleanText);
        console.log('Parsed result from Gemini:', result);
      } catch (parseError) {
        console.error('JSON parse error:', parseError.message);
        console.error('Cleaned text:', cleanText);
        
        // Fallback: Try to extract fields manually
        const detectedMatch = cleanText.match(/"detected"\s*:\s*"([^"]*)"/);
        const isCorrectMatch = cleanText.match(/"isCorrect"\s*:\s*(true|false)/);
        const confidenceMatch = cleanText.match(/"confidence"\s*:\s*(\d+)/);
        const explanationMatch = cleanText.match(/"explanation"\s*:\s*"([^"]*)"/);
        
        result = {
          detected: detectedMatch ? detectedMatch[1] : '',
          isCorrect: isCorrectMatch ? isCorrectMatch[1] === 'true' : false,
          confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 0,
          explanation: explanationMatch ? explanationMatch[1] : 'เกิดข้อผิดพลาดในการประมวลผล'
        };
        
        console.warn('⚠️ Using fallback parsing:', result);
      }

      // Return formatted result
      return {
        detectedText: result.detected || '',
        isCorrect: result.isCorrect || false,
        confidence: Math.min(100, Math.max(0, result.confidence || 0)),
        explanation: result.explanation || '',
        method: 'Gemini'
      };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error(`Gemini detection failed: ${error.message}`);
    }
  }

  /**
   * Build prompt for Gemini API
   */
  static buildPrompt(targetWord) {
    return `You are an expert Thai handwriting evaluator. Analyze the student's handwriting and determine if it matches the target character "${targetWord}".

IMAGE ANALYSIS:
- GRAY DASHED LINE = Guide template (the correct character "${targetWord}")
- BLUE LINE = Student's handwriting

EVALUATION CRITERIA (STRICT - FOLLOW EXACTLY):

1. **TRACING ACCURACY (MOST IMPORTANT - CHECK FIRST!)**:
   - Measure overlap: What % of gray guide line is covered by blue line?
   - Check quality: Is blue line a SINGLE CLEAN TRACE or messy scribbles?
   
   **REJECT IMMEDIATELY if:**
   - Messy scribbles/zig-zags → isCorrect: false, confidence: 0-30%
   - Overlap < 80% → isCorrect: false, confidence: 0-49%
   - Multiple random lines → isCorrect: false, confidence: 0-20%
   - Written outside guide → isCorrect: false, confidence: 0-15%
   
   **ACCEPT ONLY if:**
   - Overlap ≥ 80% AND
   - Single clean trace (not messy) AND
   - Follows guide shape closely AND
   - Character shape matches "${targetWord}" exactly

2. **CHARACTER SHAPE MATCHING**:
   - Does blue line's shape match "${targetWord}"?
   - Check Thai-specific features (head orientation, tail length, etc.)

3. **DECISION RULES**:
   - isCorrect: true ONLY if overlap ≥ 80% AND clean trace AND correct character
   - If messy scribbles → isCorrect: false (NO EXCEPTIONS!)
   - If overlap < 80% → isCorrect: false (even if character is correct!)

**CRITICAL: Messy scribbles = ALWAYS WRONG, no matter what!**

Response format (JSON only, no markdown):
{
  "detected": "Character detected (e.g., '${targetWord}', 'ก', 'ข')",
  "isCorrect": true/false (true ONLY if overlap ≥ 80% AND clean trace AND correct character),
  "confidence": 0-100 (based on overlap % and quality: 90-100% = perfect, 80-89% = good, <80% = poor),
  "explanation": "Brief feedback in Thai. If incorrect, mention: 'ลองเขียนให้ทับเส้นประให้มากขึ้น' (if overlap < 80%), 'ลองเขียนให้เป็นเส้นเดียวที่ชัดเจน' (if messy), 'เขียนได้ดีมาก!' (if correct)"
}`;
  }
}
