export const eveTools = [
  {
    name: 'send_email',
    description: 'Send an email to a candidate or client on behalf of the recruiter.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'The recipient email address' },
        subject: { type: 'string', description: 'The subject of the email' },
        body: { type: 'string', description: 'The HTML body of the email. Use proper paragraph tags.' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
  {
    name: 'read_recent_emails',
    description: 'Read the recent emails from the recruiter inbox to check for replies from candidates or clients.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Optional search query, e.g., an email address or subject' },
      },
      required: [],
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event (e.g., an interview) in the recruiter calendar.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Title of the event' },
        start_time: { type: 'string', description: 'ISO 8601 formatted start time (e.g., 2024-10-15T14:00:00Z)' },
        end_time: { type: 'string', description: 'ISO 8601 formatted end time' },
        attendee_email: { type: 'string', description: 'The email of the candidate or client' },
      },
      required: ['title', 'start_time', 'end_time', 'attendee_email'],
    },
  },
];
