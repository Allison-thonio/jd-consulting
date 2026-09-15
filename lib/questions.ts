export type Question = {
  id: string
  prompt: string
  options: string[]
  answerIndex: number // 0-indexed server-side answer key (NEVER sent to client)
}

/**
 * Question Bank — SSCE Level Candidates
 * Basic numeracy, verbal reasoning, general knowledge, and logic.
 * Note: JD Outsourcing can replace array items here without modifying any scoring pipeline logic.
 */
export const SSCE_QUESTIONS: Question[] = [
  {
    id: 'ssce-num-1',
    prompt: 'A store clerk sells 15 cartons of juice at ₦4,500 each. What is the total amount made from the sale?',
    options: ['₦58,500', '₦67,500', '₦72,000', '₦63,000'],
    answerIndex: 1, // ₦67,500
  },
  {
    id: 'ssce-verb-2',
    prompt: 'Choose the word that is most opposite in meaning to DILIGENT:',
    options: ['Hardworking', 'Careless', 'Punctual', 'Honest'],
    answerIndex: 1, // Careless
  },
  {
    id: 'ssce-logic-3',
    prompt: 'If Monday comes three days before Thursday, what day is two days after Friday?',
    options: ['Saturday', 'Sunday', 'Monday', 'Tuesday'],
    answerIndex: 1, // Sunday
  },
  {
    id: 'ssce-num-4',
    prompt: 'A delivery motorcycle uses 1 litre of fuel for every 35 kilometers. How many litres are required for a 280-kilometer journey?',
    options: ['6 litres', '7 litres', '8 litres', '9 litres'],
    answerIndex: 2, // 8 litres
  },
  {
    id: 'ssce-prof-5',
    prompt: 'When a customer is upset about a delay in service delivery, what is the best first step?',
    options: [
      'Tell them it is not your fault',
      'Listen attentively, apologize for the inconvenience, and offer an immediate resolution',
      'Ask them to come back next week',
      'Ignore the complaint if you are busy'
    ],
    answerIndex: 1, // Listen attentively...
  },
]

/**
 * Question Bank — Graduate Level Candidates
 * Advanced quantitative analysis, critical verbal reasoning, data interpretation, and professional judgment.
 * Note: JD Outsourcing can replace array items here without modifying any scoring pipeline logic.
 */
export const GRADUATE_QUESTIONS: Question[] = [
  {
    id: 'grad-quant-1',
    prompt: 'A company increases its quarterly operating revenue by 25% to ₦15,000,000. What was the operating revenue in the preceding quarter?',
    options: ['₦11,250,000', '₦12,000,000', '₦12,500,000', '₦13,500,000'],
    answerIndex: 1, // ₦12,000,000 (15,000,000 / 1.25)
  },
  {
    id: 'grad-verb-2',
    prompt: 'Identify the logically valid conclusion: "All project managers are certified. Some certified professionals lead remote teams."',
    options: [
      'All certified professionals are project managers.',
      'Some certified professionals may be project managers who lead remote teams.',
      'Every remote team is led by a project manager.',
      'No project manager works remotely.'
    ],
    answerIndex: 1, // Some certified professionals may be project managers who lead remote teams.
  },
  {
    id: 'grad-analyt-3',
    prompt: 'An HR department reduced staff turnover by 40% in Year 1 and another 20% in Year 2 relative to Year 1. What is the overall percentage reduction from baseline?',
    options: ['48%', '52%', '60%', '64%'],
    answerIndex: 1, // 52% (1 - 0.6 * 0.8 = 0.52 = 52%)
  },
  {
    id: 'grad-logic-4',
    prompt: 'If Process X takes 4 hours and Process Y takes 6 hours to complete independently, how long will they take working concurrently on two identical workstreams?',
    options: ['2.4 hours', '3.0 hours', '5.0 hours', '10.0 hours'],
    answerIndex: 0, // 2.4 hours (1/(1/4 + 1/6) = 24/10 = 2.4)
  },
  {
    id: 'grad-lead-5',
    prompt: 'You discover an error in a quarterly financial reconciliation that was already submitted to executive management. What is the most appropriate action?',
    options: [
      'Wait until the annual audit to see if anyone notices.',
      'Immediately inform your supervisor with a verified correction and explanation of how to prevent recurrence.',
      'Silently adjust next quarter’s numbers to offset the discrepancy.',
      'Blame the software system for generating incorrect figures.'
    ],
    answerIndex: 1, // Immediately inform your supervisor...
  },
]

/**
 * Returns the official question bank for the designated applicant level.
 * 
 * EXTENSION POINT:
 * To introduce role-based branching by position (e.g., Accountant vs HR Consultant vs Sales),
 * accept an optional `position` parameter here and select specialized question banks
 * (e.g. `ACCOUNTING_QUESTIONS`, `ENGINEERING_QUESTIONS`) before falling back to general level questions.
 */
export function getQuestionsFor(level: 'SSCE' | 'Graduate', _position?: string): Question[] {
  // ROLE-BASED BRANCHING PLACEHOLDER:
  // if (_position && isSpecializedRole(_position)) {
  //   return getQuestionsByRoleAndLevel(_position, level);
  // }

  if (level === 'SSCE') {
    return SSCE_QUESTIONS
  }
  return GRADUATE_QUESTIONS
}
