const fs = require('fs');
let content = fs.readFileSync('src/app/candidates/page.tsx', 'utf8');

content = content.replace(
`  TableProperties,
  Trash2,
  Sparkles,
} from 'lucide-react';`,
`  TableProperties,
  Trash2,
  Sparkles,
  Phone,
  MessageSquare,
} from 'lucide-react';`
);

content = content.replace(
`                      <Link
                        href={\`/outreach?candidate=\${candidate.id}\`}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Link>`,
`                      <Link
                        href={\`/outreach?candidate=\${candidate.id}\`}
                        className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                        title="Send email"
                      >
                        <Mail className="w-3.5 h-3.5" strokeWidth={1.75} />
                      </Link>
                      {candidate.phone && candidate.phone !== 'N/A' && (
                        <>
                          <a
                            href={\`tel:\${candidate.phone}\`}
                            className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                            title="Call Candidate"
                          >
                            <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </a>
                          <a
                            href={\`sms:\${candidate.phone}\`}
                            className="p-1.5 rounded-md text-text-tertiary hover:text-accent hover:bg-accent-soft transition-all"
                            title="SMS Candidate"
                          >
                            <MessageSquare className="w-3.5 h-3.5" strokeWidth={1.75} />
                          </a>
                        </>
                      )}`
);

fs.writeFileSync('src/app/candidates/page.tsx', content);
console.log('Fixed file safely.');
