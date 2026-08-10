import pool from "../db";

export async function saveMCQ(
  question: string,
  options: string[],
  correctAnswer: string,
  testId: number
) {
  await pool.query(
    `INSERT INTO mcqs (test_id, question, options, correct_answer)
     VALUES ($1, $2, $3::jsonb, $4)`,
    [testId, question, JSON.stringify(options), correctAnswer]
  );
}
