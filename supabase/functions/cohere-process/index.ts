import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface RequestBody {
  query: string;
  max_tokens?: number;
  temperature?: number;
}

interface CohereResponse {
  generations: Array<{
    text: string;
  }>;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Method not allowed. Use POST.'
        }),
        {
          status: 405,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Invalid JSON in request body'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate required parameters
    if (!body.query || typeof body.query !== 'string' || body.query.trim().length === 0) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Missing or invalid required parameter: query'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Set default values and validate optional parameters
    const maxTokens = body.max_tokens || 100;
    const temperature = body.temperature || 0.7;

    if (typeof maxTokens !== 'number' || maxTokens < 1 || maxTokens > 2048) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'max_tokens must be a number between 1 and 2048'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (typeof temperature !== 'number' || temperature < 0 || temperature > 2) {
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'temperature must be a number between 0 and 2'
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Log request for monitoring
    console.log(`Processing request: query length=${body.query.length}, max_tokens=${maxTokens}, temperature=${temperature}`);

    // Prepare Cohere API request
    const cohereApiKey = 'OQg8ckowsFnKYWQvNwZWroRiOwSS9eGWSy5fUESr';
    const cohereUrl = 'https://api.cohere.ai/v1/generate';

    const coherePayload = {
      model: 'command',
      prompt: body.query,
      max_tokens: maxTokens,
      temperature: temperature,
      k: 0,
      stop_sequences: [],
      return_likelihoods: 'NONE'
    };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      // Make request to Cohere API
      const cohereResponse = await fetch(cohereUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cohereApiKey}`,
          'Content-Type': 'application/json',
          'Cohere-Version': '2022-12-06'
        },
        body: JSON.stringify(coherePayload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // Handle API key errors
      if (cohereResponse.status === 401) {
        console.error('Cohere API authentication failed');
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'API authentication failed'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Handle rate limiting
      if (cohereResponse.status === 429) {
        console.error('Cohere API rate limit exceeded');
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'API rate limit exceeded. Please try again later.'
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Handle other API errors
      if (!cohereResponse.ok) {
        const errorText = await cohereResponse.text();
        console.error(`Cohere API error: ${cohereResponse.status} - ${errorText}`);
        return new Response(
          JSON.stringify({
            status: 'error',
            error: `API request failed with status ${cohereResponse.status}`
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Parse successful response
      const cohereData: CohereResponse = await cohereResponse.json();
      
      // Validate response structure
      if (!cohereData.generations || !Array.isArray(cohereData.generations) || cohereData.generations.length === 0) {
        console.error('Invalid response structure from Cohere API');
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'Invalid response from AI service'
          }),
          {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      const generatedText = cohereData.generations[0].text.trim();
      
      // Log successful processing
      console.log(`Successfully processed request: response length=${generatedText.length}`);

      // Return successful response
      return new Response(
        JSON.stringify({
          status: 'success',
          data: {
            text: generatedText,
            query: body.query,
            parameters: {
              max_tokens: maxTokens,
              temperature: temperature
            }
          }
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        console.error('Request timeout after 30 seconds');
        return new Response(
          JSON.stringify({
            status: 'error',
            error: 'Request timeout. Please try again.'
          }),
          {
            status: 408,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Handle network errors
      console.error('Network error:', error);
      return new Response(
        JSON.stringify({
          status: 'error',
          error: 'Network error. Please check your connection and try again.'
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    // Handle unexpected errors
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({
        status: 'error',
        error: 'An unexpected error occurred. Please try again.'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})