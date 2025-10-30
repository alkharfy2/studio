'use server';
/**
 * @fileOverview AI-powered summarization of client work experience for task creation.
 *
 * - summarizeClientExperience - A function that summarizes client work experience.
 * - SummarizeClientExperienceInput - The input type for the summarizeClientExperience function.
 * - SummarizeClientExperienceOutput - The return type for the summarizeClientExperience function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeClientExperienceInputSchema = z.object({
  clientExperience: z
    .string()
    .describe('Detailed description of the client\'s work experience.'),
});
export type SummarizeClientExperienceInput = z.infer<typeof SummarizeClientExperienceInputSchema>;

const SummarizeClientExperienceOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the client\'s work experience.'),
});
export type SummarizeClientExperienceOutput = z.infer<typeof SummarizeClientExperienceOutputSchema>;

export async function summarizeClientExperience(
  input: SummarizeClientExperienceInput
): Promise<SummarizeClientExperienceOutput> {
  return summarizeClientExperienceFlow(input);
}

const summarizeClientExperiencePrompt = ai.definePrompt({
  name: 'summarizeClientExperiencePrompt',
  input: {schema: SummarizeClientExperienceInputSchema},
  output: {schema: SummarizeClientExperienceOutputSchema},
  prompt: `You are an AI assistant helping moderators quickly understand a client's work history.

  Summarize the following work experience in a concise paragraph.

  Work Experience: {{{clientExperience}}}`,
});

const summarizeClientExperienceFlow = ai.defineFlow(
  {
    name: 'summarizeClientExperienceFlow',
    inputSchema: SummarizeClientExperienceInputSchema,
    outputSchema: SummarizeClientExperienceOutputSchema,
  },
  async input => {
    const {output} = await summarizeClientExperiencePrompt(input);
    return output!;
  }
);
