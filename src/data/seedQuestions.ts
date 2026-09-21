import { Question } from '../types';

/**
 * Dedicated Test Data questions.
 * These are strictly for development and verifying functionality:
 * - Single-answer questions
 * - Multiple-answer questions
 * - Randomization and quiz behavior
 *
 * Notice: week is null, source is 'test'.
 * These NEVER appear in Course Weeks 1-12 or All Questions!
 */
export const TEST_QUESTIONS: Question[] = [
  {
    id: 'test_q_1',
    source: 'test',
    week: null,
    type: 'single',
    question: 'Which element of the CIA triad is primarily compromised during a Denial of Service (DoS) attack?',
    options: ['Confidentiality', 'Integrity', 'Availability', 'Authenticity'],
    correctAnswers: ['Availability'],
    explanation: 'A Denial of Service (DoS) attack aims to overwhelm system resources, making services unavailable to legitimate users, directly violating the Availability tenet of the CIA triad.',
    createdAt: 1710000001000,
  },
  {
    id: 'test_q_2',
    source: 'test',
    week: null,
    type: 'multiple',
    question: 'Which of the following are common characteristics and objectives of phishing attacks?',
    options: [
      'Deceptive emails simulating trusted entities',
      'Harvesting user credentials and sensitive data',
      'Employing social engineering persuasion techniques',
      'Overclocking hardware components to accelerate CPU clock speed',
    ],
    correctAnswers: [
      'Deceptive emails simulating trusted entities',
      'Harvesting user credentials and sensitive data',
      'Employing social engineering persuasion techniques',
    ],
    explanation: 'Phishing relies on spoofed/deceptive messages and psychological manipulation to steal credentials or sensitive info. Hardware overclocking is unrelated.',
    createdAt: 1710000002000,
  },
  {
    id: 'test_q_3',
    source: 'test',
    week: null,
    type: 'single',
    question: 'Which security principle mandates that a user or system process must be granted only the minimum clearance and rights necessary to complete authorized tasks?',
    options: [
      'Separation of Duties',
      'Principle of Least Privilege',
      'Defense in Depth',
      'Fail-Safe Defaults',
    ],
    correctAnswers: ['Principle of Least Privilege'],
    explanation: 'The Principle of Least Privilege (PoLP) ensures entities have only the bare minimum privileges required to execute their specific duties, limiting blast radius.',
    createdAt: 1710000003000,
  },
  {
    id: 'test_q_4',
    source: 'test',
    week: null,
    type: 'multiple',
    question: 'Which of the following cryptographic algorithms rely on asymmetric (public-key) key pairs rather than a single shared secret?',
    options: [
      'RSA (Rivest-Shamir-Adleman)',
      'AES (Advanced Encryption Standard)',
      'ECC (Elliptic Curve Cryptography)',
      'DES (Data Encryption Standard)',
    ],
    correctAnswers: [
      'RSA (Rivest-Shamir-Adleman)',
      'ECC (Elliptic Curve Cryptography)',
    ],
    explanation: 'RSA and ECC are asymmetric public-key cryptosystems. AES and DES are symmetric ciphers that utilize a single shared secret key.',
    createdAt: 1710000004000,
  },
  {
    id: 'test_q_5',
    source: 'test',
    week: null,
    type: 'multiple',
    question: 'Which of the following network attacks are classified as ACTIVE attacks (modifying data or system state) rather than passive sniffing?',
    options: [
      'Man-in-the-Middle (MITM) packet tampering',
      'Passive network packet sniffing with Wireshark',
      'TCP Session Hijacking with packet injection',
      'Traffic pattern and bandwidth volume analysis',
    ],
    correctAnswers: [
      'Man-in-the-Middle (MITM) packet tampering',
      'TCP Session Hijacking with packet injection',
    ],
    explanation: 'MITM data manipulation and TCP session injection alter network streams (active attacks). Packet sniffing and traffic volume observation do not alter data (passive attacks).',
    createdAt: 1710000005000,
  },
  {
    id: 'test_q_6',
    source: 'test',
    week: null,
    type: 'single',
    question: 'What is the standard fixed block size used by the Advanced Encryption Standard (AES) cipher?',
    options: ['64 bits', '128 bits', '192 bits', '256 bits'],
    correctAnswers: ['128 bits'],
    explanation: 'AES is a symmetric block cipher standardized with a fixed block length of 128 bits (regardless of whether key size is 128, 192, or 256 bits).',
    createdAt: 1710000006000,
  },
];
