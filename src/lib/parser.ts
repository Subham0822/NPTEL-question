import { ParsedQuestionCandidate, ParseError, ParseResult, Question, QuestionType } from '../types';

/**
 * Standard ChatGPT import prompt & template for NPTEL Cybersecurity questions.
 */
export const QUESTION_IMPORT_TEMPLATE = `[QUESTION]
Which element of the CIA triad is primarily compromised during a Denial of Service (DoS) attack?
[TYPE]
single
[OPTION]
Confidentiality
[OPTION]
Integrity
[OPTION]
Availability
[OPTION]
Authenticity
[ANSWER]
C
[EXPLANATION]
DoS attacks overwhelm server resources, preventing authorized users from accessing the system.
[/QUESTION]

[QUESTION]
Which of the following are common characteristics of phishing attacks?
[TYPE]
multiple
[OPTION]
Deceptive emails simulating trusted entities
[OPTION]
Harvesting user credentials and sensitive information
[OPTION]
Social engineering psychological manipulation
[OPTION]
Hardware overclocking to increase CPU performance
[ANSWER]
A
[ANSWER]
B
[ANSWER]
C
[EXPLANATION]
Phishing relies on deceptive messaging and social engineering to steal credentials. Hardware overclocking is completely unrelated.
[/QUESTION]`;

/**
 * Validates whether user-selected answers match correct answers.
 * For multiple-answer questions: exact set match (order-independent).
 * For single-answer questions: exact match.
 */
export function validateAnswers(
  selectedAnswers: string[],
  correctAnswers: string[]
): boolean {
  if (!selectedAnswers || !correctAnswers) return false;
  if (selectedAnswers.length !== correctAnswers.length) return false;

  const correctSet = new Set(correctAnswers.map((s) => s.trim().toLowerCase()));
  const selectedSet = new Set(selectedAnswers.map((s) => s.trim().toLowerCase()));

  if (correctSet.size !== selectedSet.size) return false;

  for (const ans of selectedSet) {
    if (!correctSet.has(ans)) return false;
  }

  return true;
}

/**
 * Main parser function to convert raw copy-pasted text into structured MCQ objects.
 * Handles both Single-Answer and Multiple-Answer formats, with backwards compatibility.
 */
export function parseQuestions(text: string, targetWeek: number | 'all'): ParseResult {
  const validQuestions: ParsedQuestionCandidate[] = [];
  const errors: ParseError[] = [];

  if (!text || text.trim() === '') {
    return {
      validQuestions: [],
      errors: [
        {
          index: 0,
          title: 'Empty Input',
          reason: 'No text was provided. Please paste formatted questions into the input area.',
          rawSnippet: '',
        },
      ],
    };
  }

  // Regex to extract all [QUESTION] ... [/QUESTION] blocks
  const questionRegex = /\[QUESTION\]([\s\S]*?)\[\/QUESTION\]/gi;
  const blocks: { content: string; start: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionRegex.exec(text)) !== null) {
    blocks.push({
      content: match[1],
      start: match.index,
    });
  }

  // Check for orphan tags or syntax mismatches
  const openCount = (text.match(/\[QUESTION\]/gi) || []).length;
  const closeCount = (text.match(/\[\/QUESTION\]/gi) || []).length;

  if (blocks.length === 0) {
    errors.push({
      index: 0,
      title: 'No Valid Blocks Found',
      reason:
        'Could not find any [QUESTION] ... [/QUESTION] blocks. Please ensure your text follows the template format.',
      rawSnippet: text.slice(0, 200),
    });
    return { validQuestions, errors };
  }

  if (openCount !== closeCount) {
    errors.push({
      index: blocks.length + 1,
      title: 'Unclosed Question Block',
      reason: `Detected ${openCount} [QUESTION] tag(s) but ${closeCount} [/QUESTION] closing tag(s). One or more questions might be missing [/QUESTION].`,
      rawSnippet: text.slice(
        Math.max(0, text.lastIndexOf('[QUESTION]')),
        Math.min(text.length, text.lastIndexOf('[QUESTION]') + 150)
      ),
    });
  }

  blocks.forEach((block, idx) => {
    const qIndex = idx + 1;
    let rawContent = block.content.trim();

    // Check for [TYPE] tag
    let specifiedType: QuestionType | null = null;
    const typeMatch = rawContent.match(/\[TYPE\]\s*([a-zA-Z]+)/i);

    if (typeMatch) {
      const typeVal = typeMatch[1].trim().toLowerCase();
      if (typeVal === 'single' || typeVal === 'multiple') {
        specifiedType = typeVal as QuestionType;
      } else {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Invalid [TYPE]`,
          reason: `Invalid [TYPE] "${typeMatch[1]}". Allowed values are "single" or "multiple".`,
          rawSnippet: typeMatch[0],
        });
        return;
      }
      // Remove [TYPE] declaration from rawContent so it doesn't pollute the question text
      rawContent = rawContent.replace(/\[TYPE\]\s*[a-zA-Z]+/i, '').trim();
    }

    // Extract Question text: text before the first [OPTION]
    const firstOptionIndex = rawContent.search(/\[OPTION\]/i);
    if (firstOptionIndex === -1) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Missing Options`,
        reason: 'No [OPTION] tags found inside this question block. Exactly 4 [OPTION] fields are required.',
        rawSnippet: rawContent.slice(0, 150),
      });
      return;
    }

    const questionText = rawContent.slice(0, firstOptionIndex).trim();
    if (!questionText) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Empty Question Body`,
        reason: 'Question text cannot be blank before the first [OPTION] tag.',
        rawSnippet: rawContent.slice(0, 120),
      });
      return;
    }

    const optionsAndBeyond = rawContent.slice(firstOptionIndex);

    // Locate first [ANSWER]
    const firstAnswerTagIndex = optionsAndBeyond.search(/\[ANSWER\]/i);
    if (firstAnswerTagIndex === -1) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Missing [ANSWER] Tag`,
        reason: 'Every question must specify a correct answer using the [ANSWER] tag.',
        rawSnippet: questionText.slice(0, 100) + '...',
      });
      return;
    }

    const optionsSection = optionsAndBeyond.slice(0, firstAnswerTagIndex);
    const answerAndExplanationSection = optionsAndBeyond.slice(firstAnswerTagIndex);

    // Parse options
    const rawOptions = optionsSection
      .split(/\[OPTION\]/i)
      .map((opt) => opt.trim())
      .filter((opt) => opt.length > 0);

    if (rawOptions.length !== 4) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Invalid Option Count`,
        reason: `Expected exactly 4 options, but found ${rawOptions.length}. Each question must have 4 [OPTION] tags.`,
        rawSnippet: rawOptions.join(' | ') || optionsSection.slice(0, 100),
      });
      return;
    }

    const options: [string, string, string, string] = [
      rawOptions[0],
      rawOptions[1],
      rawOptions[2],
      rawOptions[3],
    ];

    if (options.some((opt) => opt.trim() === '')) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Blank Option Found`,
        reason: 'One or more of the 4 options is empty.',
        rawSnippet: options.join(' | '),
      });
      return;
    }

    // Extract Explanation (if present)
    const explanationTagIndex = answerAndExplanationSection.search(/\[EXPLANATION\]/i);
    let answersSection = '';
    let explanation: string | undefined = undefined;

    if (explanationTagIndex !== -1) {
      answersSection = answerAndExplanationSection.slice(0, explanationTagIndex);
      const rawExpl = answerAndExplanationSection
        .slice(explanationTagIndex)
        .replace(/\[EXPLANATION\]/i, '')
        .trim();
      if (rawExpl) {
        explanation = rawExpl;
      }
    } else {
      answersSection = answerAndExplanationSection;
    }

    // Extract all [ANSWER] values
    const rawAnswersList = answersSection
      .split(/\[ANSWER\]/i)
      .map((ans) => ans.trim())
      .filter((ans) => ans.length > 0);

    if (rawAnswersList.length === 0) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Empty Answer`,
        reason: '[ANSWER] tag was provided, but no answer value was specified.',
        rawSnippet: questionText.slice(0, 100),
      });
      return;
    }

    // Determine type (with backwards compatibility)
    let finalType: QuestionType = 'single';
    if (specifiedType) {
      finalType = specifiedType;
    } else {
      // Backward compatibility rule:
      // If no [TYPE] tag: exactly 1 answer -> 'single', >= 2 answers -> 'multiple'
      finalType = rawAnswersList.length >= 2 ? 'multiple' : 'single';
    }

    // Validation according to Requirement 12:
    if (finalType === 'single') {
      if (rawAnswersList.length !== 1) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Single-Answer Violation`,
          reason: 'Single-answer questions can only have one correct answer.',
          rawSnippet: `Found ${rawAnswersList.length} [ANSWER] tags: ${rawAnswersList.join(', ')}`,
        });
        return;
      }
    } else if (finalType === 'multiple') {
      if (rawAnswersList.length < 2) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Multiple-Answer Violation`,
          reason: 'Multiple-answer questions must have at least two correct answers.',
          rawSnippet: `Only 1 [ANSWER] tag found: "${rawAnswersList[0]}"`,
        });
        return;
      }
    }

    // Resolve each answer to its corresponding option
    const resolvedAnswers: string[] = [];
    const seenAnswerKeys = new Set<string>();

    for (const rawAns of rawAnswersList) {
      const resolved = resolveAnswer(rawAns, options);
      if (!resolved) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Answer Mismatch`,
          reason: `Answer "${rawAns}" does not match any of the 4 options, nor is it a valid option letter (A, B, C, D).`,
          rawSnippet: `Options: A) ${options[0]} | B) ${options[1]} | C) ${options[2]} | D) ${options[3]} -> Specified: "${rawAns}"`,
        });
        return;
      }

      const normalizedKey = resolved.toLowerCase().trim();
      if (seenAnswerKeys.has(normalizedKey)) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Duplicate Answer`,
          reason: `Duplicate answer detected: "${rawAns}" resolves to "${resolved}", which was already specified.`,
          rawSnippet: rawAnswersList.join(', '),
        });
        return;
      }

      seenAnswerKeys.add(normalizedKey);
      resolvedAnswers.push(resolved);
    }

    validQuestions.push({
      week: targetWeek,
      type: finalType,
      question: questionText,
      options,
      correctAnswers: resolvedAnswers,
      explanation,
    });
  });

  return { validQuestions, errors };
}

/**
 * Resolves answer string (e.g. 'A', 'Option B', '(C)', 'Brute Force')
 * to the exact matching option string.
 */
export function resolveAnswer(
  rawAnswer: string,
  options: [string, string, string, string]
): string | null {
  const cleaned = rawAnswer.trim();

  // 1. Direct case-insensitive match against option text
  for (const opt of options) {
    if (opt.trim().toLowerCase() === cleaned.toLowerCase()) {
      return opt;
    }
  }

  // 2. Check for single letters: A, B, C, D (or (A), [A], Option A, Option 1, A., B))
  const letterMatch = cleaned.match(/^(?:option\s*)?[\(\[]?([a-dA-D]|1|2|3|4)[\.\)\:\-\]\)]?$/i);
  if (letterMatch) {
    const val = letterMatch[1].toUpperCase();
    const indexMap: Record<string, number> = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
      '1': 0,
      '2': 1,
      '3': 2,
      '4': 3,
    };
    const targetIdx = indexMap[val];
    if (targetIdx !== undefined && options[targetIdx]) {
      return options[targetIdx];
    }
  }

  // 3. Fallback: check if option starts with "A." or "A)" and user answered "A"
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const letter = String.fromCharCode(65 + i); // 'A', 'B', 'C', 'D'
    if (cleaned.toUpperCase() === letter) {
      return opt;
    }
    // Check if cleaned stripped of leading 'A)' matches opt stripped of leading 'A)'
    const optStripped = opt.replace(/^[A-D\d][\.\)\:\-]\s*/i, '').trim().toLowerCase();
    const cleanedStripped = cleaned.replace(/^[A-D\d][\.\)\:\-]\s*/i, '').trim().toLowerCase();
    if (optStripped && optStripped === cleanedStripped) {
      return opt;
    }
  }

  return null;
}

/**
 * Checks for duplicates against existing questions in the database for the given week.
 */
export function detectDuplicates(
  candidates: ParsedQuestionCandidate[],
  existingQuestions: Question[]
): {
  duplicates: { candidate: ParsedQuestionCandidate; existing: Question }[];
  uniqueCandidates: ParsedQuestionCandidate[];
} {
  const duplicates: { candidate: ParsedQuestionCandidate; existing: Question }[] = [];
  const uniqueCandidates: ParsedQuestionCandidate[] = [];

  const normalize = (q: string) =>
    q
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

  candidates.forEach((cand) => {
    const candNorm = normalize(cand.question);
    const found = existingQuestions.find((eq) => {
      if (eq.source !== 'course') return false;
      const weekMatch =
        cand.week === 'all'
          ? eq.week === 'all' || eq.week === 0
          : eq.week === cand.week;
      return weekMatch && normalize(eq.question) === candNorm;
    });

    if (found) {
      duplicates.push({ candidate: cand, existing: found });
    } else {
      uniqueCandidates.push(cand);
    }
  });

  return { duplicates, uniqueCandidates };
}
