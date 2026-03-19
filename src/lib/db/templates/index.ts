export interface TemplateQuestion {
  prompt: string
  type: 'text' | 'select' | 'multiselect' | 'date' | 'scale'
  options?: string[]
  sortOrder: number
  aiFollowUp: {
    enabled: boolean
    maxFollowUps: number
    systemPrompt?: string
  }
}

export interface Template {
  slug: string
  title: string
  description: string
  profession: string
  questions: TemplateQuestion[]
}

export const TEMPLATES: Template[] = [
  // 1. Therapist Initial Intake
  {
    slug: 'therapist-intake',
    title: 'Therapist Initial Intake',
    description: 'A comprehensive intake form for new therapy clients covering presenting concerns, history, and goals.',
    profession: 'Therapist',
    questions: [
      {
        prompt: 'What brings you to therapy at this time?',
        type: 'text',
        sortOrder: 1,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Gently explore the client\'s presenting concern. Ask about duration, severity, or impact on daily life.' },
      },
      {
        prompt: 'Have you previously been in therapy?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 2,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask what was helpful or unhelpful about their previous experience.' },
      },
      {
        prompt: 'How would you describe your current mood on most days?',
        type: 'text',
        sortOrder: 3,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Explore patterns in their mood — when it\'s better or worse, what triggers changes.' },
      },
      {
        prompt: 'Are you currently taking any medications?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 4,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask which medications and whether they are prescribed by a psychiatrist or primary care provider.' },
      },
      {
        prompt: 'On a scale of 1-10, how would you rate your current stress level?',
        type: 'scale',
        sortOrder: 5,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask what the main sources of stress are and how they cope.' },
      },
      {
        prompt: 'Which areas of your life are most affected by your current concerns?',
        type: 'multiselect',
        options: ['Work/Career', 'Relationships', 'Family', 'Health', 'Finances', 'Self-esteem', 'Sleep', 'Social life'],
        sortOrder: 6,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask the client to briefly describe the impact on the areas they selected.' },
      },
      {
        prompt: 'Do you have any history of trauma or significant life events you feel are relevant?',
        type: 'text',
        sortOrder: 7,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Be sensitive. Only follow up if the client seems willing to share more. Ask how it affects them today.' },
      },
      {
        prompt: 'How would you describe your sleep quality?',
        type: 'select',
        options: ['Excellent', 'Good', 'Fair', 'Poor', 'Very poor'],
        sortOrder: 8,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If poor or very poor, ask about patterns — trouble falling asleep, staying asleep, or waking early.' },
      },
      {
        prompt: 'What does a successful outcome from therapy look like for you?',
        type: 'text',
        sortOrder: 9,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Help the client articulate concrete goals. Ask what would be different in their daily life.' },
      },
      {
        prompt: 'Do you have a support system (family, friends, community)?',
        type: 'select',
        options: ['Strong support system', 'Some support', 'Limited support', 'No support'],
        sortOrder: 10,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask who they feel most comfortable turning to and whether those relationships feel supportive.' },
      },
      {
        prompt: 'Are there any cultural, spiritual, or religious considerations you would like your therapist to be aware of?',
        type: 'text',
        sortOrder: 11,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'What is your preferred appointment availability?',
        type: 'multiselect',
        options: ['Weekday mornings', 'Weekday afternoons', 'Weekday evenings', 'Saturday', 'Sunday'],
        sortOrder: 12,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
    ],
  },

  // 2. Business Coach Discovery
  {
    slug: 'business-coach-discovery',
    title: 'Business Coach Discovery',
    description: 'A discovery questionnaire to understand a client\'s business, challenges, and coaching goals.',
    profession: 'Business Coach',
    questions: [
      {
        prompt: 'What is your current role and business?',
        type: 'text',
        sortOrder: 1,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Ask about the size of their team, how long they\'ve been in this role, and what stage the business is at.' },
      },
      {
        prompt: 'What are the top 3 challenges you are facing right now?',
        type: 'text',
        sortOrder: 2,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Dig deeper into the most pressing challenge. Ask what they have already tried.' },
      },
      {
        prompt: 'What does success look like for you in the next 6 months?',
        type: 'text',
        sortOrder: 3,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Help them quantify success — revenue targets, team milestones, or personal benchmarks.' },
      },
      {
        prompt: 'How would you describe your leadership style?',
        type: 'select',
        options: ['Visionary', 'Collaborative', 'Directive', 'Coaching-oriented', 'Hands-off', 'Not sure'],
        sortOrder: 4,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask how their team responds to their style and whether they\'d like to evolve it.' },
      },
      {
        prompt: 'What is your current annual revenue range?',
        type: 'select',
        options: ['Pre-revenue', 'Under $100K', '$100K–$500K', '$500K–$1M', '$1M–$5M', '$5M+'],
        sortOrder: 5,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Have you worked with a business coach before?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 6,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask what worked well and what they wish had been different.' },
      },
      {
        prompt: 'On a scale of 1-10, how satisfied are you with your work-life balance?',
        type: 'scale',
        sortOrder: 7,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask what a better balance would look like and what\'s the biggest barrier.' },
      },
      {
        prompt: 'Which areas would you most like coaching support in?',
        type: 'multiselect',
        options: ['Strategy & Vision', 'Team & Hiring', 'Sales & Marketing', 'Operations', 'Finance', 'Leadership Development', 'Work-life Balance', 'Accountability'],
        sortOrder: 8,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask them to prioritize the top one or two and why those are most urgent.' },
      },
      {
        prompt: 'What is your preferred coaching cadence?',
        type: 'select',
        options: ['Weekly', 'Bi-weekly', 'Monthly', 'Not sure yet'],
        sortOrder: 9,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Is there anything else you would like your coach to know before your first session?',
        type: 'text',
        sortOrder: 10,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Acknowledge what they shared and ask if there are any concerns about the coaching process itself.' },
      },
    ],
  },

  // 3. Freelance Consultant Scope
  {
    slug: 'freelance-consultant-scope',
    title: 'Freelance Consultant Project Scope',
    description: 'A scoping questionnaire to define project requirements, timelines, and budget for consulting engagements.',
    profession: 'Consultant',
    questions: [
      {
        prompt: 'Please describe your project or challenge in a few sentences.',
        type: 'text',
        sortOrder: 1,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Ask about the business context — why this project matters now and what prompted it.' },
      },
      {
        prompt: 'What industry is your business in?',
        type: 'select',
        options: ['Technology', 'Healthcare', 'Finance', 'Education', 'Retail/E-commerce', 'Manufacturing', 'Professional Services', 'Non-profit', 'Other'],
        sortOrder: 2,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'What is your budget range for this engagement?',
        type: 'select',
        options: ['Under $5,000', '$5,000–$15,000', '$15,000–$50,000', '$50,000–$100,000', '$100,000+', 'Not yet determined'],
        sortOrder: 3,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If not determined, ask about any constraints or approval processes that might affect budget.' },
      },
      {
        prompt: 'What is your ideal timeline for completion?',
        type: 'select',
        options: ['Less than 1 month', '1–3 months', '3–6 months', '6–12 months', 'Ongoing/retainer'],
        sortOrder: 4,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask if there is a hard deadline or external event driving the timeline.' },
      },
      {
        prompt: 'What does a successful outcome look like for this project?',
        type: 'text',
        sortOrder: 5,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Ask about measurable success criteria and how they will evaluate the work.' },
      },
      {
        prompt: 'Who are the key stakeholders or decision-makers involved?',
        type: 'text',
        sortOrder: 6,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask about the decision-making process and who has final approval.' },
      },
      {
        prompt: 'Have you worked with an external consultant on a similar project before?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 7,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask what worked well and what could be improved in terms of collaboration.' },
      },
      {
        prompt: 'What deliverables do you expect from this engagement?',
        type: 'multiselect',
        options: ['Strategy document', 'Implementation plan', 'Hands-on execution', 'Training/workshops', 'Audit/assessment', 'Ongoing advisory', 'Other'],
        sortOrder: 8,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask about preferred formats and how they plan to use the deliverables.' },
      },
      {
        prompt: 'How would you prefer to communicate during the engagement?',
        type: 'select',
        options: ['Email', 'Video calls', 'Slack/Teams', 'Phone', 'In-person meetings', 'Mix of methods'],
        sortOrder: 9,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Is there anything else relevant to this project that we should know?',
        type: 'text',
        sortOrder: 10,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Acknowledge their input and ask if there are any risks or concerns they foresee.' },
      },
    ],
  },

  // 4. Financial Advisor First Meeting
  {
    slug: 'financial-advisor-intake',
    title: 'Financial Advisor First Meeting',
    description: 'An intake form for new financial planning clients to capture goals, assets, risk tolerance, and planning needs.',
    profession: 'Financial Advisor',
    questions: [
      {
        prompt: 'What are your primary financial goals?',
        type: 'multiselect',
        options: ['Retirement planning', 'Education funding', 'Home purchase', 'Debt reduction', 'Wealth building', 'Estate planning', 'Tax optimization', 'Business exit planning'],
        sortOrder: 1,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Ask them to prioritize their top goal and what timeframe they have in mind.' },
      },
      {
        prompt: 'What is your approximate annual household income?',
        type: 'select',
        options: ['Under $50,000', '$50,000–$100,000', '$100,000–$200,000', '$200,000–$500,000', '$500,000+', 'Prefer not to say'],
        sortOrder: 2,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'What is your current employment status?',
        type: 'select',
        options: ['Employed full-time', 'Self-employed', 'Part-time', 'Retired', 'Not currently employed'],
        sortOrder: 3,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'How would you describe your risk tolerance for investments?',
        type: 'select',
        options: ['Conservative — preserve capital above all', 'Moderately conservative', 'Moderate — balanced growth and safety', 'Moderately aggressive', 'Aggressive — maximize growth, accept volatility'],
        sortOrder: 4,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask how they have reacted emotionally to past market downturns or large financial losses.' },
      },
      {
        prompt: 'Do you currently work with any other financial professionals (CPA, attorney, etc.)?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 5,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask which professionals and whether they are open to coordinated planning.' },
      },
      {
        prompt: 'What is your approximate total investable assets (excluding primary residence)?',
        type: 'select',
        options: ['Under $50,000', '$50,000–$250,000', '$250,000–$500,000', '$500,000–$1M', '$1M–$5M', '$5M+', 'Prefer not to say'],
        sortOrder: 6,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Do you have any outstanding debts you would like help managing?',
        type: 'text',
        sortOrder: 7,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask about the types of debt (mortgage, student loans, credit cards) and approximate balances.' },
      },
      {
        prompt: 'What is your target retirement age?',
        type: 'select',
        options: ['Before 50', '50–55', '55–60', '60–65', '65–70', 'After 70', 'Already retired', 'Not sure'],
        sortOrder: 8,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Do you have a current estate plan (will, trust, power of attorney)?',
        type: 'select',
        options: ['Yes, fully up to date', 'Partially — needs updating', 'No estate plan', 'Not sure'],
        sortOrder: 9,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask when it was last reviewed and whether there have been major life changes since.' },
      },
      {
        prompt: 'On a scale of 1-10, how confident do you feel about your current financial situation?',
        type: 'scale',
        sortOrder: 10,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask what would need to change for them to feel more confident.' },
      },
      {
        prompt: 'Is there anything specific you would like to discuss in our first meeting?',
        type: 'text',
        sortOrder: 11,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Acknowledge their priorities and ask if there are any urgent financial decisions they are facing.' },
      },
    ],
  },

  // 5. Attorney Client Intake
  {
    slug: 'attorney-client-intake',
    title: 'Attorney Client Intake',
    description: 'A client intake form for law firms to capture case type, legal situation, and client information before the initial consultation.',
    profession: 'Attorney',
    questions: [
      {
        prompt: 'What type of legal matter do you need help with?',
        type: 'select',
        options: ['Family Law', 'Business/Corporate', 'Estate Planning', 'Real Estate', 'Employment', 'Criminal Defense', 'Personal Injury', 'Immigration', 'Intellectual Property', 'Other'],
        sortOrder: 1,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask for a brief description of the specific issue within this area of law.' },
      },
      {
        prompt: 'Please describe your legal situation briefly.',
        type: 'text',
        sortOrder: 2,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Ask about the timeline of events and what outcome they are hoping for.' },
      },
      {
        prompt: 'How urgent is this matter?',
        type: 'select',
        options: ['Immediate — deadline or court date within 2 weeks', 'Urgent — within 1 month', 'Moderate — within 3 months', 'Planning ahead — no immediate deadline'],
        sortOrder: 3,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If urgent, ask about specific dates or deadlines they are facing.' },
      },
      {
        prompt: 'Have you previously consulted with or retained an attorney for this matter?',
        type: 'select',
        options: ['Yes', 'No'],
        sortOrder: 4,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask why they are seeking new representation and whether there are any pending actions.' },
      },
      {
        prompt: 'Is there an opposing party involved in this matter?',
        type: 'select',
        options: ['Yes', 'No', 'Not applicable'],
        sortOrder: 5,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'If yes, ask for the name of the opposing party so conflicts can be checked.' },
      },
      {
        prompt: 'Are there any pending court dates or legal deadlines you are aware of?',
        type: 'date',
        sortOrder: 6,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'What outcome are you hoping to achieve?',
        type: 'text',
        sortOrder: 7,
        aiFollowUp: { enabled: true, maxFollowUps: 2, systemPrompt: 'Explore whether their expectations are about resolution, protection, compensation, or prevention. Ask about priorities.' },
      },
      {
        prompt: 'Do you have any relevant documents (contracts, correspondence, court filings)?',
        type: 'select',
        options: ['Yes, I can provide them', 'Some documents', 'No documents', 'Not sure what is relevant'],
        sortOrder: 8,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask them to briefly describe what documents they have available.' },
      },
      {
        prompt: 'How did you hear about our firm?',
        type: 'select',
        options: ['Online search', 'Referral from friend/family', 'Referral from another attorney', 'Social media', 'Directory listing', 'Other'],
        sortOrder: 9,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'Which services are you interested in?',
        type: 'multiselect',
        options: ['Legal consultation', 'Document review', 'Representation in court', 'Negotiation/mediation', 'Contract drafting', 'Ongoing legal counsel'],
        sortOrder: 10,
        aiFollowUp: { enabled: false, maxFollowUps: 1 },
      },
      {
        prompt: 'On a scale of 1-10, how well do you feel you understand your legal options right now?',
        type: 'scale',
        sortOrder: 11,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Ask what specific questions or uncertainties they would most like clarified during the consultation.' },
      },
      {
        prompt: 'Is there anything else you would like us to know before the consultation?',
        type: 'text',
        sortOrder: 12,
        aiFollowUp: { enabled: true, maxFollowUps: 1, systemPrompt: 'Acknowledge their input and ask if there are any specific concerns about the legal process or fees.' },
      },
    ],
  },
]
