// src/ai/flows/calculate-moderator-earnings.ts
'use server';

/**
 * @fileOverview Calculates a moderator's estimated earnings for the current month.
 *
 * This file exports:
 * - `calculateModeratorEarnings`: An async function that takes a moderator ID and returns their estimated earnings.
 * - `CalculateModeratorEarningsInput`: The input type for the calculateModeratorEarnings function.
 * - `CalculateModeratorEarningsOutput`: The return type for the calculateModeratorEarnings function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculateModeratorEarningsInputSchema = z.object({
  moderatorId: z.string().describe('The Firebase UID of the moderator.'),
});

export type CalculateModeratorEarningsInput = z.infer<typeof CalculateModeratorEarningsInputSchema>;

const CalculateModeratorEarningsOutputSchema = z.object({
  estimatedEarnings: z.number().describe('The estimated earnings for the current month in EGP.'),
});

export type CalculateModeratorEarningsOutput = z.infer<typeof CalculateModeratorEarningsOutputSchema>;

export async function calculateModeratorEarnings(input: CalculateModeratorEarningsInput): Promise<CalculateModeratorEarningsOutput> {
  return calculateModeratorEarningsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'calculateModeratorEarningsPrompt',
  input: {schema: CalculateModeratorEarningsInputSchema},
  output: {schema: CalculateModeratorEarningsOutputSchema},
  prompt: `You are an AI assistant tasked with calculating the estimated earnings for a moderator in the Cveeez system for the current month.

  The moderator's ID is {{{moderatorId}}}.

  To calculate the estimated earnings, follow these steps:

  1.  Fetch all tasks assigned to this moderator from the Firestore database where tasks are stored. Only consider tasks where the 'moderatorId' field matches the provided moderatorId.
  2.  Filter these tasks to include only those that are marked as 'done', 'completed', or 'approved'.
  3.  Further filter the tasks to include only those completed within the current month.
  4.  For each task, calculate the moderator's earnings as 20% of (amount paid - 100 EGP advertising cost), only for tasks with the EGP currency. If the amount paid is less than 100 EGP, no advertising cost should be deducted.
  5.  Sum up the earnings from all qualifying tasks to get the total estimated earnings for the month.
  6.  Return the final estimated earnings amount.

  Ensure accuracy in calculations and currency conversions to provide a reliable estimate of the moderator's financial performance. Always answer using JSON format.
  `,
});

const calculateModeratorEarningsFlow = ai.defineFlow(
  {
    name: 'calculateModeratorEarningsFlow',
    inputSchema: CalculateModeratorEarningsInputSchema,
    outputSchema: CalculateModeratorEarningsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
