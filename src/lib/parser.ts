import { ParsedQuestionCandidate, ParseError, ParseResult, Question, QuestionType } from '../types';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'] as const;

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
 * Resolves whether an option is correct based on its text, index, and the correct answers list.
 * Supports both letter keys (['A', 'C']) and full option text.
 */
export function isOptionCorrect(
  optionText: string,
  optionIndex: number,
  correctAnswers: string[]
): boolean {
  if (!correctAnswers || correctAnswers.length === 0) return false;
  const letter = OPTION_LETTERS[optionIndex];
  return correctAnswers.some((ca) => {
    const c = ca.trim();
    return (
      c.toUpperCase() === letter ||
      c.toLowerCase() === optionText.trim().toLowerCase()
    );
  });
}

/**
 * Validates whether user-selected answers match correct answers.
 * Handles both letter selections and full option text selections.
 * Requires exact set match for both single and multiple-answer questions.
 */
export function validateAnswers(
  selectedAnswers: string[],
  options: string[],
  correctAnswers: string[]
): boolean {
  if (!selectedAnswers || selectedAnswers.length === 0 || !correctAnswers || correctAnswers.length === 0) {
    return false;
  }

  const correctIndices = new Set<number>();
  options.forEach((opt, idx) => {
    if (isOptionCorrect(opt, idx, correctAnswers)) {
      correctIndices.add(idx);
    }
  });

  const selectedIndices = new Set<number>();
  options.forEach((opt, idx) => {
    const letter = OPTION_LETTERS[idx];
    const isSelected = selectedAnswers.some((s) => {
      const trimmed = s.trim();
      return (
        trimmed.toUpperCase() === letter ||
        trimmed.toLowerCase() === opt.trim().toLowerCase()
      );
    });
    if (isSelected) {
      selectedIndices.add(idx);
    }
  });

  if (selectedIndices.size !== correctIndices.size) return false;
  for (const idx of selectedIndices) {
    if (!correctIndices.has(idx)) return false;
  }
  return true;
}

/**
 * Returns formatted labels for correct answers (e.g. ["A. Option text", "C. Option text"]).
 */
export function getCorrectAnswerLabels(
  options: string[],
  correctAnswers: string[]
): string[] {
  const labels: string[] = [];
  options.forEach((opt, idx) => {
    if (isOptionCorrect(opt, idx, correctAnswers)) {
      labels.push(`${OPTION_LETTERS[idx]}. ${opt}`);
    }
  });
  return labels.length > 0 ? labels : correctAnswers;
}

/**
 * Resolves answer string (e.g. 'A', 'Option B', '(C)', 'Brute Force')
 * to the corresponding option letter ('A', 'B', 'C', or 'D').
 */
export function resolveAnswerToLetter(
  rawAnswer: string,
  options: [string, string, string, string] | string[]
): string | null {
  const cleaned = rawAnswer.trim();

  // 1. Direct letter check: A, B, C, D
  const letterMatch = cleaned.match(/^(?:option\s*)?[\(\[]?([a-dA-D]|1|2|3|4)[\.\)\:\-\]\)]?$/i);
  if (letterMatch) {
    const val = letterMatch[1].toUpperCase();
    const indexMap: Record<string, string> = {
      A: 'A',
      B: 'B',
      C: 'C',
      D: 'D',
      '1': 'A',
      '2': 'B',
      '3': 'C',
      '4': 'D',
    };
    return indexMap[val] || null;
  }

  // 2. Direct match with option text
  for (let i = 0; i < options.length; i++) {
    if (options[i].trim().toLowerCase() === cleaned.toLowerCase()) {
      return OPTION_LETTERS[i];
    }
  }

  // 3. Match option without prefix (e.g. "A) text" -> "text")
  for (let i = 0; i < options.length; i++) {
    const optStripped = options[i].replace(/^[A-D\d][\.\)\:\-]\s*/i, '').trim().toLowerCase();
    const cleanedStripped = cleaned.replace(/^[A-D\d][\.\)\:\-]\s*/i, '').trim().toLowerCase();
    if (optStripped && optStripped === cleanedStripped) {
      return OPTION_LETTERS[i];
    }
  }

  return null;
}

/**
 * Main parser function to convert raw copy-pasted text into structured MCQ objects.
 * Produces questions matching the exact repository JSON format.
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

  const questionRegex = /\[QUESTION\]([\s\S]*?)\[\/QUESTION\]/gi;
  const blocks: { content: string; start: number }[] = [];
  let match: RegExpExecArray | null;

  while ((match = questionRegex.exec(text)) !== null) {
    blocks.push({
      content: match[1],
      start: match.index,
    });
  }

  if (blocks.length === 0) {
    errors.push({
      index: 0,
      title: 'No Valid [QUESTION] Blocks',
      reason: 'No questions matching the [QUESTION]...[/QUESTION] format were detected. Please check template formatting.',
      rawSnippet: text.slice(0, 150) + '...',
    });
    return { validQuestions, errors };
  }

  blocks.forEach((block, idx) => {
    const qIndex = idx + 1;
    const content = block.content.trim();

    const firstOptionIndex = content.search(/\[OPTION\]/i);
    if (firstOptionIndex === -1) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Missing Options`,
        reason: 'No [OPTION] tags found in this question block.',
        rawSnippet: content.slice(0, 100) + '...',
      });
      return;
    }

    const questionAndTypeSection = content.slice(0, firstOptionIndex).trim();
    const optionsAndBeyond = content.slice(firstOptionIndex);

    // Extract [TYPE] if present
    let questionText = questionAndTypeSection;
    let specifiedType: QuestionType | null = null;

    const typeMatch = questionText.match(/\[TYPE\]\s*(single|multiple)/i);
    if (typeMatch) {
      specifiedType = typeMatch[1].toLowerCase() as QuestionType;
      questionText = questionText.replace(/\[TYPE\]\s*(single|multiple)/i, '').trim();
    }

    if (!questionText) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Empty Question Statement`,
        reason: 'The question text before the options is empty.',
        rawSnippet: content.slice(0, 80),
      });
      return;
    }

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

    // Extract Explanation
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

    // Extract [ANSWER] values
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

    let finalType: QuestionType = 'single';
    if (specifiedType) {
      finalType = specifiedType;
    } else {
      finalType = rawAnswersList.length >= 2 ? 'multiple' : 'single';
    }

    if (finalType === 'single' && rawAnswersList.length !== 1) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Single-Answer Violation`,
        reason: 'Single-answer questions must have exactly one [ANSWER] specified.',
        rawSnippet: `Found ${rawAnswersList.length} [ANSWER] tags: ${rawAnswersList.join(', ')}`,
      });
      return;
    } else if (finalType === 'multiple' && rawAnswersList.length < 2) {
      errors.push({
        index: qIndex,
        title: `Question ${qIndex}: Multiple-Answer Violation`,
        reason: 'Multiple-answer questions must have at least two correct answers.',
        rawSnippet: `Only 1 [ANSWER] tag found: "${rawAnswersList[0]}"`,
      });
      return;
    }

    const resolvedLetters: string[] = [];
    const seenLetters = new Set<string>();

    for (const rawAns of rawAnswersList) {
      const letter = resolveAnswerToLetter(rawAns, options);
      if (!letter) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Answer Mismatch`,
          reason: `Answer "${rawAns}" does not match any of the 4 options (A, B, C, D).`,
          rawSnippet: `Options: A) ${options[0]} | B) ${options[1]} | C) ${options[2]} | D) ${options[3]} -> Specified: "${rawAns}"`,
        });
        return;
      }

      if (seenLetters.has(letter)) {
        errors.push({
          index: qIndex,
          title: `Question ${qIndex}: Duplicate Answer`,
          reason: `Duplicate answer letter "${letter}" detected.`,
          rawSnippet: rawAnswersList.join(', '),
        });
        return;
      }

      seenLetters.add(letter);
      resolvedLetters.push(letter);
    }

    // Sort letters alphabetically: ['A', 'C']
    resolvedLetters.sort();

    const idPrefix = targetWeek === 'all' ? 'all' : `w${targetWeek}`;

    validQuestions.push({
      id: `${idPrefix}-q${qIndex}`,
      week: targetWeek,
      type: finalType,
      question: questionText,
      options,
      correctAnswers: resolvedLetters,
      explanation,
    });
  });

  return { validQuestions, errors };
}

/**
 * Checks for duplicates against an existing question list.
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
      return normalize(eq.question) === candNorm;
    });

    if (found) {
      duplicates.push({ candidate: cand, existing: found });
    } else {
      uniqueCandidates.push(cand);
    }
  });

  return { duplicates, uniqueCandidates };
}
