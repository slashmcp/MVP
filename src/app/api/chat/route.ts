import Anthropic from '@anthropic-ai/sdk';
import { NextRequest } from 'next/server';
import { eveTools } from '@/lib/agent-tools/schemas';
import { sendEmail } from '@/lib/outlook';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Eve, an AI assistant integrated into Ion Recruitment's CRM system. 
You help recruiters manage candidates, clients, jobs, and placements efficiently.
You can answer questions about recruitment processes, help draft outreach messages, analyse candidate profiles, 
suggest matches between candidates and jobs, and provide insights about the recruitment pipeline.

You now have Agentic Tools! You can:
1. Send emails to candidates and clients using the 'send_email' tool. Always confirm with the user before actually sending, unless they explicitly asked you to send it immediately.
2. Schedule calendar events.
3. Check emails.

If you don't have the user's email address or the exact time, ask them for it before calling the tool.
Be concise, professional, and helpful. Format your responses clearly.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    // Ensure messages format is strictly acceptable for Anthropic
    const anthropicMessages = messages.map((m: any) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    // Start the stream with tools
    const stream = await anthropic.messages.stream({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: anthropicMessages,
      tools: eveTools as any,
    });

    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        let toolCallAccumulator: any = null;

        for await (const chunk of stream) {
          if (
            chunk.type === 'content_block_delta' &&
            chunk.delta.type === 'text_delta'
          ) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
            );
          } else if (chunk.type === 'content_block_start' && chunk.content_block.type === 'tool_use') {
             toolCallAccumulator = { ...chunk.content_block, input: '' };
          } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'input_json_delta') {
             if (toolCallAccumulator) {
                 toolCallAccumulator.input += chunk.delta.partial_json;
             }
          }
        }
        
        // Final message block completed
        const finalMessage = await stream.finalMessage();
        
        // If a tool was called, execute it in the background
        const toolCalls = finalMessage.content.filter((c: any) => c.type === 'tool_use');
        if (toolCalls.length > 0) {
          for (const tool of toolCalls as any[]) {
            if (tool.name === 'send_email') {
              try {
                const result = await sendEmail(tool.input);
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: `\n\n*(System: I've successfully sent the email to ${tool.input.to})*` })}\n\n`)
                );
              } catch (e) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: `\n\n*(System Error: Failed to send email to ${tool.input.to})*` })}\n\n`)
                );
              }
            } else if (tool.name === 'read_recent_emails') {
               controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: `\n\n*(System: Inbox reading is still in beta, I'll have full access soon!)*` })}\n\n`)
                );
            } else if (tool.name === 'create_calendar_event') {
               controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text: `\n\n*(System: Calendar booking is still in beta, I'll have full access soon!)*` })}\n\n`)
                );
            }
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
