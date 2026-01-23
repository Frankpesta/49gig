/**
 * Experience-Based Skill Test Complexity
 * 
 * Adjusts skill test difficulty based on the experience level
 * selected during freelancer signup.
 */

export type ExperienceLevel = "junior" | "mid" | "senior" | "expert";

/**
 * Test complexity configuration
 */
interface TestComplexity {
  questionCount: number;
  timeLimit: number; // in seconds
  difficulty: "easy" | "medium" | "hard" | "expert";
  passingScore: number; // 0-100
  codingChallengeComplexity: "basic" | "intermediate" | "advanced" | "expert";
}

/**
 * Get test complexity based on experience level
 */
export function getTestComplexity(
  experienceLevel: ExperienceLevel
): TestComplexity {
  switch (experienceLevel) {
    case "junior":
      return {
        questionCount: 10,
        timeLimit: 1800, // 30 minutes
        difficulty: "easy",
        passingScore: 60,
        codingChallengeComplexity: "basic",
      };
    case "mid":
      return {
        questionCount: 15,
        timeLimit: 2400, // 40 minutes
        difficulty: "medium",
        passingScore: 70,
        codingChallengeComplexity: "intermediate",
      };
    case "senior":
      return {
        questionCount: 20,
        timeLimit: 3000, // 50 minutes
        difficulty: "hard",
        passingScore: 80,
        codingChallengeComplexity: "advanced",
      };
    case "expert":
      return {
        questionCount: 25,
        timeLimit: 3600, // 60 minutes
        difficulty: "expert",
        passingScore: 85,
        codingChallengeComplexity: "expert",
      };
    default:
      return getTestComplexity("mid");
  }
}

/**
 * Generate coding challenge based on complexity
 */
export interface CodingChallenge {
  title: string;
  description: string;
  difficulty: "basic" | "intermediate" | "advanced" | "expert";
  testCases: Array<{
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }>;
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
}

const CODING_CHALLENGES: Record<
  "basic" | "intermediate" | "advanced" | "expert",
  CodingChallenge[]
> = {
  basic: [
    {
      title: "Sum of Two Numbers",
      description:
        "Write a function that takes two numbers and returns their sum.",
      difficulty: "basic",
      testCases: [
        { input: "5, 3", expectedOutput: "8", isHidden: false },
        { input: "10, 20", expectedOutput: "30", isHidden: false },
        { input: "-5, 5", expectedOutput: "0", isHidden: true },
      ],
      timeLimit: 60,
      memoryLimit: 128,
    },
    {
      title: "Find Maximum",
      description:
        "Write a function that finds the maximum number in an array.",
      difficulty: "basic",
      testCases: [
        { input: "[1, 5, 3, 9, 2]", expectedOutput: "9", isHidden: false },
        { input: "[-1, -5, -3]", expectedOutput: "-1", isHidden: true },
      ],
      timeLimit: 60,
      memoryLimit: 128,
    },
  ],
  intermediate: [
    {
      title: "Two Sum",
      description:
        "Given an array of integers and a target sum, find two numbers that add up to the target.",
      difficulty: "intermediate",
      testCases: [
        { input: "[2, 7, 11, 15], 9", expectedOutput: "[0, 1]", isHidden: false },
        { input: "[3, 2, 4], 6", expectedOutput: "[1, 2]", isHidden: true },
      ],
      timeLimit: 120,
      memoryLimit: 256,
    },
    {
      title: "Valid Parentheses",
      description:
        "Determine if a string containing only parentheses is valid.",
      difficulty: "intermediate",
      testCases: [
        { input: "()", expectedOutput: "true", isHidden: false },
        { input: "()[]{}", expectedOutput: "true", isHidden: false },
        { input: "(]", expectedOutput: "false", isHidden: true },
      ],
      timeLimit: 120,
      memoryLimit: 256,
    },
  ],
  advanced: [
    {
      title: "Binary Tree Maximum Path Sum",
      description:
        "Find the maximum path sum in a binary tree where a path can start and end at any node.",
      difficulty: "advanced",
      testCases: [
        { input: "[1,2,3]", expectedOutput: "6", isHidden: false },
        { input: "[-10,9,20,null,null,15,7]", expectedOutput: "42", isHidden: true },
      ],
      timeLimit: 300,
      memoryLimit: 512,
    },
    {
      title: "LRU Cache",
      description:
        "Design and implement a data structure for a Least Recently Used (LRU) cache.",
      difficulty: "advanced",
      testCases: [
        {
          input: "capacity=2, operations=[put(1,1), put(2,2), get(1), put(3,3), get(2)]",
          expectedOutput: "[null, null, 1, null, -1]",
          isHidden: true,
        },
      ],
      timeLimit: 300,
      memoryLimit: 512,
    },
  ],
  expert: [
    {
      title: "Design a Distributed Cache",
      description:
        "Design a distributed caching system with consistency guarantees and fault tolerance.",
      difficulty: "expert",
      testCases: [
        {
          input: "Complex system requirements",
          expectedOutput: "Architecture design and implementation",
          isHidden: true,
        },
      ],
      timeLimit: 600,
      memoryLimit: 1024,
    },
    {
      title: "Optimize Database Query",
      description:
        "Given a complex database schema and query, optimize it for performance.",
      difficulty: "expert",
      testCases: [
        {
          input: "Query and schema",
          expectedOutput: "Optimized query with explanation",
          isHidden: true,
        },
      ],
      timeLimit: 600,
      memoryLimit: 1024,
    },
  ],
};

/**
 * Get coding challenge for experience level
 */
export function getCodingChallenge(
  experienceLevel: ExperienceLevel,
  skillName: string
): CodingChallenge {
  const complexity = getTestComplexity(experienceLevel);
  const challenges = CODING_CHALLENGES[complexity.codingChallengeComplexity];
  
  // Select a random challenge (in production, you might want to track which challenges have been used)
  const randomIndex = Math.floor(Math.random() * challenges.length);
  return challenges[randomIndex];
}

/**
 * Generate MCQ questions based on complexity
 */
export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: "easy" | "medium" | "hard" | "expert";
}

/**
 * Get question bank based on difficulty
 * In production, these would come from a database
 */
export function getMCQQuestions(
  skillName: string,
  difficulty: "easy" | "medium" | "hard" | "expert",
  count: number
): MCQQuestion[] {
  // This is a placeholder - in production, you'd query a database
  // with questions tagged by skill and difficulty
  const sampleQuestions: MCQQuestion[] = [
    {
      question: `What is the time complexity of binary search?`,
      options: ["O(n)", "O(log n)", "O(n log n)", "O(1)"],
      correctAnswer: 1,
      explanation: "Binary search has O(log n) time complexity because it eliminates half the search space in each iteration.",
      difficulty: "easy",
    },
    {
      question: `What is the difference between REST and GraphQL?`,
      options: [
        "REST uses HTTP, GraphQL doesn't",
        "GraphQL allows clients to request specific fields, REST returns fixed data",
        "REST is faster than GraphQL",
        "There is no difference",
      ],
      correctAnswer: 1,
      explanation: "GraphQL allows clients to request exactly the data they need, while REST returns fixed data structures.",
      difficulty: "medium",
    },
    // Add more questions based on skill and difficulty
  ];

  // Filter by difficulty and return requested count
  return sampleQuestions
    .filter((q) => q.difficulty === difficulty)
    .slice(0, count);
}
