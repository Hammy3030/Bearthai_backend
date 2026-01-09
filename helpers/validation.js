import Joi from 'joi';

export class ValidationHelper {
  static validateEmail(email) {
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
    return emailRegex.test(email);
  }

  static validatePassword(password) {
    // At least 6 characters
    return password && password.length >= 6;
  }

  static validateStudentCode(studentCode) {
    // Format: STU followed by numbers and letters
    const codeRegex = /^STU[A-Z0-9]+$/i;
    return codeRegex.test(studentCode);
  }

  static validateQRCode(qrCode) {
    // Format: STUDENT_ followed by timestamp and random string
    const qrRegex = /^STUDENT_\d+_[a-zA-Z0-9]+$/;
    return qrRegex.test(qrCode);
  }

  static sanitizeInput(input) {
    if (typeof input !== 'string') return input;
    
    return input
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .substring(0, 1000); // Limit length
  }

  static validateTestAnswers(answers, questions) {
    if (!answers || typeof answers !== 'object') {
      return false;
    }

    // Check if all required questions have answers
    for (const question of questions) {
      if (!(question.id in answers)) {
        return false;
      }
    }

    // Check if answers are valid indices
    for (const question of questions) {
      const answer = answers[question.id];
      if (typeof answer !== 'number' || answer < 0 || answer >= question.options.length) {
        return false;
      }
    }

    return true;
  }

  static validateGameScore(score) {
    return typeof score === 'number' && score >= 0 && score <= 100;
  }

  static validateTimeSpent(timeSpent) {
    return typeof timeSpent === 'number' && timeSpent >= 0 && timeSpent <= 7200; // Max 2 hours
  }

  static validateLessonContent(content) {
    if (!content || typeof content !== 'string') {
      return false;
    }

    // Check minimum length
    if (content.trim().length < 10) {
      return false;
    }

    // Check maximum length
    if (content.length > 50000) {
      return false;
    }

    return true;
  }

  static validateTestSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return true; // Settings are optional
    }

    // Validate time limit
    if (settings.timeLimit !== undefined) {
      if (typeof settings.timeLimit !== 'number' || settings.timeLimit < 1 || settings.timeLimit > 120) {
        return false;
      }
    }

    // Validate number of questions
    if (settings.questionCount !== undefined) {
      if (typeof settings.questionCount !== 'number' || settings.questionCount < 1 || settings.questionCount > 100) {
        return false;
      }
    }

    return true;
  }

  static validateGameSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return true; // Settings are optional
    }

    // Validate game-specific settings
    if (settings.difficulty) {
      const validDifficulties = ['easy', 'medium', 'hard'];
      if (!validDifficulties.includes(settings.difficulty)) {
        return false;
      }
    }

    if (settings.timeLimit) {
      if (typeof settings.timeLimit !== 'number' || settings.timeLimit < 30 || settings.timeLimit > 600) {
        return false;
      }
    }

    return true;
  }
}
