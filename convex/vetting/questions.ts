/**
 * Question Banks for Vetting Tests
 * 
 * Comprehensive question banks for English proficiency and skill assessments
 * Questions are stored here for now, but should be moved to a database in production
 * for better security and question rotation
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

export type QuestionDifficulty = "easy" | "medium" | "hard" | "expert";
export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";

interface MCQQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number; // 0-indexed
  explanation: string;
  difficulty: QuestionDifficulty;
  category?: string;
}

interface ComprehensionPassage {
  id: string;
  title: string;
  passage: string;
  questions: MCQQuestion[];
  difficulty: QuestionDifficulty;
  wordCount: number;
}

// ========== ENGLISH GRAMMAR QUESTIONS ==========

const GRAMMAR_QUESTIONS: MCQQuestion[] = [
  // Easy
  {
    id: "gram_001",
    question: "Choose the correct sentence:",
    options: [
      "She don't like coffee.",
      "She doesn't like coffee.",
      "She doesn't likes coffee.",
      "She don't likes coffee.",
    ],
    correctAnswer: 1,
    explanation: "Third person singular (she) requires 'doesn't' (not 'don't') and the base form 'like' (not 'likes').",
    difficulty: "easy",
  },
  {
    id: "gram_002",
    question: "Which sentence is grammatically correct?",
    options: [
      "I have been working here since five years.",
      "I have been working here for five years.",
      "I have been working here from five years.",
      "I have been working here during five years.",
    ],
    correctAnswer: 1,
    explanation: "Use 'for' with periods of time (five years) and 'since' with specific points in time (2019).",
    difficulty: "easy",
  },
  {
    id: "gram_003",
    question: "Select the correct form:",
    options: [
      "The team are playing well.",
      "The team is playing well.",
      "The team were playing well.",
      "The team be playing well.",
    ],
    correctAnswer: 1,
    explanation: "Collective nouns like 'team' can take singular or plural verbs, but in American English, singular is preferred.",
    difficulty: "easy",
  },
  {
    id: "gram_004",
    question: "Choose the correct preposition:",
    options: [
      "I'm good in English.",
      "I'm good at English.",
      "I'm good with English.",
      "I'm good for English.",
    ],
    correctAnswer: 1,
    explanation: "Use 'good at' when referring to skills or abilities.",
    difficulty: "easy",
  },
  {
    id: "gram_005",
    question: "Which sentence uses the correct conditional?",
    options: [
      "If I will have time, I will call you.",
      "If I have time, I will call you.",
      "If I had time, I will call you.",
      "If I have time, I would call you.",
    ],
    correctAnswer: 1,
    explanation: "First conditional: 'If + present simple, will + base form' for real future possibilities.",
    difficulty: "easy",
  },
  // Medium
  {
    id: "gram_006",
    question: "Identify the sentence with correct subject-verb agreement:",
    options: [
      "Neither the manager nor the employees was satisfied.",
      "Neither the manager nor the employees were satisfied.",
      "Neither the manager nor the employees is satisfied.",
      "Neither the manager nor the employees are satisfied.",
    ],
    correctAnswer: 1,
    explanation: "With 'neither...nor', the verb agrees with the subject closest to it (employees - plural).",
    difficulty: "medium",
  },
  {
    id: "gram_007",
    question: "Choose the correct passive voice:",
    options: [
      "The report was wrote by the team.",
      "The report was written by the team.",
      "The report was write by the team.",
      "The report was writing by the team.",
    ],
    correctAnswer: 1,
    explanation: "Passive voice: 'was/were + past participle'. 'Write' → 'written'.",
    difficulty: "medium",
  },
  {
    id: "gram_008",
    question: "Select the sentence with correct use of articles:",
    options: [
      "I need an advice about this matter.",
      "I need a advice about this matter.",
      "I need advice about this matter.",
      "I need the advice about this matter.",
    ],
    correctAnswer: 2,
    explanation: "'Advice' is uncountable, so no article is needed. Use 'a piece of advice' if you need to count it.",
    difficulty: "medium",
  },
  {
    id: "gram_009",
    question: "Which sentence correctly uses the subjunctive mood?",
    options: [
      "I suggest that he goes to the doctor.",
      "I suggest that he go to the doctor.",
      "I suggest that he will go to the doctor.",
      "I suggest that he went to the doctor.",
    ],
    correctAnswer: 1,
    explanation: "After verbs like 'suggest', 'recommend', 'insist', use the base form (subjunctive) in formal English.",
    difficulty: "medium",
  },
  {
    id: "gram_010",
    question: "Choose the correct relative clause:",
    options: [
      "This is the book who I was telling you about.",
      "This is the book which I was telling you about.",
      "This is the book where I was telling you about.",
      "This is the book when I was telling you about.",
    ],
    correctAnswer: 1,
    explanation: "Use 'which' or 'that' for things (book). 'Who' is for people, 'where' for places, 'when' for time.",
    difficulty: "medium",
  },
  // Hard
  {
    id: "gram_011",
    question: "Identify the sentence with correct use of 'had better':",
    options: [
      "You had better to finish this by tomorrow.",
      "You had better finish this by tomorrow.",
      "You had better finishing this by tomorrow.",
      "You had better finished this by tomorrow.",
    ],
    correctAnswer: 1,
    explanation: "'Had better' is followed by the base form of the verb (no 'to', no '-ing', no past form).",
    difficulty: "hard",
  },
  {
    id: "gram_012",
    question: "Which sentence correctly uses inversion?",
    options: [
      "Not only she speaks English, but also French.",
      "Not only does she speak English, but also French.",
      "Not only she does speak English, but also French.",
      "Not only speaks she English, but also French.",
    ],
    correctAnswer: 1,
    explanation: "After 'not only' at the beginning, use inversion: auxiliary verb + subject + main verb.",
    difficulty: "hard",
  },
  {
    id: "gram_013",
    question: "Select the correct use of 'wish':",
    options: [
      "I wish I can speak French fluently.",
      "I wish I could speak French fluently.",
      "I wish I will speak French fluently.",
      "I wish I speak French fluently.",
    ],
    correctAnswer: 1,
    explanation: "After 'wish' for present/future, use past tense ('could') to express something unlikely or impossible.",
    difficulty: "hard",
  },
  {
    id: "gram_014",
    question: "Choose the sentence with correct parallel structure:",
    options: [
      "She likes reading, writing, and to paint.",
      "She likes reading, writing, and painting.",
      "She likes to read, writing, and painting.",
      "She likes reading, to write, and painting.",
    ],
    correctAnswer: 1,
    explanation: "Maintain parallel structure: all items should be in the same form (gerunds: reading, writing, painting).",
    difficulty: "hard",
  },
  {
    id: "gram_015",
    question: "Which sentence correctly uses 'as if'?",
    options: [
      "He talks as if he knows everything.",
      "He talks as if he knew everything.",
      "He talks as if he will know everything.",
      "He talks as if he has known everything.",
    ],
    correctAnswer: 1,
    explanation: "After 'as if' for hypothetical situations, use past tense ('knew') even when referring to present.",
    difficulty: "hard",
  },
  // Expert
  {
    id: "gram_016",
    question: "Identify the sentence with correct use of 'lest':",
    options: [
      "He left early lest he should miss the train.",
      "He left early lest he misses the train.",
      "He left early lest he will miss the train.",
      "He left early lest he missed the train.",
    ],
    correctAnswer: 0,
    explanation: "'Lest' is formal and means 'in case' or 'for fear that'. It's followed by 'should' + base form or subjunctive.",
    difficulty: "expert",
  },
  {
    id: "gram_017",
    question: "Which sentence correctly uses the past perfect continuous?",
    options: [
      "By the time she arrived, I was waiting for two hours.",
      "By the time she arrived, I had been waiting for two hours.",
      "By the time she arrived, I have been waiting for two hours.",
      "By the time she arrived, I waited for two hours.",
    ],
    correctAnswer: 1,
    explanation: "Past perfect continuous ('had been waiting') shows duration up to a point in the past.",
    difficulty: "expert",
  },
  {
    id: "gram_018",
    question: "Select the correct use of 'were' in conditional:",
    options: [
      "If I were you, I will accept the offer.",
      "If I were you, I would accept the offer.",
      "If I was you, I would accept the offer.",
      "If I am you, I would accept the offer.",
    ],
    correctAnswer: 1,
    explanation: "Second conditional (hypothetical): 'If + past subjunctive (were), would + base form'.",
    difficulty: "expert",
  },
  {
    id: "gram_019",
    question: "Choose the sentence with correct use of 'may' vs 'might':",
    options: [
      "It may rain tomorrow, but I'm not sure.",
      "It might rain tomorrow, but I'm not sure.",
      "Both are correct, but 'might' suggests less certainty.",
      "Both are correct, but 'may' suggests less certainty.",
    ],
    correctAnswer: 2,
    explanation: "Both are correct, but 'might' suggests less probability than 'may' in modern English.",
    difficulty: "expert",
  },
  {
    id: "gram_020",
    question: "Which sentence correctly uses 'needn't have'?",
    options: [
      "You needn't have to worry about it.",
      "You needn't have worried about it.",
      "You needn't worry about it.",
      "You needn't have worry about it.",
    ],
    correctAnswer: 1,
    explanation: "'Needn't have + past participle' means something was done but wasn't necessary.",
    difficulty: "expert",
  },
  // More Easy questions
  {
    id: "gram_021",
    question: "Choose the correct form:",
    options: [
      "There is many books on the shelf.",
      "There are many books on the shelf.",
      "There have many books on the shelf.",
      "There has many books on the shelf.",
    ],
    correctAnswer: 1,
    explanation: "Use 'there are' with plural nouns (books).",
    difficulty: "easy",
  },
  {
    id: "gram_022",
    question: "Which sentence is correct?",
    options: [
      "I can't find my keys anywhere.",
      "I can't find my keys nowhere.",
      "I can't find my keys anywhere not.",
      "I can't find my keys anyplace not.",
    ],
    correctAnswer: 0,
    explanation: "Use 'anywhere' (not 'nowhere') with negative sentences. 'Nowhere' creates a double negative.",
    difficulty: "easy",
  },
  {
    id: "gram_023",
    question: "Select the correct sentence:",
    options: [
      "She is more taller than her sister.",
      "She is taller than her sister.",
      "She is more tall than her sister.",
      "She is tall than her sister.",
    ],
    correctAnswer: 1,
    explanation: "One-syllable adjectives use '-er' for comparatives, not 'more'.",
    difficulty: "easy",
  },
  {
    id: "gram_024",
    question: "Which is correct?",
    options: [
      "I have been to Paris last year.",
      "I went to Paris last year.",
      "I have went to Paris last year.",
      "I have go to Paris last year.",
    ],
    correctAnswer: 1,
    explanation: "Use simple past ('went') with specific time expressions like 'last year'.",
    difficulty: "easy",
  },
  {
    id: "gram_025",
    question: "Choose the correct sentence:",
    options: [
      "I am interesting in learning English.",
      "I am interested in learning English.",
      "I am interest in learning English.",
      "I am interests in learning English.",
    ],
    correctAnswer: 1,
    explanation: "Use 'interested' (how you feel) not 'interesting' (describes something).",
    difficulty: "easy",
  },
  // More Medium questions
  {
    id: "gram_026",
    question: "Identify the correct sentence:",
    options: [
      "The data is incorrect.",
      "The data are incorrect.",
      "Both are correct depending on context.",
      "Neither is correct.",
    ],
    correctAnswer: 2,
    explanation: "'Data' can be singular (treated as a mass noun) or plural (treated as individual items).",
    difficulty: "medium",
  },
  {
    id: "gram_027",
    question: "Which sentence uses 'used to' correctly?",
    options: [
      "I used to playing tennis when I was younger.",
      "I used to play tennis when I was younger.",
      "I used to played tennis when I was younger.",
      "I use to play tennis when I was younger.",
    ],
    correctAnswer: 1,
    explanation: "'Used to' is followed by the base form of the verb (play, not playing or played).",
    difficulty: "medium",
  },
  {
    id: "gram_028",
    question: "Choose the correct modal verb:",
    options: [
      "You must to finish this by Friday.",
      "You must finish this by Friday.",
      "You must finishing this by Friday.",
      "You must finished this by Friday.",
    ],
    correctAnswer: 1,
    explanation: "Modal verbs (must, can, should, etc.) are followed by the base form without 'to'.",
    difficulty: "medium",
  },
  {
    id: "gram_029",
    question: "Which sentence is correct?",
    options: [
      "I look forward to hear from you.",
      "I look forward to hearing from you.",
      "I look forward to heard from you.",
      "I look forward to will hear from you.",
    ],
    correctAnswer: 1,
    explanation: "After 'look forward to', use a gerund (-ing form), not the base form.",
    difficulty: "medium",
  },
  {
    id: "gram_030",
    question: "Select the correct form:",
    options: [
      "Neither of the options are correct.",
      "Neither of the options is correct.",
      "Neither of the options be correct.",
      "Neither of the options were correct.",
    ],
    correctAnswer: 1,
    explanation: "'Neither of' is followed by a singular verb, even though it refers to multiple items.",
    difficulty: "medium",
  },
  // More Hard questions
  {
    id: "gram_031",
    question: "Which sentence correctly uses 'would rather'?",
    options: [
      "I would rather to stay home.",
      "I would rather stay home.",
      "I would rather staying home.",
      "I would rather stayed home.",
    ],
    correctAnswer: 1,
    explanation: "'Would rather' is followed by the base form of the verb without 'to'.",
    difficulty: "hard",
  },
  {
    id: "gram_032",
    question: "Identify the correct use of 'so' and 'such':",
    options: [
      "It was so a beautiful day.",
      "It was such a beautiful day.",
      "It was so beautiful a day.",
      "Both B and C are correct.",
    ],
    correctAnswer: 3,
    explanation: "'Such' is used with 'a/an + adjective + noun'. 'So' can be used with 'adjective + a/an + noun'.",
    difficulty: "hard",
  },
  {
    id: "gram_033",
    question: "Which sentence uses 'would' correctly?",
    options: [
      "If I would have time, I would help you.",
      "If I had time, I would help you.",
      "If I have time, I would help you.",
      "If I will have time, I would help you.",
    ],
    correctAnswer: 1,
    explanation: "In second conditional, use 'if + past simple, would + base form'. Don't use 'would' in the 'if' clause.",
    difficulty: "hard",
  },
  {
    id: "gram_034",
    question: "Choose the correct sentence:",
    options: [
      "I wish I can speak French fluently.",
      "I wish I could speak French fluently.",
      "I wish I will speak French fluently.",
      "I wish I speak French fluently.",
    ],
    correctAnswer: 1,
    explanation: "After 'wish' for present/future, use past tense ('could') to express something unlikely or impossible.",
    difficulty: "hard",
  },
  {
    id: "gram_035",
    question: "Which sentence correctly uses 'it's time'?",
    options: [
      "It's time we go home.",
      "It's time we went home.",
      "It's time we will go home.",
      "It's time we are going home.",
    ],
    correctAnswer: 1,
    explanation: "After 'it's time', use past tense ('went') even though it refers to the present/future.",
    difficulty: "hard",
  },
  // More Expert questions
  {
    id: "gram_036",
    question: "Identify the correct use of 'should have':",
    options: [
      "You should have to finish this yesterday.",
      "You should have finished this yesterday.",
      "You should have finish this yesterday.",
      "You should had finished this yesterday.",
    ],
    correctAnswer: 1,
    explanation: "'Should have' is followed by the past participle ('finished'), not 'to' or base form.",
    difficulty: "expert",
  },
  {
    id: "gram_037",
    question: "Which sentence correctly uses 'needn't have'?",
    options: [
      "You needn't have to worry about it.",
      "You needn't have worried about it.",
      "You needn't worry about it.",
      "Both B and C are correct but mean different things.",
    ],
    correctAnswer: 3,
    explanation: "'Needn't have + past participle' means something was done but wasn't necessary. 'Needn't + base form' means it's not necessary now.",
    difficulty: "expert",
  },
  {
    id: "gram_038",
    question: "Select the correct use of 'as if':",
    options: [
      "He talks as if he knows everything.",
      "He talks as if he knew everything.",
      "He talks as if he will know everything.",
      "Both A and B are correct but mean different things.",
    ],
    correctAnswer: 3,
    explanation: "'As if + present' suggests it might be true. 'As if + past' suggests it's not true (hypothetical).",
    difficulty: "expert",
  },
  {
    id: "gram_039",
    question: "Which sentence correctly uses 'were' in conditional?",
    options: [
      "If I were you, I will accept the offer.",
      "If I were you, I would accept the offer.",
      "If I was you, I would accept the offer.",
      "Both B and C are correct.",
    ],
    correctAnswer: 1,
    explanation: "Second conditional (hypothetical): 'If + past subjunctive (were), would + base form'.",
    difficulty: "expert",
  },
  {
    id: "gram_040",
    question: "Choose the sentence with correct use of 'may' vs 'might':",
    options: [
      "It may rain tomorrow, but I'm not sure.",
      "It might rain tomorrow, but I'm not sure.",
      "Both are correct, but 'might' suggests less certainty.",
      "Both are correct, but 'may' suggests less certainty.",
    ],
    correctAnswer: 2,
    explanation: "Both are correct, but 'might' suggests less probability than 'may' in modern English.",
    difficulty: "expert",
  },
  // Additional questions to reach 50+
  {
    id: "gram_041",
    question: "Which sentence uses 'used to' vs 'be used to' correctly?",
    options: [
      "I am used to wake up early.",
      "I am used to waking up early.",
      "I used to waking up early.",
      "I use to wake up early.",
    ],
    correctAnswer: 1,
    explanation: "'Be used to' means 'be accustomed to' and is followed by a gerund. 'Used to' means 'did in the past' and is followed by base form.",
    difficulty: "hard",
  },
  {
    id: "gram_042",
    question: "Select the correct sentence:",
    options: [
      "The more you practice, the better you get.",
      "The more you practice, the better you will get.",
      "The more you practice, the better you got.",
      "Both A and B are correct.",
    ],
    correctAnswer: 3,
    explanation: "Both present and future tenses are acceptable in 'the more...the more' constructions.",
    difficulty: "medium",
  },
  {
    id: "gram_043",
    question: "Which sentence is correct?",
    options: [
      "I prefer coffee than tea.",
      "I prefer coffee to tea.",
      "I prefer coffee over tea.",
      "Both B and C are correct.",
    ],
    correctAnswer: 3,
    explanation: "'Prefer...to' is more formal, 'prefer...over' is also acceptable in modern English.",
    difficulty: "medium",
  },
  {
    id: "gram_044",
    question: "Choose the correct form:",
    options: [
      "I have difficulty to understand this.",
      "I have difficulty understanding this.",
      "I have difficulty understand this.",
      "I have difficulty in understanding this.",
    ],
    correctAnswer: 1,
    explanation: "'Have difficulty' is followed by a gerund (-ing form), optionally with 'in'.",
    difficulty: "hard",
  },
  {
    id: "gram_045",
    question: "Which sentence uses 'supposed to' correctly?",
    options: [
      "You are supposed to be here at 9 AM.",
      "You are supposed be here at 9 AM.",
      "You are supposed being here at 9 AM.",
      "You supposed to be here at 9 AM.",
    ],
    correctAnswer: 0,
    explanation: "'Be supposed to' is followed by the base form of the verb.",
    difficulty: "medium",
  },
  {
    id: "gram_046",
    question: "Select the correct sentence:",
    options: [
      "I would like that you help me.",
      "I would like you to help me.",
      "I would like you help me.",
      "I would like you helping me.",
    ],
    correctAnswer: 1,
    explanation: "'Would like' is followed by object + infinitive (to + base form), not 'that' clause.",
    difficulty: "hard",
  },
  {
    id: "gram_047",
    question: "Which sentence is correct?",
    options: [
      "I am looking forward to see you.",
      "I am looking forward to seeing you.",
      "I am looking forward see you.",
      "I am looking forward seeing you.",
    ],
    correctAnswer: 1,
    explanation: "'Look forward to' is a phrasal verb where 'to' is a preposition, so it's followed by a gerund.",
    difficulty: "medium",
  },
  {
    id: "gram_048",
    question: "Choose the correct form:",
    options: [
      "I suggest you to take a break.",
      "I suggest you take a break.",
      "I suggest you taking a break.",
      "I suggest you should take a break.",
    ],
    correctAnswer: 1,
    explanation: "'Suggest' can be followed by 'that' + subject + base form (subjunctive) or 'should' + base form.",
    difficulty: "hard",
  },
  {
    id: "gram_049",
    question: "Which sentence uses 'make' correctly?",
    options: [
      "This music makes me to feel relaxed.",
      "This music makes me feel relaxed.",
      "This music makes me feeling relaxed.",
      "This music makes me felt relaxed.",
    ],
    correctAnswer: 1,
    explanation: "'Make' (causative) is followed by object + base form (without 'to').",
    difficulty: "medium",
  },
  {
    id: "gram_050",
    question: "Select the correct sentence:",
    options: [
      "I had my car repaired yesterday.",
      "I had my car to repair yesterday.",
      "I had my car repairing yesterday.",
      "I had my car repair yesterday.",
    ],
    correctAnswer: 0,
    explanation: "'Have something done' (causative) uses past participle to show someone else did the action.",
    difficulty: "hard",
  },
];

// ========== ENGLISH COMPREHENSION PASSAGES ==========

const COMPREHENSION_PASSAGES: ComprehensionPassage[] = [
  {
    id: "comp_001",
    title: "Remote Work Revolution",
    passage: `The shift to remote work has fundamentally transformed how businesses operate. Companies that once required employees to be physically present in offices have discovered that productivity can actually increase when workers have more flexibility. Studies show that remote workers often report higher job satisfaction and better work-life balance.

However, remote work also presents challenges. Communication can become more difficult when team members are not in the same physical space. Building company culture and maintaining team cohesion requires more intentional effort. Some employees struggle with isolation and the blurring of boundaries between work and personal life.

The future of work likely involves a hybrid model, combining the benefits of remote flexibility with the advantages of in-person collaboration. Organizations must adapt their management styles, communication tools, and company policies to support this new paradigm.`,
    wordCount: 150,
    difficulty: "medium",
    questions: [
      {
        id: "comp_001_q1",
        question: "What is the main idea of this passage?",
        options: [
          "Remote work is always better than office work.",
          "Remote work has benefits and challenges that require adaptation.",
          "Companies should eliminate remote work entirely.",
          "Remote work only works for certain industries.",
        ],
        correctAnswer: 1,
        explanation: "The passage discusses both benefits and challenges of remote work, suggesting adaptation is needed.",
        difficulty: "medium",
      },
      {
        id: "comp_001_q2",
        question: "According to the passage, what do studies show about remote workers?",
        options: [
          "They are less productive.",
          "They report higher job satisfaction.",
          "They always prefer remote work.",
          "They struggle with all aspects of remote work.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'remote workers often report higher job satisfaction and better work-life balance.'",
        difficulty: "easy",
      },
      {
        id: "comp_001_q3",
        question: "What challenge is mentioned regarding remote work?",
        options: [
          "Higher costs for companies.",
          "Difficulty in communication and building culture.",
          "Lack of technology support.",
          "Inability to measure productivity.",
        ],
        correctAnswer: 1,
        explanation: "The passage mentions that 'Communication can become more difficult' and 'Building company culture... requires more intentional effort.'",
        difficulty: "easy",
      },
    ],
  },
  {
    id: "comp_002",
    title: "Artificial Intelligence in Healthcare",
    passage: `Artificial intelligence is revolutionizing healthcare by enabling faster and more accurate diagnoses. Machine learning algorithms can analyze medical images, detect patterns in patient data, and assist doctors in making informed decisions. This technology has shown particular promise in radiology, where AI systems can identify abnormalities in X-rays and MRIs with remarkable precision.

Despite these advances, concerns remain about the reliability and ethical implications of AI in medicine. There are worries about algorithmic bias, data privacy, and the potential for AI to make errors that could harm patients. Additionally, some healthcare professionals fear that over-reliance on AI might diminish the importance of human judgment and the doctor-patient relationship.

The most effective approach appears to be a collaborative model where AI augments rather than replaces human expertise. Doctors can use AI tools to enhance their diagnostic capabilities while maintaining their critical thinking and empathy. This synergy between human intelligence and artificial intelligence holds the greatest promise for improving patient outcomes.`,
    wordCount: 180,
    difficulty: "hard",
    questions: [
      {
        id: "comp_002_q1",
        question: "What is the primary benefit of AI in healthcare mentioned in the passage?",
        options: [
          "Reducing healthcare costs.",
          "Faster and more accurate diagnoses.",
          "Eliminating the need for doctors.",
          "Improving hospital infrastructure.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that AI enables 'faster and more accurate diagnoses.'",
        difficulty: "easy",
      },
      {
        id: "comp_002_q2",
        question: "What concern is raised about AI in healthcare?",
        options: [
          "AI is too expensive to implement.",
          "AI might diminish human judgment and doctor-patient relationships.",
          "AI cannot analyze medical images.",
          "AI only works in certain medical specialties.",
        ],
        correctAnswer: 1,
        explanation: "The passage mentions concerns about 'over-reliance on AI might diminish the importance of human judgment and the doctor-patient relationship.'",
        difficulty: "medium",
      },
      {
        id: "comp_002_q3",
        question: "What does the passage suggest is the best approach for using AI in healthcare?",
        options: [
          "Replacing doctors entirely with AI systems.",
          "Using AI only for administrative tasks.",
          "A collaborative model where AI augments human expertise.",
          "Avoiding AI in healthcare altogether.",
        ],
        correctAnswer: 2,
        explanation: "The passage states that 'The most effective approach appears to be a collaborative model where AI augments rather than replaces human expertise.'",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_003",
    title: "The Gig Economy",
    passage: `The gig economy refers to a labour market characterised by short-term contracts and freelance work rather than permanent jobs. Platforms like Uber, Fiverr, and Upwork have made it easier for people to offer their skills on a project-by-project basis. For workers, the appeal often lies in flexibility and the ability to choose when and where to work.

Critics argue that gig workers lack job security, benefits such as health insurance, and stable income. Regulations vary widely by country; some governments are introducing laws to extend minimum wage and benefits to gig workers. The long-term impact of the gig economy on traditional employment remains a subject of debate among economists and policymakers.`,
    wordCount: 130,
    difficulty: "medium",
    questions: [
      {
        id: "comp_003_q1",
        question: "What is the main characteristic of the gig economy?",
        options: [
          "Permanent employment with benefits.",
          "Short-term contracts and freelance work.",
          "Government-regulated minimum wage only.",
          "Work limited to technology companies.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that the gig economy is 'characterised by short-term contracts and freelance work rather than permanent jobs.'",
        difficulty: "easy",
      },
      {
        id: "comp_003_q2",
        question: "According to the passage, what do critics say about gig workers?",
        options: [
          "They earn more than traditional employees.",
          "They lack job security and benefits such as health insurance.",
          "They have too much flexibility.",
          "They are over-regulated.",
        ],
        correctAnswer: 1,
        explanation: "The passage says critics argue that 'gig workers lack job security, benefits such as health insurance, and stable income.'",
        difficulty: "easy",
      },
      {
        id: "comp_003_q3",
        question: "What does the passage suggest about the future of the gig economy?",
        options: [
          "It will replace all traditional employment.",
          "Its long-term impact is still debated.",
          "All countries have agreed on regulations.",
          "Gig workers will soon receive no benefits.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'The long-term impact of the gig economy on traditional employment remains a subject of debate.'",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_004",
    title: "Effective Communication in Teams",
    passage: `Effective communication is essential for successful teamwork. When team members share information clearly and listen actively, projects move forward with fewer misunderstandings. Best practices include setting clear goals, holding regular check-ins, and using the right channels—whether email, chat, or video calls—for different types of messages.

Barriers to effective communication can include cultural differences, unclear roles, and poor feedback habits. Teams that invest in communication skills often see higher productivity and better morale. In remote or hybrid settings, written communication and asynchronous updates become even more important to keep everyone aligned.`,
    wordCount: 115,
    difficulty: "medium",
    questions: [
      {
        id: "comp_004_q1",
        question: "What does the passage recommend for effective teamwork?",
        options: [
          "Avoiding regular meetings.",
          "Setting clear goals and holding regular check-ins.",
          "Using only email for all messages.",
          "Limiting communication to reduce noise.",
        ],
        correctAnswer: 1,
        explanation: "The passage lists 'setting clear goals, holding regular check-ins' as best practices.",
        difficulty: "easy",
      },
      {
        id: "comp_004_q2",
        question: "Which of the following is mentioned as a barrier to communication?",
        options: [
          "Too many video calls.",
          "Cultural differences and unclear roles.",
          "Excessive written documentation.",
          "Lack of technology.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that barriers 'can include cultural differences, unclear roles, and poor feedback habits.'",
        difficulty: "easy",
      },
      {
        id: "comp_004_q3",
        question: "Why does the passage say written communication matters in remote settings?",
        options: [
          "It replaces all other forms of communication.",
          "It keeps everyone aligned when work is asynchronous.",
          "It is required by law.",
          "It is faster than video calls.",
        ],
        correctAnswer: 1,
        explanation: "The passage says 'written communication and asynchronous updates become even more important to keep everyone aligned' in remote or hybrid settings.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_005",
    title: "Climate Change and Business",
    passage: `Climate change is increasingly influencing how businesses operate. Many companies now set carbon reduction targets, invest in renewable energy, and report their environmental impact to stakeholders. Consumers and investors are paying closer attention to sustainability, which has led to a rise in green products and responsible investing.

Adapting to a low-carbon economy involves both risks and opportunities. Businesses that fail to prepare may face regulatory penalties and reputational damage. Those that innovate—for example, by improving supply chain efficiency or developing sustainable products—can gain a competitive advantage and attract talent who care about environmental issues.`,
    wordCount: 115,
    difficulty: "hard",
    questions: [
      {
        id: "comp_005_q1",
        question: "What are companies doing in response to climate change, according to the passage?",
        options: [
          "Ignoring environmental impact.",
          "Setting carbon reduction targets and investing in renewable energy.",
          "Moving all operations offshore.",
          "Reducing reporting to stakeholders.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Many companies now set carbon reduction targets, invest in renewable energy, and report their environmental impact.'",
        difficulty: "easy",
      },
      {
        id: "comp_005_q2",
        question: "What does the passage say about businesses that do not prepare for a low-carbon economy?",
        options: [
          "They will always outperform competitors.",
          "They may face regulatory penalties and reputational damage.",
          "They will receive government subsidies.",
          "They have no risks.",
        ],
        correctAnswer: 1,
        explanation: "The passage says businesses 'that fail to prepare may face regulatory penalties and reputational damage.'",
        difficulty: "medium",
      },
      {
        id: "comp_005_q3",
        question: "How can companies gain a competitive advantage in this context?",
        options: [
          "By avoiding any sustainability reporting.",
          "By innovating with supply chain efficiency or sustainable products.",
          "By relocating to countries with fewer regulations.",
          "By reducing workforce size.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that businesses that innovate, e.g. 'by improving supply chain efficiency or developing sustainable products,' can gain a competitive advantage.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_006",
    title: "Time Management for Professionals",
    passage: `Time management is a skill that can be learned and improved. Key strategies include prioritising tasks by importance and urgency, blocking time for focused work, and minimising distractions. Many professionals use techniques such as the Eisenhower Matrix or time-blocking to structure their day.

Delegation is another important aspect: not every task needs to be done by the same person. Learning to say no to low-value requests and to set boundaries helps protect time for high-impact work. Regular review of how time is spent can reveal patterns and opportunities for improvement.`,
    wordCount: 105,
    difficulty: "easy",
    questions: [
      {
        id: "comp_006_q1",
        question: "What does the passage say about time management?",
        options: [
          "It is a fixed trait that cannot be changed.",
          "It is a skill that can be learned and improved.",
          "It only works for senior executives.",
          "It requires expensive software.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Time management is a skill that can be learned and improved.'",
        difficulty: "easy",
      },
      {
        id: "comp_006_q2",
        question: "Which strategy is mentioned in the passage?",
        options: [
          "Working longer hours only.",
          "Prioritising tasks by importance and urgency.",
          "Avoiding all meetings.",
          "Doing all tasks personally.",
        ],
        correctAnswer: 1,
        explanation: "The passage lists 'prioritising tasks by importance and urgency' as a key strategy.",
        difficulty: "easy",
      },
      {
        id: "comp_006_q3",
        question: "Why does the passage recommend delegation?",
        options: [
          "To reduce the number of employees.",
          "Because not every task needs to be done by the same person.",
          "To avoid learning new skills.",
          "To increase meeting time.",
        ],
        correctAnswer: 1,
        explanation: "The passage says 'not every task needs to be done by the same person' when discussing delegation.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_007",
    title: "Digital Transformation",
    passage: `Digital transformation refers to the integration of digital technology into all areas of a business, changing how it operates and delivers value to customers. It often involves updating legacy systems, training staff, and rethinking processes from a customer perspective. Success depends on leadership commitment and a culture that supports change.

Not every digital initiative succeeds. Some projects fail because of resistance to change, poor planning, or a disconnect between technology and business goals. Organisations that take a phased approach, involve employees early, and align technology with strategy are more likely to achieve lasting benefits.`,
    wordCount: 110,
    difficulty: "hard",
    questions: [
      {
        id: "comp_007_q1",
        question: "What is digital transformation, according to the passage?",
        options: [
          "Replacing all employees with automation.",
          "Integration of digital technology into all areas of a business.",
          "Selling only online.",
          "Using only legacy systems.",
        ],
        correctAnswer: 1,
        explanation: "The passage defines it as 'the integration of digital technology into all areas of a business.'",
        difficulty: "easy",
      },
      {
        id: "comp_007_q2",
        question: "What does success in digital transformation depend on?",
        options: [
          "Spending the most money.",
          "Leadership commitment and a culture that supports change.",
          "Avoiding any training.",
          "Keeping all legacy systems unchanged.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Success depends on leadership commitment and a culture that supports change.'",
        difficulty: "medium",
      },
      {
        id: "comp_007_q3",
        question: "Why do some digital initiatives fail?",
        options: [
          "Because technology is too cheap.",
          "Due to resistance to change, poor planning, or disconnect between technology and goals.",
          "Because employees are too skilled.",
          "Because customers prefer legacy systems.",
        ],
        correctAnswer: 1,
        explanation: "The passage says projects 'fail because of resistance to change, poor planning, or a disconnect between technology and business goals.'",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_008",
    title: "Cross-Cultural Collaboration",
    passage: `Working with colleagues and clients from different cultures requires awareness and adaptability. Communication styles, attitudes toward hierarchy, and expectations around deadlines can vary significantly. For example, in some cultures direct feedback is valued, while in others it may be seen as rude. Similarly, the meaning of "soon" or "urgent" can differ.

Building trust across cultures often takes time and patience. Simple steps include learning basic greetings, showing respect for local customs, and avoiding assumptions. When in doubt, asking clarifying questions and confirming understanding in writing can prevent misunderstandings and strengthen working relationships.`,
    wordCount: 115,
    difficulty: "medium",
    questions: [
      {
        id: "comp_008_q1",
        question: "What can vary across cultures, according to the passage?",
        options: [
          "Only language.",
          "Communication styles, attitudes toward hierarchy, and expectations around deadlines.",
          "Only dress codes.",
          "Only time zones.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Communication styles, attitudes toward hierarchy, and expectations around deadlines can vary significantly.'",
        difficulty: "easy",
      },
      {
        id: "comp_008_q2",
        question: "Why might direct feedback be perceived differently?",
        options: [
          "Because it is always wrong.",
          "In some cultures it is valued; in others it may be seen as rude.",
          "Because it is never used in business.",
          "Because it is illegal in some countries.",
        ],
        correctAnswer: 1,
        explanation: "The passage says 'in some cultures direct feedback is valued, while in others it may be seen as rude.'",
        difficulty: "medium",
      },
      {
        id: "comp_008_q3",
        question: "What does the passage recommend to prevent misunderstandings?",
        options: [
          "Avoiding all written communication.",
          "Asking clarifying questions and confirming understanding in writing.",
          "Using only one language globally.",
          "Skipping introductions.",
        ],
        correctAnswer: 1,
        explanation: "The passage recommends 'asking clarifying questions and confirming understanding in writing' to prevent misunderstandings.",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_009",
    title: "Customer Feedback and Product Development",
    passage: `Listening to customer feedback is central to building products that people want. Feedback can come from surveys, support tickets, reviews, and direct conversations. Analysing this data helps teams identify pain points, prioritise features, and fix issues before they affect too many users.

However, not all feedback should be treated equally. A single loud voice might not represent the majority; balancing feedback with data on usage and business goals is important. Teams that close the loop by informing customers when their suggestions are implemented often see higher loyalty and more constructive feedback in the future.`,
    wordCount: 110,
    difficulty: "medium",
    questions: [
      {
        id: "comp_009_q1",
        question: "How can companies gather customer feedback?",
        options: [
          "Only through sales calls.",
          "Through surveys, support tickets, reviews, and direct conversations.",
          "Only after a product is discontinued.",
          "Only from internal staff.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Feedback can come from surveys, support tickets, reviews, and direct conversations.'",
        difficulty: "easy",
      },
      {
        id: "comp_009_q2",
        question: "Why should not all feedback be treated equally?",
        options: [
          "Because feedback is always negative.",
          "A single loud voice might not represent the majority.",
          "Because customers never know what they want.",
          "Because it is too expensive to analyse.",
        ],
        correctAnswer: 1,
        explanation: "The passage says 'A single loud voice might not represent the majority' and recommends balancing feedback with data.",
        difficulty: "medium",
      },
      {
        id: "comp_009_q3",
        question: "What can happen when teams inform customers that their suggestions were implemented?",
        options: [
          "Customers always ask for refunds.",
          "Higher loyalty and more constructive feedback.",
          "Legal problems only.",
          "No change in behaviour.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that teams that 'close the loop' often see 'higher loyalty and more constructive feedback in the future.'",
        difficulty: "medium",
      },
    ],
  },
  {
    id: "comp_010",
    title: "Leadership and Accountability",
    passage: `Effective leaders take responsibility for both successes and failures. When things go wrong, they do not blame others; instead, they focus on what can be learned and how to improve. This behaviour builds trust and encourages team members to take ownership of their work.

Accountability also means setting clear expectations, following through on commitments, and giving honest feedback. Leaders who model accountability create a culture where people feel safe to admit mistakes and propose new ideas. Over time, this can lead to higher performance and better team cohesion.`,
    wordCount: 100,
    difficulty: "medium",
    questions: [
      {
        id: "comp_010_q1",
        question: "What do effective leaders do when things go wrong?",
        options: [
          "Blame others and avoid discussion.",
          "Take responsibility and focus on what can be learned.",
          "Hide the failure from the team.",
          "Resign immediately.",
        ],
        correctAnswer: 1,
        explanation: "The passage says they 'do not blame others; instead, they focus on what can be learned and how to improve.'",
        difficulty: "easy",
      },
      {
        id: "comp_010_q2",
        question: "What does accountability include, according to the passage?",
        options: [
          "Only celebrating wins.",
          "Setting clear expectations, following through on commitments, and giving honest feedback.",
          "Avoiding all feedback.",
          "Delegating all responsibility.",
        ],
        correctAnswer: 1,
        explanation: "The passage states that 'Accountability also means setting clear expectations, following through on commitments, and giving honest feedback.'",
        difficulty: "medium",
      },
      {
        id: "comp_010_q3",
        question: "What kind of culture do leaders who model accountability create?",
        options: [
          "One where mistakes are punished severely.",
          "One where people feel safe to admit mistakes and propose new ideas.",
          "One where only the leader speaks.",
          "One with no expectations.",
        ],
        correctAnswer: 1,
        explanation: "The passage says such leaders 'create a culture where people feel safe to admit mistakes and propose new ideas.'",
        difficulty: "medium",
      },
    ],
  },
];

// ========== SKILL MCQ QUESTIONS ==========

const SKILL_QUESTIONS: Record<string, MCQQuestion[]> = {
  "React": [
    {
      id: "react_001",
      question: "What is the correct way to update state in a functional component?",
      options: [
        "this.setState({ count: 1 })",
        "setState({ count: 1 })",
        "const [count, setCount] = useState(0); setCount(1)",
        "state.count = 1",
      ],
      correctAnswer: 2,
      explanation: "In functional components, use the useState hook and the setter function to update state.",
      difficulty: "easy",
      category: "React",
    },
    {
      id: "react_002",
      question: "What is the purpose of the useEffect hook?",
      options: [
        "To manage component state",
        "To handle side effects and lifecycle events",
        "To create new components",
        "To optimize rendering performance",
      ],
      correctAnswer: 1,
      explanation: "useEffect is used to perform side effects in functional components, similar to componentDidMount, componentDidUpdate, etc.",
      difficulty: "medium",
      category: "React",
    },
    {
      id: "react_003",
      question: "What is the purpose of React keys?",
      options: [
        "To style components",
        "To help React identify which items have changed, been added, or removed",
        "To encrypt component data",
        "To improve component performance only",
      ],
      correctAnswer: 1,
      explanation: "Keys help React identify which items have changed, been added, or removed, enabling efficient updates.",
      difficulty: "easy",
      category: "React",
    },
    {
      id: "react_004",
      question: "What is the difference between controlled and uncontrolled components?",
      options: [
        "Controlled components use state, uncontrolled use refs",
        "Controlled components are faster",
        "Uncontrolled components are more secure",
        "There is no difference",
      ],
      correctAnswer: 0,
      explanation: "Controlled components have their state controlled by React, while uncontrolled components use refs to access DOM values directly.",
      difficulty: "medium",
      category: "React",
    },
    {
      id: "react_005",
      question: "What does useMemo do?",
      options: [
        "Memorizes component props",
        "Memoizes expensive calculations to avoid recalculating on every render",
        "Stores data in browser memory",
        "Creates memo components",
      ],
      correctAnswer: 1,
      explanation: "useMemo memoizes the result of expensive calculations, only recalculating when dependencies change.",
      difficulty: "hard",
      category: "React",
    },
  ],
  "Python": [
    {
      id: "python_001",
      question: "What is the output of: print([i for i in range(5) if i % 2 == 0])",
      options: ["[0, 2, 4]", "[1, 3]", "[0, 1, 2, 3, 4]", "[2, 4]"],
      correctAnswer: 0,
      explanation: "List comprehension filters even numbers (0, 2, 4) from range(5).",
      difficulty: "easy",
      category: "Python",
    },
    {
      id: "python_002",
      question: "What is the difference between '==' and 'is' in Python?",
      options: [
        "'==' compares values, 'is' compares object identity",
        "'==' compares object identity, 'is' compares values",
        "They are identical",
        "'==' is for numbers, 'is' is for strings",
      ],
      correctAnswer: 0,
      explanation: "'==' checks value equality, 'is' checks if two variables refer to the same object in memory.",
      difficulty: "medium",
      category: "Python",
    },
    {
      id: "python_003",
      question: "What is a Python decorator?",
      options: [
        "A function that modifies another function",
        "A type of variable",
        "A Python module",
        "A data structure",
      ],
      correctAnswer: 0,
      explanation: "A decorator is a function that takes another function and extends its behavior without explicitly modifying it.",
      difficulty: "hard",
      category: "Python",
    },
    {
      id: "python_004",
      question: "What is the difference between a list and a tuple?",
      options: [
        "Lists are mutable, tuples are immutable",
        "Tuples are mutable, lists are immutable",
        "There is no difference",
        "Lists can only contain numbers",
      ],
      correctAnswer: 0,
      explanation: "Lists are mutable (can be changed), while tuples are immutable (cannot be changed after creation).",
      difficulty: "easy",
      category: "Python",
    },
    {
      id: "python_005",
      question: "What does the 'with' statement do?",
      options: [
        "Creates a context manager for resource management",
        "Imports a module",
        "Defines a function",
        "Creates a loop",
      ],
      correctAnswer: 0,
      explanation: "The 'with' statement is used for context management, ensuring proper setup and teardown of resources.",
      difficulty: "medium",
      category: "Python",
    },
  ],
  "JavaScript": [
    {
      id: "js_001",
      question: "What is the difference between 'let', 'const', and 'var'?",
      options: [
        "'let' and 'const' are block-scoped, 'var' is function-scoped",
        "They are all identical",
        "'var' is block-scoped, 'let' and 'const' are function-scoped",
        "Only 'const' is block-scoped",
      ],
      correctAnswer: 0,
      explanation: "'let' and 'const' are block-scoped, while 'var' is function-scoped. 'const' also prevents reassignment.",
      difficulty: "medium",
      category: "JavaScript",
    },
    {
      id: "js_002",
      question: "What is a closure in JavaScript?",
      options: [
        "A function that has access to variables in its outer scope",
        "A way to close a browser window",
        "A type of loop",
        "A data structure",
      ],
      correctAnswer: 0,
      explanation: "A closure is a function that has access to variables in its outer (enclosing) lexical scope, even after the outer function has returned.",
      difficulty: "hard",
      category: "JavaScript",
    },
    {
      id: "js_003",
      question: "What is the difference between 'null' and 'undefined'?",
      options: [
        "'null' is an assigned value, 'undefined' means a variable has been declared but not assigned",
        "They are identical",
        "'undefined' is an assigned value, 'null' means not declared",
        "Both mean the same thing",
      ],
      correctAnswer: 0,
      explanation: "'null' is an explicitly assigned value representing 'no value', while 'undefined' means a variable has been declared but not assigned a value.",
      difficulty: "medium",
      category: "JavaScript",
    },
  ],
  "Node.js": [
    {
      id: "node_001",
      question: "What is the purpose of package.json?",
      options: [
        "To define project metadata and dependencies",
        "To store user data",
        "To configure the server",
        "To define database schemas",
      ],
      correctAnswer: 0,
      explanation: "package.json contains project metadata, scripts, and dependency information for Node.js projects.",
      difficulty: "easy",
      category: "Node.js",
    },
    {
      id: "node_002",
      question: "What is the event loop in Node.js?",
      options: [
        "A mechanism that handles asynchronous operations",
        "A type of loop in JavaScript",
        "A way to iterate over arrays",
        "A database query mechanism",
      ],
      correctAnswer: 0,
      explanation: "The event loop is Node.js's mechanism for handling asynchronous operations, allowing non-blocking I/O.",
      difficulty: "hard",
      category: "Node.js",
    },
  ],
  // Add more skills as needed
};

/**
 * Get English grammar questions
 */
export const getEnglishGrammarQuestions = query({
  args: {
    count: v.number(),
    difficulty: v.optional(v.string()),
    excludeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let questions = GRAMMAR_QUESTIONS;

    // Filter by difficulty if specified
    if (args.difficulty) {
      questions = questions.filter((q) => q.difficulty === args.difficulty);
    }

    // Exclude already used questions
    if (args.excludeIds) {
      questions = questions.filter((q) => !args.excludeIds!.includes(q.id));
    }

    // Shuffle and return requested count
    const shuffled = questions.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(args.count, shuffled.length));
  },
});

/**
 * Get English comprehension passage with questions
 */
export const getEnglishComprehension = query({
  args: {
    difficulty: v.optional(v.string()),
    excludeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    let passages = COMPREHENSION_PASSAGES;

    // Filter by difficulty if specified
    if (args.difficulty) {
      passages = passages.filter((p) => p.difficulty === args.difficulty);
    }

    // Exclude already used passages
    if (args.excludeIds) {
      passages = passages.filter((p) => !args.excludeIds!.includes(p.id));
    }

    // Return random passage
    if (passages.length === 0) {
      return null;
    }

    const randomPassage = passages[Math.floor(Math.random() * passages.length)];
    
    // Shuffle questions within the passage
    const shuffledQuestions = randomPassage.questions.sort(() => Math.random() - 0.5);
    
    return {
      ...randomPassage,
      questions: shuffledQuestions,
    };
  },
});

/**
 * Get skill-specific MCQ questions
 */
export const getSkillMCQQuestions = query({
  args: {
    skillName: v.string(),
    experienceLevel: v.string(),
    count: v.number(),
    excludeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const skillQuestions = SKILL_QUESTIONS[args.skillName] || [];

    // Map experience level to difficulty
    const difficultyMap: Record<string, QuestionDifficulty> = {
      junior: "easy",
      mid: "medium",
      senior: "hard",
      expert: "expert",
    };

    const targetDifficulty = difficultyMap[args.experienceLevel] || "medium";

    // Filter by difficulty (include easier questions too for comprehensive assessment)
    const difficultyOrder = ["easy", "medium", "hard", "expert"];
    const targetIndex = difficultyOrder.indexOf(targetDifficulty);
    const allowedDifficulties = difficultyOrder.slice(0, targetIndex + 1);

    let filtered = skillQuestions.filter(
      (q) => allowedDifficulties.includes(q.difficulty)
    );

    // Exclude already used questions
    if (args.excludeIds) {
      filtered = filtered.filter((q) => !args.excludeIds!.includes(q.id));
    }

    // Shuffle and return
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(args.count, shuffled.length));
  },
});

/**
 * Validate test answers
 */
export const validateTestAnswers = query({
  args: {
    questions: v.array(
      v.object({
        id: v.string(),
        selectedAnswer: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // In production, fetch correct answers from database
    // For now, we'll need to pass questions with answers or store them securely
    // This is a placeholder - actual implementation should fetch from secure storage
    
    const results = args.questions.map((q) => {
      // This would fetch the correct answer from database
      // For now, return structure
      return {
        questionId: q.id,
        selectedAnswer: q.selectedAnswer,
        correct: false, // Would be calculated from database
        score: 0, // Would be calculated
      };
    });

    return results;
  },
});
