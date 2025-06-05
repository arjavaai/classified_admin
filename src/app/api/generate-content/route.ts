import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

// Check if we have an API key
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is missing in environment variables');
}

const groq = new Groq({ 
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { pageType, state, city } = body;
    
    console.log(`Generating content for ${pageType} page: ${state}${city ? `, ${city}` : ''}`);

    let command = '';
    if (pageType === 'state' && state) {
      command = `Generate a State page for ${state}`;
    } else if (pageType === 'city' && state && city) {
      command = `Generate a City page for ${city}, ${state}`;
    } else {
      return NextResponse.json({ error: 'Missing state or city' }, { status: 400 });
    }

    const systemPrompt = `Objective: Generate SEO-optimized content for SKLUVA.com (United States Escorts Classifieds).

CRITICAL FORMATTING INSTRUCTIONS: 
- DO NOT USE ASTERISKS (*) ANYWHERE IN YOUR RESPONSE
- DO NOT INCLUDE CHARACTER COUNTS
- DO NOT USE MARKDOWN FORMATTING
- DO NOT WRAP TEXT IN ANY SPECIAL CHARACTERS
- FORMAT ONLY WITH HTML TAGS AS SPECIFIED BELOW

Your response must follow this EXACT structure:

Meta Title: [Plain text title, max 50 characters]

Meta Description: [Plain text description, 130-140 characters exactly]

H1: [Plain text H1 heading]

Content:
<h2>First Subheading Here</h2>
<p>First paragraph of content here. Each paragraph must be properly wrapped in p tags.</p>
<p>Second paragraph here with more information about the topic.</p>
<h2>Second Subheading Here</h2>
<p>More content about this topic with important information.</p>
<h3>A  subheading</h3>
<p>Further details and information for the reader.</p>
<h2>Third Subheading Here</h2>
<p>.</p>
<p></p>
<h2>Fourth Subheading Here</h2>
<p></p>
<p>CTA</p>
<ul>
<li>First important point or benefit</li>
<li>Second important point or next step</li>
<li>Third important point or feature</li>
</ul>

I. COMMAND STRUCTURE (How to Request Content):

For State Pages: Use the command: Generate a State page for [State Name]Example: Generate a State page for Texas

For City Pages: Use the command: Generate a City page for [City Name], [State Name]Example: Generate a City page for Miami, Florida

II. UNIVERSAL OUTPUT REQUIREMENTS (Applicable to ALL Pages):

IMPORTANT: STRUCTURE YOUR RESPONSE EXACTLY AS FOLLOWS:

Meta Title: [Title here, max 50 characters - DO NOT include ** or character counts]

Meta Description: [Description here, 130-140 characters exactly - DO NOT include ** or character counts]

H1: [H1 title here - DO NOT include ** or character counts]

Content:
[All body content goes here, properly formatted with HTML tags]

A. Meta Title:

Maximum Length: 50 characters.

Content Requirements:
- MUST be completely unique for each generation
- MUST include either "[State/City] Escorts" OR "[State/City] Independent Escorts" (use exactly ONE of these two keyword phrases)
- MUST include a unique and creative tagline that relates to the location
- Never reuse taglines or phrases from previous outputs
- Avoid generic phrases like "find companionship" or "discover connections"
- Avoid the word "championship" and similar overused terms

B. Meta Description:

Length Requirement: MUST be between 130-140 characters (not less, not more).

Content Requirements:
- MUST be completely unique for each generation
- MUST include "[State/City] Independent Escorts" exactly once
- MUST be engaging and provide specific information about the location or service
- NEVER include "SKLUVA" or "SKLUVA.com" in the meta description
- STRICTLY NEVER include "SKLUVA" or "SKLUVA.com" in WHOLE CONTENT MORE THAN 1 TIME
- Never reuse phrases from previous outputs
- Avoid generic descriptions

C. SEO Body Content (MUST BE PROPERLY FORMATTED WITH HTML TAGS):

Minimum Word Count: 200+ words.

H1 Heading: Structure (State Page): [State Name] Escorts – [Engaging Tagline Related to Discovery/Connections Statewide]Example: Nevada Escorts – Discover Companionship Statewide Structure (City Page): [City Name] Escorts – [Engaging Tagline Related to City-Specific Connections/Experiences]Example: Atlanta Escorts – Experience the City's Finest Connections

Exact Phrase Requirement: Must include the exact phrase [State Name] Escorts or [City Name] Escorts.

Formatting & Structure: Use proper HTML tags as follows:
- Use <h2> and <h3> tags for subheadings
- Use <p> tags for paragraphs
- Use <ul> and <li> tags for bullet points
- The last section MUST be formatted as a <ul> with <li> bullet points

Paragraphs: Keep paragraphs short (2-6 sentences) for better readability. Each paragraph must not exceed four lines of text.

Voice: Use active voice consistently.

Readability: Format for optimal mobile readability (e.g., good spacing, concise sentences).

Bold Text: Dont use bold text OR Bold Words body content.

SKLUVA's Role: VERY STRICTLY NEVER state or imply that SKLUVA.com owns, manages, operates, verifies, or endorses any listings or individuals. The platform is a classifieds site.

Anti-Repetition Rules:
- Never use the same phrase or sentence structure more than once
- Vary your vocabulary throughout the content
- Use different subheading styles and formats
- Ensure each paragraph has a distinct focus and content
- Each bullet point should be unique with no repetitive structure
- STRICTLY Maximum mentions of "SKLUVA.com" is 1 TIME in the entire content
- Avoid repetitive calls-to-action; make each CTA unique
- Use synonyms and alternative phrasing instead of repeating terms

General Keyword "Escort(s)" Usage Rules:Per Paragraph: The word "escort" or "escorts" must not appear more than TWO (2) times in any single paragraph.

Meta Tags: The word "escort" or "escorts" must not appear more than ONCE (1) in the Meta Title and ONCE (1) in the Meta Description.

Call-To-Action (CTA):Minimum Requirement: Include at least THREE (3) distinct CTAs within the body content.

Examples: "Explore listings", "Book today", "Find your match", "Discover connections", "View profiles now".

Tone & Compliance:Tone: Maintain a neutral, professional, and informational tone.

SKLUVA's Role: NEVER state or imply that SKLUVA.com owns, manages, operates, verifies, or endorses any listings or individuals. The platform is a classifieds site.

Content Focus: Content should be informational about finding companionship in the specified location via classified listings, not promotional of illicit or explicit activities. Focus on connection, companionship, and exploring options.

III. CITY PAGE SPECIFIC KEYWORD SET:

The following keywords are ONLY for City Pages.

Use each keyword from this list no more than TWO (2) times in the entire SEO body content for a city page:

escorts (This is in addition to the general "escort(s)" rule for paragraph/meta, but the total for the body from this specific keyword set is 2)

independent escorts

female escorts

blonde escorts

busty escorts

bisexual escorts

luxury escorts

Asian escorts

beautiful

services

IV. CONTENT REGENERATION CLAUSE:

CRITICAL: If any rule outlined in this Master Prompt is broken (e.g., character/word count violations, keyword limits exceeded, incorrect formatting, tone issues), the content MUST be regenerated until all criteria are met.

V. STRICT LAST PARAGRAPH INSTRUCTION:

CRITICAL: The very last section of the generated output, which would typically be the final paragraph, MUST be formatted as a list of bullet points using <ul> and <li> tags. It must NOT be a continuous paragraph. These bullet points should summarize key benefits or next steps for the user.`;

    try {
      console.log("Attempting to use Groq API...");
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        model: 'meta-llama/llama-4-maverick-17b-128e-instruct', // Use a valid model name
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      });

      const aiContent = chatCompletion.choices[0]?.message?.content || '';
      console.log("Content generated successfully");
      return NextResponse.json({ content: aiContent });
    } catch (apiError: any) {
      console.error("Groq API error:", apiError);
      
      // Return a meaningful error with status code
      return NextResponse.json(
        { 
          error: 'AI generation failed',
          details: apiError.message || 'Unknown error' 
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 