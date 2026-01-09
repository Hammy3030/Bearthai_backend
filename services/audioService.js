import axios from 'axios';

/**
 * Audio Service for Text-to-Speech
 * Optimized for Grade 1 Thai students
 */
export class AudioService {
    /**
     * Generate speech from text with child-friendly settings
     * @param {string} text - Text to convert to speech
     * @param {Object} options - Additional options
     * @returns {Promise<string>} - URL to audio file
     */
    static async generateSpeech(text, options = {}) {
        try {
            const {
                speed = 0.75,        // พูดช้าลง 25% เพื่อให้เด็กฟังชัด
                pitch = 1.1,         // เสียงสูงขึ้นเล็กน้อย เหมาะกับเด็ก
                volume = 1.0,        // ระดับเสียงปกติ
                pauseBetweenWords = 0.3,  // หยุดระหว่างคำ 0.3 วินาที
                emphasis = 'moderate',     // เน้นเสียงปานกลาง
                locale = 'th-TH'    // ภาษาไทยมาตรฐาน
            } = options;

            // เพิ่มช่วงหยุดระหว่างคำเพื่อความชัดเจน
            const processedText = this.addPausesToText(text, pauseBetweenWords);

            // TODO: Integrate with actual TTS service (Google TTS, Azure TTS, etc.)
            // For now, return a placeholder
            console.log('🔊 Generating speech:', {
                text: processedText,
                speed,
                pitch,
                volume,
                emphasis,
                locale
            });

            // ในอนาคตจะต่อกับ TTS service จริง
            // const response = await axios.post('TTS_API_ENDPOINT', {
            //   text: processedText,
            //   voice: 'th-TH-Premium',
            //   speed,
            //   pitch,
            //   volume
            // });
            // return response.data.audioUrl;

            return null; // จะ return audio URL เมื่อต่อกับ TTS service
        } catch (error) {
            console.error('❌ Error generating speech:', error);
            throw error;
        }
    }

    /**
     * Add pauses between words for clarity
     * @param {string} text - Original text
     * @param {number} pauseDuration - Pause duration in seconds
     * @returns {string} - Text with SSML pause markers
     */
    static addPausesToText(text, pauseDuration = 0.3) {
        // แยกคำด้วยช่องว่าง
        const words = text.split(' ');

        // เพิ่ม pause ระหว่างคำ (SSML format)
        const pauseMs = Math.round(pauseDuration * 1000);
        return words.map(word => {
            // ถ้าเป็นพยัญชนะหรือสระเดี่ยว ให้หยุดนานขึ้น
            if (word.length === 1 || this.isSingleCharacter(word)) {
                return `${word}<break time="${pauseMs * 1.5}ms"/>`;
            }
            return `${word}<break time="${pauseMs}ms"/>`;
        }).join(' ');
    }

    /**
     * Check if text is a single character (consonant, vowel)
     */
    static isSingleCharacter(text) {
        const cleaned = text.trim();
        return cleaned.length === 1 || /^[ก-ฮะ-ฺ็-์]$/.test(cleaned);
    }

    /**
     * Generate audio for lesson content
     * @param {Object} lesson - Lesson object
     * @returns {Promise<Object>} - Lesson with audio URLs
     */
    static async generateLessonAudio(lesson) {
        try {
            const audioUrls = {};

            // สร้างเสียงสำหรับชื่อบทเรียน
            if (lesson.title) {
                audioUrls.title = await this.generateSpeech(lesson.title, {
                    speed: 0.8,  // พูดช้าหน่อยสำหรับชื่อบท
                    pitch: 1.2   // เสียงสูงขึ้นเล็กน้อย
                });
            }

            // สร้างเสียงสำหรับเนื้อหา
            if (lesson.content) {
                audioUrls.content = await this.generateSpeech(lesson.content, {
                    speed: 0.75,
                    pitch: 1.1
                });
            }

            // สร้างเสียงสำหรับแต่ละ step
            if (lesson.steps && lesson.steps.length > 0) {
                audioUrls.steps = [];
                for (const step of lesson.steps) {
                    const stepAudio = await this.generateSpeech(
                        `${step.title}. ${step.content}`,
                        {
                            speed: 0.75,
                            pitch: 1.1,
                            pauseBetweenWords: 0.4 // หยุดนานขึ้นสำหรับคำแนะนำ
                        }
                    );
                    audioUrls.steps.push(stepAudio);
                }
            }

            return {
                ...lesson,
                audioUrls
            };
        } catch (error) {
            console.error('❌ Error generating lesson audio:', error);
            return lesson; // Return original lesson if audio generation fails
        }
    }

    /**
     * Generate audio for test questions
     * @param {Object} question - Question object
     * @returns {Promise<string>} - Audio URL
     */
    static async generateQuestionAudio(question) {
        try {
            // เพิ่มคำว่า "ข้อ" ข้างหน้าเพื่อให้เด็กรู้ว่าเป็นคำถาม
            const questionText = `คำถาม: ${question.question}`;

            return await this.generateSpeech(questionText, {
                speed: 0.7,  // พูดช้ามากสำหรับคำถาม
                pitch: 1.15,
                pauseBetweenWords: 0.5 // หยุดนานเพื่อให้เด็กได้คิด
            });
        } catch (error) {
            console.error('❌ Error generating question audio:', error);
            return null;
        }
    }

    /**
     * Generate encouraging sound effects
     * @param {string} type - Type of sound (correct, incorrect, complete)
     * @returns {string} - Sound effect identifier
     */
    static getEncouragingSound(type) {
        const sounds = {
            correct: '🎉 เก่งมาก!',
            incorrect: '💪 ลองใหม่นะ!',
            complete: '🌟 ยอดเยี่ยม! เรียนจบแล้ว!',
            try_again: '😊 อีกนิดเดียว!',
            good_job: '👏 ทำได้ดีมาก!'
        };

        return sounds[type] || sounds.good_job;
    }
}

export default AudioService;
