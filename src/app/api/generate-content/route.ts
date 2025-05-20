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

    const systemPrompt = `Objective: Generate SEO-optimized content for SKLUVA.com (United States Escorts Classifieds). Adhere strictly to all instructions outlined below for consistent and effective content creation.

CRITICAL: Format your response precisely as follows - do not use asterisks, markdown, or special characters:

Meta Title: [title here]

Meta Description: [description here]

H1: [h1 title here]

Content:
<h1>[h1 title here]</h1>
<p>[First paragraph]</p>
<h2>[First subheading]</h2>
<p>[Paragraph under first subheading]</p>
<h2>[Second subheading]</h2>
<p>[Paragraph under second subheading]</p>
<h2>[Third subheading]</h2>
<p>[Paragraph under third subheading]</p>
<h2>Key Benefits</h2>
<ul>
<li>[First bullet point]</li>
<li>[Second bullet point]</li>
<li>[Third bullet point]</li>
<li>[Fourth bullet point]</li>
</ul>

CRITICAL: The content must begin with the H1 heading. Do NOT include any introductory paragraphs or text before the H1 heading. Always start the actual content with the H1.

STATE PAGE RULES (MUST FOLLOW EXACTLY):
1. H1 format MUST be: "[State Name] Escorts – [Engaging Tagline Related to Discovery/Connections Statewide]"
2. Paragraphs must be SHORT (2-4 sentences maximum)
3. The last section MUST be formatted as bullet points (not paragraph text)
4. Each paragraph must not mention "escort" or "escorts" more than TWICE
5. Include at least THREE distinct call-to-actions in the content

EXAMPLE STATE PAGE FORMAT:
Meta Title: Florida Escorts - Find Companions Statewide

Meta Description: Browse Florida Independent Escorts on SKLUVA. Discover verified listings and genuine connections across the Sunshine State.

H1: Florida Escorts – Discover Genuine Connections Statewide

Content:
<h1>Florida Escorts – Discover Genuine Connections Statewide</h1>
<p>Florida offers an exciting blend of beaches, nightlife, and cultural attractions. Whether you're visiting Miami's vibrant scene or relaxing in Key West, finding companionship enhances the experience. Browse verified listings to discover your perfect match.</p>
<h2>Finding Companions in Florida</h2>
<p>SKLUVA's platform connects you with independent escorts throughout Florida. Our user-friendly interface makes it simple to view profiles and find companions who match your preferences. Explore listings today to make your Florida experience memorable.</p>
<h2>Popular Florida Destinations</h2>
<p>From Orlando's entertainment districts to Tampa's scenic waterfront, Florida offers diverse destinations for every taste. Connect with companions familiar with local hotspots who can enhance your visit. View profiles now to find someone who shares your interests.</p>
<h2>Your Florida Experience</h2>
<p>Making meaningful connections in Florida becomes effortless with SKLUVA's classifieds. The platform features detailed profiles to help you find exactly what you're looking for. Discover connections and create unforgettable memories across the Sunshine State.</p>
<h2>Why Choose SKLUVA in Florida</h2>
<ul>
<li>Browse comprehensive listings covering all major Florida cities</li>
<li>Connect directly with independent companions</li>
<li>Find matches based on specific preferences and interests</li>
<li>Discover local experiences enhanced by knowledgeable companions</li>
</ul>

I. COMMAND STRUCTURE (How to Request Content):

For State Pages: Use the command: Generate a State page for [State Name]Example: Generate a State page for Texas

For City Pages: Use the command: Generate a City page for [City Name], [State Name]Example: Generate a City page for Miami, Florida

II. UNIVERSAL OUTPUT REQUIREMENTS (Applicable to ALL Pages):

A. Meta Title:

Maximum Length: 50 characters.

Content (State Page): Must include [State Name] Escorts.

Content (City Page): Must include [City Name] Escorts.

Keyword Usage: Use the primary keyword (e.g., "Texas Escorts" or "Miami Escorts") only ONCE.

Style: Keep it concise and highly relevant to the page's geographical focus.

B. Meta Description:

Maximum Length: 140 characters.

Content (State Page): Must include [State Name] Independent Escorts.

Content (City Page): Must include [City Name] Independent Escorts.

Keyword Usage: Use the primary keyword (e.g., "Texas Independent Escorts" or "Miami Independent Escorts") only ONCE.

Style: Engaging and informative, encouraging clicks.

C. SEO Body Content:

Minimum Word Count: 200+ words.

H1 Heading:Structure (State Page): [State Name] Escorts – [Engaging Tagline Related to Discovery/Connections Statewide]Example: Nevada Escorts – Discover Companionship Statewide

Structure (City Page): [City Name] Escorts – [Engaging Tagline Related to City-Specific Connections/Experiences]Example: Atlanta Escorts – Experience the City's Finest Connections

Exact Phrase Requirement: Must include the exact phrase [State Name] Escorts or [City Name] Escorts.

Formatting & Structure:Subheadings: Use H2 or H3 headings to create a clear and logical structure.

Paragraphs: Keep paragraphs short (2-6 sentences) for better readability). Each paragraph must not exceed four lines of text.

Voice: Use active voice consistently.

Readability: Format for optimal mobile readability (e.g., good spacing, concise sentences).

Bold Text: Use bold text only for H1, H2, and H3 headings. Do not use bold text within paragraphs.

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

CRITICAL: The very last section of the generated output, which would typically be the final paragraph, MUST be formatted as a list of bullet points. It must NOT be a continuous paragraph. These bullet points should summarize key benefits or next steps for the user.`;

    try {
      console.log("Attempting to use Groq API...");
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: command },
        ],
        model: 'llama3-70b-8192',
        temperature: 0.3, // Reduced from 0.5 for exact adherence to formatting
        max_tokens: 1500, // Increased to ensure enough content
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