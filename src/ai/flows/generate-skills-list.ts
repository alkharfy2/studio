'use server';

/**
 * @fileOverview AI flow to generate a structured list of skills from free-form text.
 *
 * This file defines a Genkit flow that takes free-form text input of skills and returns a structured list of skills.
 * @fileOverview
 *
 * - `generateSkillsList` - A function that handles the skills list generation process.
 * - `GenerateSkillsListInput` - The input type for the `generateSkillsList` function.
 * - `GenerateSkillsListOutput` - The return type for the `generateSkillsList` function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSkillsListInputSchema = z.string().describe('Free-form text containing a list of skills.');
export type GenerateSkillsListInput = z.infer<typeof GenerateSkillsListInputSchema>;

const GenerateSkillsListOutputSchema = z.array(z.string()).describe('A structured list of skills.');
export type GenerateSkillsListOutput = z.infer<typeof GenerateSkillsListOutputSchema>;

export async function generateSkillsList(input: GenerateSkillsListInput): Promise<GenerateSkillsListOutput> {
  return generateSkillsListFlow(input);
}

const generateSkillsListPrompt = ai.definePrompt({
  name: 'generateSkillsListPrompt',
  input: {schema: GenerateSkillsListInputSchema},
  output: {schema: GenerateSkillsListOutputSchema},
  prompt: `You are an AI assistant that extracts a structured list of skills from free-form text.

  Input: {{{$input}}}

  Output:`, // Use {{$input}} to access the input string
});

const generateSkillsListFlow = ai.defineFlow(
  {
    name: 'generateSkillsListFlow',
    inputSchema: GenerateSkillsListInputSchema,
    outputSchema: GenerateSkillsListOutputSchema,
  },
  async input => {
    const {output} = await generateSkillsListPrompt(input);
    return output!;
  }
);
