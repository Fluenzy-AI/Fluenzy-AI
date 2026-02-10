import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  BookA,
  GraduationCap,
  Trophy,
  Users,
  Lightbulb,
  Target,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  AlertTriangle,
  Star,
  Bookmark,
  FileText,
  Clock,
  Zap,
  Shield,
  MessageCircle,
  Scale,
  Eye,
  HandshakeIcon,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  ThumbsUp,
  ChevronRight,
  Headphones
} from 'lucide-react';
import { UserProfile, ProficiencyLevel } from '../types';

// Types
interface VocabularyWord {
  word: string;
  meaning: string;
  context: string;
  example: string;
  wrongUsage?: string;
  betterAlternative?: string;
  tone?: string;
  beforeSentence?: string;
  afterSentence?: string;
  impressesWhen?: string;
  gdExample?: string;
}

interface VocabularyCategory {
  title: string;
  words: VocabularyWord[];
}

interface ReplacementPair {
  weak: string;
  strong: string;
  context?: string;
}

interface GDPhrase {
  phrase: string;
  whenToUse: string;
  example: string;
}

interface PowerPhrase {
  phrase: string;
  type: 'opening' | 'thinking' | 'closing';
  usage: string;
}

// Voice Practice Types
interface VoicePracticeItem {
  word: string;
  meaning: string;
  exampleSentence: string;
  miniTask: string;
}

interface VoicePracticeChapter {
  id: string;
  title: string;
  level: ProficiencyLevel;
  items: VoicePracticeItem[];
}

type VoicePracticeStep = 'select' | 'listen' | 'repeat' | 'sentence' | 'practice' | 'feedback' | 'complete';

// Voice Practice Data
const voicePracticeChapters: VoicePracticeChapter[] = [
  // Beginner Chapters
  {
    id: 'self-intro-beginner',
    title: 'Self-Introduction Words',
    level: ProficiencyLevel.BEGINNER,
    items: [
      { word: 'Background', meaning: 'Your education, work, and experience history', exampleSentence: 'Let me share my professional background with you.', miniTask: 'Introduce yourself using the word background.' },
      { word: 'Pursuing', meaning: 'Currently doing or working towards something', exampleSentence: 'I am currently pursuing my MBA in Finance.', miniTask: 'Tell about your current studies or work using pursuing.' },
      { word: 'Aspiring', meaning: 'Hoping to become or achieve something', exampleSentence: 'I am an aspiring data analyst.', miniTask: 'Describe your career goal using aspiring.' },
      { word: 'Dedicated', meaning: 'Fully committed to something', exampleSentence: 'I am dedicated to continuous learning.', miniTask: 'Share one thing you are dedicated to.' },
      { word: 'Enthusiastic', meaning: 'Very excited and interested', exampleSentence: 'I am enthusiastic about this opportunity.', miniTask: 'Express excitement about something using enthusiastic.' }
    ]
  },
  {
    id: 'strengths-beginner',
    title: 'Strengths & Skills Words',
    level: ProficiencyLevel.BEGINNER,
    items: [
      { word: 'Adaptable', meaning: 'Able to adjust to new situations easily', exampleSentence: 'I am highly adaptable to changing work environments.', miniTask: 'Describe a time you adapted to change.' },
      { word: 'Proactive', meaning: 'Taking action before being asked', exampleSentence: 'I take a proactive approach to problem-solving.', miniTask: 'Give an example of being proactive.' },
      { word: 'Detail-oriented', meaning: 'Paying attention to small things', exampleSentence: 'I am detail-oriented when reviewing documents.', miniTask: 'Explain how you are detail-oriented.' },
      { word: 'Collaborative', meaning: 'Working well with others', exampleSentence: 'I have a collaborative working style.', miniTask: 'Describe your teamwork approach using collaborative.' },
      { word: 'Resourceful', meaning: 'Finding clever ways to solve problems', exampleSentence: 'I am resourceful when facing challenges.', miniTask: 'Share how you solved a problem creatively.' }
    ]
  },
  {
    id: 'agreement-beginner',
    title: 'Agreement & Disagreement',
    level: ProficiencyLevel.BEGINNER,
    items: [
      { word: 'Absolutely', meaning: 'Completely, totally yes', exampleSentence: 'Absolutely, I agree with this approach.', miniTask: 'Use absolutely to agree with a statement.' },
      { word: 'Indeed', meaning: 'Yes, truly, in fact', exampleSentence: 'Indeed, that is a valid point.', miniTask: 'Respond to a point using indeed.' },
      { word: 'Partially', meaning: 'Agreeing with some parts only', exampleSentence: 'I partially agree with your perspective.', miniTask: 'Express partial agreement with an idea.' },
      { word: 'Respectfully', meaning: 'Politely, showing honor', exampleSentence: 'Respectfully, I have a different view on this.', miniTask: 'Politely disagree using respectfully.' },
      { word: 'However', meaning: 'But, on the other hand', exampleSentence: 'However, we should also consider the risks.', miniTask: 'Add a contrasting point using however.' }
    ]
  },
  {
    id: 'confidence-beginner',
    title: 'Confidence-Building Phrases',
    level: ProficiencyLevel.BEGINNER,
    items: [
      { word: 'Confident', meaning: 'Feeling sure about yourself', exampleSentence: 'I am confident in my ability to deliver results.', miniTask: 'Express confidence about a skill you have.' },
      { word: 'Certain', meaning: 'Having no doubt', exampleSentence: 'I am certain I can contribute to your team.', miniTask: 'Make a certain statement about your abilities.' },
      { word: 'Believe', meaning: 'To have faith or trust in something', exampleSentence: 'I believe in continuous improvement.', miniTask: 'Share something you strongly believe in.' },
      { word: 'Assured', meaning: 'Feeling confident and certain', exampleSentence: 'Please be assured of my commitment.', miniTask: 'Assure the interviewer of your dedication.' },
      { word: 'Committed', meaning: 'Dedicated and loyal to something', exampleSentence: 'I am fully committed to this role.', miniTask: 'Express your commitment to a goal.' }
    ]
  },
  // Intermediate Chapters
  {
    id: 'impactful-intermediate',
    title: 'Impactful Professional Words',
    level: ProficiencyLevel.INTERMEDIATE,
    items: [
      { word: 'Spearheaded', meaning: 'Led or started something important', exampleSentence: 'I spearheaded the digital transformation initiative.', miniTask: 'Describe a project you led using spearheaded.' },
      { word: 'Streamlined', meaning: 'Made a process simpler and more efficient', exampleSentence: 'I streamlined the onboarding process, reducing time by 40%.', miniTask: 'Explain how you improved a process using streamlined.' },
      { word: 'Orchestrated', meaning: 'Organized and coordinated something complex', exampleSentence: 'I orchestrated cross-functional team collaboration.', miniTask: 'Describe coordination work using orchestrated.' },
      { word: 'Implemented', meaning: 'Put into action or practice', exampleSentence: 'I implemented a new CRM system across departments.', miniTask: 'Talk about something you implemented.' },
      { word: 'Facilitated', meaning: 'Made something easier or helped it happen', exampleSentence: 'I facilitated communication between remote teams.', miniTask: 'Describe how you helped a team using facilitated.' }
    ]
  },
  {
    id: 'disagreement-intermediate',
    title: 'Polite Disagreement Phrases',
    level: ProficiencyLevel.INTERMEDIATE,
    items: [
      { word: 'With due respect', meaning: 'Politely showing you respect the person while disagreeing', exampleSentence: 'With due respect, I see this differently.', miniTask: 'Disagree with an idea respectfully.' },
      { word: 'I appreciate your point, however', meaning: 'Acknowledging their view before sharing yours', exampleSentence: 'I appreciate your point, however, the data suggests otherwise.', miniTask: 'Acknowledge and counter an argument.' },
      { word: 'From my perspective', meaning: 'Sharing your viewpoint without dismissing others', exampleSentence: 'From my perspective, the timeline is achievable.', miniTask: 'Share your view on a topic.' },
      { word: 'Let me offer an alternative view', meaning: 'Suggesting a different way of thinking', exampleSentence: 'Let me offer an alternative view on this matter.', miniTask: 'Present an alternative viewpoint.' },
      { word: 'That is a valid concern, but', meaning: 'Accepting their worry while offering counter-view', exampleSentence: 'That is a valid concern, but we have mitigation strategies.', miniTask: 'Address a concern with a solution.' }
    ]
  },
  {
    id: 'hr-answers-intermediate',
    title: 'HR Answer Vocabulary',
    level: ProficiencyLevel.INTERMEDIATE,
    items: [
      { word: 'Prioritize', meaning: 'Decide what is most important', exampleSentence: 'I prioritize tasks based on urgency and impact.', miniTask: 'Explain how you manage multiple tasks.' },
      { word: 'Leverage', meaning: 'Use something to maximum advantage', exampleSentence: 'I leverage my technical skills to solve business problems.', miniTask: 'Describe using a skill to your advantage.' },
      { word: 'Navigate', meaning: 'Find your way through difficulty', exampleSentence: 'I successfully navigated complex stakeholder dynamics.', miniTask: 'Talk about overcoming a challenge.' },
      { word: 'Optimize', meaning: 'Make the best use of something', exampleSentence: 'I continuously optimize my workflow for productivity.', miniTask: 'Explain how you improve efficiency.' },
      { word: 'Demonstrate', meaning: 'Show clearly through actions', exampleSentence: 'I can demonstrate my leadership through past projects.', miniTask: 'Offer to demonstrate a skill.' }
    ]
  },
  // Advanced Chapters
  {
    id: 'leadership-advanced',
    title: 'Leadership & Decision-Making',
    level: ProficiencyLevel.ADVANCED,
    items: [
      { word: 'Cultivate', meaning: 'Develop or nurture over time', exampleSentence: 'I cultivate a culture of innovation within my team.', miniTask: 'Describe how you build team culture.' },
      { word: 'Pioneer', meaning: 'Be the first to do something new', exampleSentence: 'I pioneered the adoption of agile methodology in my department.', miniTask: 'Share an initiative you started first.' },
      { word: 'Envision', meaning: 'Imagine future possibilities', exampleSentence: 'I envision a workflow that reduces manual effort by 50%.', miniTask: 'Describe your vision for improvement.' },
      { word: 'Champion', meaning: 'Actively support or advocate for something', exampleSentence: 'I championed the diversity initiative across our organization.', miniTask: 'Talk about a cause you actively support.' },
      { word: 'Transform', meaning: 'Make a major change', exampleSentence: 'I helped transform the customer service approach, improving satisfaction by 35%.', miniTask: 'Describe a transformation you led.' }
    ]
  },
  {
    id: 'strategic-advanced',
    title: 'Strategic & Analytical Words',
    level: ProficiencyLevel.ADVANCED,
    items: [
      { word: 'Scalable', meaning: 'Able to grow or expand efficiently', exampleSentence: 'I designed a scalable process that works across teams.', miniTask: 'Explain a scalable solution you created.' },
      { word: 'Sustainable', meaning: 'Able to continue over time', exampleSentence: 'I built sustainable practices that continue delivering results.', miniTask: 'Describe a long-term approach you developed.' },
      { word: 'Holistic', meaning: 'Considering all aspects together', exampleSentence: 'I take a holistic approach to problem-solving.', miniTask: 'Explain your comprehensive thinking.' },
      { word: 'Pragmatic', meaning: 'Practical and realistic', exampleSentence: 'I offer pragmatic solutions within budget constraints.', miniTask: 'Describe a practical solution you provided.' },
      { word: 'Benchmark', meaning: 'Standard for comparison', exampleSentence: 'I benchmarked our processes against industry leaders.', miniTask: 'Talk about comparing to best practices.' }
    ]
  },
  {
    id: 'gd-templates-practice',
    title: 'GD Template Speaking',
    level: ProficiencyLevel.ADVANCED,
    items: [
      { word: 'Initiator Opening', meaning: 'How to start a GD confidently', exampleSentence: 'Good morning everyone. The topic we have today is important because it affects all of us. In my view, we need to look at both sides.', miniTask: 'Initiate a GD on the topic of remote work.' },
      { word: 'Supporting a Point', meaning: 'How to build on someone else\'s argument', exampleSentence: 'I completely agree with the previous speaker. In fact, I would like to add that this also applies to smaller organizations.', miniTask: 'Support a point about technology in education.' },
      { word: 'Polite Challenge', meaning: 'How to respectfully disagree', exampleSentence: 'I appreciate your perspective, but I would like to offer a different viewpoint. The data suggests that the opposite might be true.', miniTask: 'Challenge an argument about social media.' },
      { word: 'Summarizing', meaning: 'How to conclude a GD', exampleSentence: 'To conclude our discussion, we have covered multiple perspectives. The group agrees that balance is essential, while having different views on implementation.', miniTask: 'Summarize a discussion on work-life balance.' },
      { word: 'Moderating', meaning: 'How to control GD flow', exampleSentence: 'I notice we are moving away from the core topic. Let us refocus on the main question and hear from those who have not spoken yet.', miniTask: 'Moderate a discussion that is going off-track.' }
    ]
  }
];

// Voice Practice Coach Messages
const coachMessages = {
  listen: {
    intro: 'Listen carefully to how this word is pronounced.',
    repeat: 'I will say it twice. Focus on the sound and rhythm.'
  },
  repeat: {
    intro: 'Now it is your turn. Repeat after me.',
    encouragement: 'Take your time. Speak clearly and confidently.'
  },
  sentence: {
    intro: 'Great. Now let us use it in a sentence.',
    task: 'Try to say this complete sentence naturally.'
  },
  practice: {
    intro: 'Excellent progress. Time for a mini practice.',
    task: 'This will help you use the word in real conversation.'
  },
  feedback: {
    great: 'Wonderful. You are speaking with more confidence now.',
    good: 'Good attempt. Let us try to make it even better.',
    encourage: 'Do not worry. Practice makes perfect. Let us try again.',
    tip: 'Remember: Speak slowly, clearly, and with confidence.'
  },
  complete: {
    chapter: 'You have completed this chapter. Great work.',
    session: 'Session complete. You practiced speaking like a pro today.'
  }
};

// GD Template Types
interface GDTemplate {
  level: string;
  duration: string;
  template: string;
}

interface GDRoleTemplate {
  role: string;
  description: string;
  icon: string;
  color: string;
  templates: GDTemplate[];
  commonMistakes: string[];
  goldenFormula: string;
  safeStarterLines?: string[];
}

// GD Templates Data
const gdTemplates: GDRoleTemplate[] = [
  {
    role: 'Initiator',
    description: 'Start the discussion confidently and set the direction for others.',
    icon: 'Zap',
    color: 'emerald',
    templates: [
      {
        level: 'Simple & Safe',
        duration: '1 min',
        template: `Good morning everyone. The topic we have today is [TOPIC]. This is an important subject because it affects [who it affects]. In my view, [your basic opinion]. Let me explain why I feel this way. [One simple reason]. I believe we should discuss both sides of this issue today.`
      },
      {
        level: 'Balanced Opinion',
        duration: '1.5 min',
        template: `Thank you for this opportunity. Today we are discussing [TOPIC]. This is a topic that has multiple perspectives. On one hand, [first perspective with reason]. On the other hand, [second perspective with reason]. Personally, I believe [your balanced view] because [logical reason]. I look forward to hearing different viewpoints from my fellow participants.`
      },
      {
        level: 'Problem to Solution',
        duration: '2 min',
        template: `Good morning to the panel and my fellow participants. The topic before us is [TOPIC]. Let me begin by stating the core problem: [define the problem clearly]. This issue has affected [mention impact on society/economy/people]. The root causes include [cause 1] and [cause 2]. However, I believe there are practical solutions. Firstly, [solution 1]. Secondly, [solution 2]. I invite everyone to share their thoughts on these approaches.`
      },
      {
        level: 'Fact + Opinion Based',
        duration: '1.5 min',
        template: `Good morning everyone. According to recent data, [mention a fact or statistic related to TOPIC]. This clearly shows that [TOPIC] is a significant issue in today's context. Based on this, my opinion is that [your stance]. The reason I believe this is because [logical explanation with example]. I am eager to hear how others interpret this situation.`
      },
      {
        level: 'Youth/Society Focused',
        duration: '1.5 min',
        template: `Good morning to all. As young professionals, the topic [TOPIC] directly impacts our generation. We are living in a time where [current reality]. This means [implication for youth/society]. I strongly feel that [your opinion] because [reason tied to youth/society]. Let us explore how we can address this collectively.`
      }
    ],
    commonMistakes: [
      'Starting with "So..." or "Actually..."',
      'Giving a very long introduction without stating your opinion',
      'Being too aggressive or too passive',
      'Not inviting others to participate',
      'Repeating the topic word by word from the card'
    ],
    goldenFormula: 'Greet → Define Topic → State Your Stand → Give One Reason → Invite Others'
  },
  {
    role: 'Supporter',
    description: 'Support someone\'s point, expand it, and add value to the discussion.',
    icon: 'HandshakeIcon',
    color: 'blue',
    templates: [
      {
        level: 'Agree + Explain',
        duration: '1 min',
        template: `I completely agree with [Name]'s point. What [he/she] mentioned about [their point] is absolutely valid. In fact, I would like to add that [your expansion]. This is why I believe [conclusion].`
      },
      {
        level: 'Strong Support + Example',
        duration: '1.5 min',
        template: `I would like to build on what [Name] just said. The point about [their point] is very relevant. Let me share a real example to support this. [Your example with brief details]. This clearly demonstrates that [Name]'s argument holds strong merit. Therefore, I believe we should consider this perspective seriously.`
      },
      {
        level: 'Support + New Angle',
        duration: '1.5 min',
        template: `[Name] has raised an excellent point about [their point]. I not only agree but would also like to add another dimension. While [Name] focused on [their angle], I believe we should also consider [your new angle]. Both these aspects together strengthen the argument that [combined conclusion].`
      },
      {
        level: 'Data/Trend Based Support',
        duration: '1.5 min',
        template: `Building on [Name]'s argument, I would like to add some supporting evidence. Recent trends show that [mention trend or data]. This validates what [Name] mentioned about [their point]. The data clearly indicates that [logical conclusion]. Therefore, I fully support this line of thinking.`
      },
      {
        level: 'Youth/Society Support',
        duration: '1 min',
        template: `I resonate with what [Name] said. As someone from this generation, I can confirm that [personal or generational validation]. [Name]'s point about [their point] reflects the ground reality. I support this view because [brief reason].`
      }
    ],
    commonMistakes: [
      'Just saying "I agree" without adding value',
      'Repeating the exact same point without expansion',
      'Not giving credit to the original speaker',
      'Supporting without any logic or example',
      'Sounding like you are just filling time'
    ],
    goldenFormula: 'Acknowledge → Agree → Expand with Example → Conclude'
  },
  {
    role: 'Information Provider',
    description: 'Share facts, trends, and neutral explanations to educate the group.',
    icon: 'BookA',
    color: 'cyan',
    templates: [
      {
        level: 'Definition + Overview',
        duration: '1 min',
        template: `Let me provide some context on [TOPIC]. By definition, [TOPIC] means [simple definition]. This concept has gained importance because [reason for relevance]. Understanding this foundation will help us discuss more effectively.`
      },
      {
        level: 'Fact-Based Explanation',
        duration: '1.5 min',
        template: `I would like to share some factual information about [TOPIC]. According to [source or general knowledge], [fact 1]. Additionally, [fact 2]. These facts indicate that [neutral observation]. I believe this information can help us form well-informed opinions.`
      },
      {
        level: 'Past → Present → Future',
        duration: '2 min',
        template: `Let me provide a timeline perspective on [TOPIC]. In the past, [how things were]. Today, the situation has evolved where [current state]. Looking ahead, experts predict that [future trend]. This progression shows us that [neutral conclusion about the evolution].`
      },
      {
        level: 'Cause & Effect',
        duration: '1.5 min',
        template: `To understand [TOPIC] better, let us look at the cause and effect. The primary causes include [cause 1] and [cause 2]. As a result, we observe [effect 1] and [effect 2]. This chain of events explains why [TOPIC] is being discussed so widely today.`
      },
      {
        level: 'Comparison-Based Information',
        duration: '1.5 min',
        template: `Let me offer a comparison to add clarity. When we look at [comparison point A], we see [observation]. However, in [comparison point B], the scenario is [different observation]. This comparison highlights that [neutral insight]. Such information can guide our discussion forward.`
      }
    ],
    commonMistakes: [
      'Making up fake statistics',
      'Being biased while presenting information',
      'Overloading with too many facts',
      'Not connecting information to the topic',
      'Speaking in a boring, monotonous way'
    ],
    goldenFormula: 'Define → Explain → Support with Fact/Trend → Wrap Up Neutrally'
  },
  {
    role: 'Analyzer',
    description: 'Break the topic logically, analyze pros and cons, and evaluate risks.',
    icon: 'Scale',
    color: 'purple',
    templates: [
      {
        level: 'Pros-Cons Analysis',
        duration: '1.5 min',
        template: `Let me analyze [TOPIC] from both sides. On the positive side, we have [pro 1] and [pro 2]. These benefits include [brief explanation]. However, we must also consider the drawbacks: [con 1] and [con 2]. After weighing both sides, I believe [your balanced conclusion].`
      },
      {
        level: 'Cause → Impact → Outcome',
        duration: '2 min',
        template: `Let us break down [TOPIC] systematically. The root cause of this issue is [cause]. This has led to [immediate impact] in the short term. If this continues, the long-term outcome could be [predicted outcome]. Therefore, we need to address [specific area] to change this trajectory.`
      },
      {
        level: 'Short-Term vs Long-Term',
        duration: '1.5 min',
        template: `I would like to analyze [TOPIC] from a time perspective. In the short term, [short-term implications]. However, if we look at the long-term picture, [long-term implications]. This distinction is crucial because [reason]. My recommendation is to focus on [which term and why].`
      },
      {
        level: 'Stakeholder Analysis',
        duration: '2 min',
        template: `Let me examine [TOPIC] from different stakeholder perspectives. For [stakeholder 1 - e.g., students], this means [impact on them]. For [stakeholder 2 - e.g., companies], the implications are [their impact]. And for [stakeholder 3 - e.g., government], [their perspective]. Balancing these viewpoints, I suggest [balanced recommendation].`
      },
      {
        level: 'Problem → Risk → Solution',
        duration: '2 min',
        template: `The problem with [TOPIC] is clear: [state the problem]. If we ignore this, the risks include [risk 1] and [risk 2]. These risks could lead to [worst-case scenario]. However, the solution lies in [proposed solution]. By implementing this, we can [expected positive outcome].`
      }
    ],
    commonMistakes: [
      'Being one-sided in analysis',
      'Making analysis too complex to follow',
      'Not providing a conclusion after analysis',
      'Using analysis to criticize others indirectly',
      'Spending too much time without a clear point'
    ],
    goldenFormula: 'Break Down → Compare/Evaluate → Draw Insight → Conclude'
  },
  {
    role: 'Challenger',
    description: 'Respectfully question ideas and offer alternative perspectives.',
    icon: 'Shield',
    color: 'amber',
    templates: [
      {
        level: 'Polite Disagreement',
        duration: '1 min',
        template: `I appreciate [Name]'s perspective, but I would like to offer a different viewpoint. While [Name] mentioned [their point], I believe we should also consider [your alternative view]. The reason I say this is [brief logical reason].`
      },
      {
        level: 'Assumption Challenge',
        duration: '1.5 min',
        template: `With due respect to [Name], I think there is an assumption in that argument that needs examination. The assumption is [state the assumption]. However, if we look at [counter-evidence or logic], we find that [alternative perspective]. Perhaps we should reconsider this angle.`
      },
      {
        level: 'Logic/Data-Based Challenge',
        duration: '1.5 min',
        template: `I respect [Name]'s opinion, but let me present some contrasting information. According to [source or logic], [counter-fact or argument]. This suggests that [alternative conclusion]. I believe considering this data gives us a more complete picture of [TOPIC].`
      },
      {
        level: 'Risk-Focused Challenge',
        duration: '1.5 min',
        template: `[Name] has made an interesting point about [their point]. However, I see some potential risks in that approach. Firstly, [risk 1]. Secondly, [risk 2]. If we do not address these risks, we might face [negative consequence]. Therefore, I suggest we also explore [alternative approach].`
      },
      {
        level: 'Reframing the Discussion',
        duration: '1.5 min',
        template: `I think we might be looking at [TOPIC] from a limited lens. Instead of focusing only on [current focus], what if we consider [new frame or angle]? This reframing shows us that [new insight]. I believe this broader perspective will lead to better solutions.`
      }
    ],
    commonMistakes: [
      'Being rude or dismissive',
      'Challenging without offering an alternative',
      'Getting personal in disagreement',
      'Challenging just to sound smart',
      'Not backing your challenge with logic'
    ],
    goldenFormula: 'Respect → Question/Challenge → Provide Logic → Offer Alternative'
  },
  {
    role: 'Moderator',
    description: 'Control the flow, balance speakers, and guide the discussion.',
    icon: 'Users',
    color: 'indigo',
    templates: [
      {
        level: 'Bring Back on Track',
        duration: '30 sec',
        template: `I appreciate the diverse opinions, but I notice we are moving away from the core topic. Let us refocus on [main aspect of TOPIC]. [Name], you made a relevant point earlier about [their point]. Can we build on that direction?`
      },
      {
        level: 'Balance Multiple Speakers',
        duration: '30 sec',
        template: `We have heard some excellent points from [Name 1] and [Name 2]. However, I notice some participants have not had a chance to share. [Name 3], would you like to add your perspective? It would be valuable to hear from everyone.`
      },
      {
        level: 'Conflict Control',
        duration: '45 sec',
        template: `I see we have two strong but differing opinions here. Both [Name 1] and [Name 2] raise valid points. Instead of seeing these as conflicting, let us find common ground. Perhaps we can agree that [common element]. Can we move forward from there?`
      },
      {
        level: 'Summary + Direction',
        duration: '1 min',
        template: `So far, our discussion has covered [point 1], [point 2], and [point 3]. We have both supporting and opposing views on the table. To make our discussion more productive, I suggest we now focus on [specific aspect]. This will help us reach a more concrete conclusion.`
      },
      {
        level: 'Final Closure',
        duration: '1 min',
        template: `As we near the end of our discussion, let me briefly consolidate. We discussed [main points]. The group seemed to agree on [consensus point] while having different views on [debated point]. I believe our discussion has covered the topic comprehensively. Thank you all for the valuable contributions.`
      }
    ],
    commonMistakes: [
      'Being too bossy or controlling',
      'Taking too much speaking time yourself',
      'Ignoring quieter participants',
      'Taking sides instead of being neutral',
      'Interrupting others rudely'
    ],
    goldenFormula: 'Observe → Control Flow → Balance → Redirect → Summarize',
    safeStarterLines: [
      'I notice that we have been discussing... Let us also consider...',
      'That is a great point. Before we continue, may I add...',
      'We have limited time. Let us focus on the key aspects.',
      'I see both sides have merit. Perhaps we can find middle ground.',
      'Let us hear from those who have not spoken yet.'
    ]
  },
  {
    role: 'Summarizer',
    description: 'Conclude the discussion neutrally, clearly, and memorably.',
    icon: 'FileText',
    color: 'teal',
    templates: [
      {
        level: 'Simple Recap',
        duration: '1 min',
        template: `To conclude our discussion on [TOPIC], we covered several important points. [Name 1] highlighted [point 1]. [Name 2] added [point 2]. And [Name 3] brought up [point 3]. Overall, the group acknowledges that [balanced conclusion]. Thank you all for this enriching discussion.`
      },
      {
        level: 'Balanced Summary',
        duration: '1.5 min',
        template: `As we wrap up, let me summarize the key perspectives. On one side, we heard arguments supporting [perspective A] because [reason]. On the other side, concerns were raised about [perspective B] due to [reason]. Despite different viewpoints, we found common ground on [common point]. This shows that [TOPIC] requires balanced consideration.`
      },
      {
        level: 'Role-Wise Summary',
        duration: '1.5 min',
        template: `Let me conclude by acknowledging everyone's contributions. [Name] initiated with [their point]. [Name] provided valuable information about [their contribution]. [Name] analyzed the pros and cons effectively. And [Name] offered a challenging perspective on [their point]. Together, we have explored [TOPIC] from multiple angles.`
      },
      {
        level: 'Problem-Solution Summary',
        duration: '1.5 min',
        template: `In summary, our discussion identified [main problem] as the core challenge with [TOPIC]. We discussed various impacts including [impact 1] and [impact 2]. The proposed solutions ranged from [solution 1] to [solution 2]. Moving forward, the key takeaway is that [actionable conclusion].`
      },
      {
        level: 'Future-Oriented Summary',
        duration: '1.5 min',
        template: `To conclude, we discussed [TOPIC] comprehensively. Looking at where we stand today, [current state]. Based on our discussion, the path forward involves [recommended actions]. If we implement these, we can expect [positive outcome]. This discussion has given us clarity on how to approach [TOPIC] going forward.`
      }
    ],
    commonMistakes: [
      'Adding new points in the summary',
      'Being biased towards one viewpoint',
      'Making the summary too long',
      'Forgetting to mention key contributors',
      'Ending abruptly without a proper closing'
    ],
    goldenFormula: 'Recall Key Points → Acknowledge Both Sides → State Common Ground → Close Gracefully'
  },
  {
    role: 'Disagree / Opposer',
    description: 'Say "No" respectfully with logic and offer alternatives.',
    icon: 'MessageCircle',
    color: 'rose',
    templates: [
      {
        level: 'Polite Disagree',
        duration: '1 min',
        template: `I respect [Name]'s viewpoint, but I see this differently. While [Name] believes [their point], I think [your contrasting view]. The reason for my disagreement is [simple reason]. I hope we can explore this alternative perspective.`
      },
      {
        level: 'Logical Disagree',
        duration: '1.5 min',
        template: `I appreciate [Name]'s argument, however, I must respectfully disagree. The logic presented assumes [assumption]. But if we examine [counter-logic], we find that [your point]. Therefore, I believe [alternative conclusion] is more accurate in this context.`
      },
      {
        level: 'Example-Based Disagree',
        duration: '1.5 min',
        template: `While I understand [Name]'s perspective, let me share an example that presents a different picture. [Your example with details]. This example shows that [lesson from example]. Based on this, I disagree that [their point] applies universally. We need to consider these exceptions.`
      },
      {
        level: 'Risk-Focused Disagree',
        duration: '1.5 min',
        template: `[Name] has made a compelling argument, but I see some risks in that approach. If we follow [their suggestion], we might face [risk 1] and [risk 2]. The consequences could include [negative outcome]. Therefore, I respectfully disagree and suggest we consider [safer alternative].`
      },
      {
        level: 'Partial Disagree (Mature)',
        duration: '1.5 min',
        template: `I partially agree with [Name]. The point about [what you agree with] is valid. However, I disagree with [specific part] because [reason]. Perhaps a more balanced approach would be [your suggestion]. This way, we can incorporate the valid aspects while addressing the concerns I raised.`
      }
    ],
    commonMistakes: [
      'Starting with "I totally disagree"',
      'Getting emotional or defensive',
      'Disagreeing without any reason',
      'Making it personal',
      'Not offering any alternative'
    ],
    goldenFormula: 'Acknowledge → State Disagreement → Give Reason → Offer Alternative',
    safeStarterLines: [
      'I see your point, but have we considered...',
      'That is one way to look at it, however...',
      'While I understand your perspective, I believe...',
      'With due respect, I have a different take on this...',
      'I appreciate your view, but let me offer another angle...'
    ]
  }
];

// Beginner Vocabulary Data
const beginnerVocabulary: VocabularyCategory[] = [
  {
    title: 'Self-Introduction Words',
    words: [
      {
        word: 'Background',
        meaning: 'Your education, work, and experience history',
        context: 'HR / Interview opening',
        example: 'Let me share my professional background with you.',
        wrongUsage: 'I will tell my past.',
        betterAlternative: 'I come from a background in marketing.'
      },
      {
        word: 'Pursuing',
        meaning: 'Currently doing or working towards something',
        context: 'HR / Self-intro',
        example: 'I am currently pursuing my MBA in Finance.',
        wrongUsage: 'I am doing MBA.',
        betterAlternative: 'I am pursuing excellence in my field.'
      },
      {
        word: 'Aspiring',
        meaning: 'Hoping to become or achieve something',
        context: 'HR / Career goals',
        example: 'I am an aspiring data analyst.',
        wrongUsage: 'I want to become analyst.',
        betterAlternative: 'As an aspiring professional...'
      },
      {
        word: 'Dedicated',
        meaning: 'Fully committed to something',
        context: 'HR / Strengths',
        example: 'I am dedicated to continuous learning.',
        wrongUsage: 'I work very hard.',
        betterAlternative: 'I have always been dedicated to quality work.'
      },
      {
        word: 'Enthusiastic',
        meaning: 'Very excited and interested',
        context: 'HR / Interview',
        example: 'I am enthusiastic about this opportunity.',
        wrongUsage: 'I am very excited for job.',
        betterAlternative: 'I bring an enthusiastic approach to every project.'
      }
    ]
  },
  {
    title: 'Strengths & Skills Words',
    words: [
      {
        word: 'Adaptable',
        meaning: 'Able to adjust to new situations easily',
        context: 'HR / Strengths',
        example: 'I am highly adaptable to changing work environments.',
        wrongUsage: 'I can change myself.',
        betterAlternative: 'My adaptable nature helps me handle transitions.'
      },
      {
        word: 'Proactive',
        meaning: 'Taking action before being asked',
        context: 'HR / Work style',
        example: 'I take a proactive approach to problem-solving.',
        wrongUsage: 'I do work before asking.',
        betterAlternative: 'Being proactive helps me anticipate challenges.'
      },
      {
        word: 'Detail-oriented',
        meaning: 'Paying attention to small things',
        context: 'HR / Strengths',
        example: 'I am detail-oriented when reviewing documents.',
        wrongUsage: 'I see small things.',
        betterAlternative: 'My detail-oriented approach ensures accuracy.'
      },
      {
        word: 'Collaborative',
        meaning: 'Working well with others',
        context: 'HR / Teamwork',
        example: 'I have a collaborative working style.',
        wrongUsage: 'I work with team.',
        betterAlternative: 'The collaborative environment brings out my best.'
      },
      {
        word: 'Resourceful',
        meaning: 'Finding clever ways to solve problems',
        context: 'HR / Problem-solving',
        example: 'I am resourceful when facing challenges.',
        wrongUsage: 'I find ways.',
        betterAlternative: 'Being resourceful helped me complete the project on time.'
      }
    ]
  },
  {
    title: 'Agreement & Disagreement Words',
    words: [
      {
        word: 'Absolutely',
        meaning: 'Completely, totally yes',
        context: 'HR / GD / Agreement',
        example: 'Absolutely, I agree with this approach.',
        wrongUsage: 'Yes yes, correct.',
        betterAlternative: 'Absolutely, that makes complete sense.'
      },
      {
        word: 'Indeed',
        meaning: 'Yes, truly, in fact',
        context: 'HR / GD / Confirmation',
        example: 'Indeed, that is a valid point.',
        wrongUsage: 'Yes, right.',
        betterAlternative: 'Indeed, this aligns with my experience.'
      },
      {
        word: 'Partially',
        meaning: 'Agreeing with some parts only',
        context: 'HR / GD / Nuanced opinion',
        example: 'I partially agree with your perspective.',
        wrongUsage: 'I agree a little bit.',
        betterAlternative: 'I partially agree because...'
      },
      {
        word: 'Respectfully',
        meaning: 'Politely, showing honor',
        context: 'HR / GD / Disagreement',
        example: 'Respectfully, I have a different view on this.',
        wrongUsage: 'Sorry but I disagree.',
        betterAlternative: 'Respectfully, I would like to offer an alternative view.'
      },
      {
        word: 'However',
        meaning: 'But, on the other hand',
        context: 'HR / GD / Contrast',
        example: 'However, we should also consider the risks.',
        wrongUsage: 'But but, there is problem.',
        betterAlternative: 'However, another perspective is equally important.'
      }
    ]
  },
  {
    title: 'Confidence-Building Phrases',
    words: [
      {
        word: 'Confident',
        meaning: 'Feeling sure about yourself',
        context: 'HR / Interview',
        example: 'I am confident in my ability to deliver results.',
        wrongUsage: 'I am sure I can do.',
        betterAlternative: 'I am confident this approach will work.'
      },
      {
        word: 'Certain',
        meaning: 'Having no doubt',
        context: 'HR / Closing',
        example: 'I am certain I can contribute to your team.',
        wrongUsage: 'I am very very sure.',
        betterAlternative: 'I am certain about my capability here.'
      },
      {
        word: 'Believe',
        meaning: 'To have faith or trust in something',
        context: 'HR / Values',
        example: 'I believe in continuous improvement.',
        wrongUsage: 'I think hard work is good.',
        betterAlternative: 'I strongly believe that teamwork drives success.'
      },
      {
        word: 'Assured',
        meaning: 'Feeling confident and certain',
        context: 'HR / Closing',
        example: 'Please be assured of my commitment.',
        wrongUsage: 'Dont worry, I will do.',
        betterAlternative: 'Rest assured, I will handle this professionally.'
      },
      {
        word: 'Committed',
        meaning: 'Dedicated and loyal to something',
        context: 'HR / Closing',
        example: 'I am fully committed to this role.',
        wrongUsage: 'I will work hard for job.',
        betterAlternative: 'I remain committed to delivering excellence.'
      }
    ]
  }
];

// Intermediate Vocabulary Data
const intermediateVocabulary: VocabularyCategory[] = [
  {
    title: 'Impactful Professional Words',
    words: [
      {
        word: 'Spearheaded',
        meaning: 'Led or started something important',
        context: 'HR / Experience',
        example: 'I spearheaded the digital transformation initiative.',
        beforeSentence: 'I started the new project.',
        afterSentence: 'I spearheaded the new project.',
        tone: 'Formal, leadership-oriented'
      },
      {
        word: 'Streamlined',
        meaning: 'Made a process simpler and more efficient',
        context: 'HR / Achievements',
        example: 'I streamlined the onboarding process, reducing time by 40%.',
        beforeSentence: 'I made the process faster.',
        afterSentence: 'I streamlined the process for better efficiency.',
        tone: 'Formal, results-focused'
      },
      {
        word: 'Orchestrated',
        meaning: 'Organized and coordinated something complex',
        context: 'HR / Projects',
        example: 'I orchestrated cross-functional team collaboration.',
        beforeSentence: 'I managed the teams together.',
        afterSentence: 'I orchestrated seamless cross-team coordination.',
        tone: 'Formal, senior-level'
      },
      {
        word: 'Implemented',
        meaning: 'Put into action or practice',
        context: 'HR / Technical / Projects',
        example: 'I implemented a new CRM system across departments.',
        beforeSentence: 'I started using new software.',
        afterSentence: 'I implemented the new software company-wide.',
        tone: 'Neutral, action-oriented'
      },
      {
        word: 'Facilitated',
        meaning: 'Made something easier or helped it happen',
        context: 'HR / Teamwork',
        example: 'I facilitated communication between remote teams.',
        beforeSentence: 'I helped teams talk to each other.',
        afterSentence: 'I facilitated effective cross-team communication.',
        tone: 'Neutral, collaborative'
      }
    ]
  },
  {
    title: 'Polite Disagreement Phrases',
    words: [
      {
        word: 'With due respect',
        meaning: 'Politely showing you respect the person while disagreeing',
        context: 'GD / HR',
        example: 'With due respect, I see this differently.',
        beforeSentence: 'I dont agree with you.',
        afterSentence: 'With due respect, I would like to offer a different perspective.',
        tone: 'Very formal, respectful'
      },
      {
        word: 'I appreciate your point, however',
        meaning: 'Acknowledging their view before sharing yours',
        context: 'GD / HR',
        example: 'I appreciate your point, however, the data suggests otherwise.',
        beforeSentence: 'Your point is okay but wrong.',
        afterSentence: 'I appreciate your point, however, let me share additional context.',
        tone: 'Formal, diplomatic'
      },
      {
        word: 'That is a valid concern, but',
        meaning: 'Accepting their worry while offering counter-view',
        context: 'GD / HR',
        example: 'That is a valid concern, but we have mitigation strategies.',
        beforeSentence: 'Your worry is okay but...',
        afterSentence: 'That is a valid concern, but here is how we address it.',
        tone: 'Neutral, problem-solving'
      },
      {
        word: 'From my perspective',
        meaning: 'Sharing your viewpoint without dismissing others',
        context: 'GD / HR',
        example: 'From my perspective, the timeline is achievable.',
        beforeSentence: 'I think it can be done.',
        afterSentence: 'From my perspective, we have the resources to succeed.',
        tone: 'Neutral, personal'
      },
      {
        word: 'Let me offer an alternative view',
        meaning: 'Suggesting a different way of thinking',
        context: 'GD',
        example: 'Let me offer an alternative view on this matter.',
        beforeSentence: 'I have different idea.',
        afterSentence: 'Let me offer an alternative view that addresses all concerns.',
        tone: 'Formal, constructive'
      }
    ]
  },
  {
    title: 'HR Answer Vocabulary',
    words: [
      {
        word: 'Prioritize',
        meaning: 'Decide what is most important',
        context: 'HR / Time management',
        example: 'I prioritize tasks based on urgency and impact.',
        beforeSentence: 'I do important things first.',
        afterSentence: 'I systematically prioritize my responsibilities.',
        tone: 'Neutral, organized'
      },
      {
        word: 'Leverage',
        meaning: 'Use something to maximum advantage',
        context: 'HR / Strategy',
        example: 'I leverage my technical skills to solve business problems.',
        beforeSentence: 'I use my skills.',
        afterSentence: 'I leverage my expertise to create value.',
        tone: 'Formal, strategic'
      },
      {
        word: 'Navigate',
        meaning: 'Find your way through difficulty',
        context: 'HR / Challenges',
        example: 'I successfully navigated complex stakeholder dynamics.',
        beforeSentence: 'I handled the difficult situation.',
        afterSentence: 'I navigated the challenge with careful stakeholder management.',
        tone: 'Formal, experienced'
      },
      {
        word: 'Optimize',
        meaning: 'Make the best use of something',
        context: 'HR / Efficiency',
        example: 'I continuously optimize my workflow for productivity.',
        beforeSentence: 'I try to work better.',
        afterSentence: 'I optimize processes to maximize output.',
        tone: 'Neutral, results-focused'
      },
      {
        word: 'Demonstrate',
        meaning: 'Show clearly through actions',
        context: 'HR / Evidence',
        example: 'I can demonstrate my leadership through past projects.',
        beforeSentence: 'I can show you my work.',
        afterSentence: 'I can demonstrate measurable impact in this area.',
        tone: 'Neutral, evidence-based'
      }
    ]
  },
  {
    title: 'Problem-Solving Vocabulary',
    words: [
      {
        word: 'Analyze',
        meaning: 'Examine something in detail',
        context: 'HR / Technical',
        example: 'I first analyze the root cause before proposing solutions.',
        beforeSentence: 'I look at the problem carefully.',
        afterSentence: 'I analyze problems systematically to find root causes.',
        tone: 'Neutral, methodical'
      },
      {
        word: 'Evaluate',
        meaning: 'Assess the value or quality',
        context: 'HR / Decision-making',
        example: 'I evaluate all options before making decisions.',
        beforeSentence: 'I check all choices.',
        afterSentence: 'I evaluate options against key success criteria.',
        tone: 'Formal, thorough'
      },
      {
        word: 'Mitigate',
        meaning: 'Make something less severe',
        context: 'HR / Risk management',
        example: 'I identified ways to mitigate the project risks.',
        beforeSentence: 'I reduced the problems.',
        afterSentence: 'I developed strategies to mitigate potential risks.',
        tone: 'Formal, proactive'
      },
      {
        word: 'Resolve',
        meaning: 'Find a solution to a problem',
        context: 'HR / Conflicts',
        example: 'I worked to resolve the conflict between departments.',
        beforeSentence: 'I fixed the fight between teams.',
        afterSentence: 'I resolved the interdepartmental disagreement constructively.',
        tone: 'Neutral, action-oriented'
      },
      {
        word: 'Synthesize',
        meaning: 'Combine different ideas into one',
        context: 'HR / Analysis',
        example: 'I synthesized feedback from multiple stakeholders.',
        beforeSentence: 'I put together everyones ideas.',
        afterSentence: 'I synthesized diverse perspectives into a unified approach.',
        tone: 'Formal, analytical'
      }
    ]
  }
];

// Advanced Vocabulary Data
const advancedVocabulary: VocabularyCategory[] = [
  {
    title: 'Leadership & Decision-Making',
    words: [
      {
        word: 'Cultivate',
        meaning: 'Develop or nurture over time',
        impressesWhen: 'Talking about team culture or relationships',
        example: 'I cultivate a culture of innovation within my team.',
        gdExample: 'Organizations must cultivate talent to remain competitive.',
        context: 'HR / Leadership'
      },
      {
        word: 'Pioneer',
        meaning: 'Be the first to do something new',
        impressesWhen: 'Discussing innovation or new initiatives',
        example: 'I pioneered the adoption of agile methodology in my department.',
        gdExample: 'Companies that pioneer change will lead the industry.',
        context: 'HR / Innovation'
      },
      {
        word: 'Envision',
        meaning: 'Imagine future possibilities',
        impressesWhen: 'Discussing vision and strategic thinking',
        example: 'I envision a workflow that reduces manual effort by 50%.',
        gdExample: 'Leaders must envision the future state of the organization.',
        context: 'HR / Strategy'
      },
      {
        word: 'Champion',
        meaning: 'Actively support or advocate for something',
        impressesWhen: 'Showing initiative and ownership',
        example: 'I championed the diversity initiative across our organization.',
        gdExample: 'Someone needs to champion this cause for change to happen.',
        context: 'HR / Leadership'
      },
      {
        word: 'Transform',
        meaning: 'Make a major change',
        impressesWhen: 'Discussing significant achievements',
        example: 'I helped transform the customer service approach, improving satisfaction by 35%.',
        gdExample: 'Digital technology will transform how businesses operate.',
        context: 'HR / Impact'
      }
    ]
  },
  {
    title: 'Strategic & Analytical',
    words: [
      {
        word: 'Scalable',
        meaning: 'Able to grow or expand efficiently',
        impressesWhen: 'Discussing solutions with long-term thinking',
        example: 'I designed a scalable process that works across teams.',
        gdExample: 'Any solution must be scalable to handle future growth.',
        context: 'HR / Technical / Strategy'
      },
      {
        word: 'Sustainable',
        meaning: 'Able to continue over time',
        impressesWhen: 'Showing long-term thinking',
        example: 'I built sustainable practices that continue delivering results.',
        gdExample: 'We need sustainable business models, not quick fixes.',
        context: 'HR / GD'
      },
      {
        word: 'Holistic',
        meaning: 'Considering all aspects together',
        impressesWhen: 'Showing broad perspective',
        example: 'I take a holistic approach to problem-solving.',
        gdExample: 'A holistic view of the issue reveals interconnected challenges.',
        context: 'HR / GD'
      },
      {
        word: 'Pragmatic',
        meaning: 'Practical and realistic',
        impressesWhen: 'Balancing idealism with practicality',
        example: 'I offer pragmatic solutions within budget constraints.',
        gdExample: 'While idealism is good, we need pragmatic implementation steps.',
        context: 'HR / GD'
      },
      {
        word: 'Benchmark',
        meaning: 'Standard for comparison',
        impressesWhen: 'Showing awareness of industry standards',
        example: 'I benchmarked our processes against industry leaders.',
        gdExample: 'We should benchmark ourselves against global best practices.',
        context: 'HR / GD / Technical'
      }
    ]
  },
  {
    title: 'Corporate Communication',
    words: [
      {
        word: 'Articulate',
        meaning: 'Express clearly and effectively',
        impressesWhen: 'Demonstrating communication skills',
        example: 'I can articulate complex ideas to non-technical stakeholders.',
        gdExample: 'Let me articulate the key points we have discussed.',
        context: 'HR / GD'
      },
      {
        word: 'Synthesize',
        meaning: 'Combine information into a coherent whole',
        impressesWhen: 'Showing analytical ability',
        example: 'I synthesize data from multiple sources to inform decisions.',
        gdExample: 'To conclude, let me synthesize the main arguments presented.',
        context: 'HR / GD'
      },
      {
        word: 'Align',
        meaning: 'Bring into agreement or coordination',
        impressesWhen: 'Discussing collaboration and goals',
        example: 'I aligned team objectives with company strategy.',
        gdExample: 'Our approach should align with broader organizational goals.',
        context: 'HR / Corporate'
      },
      {
        word: 'Integrate',
        meaning: 'Combine different things into one',
        impressesWhen: 'Showing systems thinking',
        example: 'I integrated feedback mechanisms into our workflow.',
        gdExample: 'We must integrate technology with human skills.',
        context: 'HR / Technical'
      },
      {
        word: 'Optimize',
        meaning: 'Make as effective as possible',
        impressesWhen: 'Showing efficiency focus',
        example: 'I continuously optimize processes for better outcomes.',
        gdExample: 'The goal is to optimize resource utilization across teams.',
        context: 'HR / Technical / GD'
      }
    ]
  }
];

// Vocabulary Replacements
const vocabularyReplacements: ReplacementPair[] = [
  { weak: 'Good', strong: 'Effective', context: 'Describing performance' },
  { weak: 'Bad', strong: 'Suboptimal', context: 'Describing issues' },
  { weak: 'Problem', strong: 'Challenge', context: 'Describing obstacles' },
  { weak: 'Helped', strong: 'Contributed to', context: 'Describing teamwork' },
  { weak: 'Did', strong: 'Executed', context: 'Describing actions' },
  { weak: 'Made', strong: 'Developed', context: 'Describing creation' },
  { weak: 'Got', strong: 'Achieved', context: 'Describing gains' },
  { weak: 'Used', strong: 'Leveraged', context: 'Describing resource use' },
  { weak: 'Very big', strong: 'Significant', context: 'Describing impact' },
  { weak: 'A lot', strong: 'Substantially', context: 'Describing quantity' },
  { weak: 'I think', strong: 'I believe', context: 'Expressing opinion' },
  { weak: 'Hard work', strong: 'Dedication', context: 'Describing effort' },
  { weak: 'Team player', strong: 'Collaborative professional', context: 'Describing teamwork' },
  { weak: 'Fast learner', strong: 'Quick to adapt', context: 'Describing learning' },
  { weak: 'Worked on', strong: 'Contributed to', context: 'Describing involvement' },
  { weak: 'In charge of', strong: 'Responsible for', context: 'Describing ownership' },
  { weak: 'Fixed', strong: 'Resolved', context: 'Describing solutions' },
  { weak: 'Showed', strong: 'Demonstrated', context: 'Describing evidence' },
  { weak: 'Talked to', strong: 'Communicated with', context: 'Describing interaction' },
  { weak: 'Looked at', strong: 'Analyzed', context: 'Describing review' }
];

// GD-Specific Phrases
const gdPhrases: { category: string; phrases: GDPhrase[] }[] = [
  {
    category: 'Entry Phrases',
    phrases: [
      { phrase: 'I would like to initiate this discussion by...', whenToUse: 'Starting as the first speaker', example: 'I would like to initiate this discussion by defining what we mean by digital transformation.' },
      { phrase: 'Building on the topic at hand...', whenToUse: 'Entering mid-discussion', example: 'Building on the topic at hand, let me add a practical perspective.' },
      { phrase: 'If I may add to this conversation...', whenToUse: 'Joining politely when others are speaking', example: 'If I may add to this conversation, there is another dimension we should consider.' },
      { phrase: 'I would like to bring a fresh perspective...', whenToUse: 'Introducing a new angle', example: 'I would like to bring a fresh perspective from the consumer standpoint.' }
    ]
  },
  {
    category: 'Agreement Phrases',
    phrases: [
      { phrase: 'I completely align with that viewpoint...', whenToUse: 'Strong agreement', example: 'I completely align with that viewpoint, and let me add supporting evidence.' },
      { phrase: 'That is an excellent point, and to elaborate...', whenToUse: 'Agreement with expansion', example: 'That is an excellent point, and to elaborate, this also applies to small businesses.' },
      { phrase: 'I second that thought because...', whenToUse: 'Supporting a teammates point', example: 'I second that thought because data supports this conclusion.' },
      { phrase: 'Your observation resonates with me...', whenToUse: 'Personal agreement', example: 'Your observation resonates with me based on my experience in this field.' }
    ]
  },
  {
    category: 'Disagreement Phrases',
    phrases: [
      { phrase: 'I see the merit in that argument, however...', whenToUse: 'Diplomatic disagreement', example: 'I see the merit in that argument, however, we must also consider the practical challenges.' },
      { phrase: 'While I understand your perspective, I would like to present an alternative view...', whenToUse: 'Polite counter-argument', example: 'While I understand your perspective, I would like to present an alternative view based on recent studies.' },
      { phrase: 'That is one way to look at it, but perhaps we should also consider...', whenToUse: 'Broadening the discussion', example: 'That is one way to look at it, but perhaps we should also consider the environmental impact.' },
      { phrase: 'I respectfully differ because...', whenToUse: 'Direct but polite disagreement', example: 'I respectfully differ because the data points to a different conclusion.' }
    ]
  },
  {
    category: 'Interrupting Politely',
    phrases: [
      { phrase: 'Excuse me, may I add a quick point here...', whenToUse: 'When you must interrupt', example: 'Excuse me, may I add a quick point here before we move forward.' },
      { phrase: 'I would like to interject with a relevant thought...', whenToUse: 'Adding crucial information', example: 'I would like to interject with a relevant thought that addresses this concern.' },
      { phrase: 'Before we proceed, let me quickly mention...', whenToUse: 'Adding important context', example: 'Before we proceed, let me quickly mention the regulatory aspect.' },
      { phrase: 'Pardon the interruption, but this connects to...', whenToUse: 'Making connections', example: 'Pardon the interruption, but this connects to what was mentioned earlier.' }
    ]
  },
  {
    category: 'Summarizing Phrases',
    phrases: [
      { phrase: 'To summarize the key points discussed...', whenToUse: 'Wrapping up discussion', example: 'To summarize the key points discussed, we have three main areas of agreement.' },
      { phrase: 'In essence, our discussion has highlighted...', whenToUse: 'Capturing main themes', example: 'In essence, our discussion has highlighted both opportunities and challenges.' },
      { phrase: 'Drawing together our collective insights...', whenToUse: 'Synthesizing views', example: 'Drawing together our collective insights, we can conclude that balance is essential.' },
      { phrase: 'The common thread in our discussion has been...', whenToUse: 'Finding consensus', example: 'The common thread in our discussion has been the importance of innovation.' }
    ]
  }
];

// Power Phrases for Interviews
const powerPhrases: PowerPhrase[] = [
  // Opening Phrases
  { phrase: 'Thank you for the opportunity to discuss my candidature.', type: 'opening', usage: 'Start of interview' },
  { phrase: 'I am excited to share how my experience aligns with this role.', type: 'opening', usage: 'After greeting' },
  { phrase: 'Let me walk you through my professional journey.', type: 'opening', usage: 'Self-introduction' },
  { phrase: 'To give you a comprehensive picture of my background...', type: 'opening', usage: 'Before detailed explanation' },
  { phrase: 'I would like to begin by highlighting my key strengths.', type: 'opening', usage: 'Structured start' },
  
  // Thinking Phrases (Buy Time)
  { phrase: 'That is an interesting question. Let me structure my thoughts.', type: 'thinking', usage: 'Complex question' },
  { phrase: 'I would like to approach this from multiple angles.', type: 'thinking', usage: 'Multi-part question' },
  { phrase: 'Let me share a specific example that addresses this.', type: 'thinking', usage: 'Behavioral question' },
  { phrase: 'To answer this comprehensively...', type: 'thinking', usage: 'Detailed response' },
  { phrase: 'That prompts me to share an experience from my last role.', type: 'thinking', usage: 'Experience-based answer' },
  
  // Closing Phrases
  { phrase: 'I am confident my skills align perfectly with your requirements.', type: 'closing', usage: 'Ending statement' },
  { phrase: 'I am eager to contribute to your teams success.', type: 'closing', usage: 'Showing enthusiasm' },
  { phrase: 'I look forward to the opportunity to add value here.', type: 'closing', usage: 'Final impression' },
  { phrase: 'Please feel free to reach out for any additional information.', type: 'closing', usage: 'Open communication' },
  { phrase: 'Thank you for considering my application.', type: 'closing', usage: 'Grateful closing' }
];

// Memorization Cheat Sheet
const cheatSheet = {
  mustRememberWords: [
    'Spearheaded', 'Streamlined', 'Collaborated', 'Implemented', 'Demonstrated',
    'Proactive', 'Adaptable', 'Leverage', 'Navigate', 'Optimize',
    'Prioritize', 'Champion', 'Scalable', 'Sustainable', 'Articulate',
    'Facilitate', 'Synthesize', 'Mitigate', 'Cultivate', 'Align'
  ],
  powerSentences: [
    'I spearheaded the initiative that resulted in a 30% improvement in efficiency.',
    'My proactive approach helped identify potential issues before they escalated.',
    'I collaborated with cross-functional teams to deliver the project ahead of schedule.',
    'I leveraged my technical skills to solve a complex business problem.',
    'My adaptable nature allowed me to navigate challenging situations effectively.',
    'I prioritize tasks based on business impact and urgency.',
    'I am committed to continuous learning and professional development.',
    'I demonstrated leadership by mentoring junior team members.',
    'I streamlined processes which resulted in significant time savings.',
    'I believe in taking ownership and driving results proactively.'
  ],
  phrasesToAvoid: [
    { phrase: 'I am a perfectionist', reason: 'Overused and sounds fake as a weakness' },
    { phrase: 'I work too hard', reason: 'Not a genuine weakness, interviewers see through it' },
    { phrase: 'I have no weaknesses', reason: 'Shows lack of self-awareness' },
    { phrase: 'Basically / Actually / Like', reason: 'Filler words that reduce professionalism' },
    { phrase: 'I dont know', reason: 'Instead say: Let me think about that or I would approach by...' }
  ]
};

// Component
const VocabularyBooster: React.FC<{ user: UserProfile }> = ({ user }) => {
  const router = useRouter();
  const [activeLevel, setActiveLevel] = useState<ProficiencyLevel>(ProficiencyLevel.BEGINNER);
  const [activeSection, setActiveSection] = useState<string>('vocabulary');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [activeRole, setActiveRole] = useState<string>('Initiator');
  const [expandedTemplates, setExpandedTemplates] = useState<Set<string>>(new Set());
  
  // Voice Practice State
  const [voicePracticeLevel, setVoicePracticeLevel] = useState<ProficiencyLevel>(ProficiencyLevel.BEGINNER);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  const [currentItemIndex, setCurrentItemIndex] = useState<number>(0);
  const [practiceStep, setPracticeStep] = useState<VoicePracticeStep>('select');
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [userResponse, setUserResponse] = useState<string>('');
  const [feedbackType, setFeedbackType] = useState<'great' | 'good' | 'encourage'>('good');
  const [practiceProgress, setPracticeProgress] = useState<number>(0);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);
  
  // Speech synthesis ref
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const recognitionRef = useRef<any>(null);

  // Get chapters for current level
  const getChaptersForLevel = useCallback((level: ProficiencyLevel) => {
    return voicePracticeChapters.filter(chapter => chapter.level === level);
  }, []);

  // Get current practice item
  const getCurrentPracticeItem = useCallback(() => {
    if (!selectedChapter) return null;
    const chapter = voicePracticeChapters.find(c => c.id === selectedChapter);
    if (!chapter) return null;
    return chapter.items[currentItemIndex] || null;
  }, [selectedChapter, currentItemIndex]);

  // Get current chapter
  const getCurrentChapter = useCallback(() => {
    if (!selectedChapter) return null;
    return voicePracticeChapters.find(c => c.id === selectedChapter) || null;
  }, [selectedChapter]);

  // Text to Speech function
  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = voicePracticeLevel === ProficiencyLevel.BEGINNER ? 0.8 : 
                     voicePracticeLevel === ProficiencyLevel.INTERMEDIATE ? 0.9 : 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    
    // Try to get a good English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.includes('en') && v.name.includes('Female')) ||
                         voices.find(v => v.lang.includes('en-US')) ||
                         voices.find(v => v.lang.includes('en'));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => setIsSpeaking(false);
    
    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [voicePracticeLevel]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, []);

  // Start speech recognition
  const startListening = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setUserResponse(transcript);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    
    recognitionRef.current = recognition;
    recognition.start();
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  }, []);

  // Start practice session
  const startPractice = useCallback((chapterId: string) => {
    setSelectedChapter(chapterId);
    setCurrentItemIndex(0);
    setPracticeStep('listen');
    setSessionComplete(false);
    setPracticeProgress(0);
    setUserResponse('');
  }, []);

  // Move to next step
  const nextStep = useCallback(() => {
    const stepOrder: VoicePracticeStep[] = ['listen', 'repeat', 'sentence', 'practice', 'feedback'];
    const currentIndex = stepOrder.indexOf(practiceStep);
    
    if (currentIndex < stepOrder.length - 1) {
      setPracticeStep(stepOrder[currentIndex + 1]);
    } else {
      // Move to next item or complete
      const chapter = getCurrentChapter();
      if (chapter && currentItemIndex < chapter.items.length - 1) {
        setCurrentItemIndex(prev => prev + 1);
        setPracticeStep('listen');
        setPracticeProgress(((currentItemIndex + 1) / chapter.items.length) * 100);
        setUserResponse('');
      } else {
        setPracticeStep('complete');
        setSessionComplete(true);
        setPracticeProgress(100);
      }
    }
  }, [practiceStep, currentItemIndex, getCurrentChapter]);

  // Reset practice
  const resetPractice = useCallback(() => {
    setSelectedChapter(null);
    setCurrentItemIndex(0);
    setPracticeStep('select');
    setSessionComplete(false);
    setPracticeProgress(0);
    setUserResponse('');
    stopSpeaking();
    stopListening();
  }, [stopSpeaking, stopListening]);

  // Provide feedback based on simple matching
  const provideFeedback = useCallback(() => {
    const item = getCurrentPracticeItem();
    if (!item || !userResponse) {
      setFeedbackType('encourage');
      return;
    }
    
    const response = userResponse.toLowerCase();
    const targetWord = item.word.toLowerCase();
    
    if (response.includes(targetWord)) {
      setFeedbackType('great');
    } else if (response.length > 10) {
      setFeedbackType('good');
    } else {
      setFeedbackType('encourage');
    }
  }, [userResponse, getCurrentPracticeItem]);

  // Effect to provide feedback when user response changes
  useEffect(() => {
    if (practiceStep === 'feedback' && userResponse) {
      provideFeedback();
    }
  }, [practiceStep, userResponse, provideFeedback]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getCurrentVocabulary = () => {
    switch (activeLevel) {
      case ProficiencyLevel.BEGINNER:
        return beginnerVocabulary;
      case ProficiencyLevel.INTERMEDIATE:
        return intermediateVocabulary;
      case ProficiencyLevel.ADVANCED:
        return advancedVocabulary;
      default:
        return beginnerVocabulary;
    }
  };

  const renderVocabularyWord = (word: VocabularyWord, index: number) => (
    <div key={index} className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 hover:border-slate-600/50 transition-all">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-lg font-bold text-white">{word.word}</h4>
        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-purple-500/20 text-purple-300">
          {word.context}
        </span>
      </div>
      
      <p className="text-slate-300 text-sm mb-4">
        <span className="text-slate-400 font-semibold">Meaning: </span>{word.meaning}
      </p>
      
      <div className="space-y-3">
        {/* Example */}
        <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Example</span>
          </div>
          <p className="text-slate-200 text-sm">{word.example}</p>
        </div>
        
        {/* Wrong Usage */}
        {word.wrongUsage && (
          <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
            <div className="flex items-center gap-2 mb-1">
              <XCircle size={14} className="text-red-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Wrong Usage</span>
            </div>
            <p className="text-slate-300 text-sm">{word.wrongUsage}</p>
          </div>
        )}
        
        {/* Better Alternative */}
        {word.betterAlternative && (
          <div className="bg-blue-500/10 rounded-xl p-3 border border-blue-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Lightbulb size={14} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-400">Better Alternative</span>
            </div>
            <p className="text-slate-200 text-sm">{word.betterAlternative}</p>
          </div>
        )}
        
        {/* Before/After for Intermediate */}
        {word.beforeSentence && word.afterSentence && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="bg-red-500/10 rounded-xl p-3 border border-red-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-red-400 mb-1 block">Before</span>
              <p className="text-slate-300 text-sm">{word.beforeSentence}</p>
            </div>
            <div className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 mb-1 block">After</span>
              <p className="text-slate-200 text-sm">{word.afterSentence}</p>
            </div>
          </div>
        )}
        
        {/* Tone */}
        {word.tone && (
          <p className="text-slate-400 text-xs">
            <span className="font-semibold">Tone: </span>{word.tone}
          </p>
        )}
        
        {/* Advanced specific */}
        {word.impressesWhen && (
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Star size={14} className="text-amber-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400">Impresses When</span>
            </div>
            <p className="text-slate-200 text-sm">{word.impressesWhen}</p>
          </div>
        )}
        
        {word.gdExample && (
          <div className="bg-purple-500/10 rounded-xl p-3 border border-purple-500/20">
            <div className="flex items-center gap-2 mb-1">
              <Users size={14} className="text-purple-400" />
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-400">GD Usage</span>
            </div>
            <p className="text-slate-200 text-sm">{word.gdExample}</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/train')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Back to Training</span>
        </button>
      </div>
      
      {/* Title Section */}
      <div className="text-center py-6">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
          <BookA size={40} className="text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Vocabulary Booster</h1>
        <p className="text-slate-400 max-w-xl mx-auto">
          Build interview-ready vocabulary that upgrades your speaking confidence and professional impression.
        </p>
      </div>
      
      {/* Section Tabs */}
      <div className="flex flex-wrap justify-center gap-2">
        {[
          { id: 'vocabulary', label: 'Vocabulary', icon: BookA },
          { id: 'replacements', label: 'Word Upgrades', icon: ArrowRight },
          { id: 'gd-phrases', label: 'GD Phrases', icon: Users },
          { id: 'templates', label: 'GD Templates', icon: FileText },
          { id: 'power-phrases', label: 'Power Phrases', icon: Sparkles },
          { id: 'cheat-sheet', label: 'Cheat Sheet', icon: Bookmark },
          { id: 'voice-practice', label: 'Voice Practice', icon: Mic }
        ].map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${
              activeSection === section.id
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
            }`}
          >
            <section.icon size={16} />
            {section.label}
          </button>
        ))}
      </div>
      
      {/* Main Content */}
      {activeSection === 'vocabulary' && (
        <div className="space-y-6">
          {/* Level Tabs */}
          <div className="flex justify-center gap-3">
            {Object.values(ProficiencyLevel).map((level) => (
              <button
                key={level}
                onClick={() => setActiveLevel(level)}
                className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                  activeLevel === level
                    ? level === ProficiencyLevel.BEGINNER
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : level === ProficiencyLevel.INTERMEDIATE
                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                        : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                }`}
              >
                {level === ProficiencyLevel.BEGINNER && <GraduationCap size={16} className="inline mr-2" />}
                {level === ProficiencyLevel.INTERMEDIATE && <Target size={16} className="inline mr-2" />}
                {level === ProficiencyLevel.ADVANCED && <Trophy size={16} className="inline mr-2" />}
                {level}
              </button>
            ))}
          </div>
          
          {/* Vocabulary Categories */}
          <div className="space-y-4">
            {getCurrentVocabulary().map((category, catIndex) => (
              <div key={catIndex} className="bg-slate-800/40 rounded-3xl border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between p-5 hover:bg-slate-700/30 transition-colors"
                >
                  <h3 className="text-lg font-bold text-white">{category.title}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-400 text-sm">{category.words.length} words</span>
                    {expandedCategories.has(category.title) ? (
                      <ChevronUp size={20} className="text-slate-400" />
                    ) : (
                      <ChevronDown size={20} className="text-slate-400" />
                    )}
                  </div>
                </button>
                
                {expandedCategories.has(category.title) && (
                  <div className="p-5 pt-0 space-y-4">
                    {category.words.map((word, wordIndex) => renderVocabularyWord(word, wordIndex))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Replacements Section */}
      {activeSection === 'replacements' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Word Upgrade Table</h2>
            <p className="text-slate-400">Replace basic words with professional alternatives</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vocabularyReplacements.map((pair, index) => (
              <div key={index} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50 hover:border-slate-600/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <XCircle size={14} className="text-red-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-400">Weak</span>
                    </div>
                    <p className="text-slate-300 font-medium">{pair.weak}</p>
                  </div>
                  <ArrowRight size={20} className="text-orange-400" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 size={14} className="text-emerald-400" />
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Strong</span>
                    </div>
                    <p className="text-white font-bold">{pair.strong}</p>
                  </div>
                </div>
                {pair.context && (
                  <p className="text-slate-500 text-xs mt-2">{pair.context}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* GD Phrases Section */}
      {activeSection === 'gd-phrases' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">GD-Specific Vocabulary</h2>
            <p className="text-slate-400">Master phrases for Group Discussion success</p>
          </div>
          
          {gdPhrases.map((section, sectionIndex) => (
            <div key={sectionIndex} className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Users size={20} className="text-purple-400" />
                {section.category}
              </h3>
              
              <div className="space-y-3">
                {section.phrases.map((phrase, phraseIndex) => (
                  <div key={phraseIndex} className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/50">
                    <p className="text-white font-semibold mb-2">"{phrase.phrase}"</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-slate-400 font-semibold">When to use: </span>
                        <span className="text-slate-300">{phrase.whenToUse}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-semibold">Example: </span>
                        <span className="text-emerald-300">{phrase.example}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* GD Templates Section */}
      {activeSection === 'templates' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">GD Speaking Templates</h2>
            <p className="text-slate-400">Ready-to-use templates for every GD role. Memorize and speak confidently.</p>
          </div>
          
          {/* Role Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {gdTemplates.map((roleData) => {
              const IconComponent = roleData.icon === 'Zap' ? Zap :
                roleData.icon === 'HandshakeIcon' ? HandshakeIcon :
                roleData.icon === 'BookA' ? BookA :
                roleData.icon === 'Scale' ? Scale :
                roleData.icon === 'Shield' ? Shield :
                roleData.icon === 'Users' ? Users :
                roleData.icon === 'FileText' ? FileText :
                roleData.icon === 'MessageCircle' ? MessageCircle : Users;
              
              const colorClasses: Record<string, string> = {
                emerald: 'bg-emerald-500 shadow-emerald-500/30',
                blue: 'bg-blue-500 shadow-blue-500/30',
                cyan: 'bg-cyan-500 shadow-cyan-500/30',
                purple: 'bg-purple-500 shadow-purple-500/30',
                amber: 'bg-amber-500 shadow-amber-500/30',
                indigo: 'bg-indigo-500 shadow-indigo-500/30',
                teal: 'bg-teal-500 shadow-teal-500/30',
                rose: 'bg-rose-500 shadow-rose-500/30'
              };
              
              return (
                <button
                  key={roleData.role}
                  onClick={() => setActiveRole(roleData.role)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl font-semibold text-sm transition-all ${
                    activeRole === roleData.role
                      ? `${colorClasses[roleData.color]} text-white shadow-lg`
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  <IconComponent size={16} />
                  {roleData.role}
                </button>
              );
            })}
          </div>
          
          {/* Active Role Content */}
          {gdTemplates.filter(r => r.role === activeRole).map((roleData) => {
            const IconComponent = roleData.icon === 'Zap' ? Zap :
              roleData.icon === 'HandshakeIcon' ? HandshakeIcon :
              roleData.icon === 'BookA' ? BookA :
              roleData.icon === 'Scale' ? Scale :
              roleData.icon === 'Shield' ? Shield :
              roleData.icon === 'Users' ? Users :
              roleData.icon === 'FileText' ? FileText :
              roleData.icon === 'MessageCircle' ? MessageCircle : Users;
            
            const borderColorClass: Record<string, string> = {
              emerald: 'border-emerald-500/30',
              blue: 'border-blue-500/30',
              cyan: 'border-cyan-500/30',
              purple: 'border-purple-500/30',
              amber: 'border-amber-500/30',
              indigo: 'border-indigo-500/30',
              teal: 'border-teal-500/30',
              rose: 'border-rose-500/30'
            };
            
            const bgColorClass: Record<string, string> = {
              emerald: 'from-emerald-500/20',
              blue: 'from-blue-500/20',
              cyan: 'from-cyan-500/20',
              purple: 'from-purple-500/20',
              amber: 'from-amber-500/20',
              indigo: 'from-indigo-500/20',
              teal: 'from-teal-500/20',
              rose: 'from-rose-500/20'
            };
            
            const textColorClass: Record<string, string> = {
              emerald: 'text-emerald-400',
              blue: 'text-blue-400',
              cyan: 'text-cyan-400',
              purple: 'text-purple-400',
              amber: 'text-amber-400',
              indigo: 'text-indigo-400',
              teal: 'text-teal-400',
              rose: 'text-rose-400'
            };
            
            return (
              <div key={roleData.role} className="space-y-6">
                {/* Role Header */}
                <div className={`bg-gradient-to-r ${bgColorClass[roleData.color]} to-slate-900/80 rounded-3xl p-6 border ${borderColorClass[roleData.color]}`}>
                  <div className="flex items-center gap-4 mb-3">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${bgColorClass[roleData.color].replace('/20', '')} flex items-center justify-center`}>
                      <IconComponent size={28} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">{roleData.role}</h3>
                      <p className="text-slate-300">{roleData.description}</p>
                    </div>
                  </div>
                  
                  {/* Golden Formula */}
                  <div className="bg-amber-500/10 rounded-2xl p-4 border border-amber-500/20 mt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Star size={18} className="text-amber-400" />
                      <span className="text-amber-300 font-bold">Golden Formula</span>
                    </div>
                    <p className="text-white font-medium">{roleData.goldenFormula}</p>
                  </div>
                </div>
                
                {/* Templates */}
                <div className="space-y-4">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <FileText size={20} className={textColorClass[roleData.color]} />
                    Speaking Templates
                  </h4>
                  
                  {roleData.templates.map((template, idx) => (
                    <div 
                      key={idx} 
                      className={`bg-slate-800/60 rounded-2xl border ${borderColorClass[roleData.color]} overflow-hidden`}
                    >
                      <button
                        onClick={() => {
                          const key = `${roleData.role}-${idx}`;
                          const newExpanded = new Set(expandedTemplates);
                          if (newExpanded.has(key)) {
                            newExpanded.delete(key);
                          } else {
                            newExpanded.add(key);
                          }
                          setExpandedTemplates(newExpanded);
                        }}
                        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-sm font-bold ${textColorClass[roleData.color]}`}>
                            {idx + 1}.
                          </span>
                          <span className="text-white font-semibold">{template.level}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <Clock size={14} />
                            <span>{template.duration}</span>
                          </div>
                          {expandedTemplates.has(`${roleData.role}-${idx}`) ? (
                            <ChevronUp size={20} className="text-slate-400" />
                          ) : (
                            <ChevronDown size={20} className="text-slate-400" />
                          )}
                        </div>
                      </button>
                      
                      {expandedTemplates.has(`${roleData.role}-${idx}`) && (
                        <div className="p-4 pt-0 border-t border-slate-700/50">
                          <div className={`bg-gradient-to-r ${bgColorClass[roleData.color]} to-slate-800/60 rounded-xl p-4 mt-3`}>
                            <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {template.template}
                            </p>
                          </div>
                          <p className="text-slate-500 text-xs mt-3 flex items-center gap-1">
                            <Lightbulb size={12} />
                            Replace [TOPIC], [Name], [examples] with actual content
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Safe Starter Lines */}
                {roleData.safeStarterLines && roleData.safeStarterLines.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-lg font-bold text-white flex items-center gap-2">
                      <CheckCircle2 size={20} className="text-emerald-400" />
                      Safe Starter Lines
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {roleData.safeStarterLines.map((line, idx) => (
                        <div key={idx} className="bg-emerald-500/10 rounded-xl p-3 border border-emerald-500/20">
                          <p className="text-slate-200 text-sm">"{line}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Common Mistakes */}
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <XCircle size={20} className="text-red-400" />
                    Common Mistakes to Avoid
                  </h4>
                  <div className="bg-red-500/10 rounded-2xl p-4 border border-red-500/20">
                    <div className="space-y-2">
                      {roleData.commonMistakes.map((mistake, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="text-red-400 font-bold text-sm mt-0.5">x</span>
                          <p className="text-slate-300 text-sm">{mistake}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Power Phrases Section */}
      {activeSection === 'power-phrases' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">Power Phrases for Interviews</h2>
            <p className="text-slate-400">Ready-to-use phrases that make an impact</p>
          </div>
          
          {['opening', 'thinking', 'closing'].map((type) => (
            <div key={type} className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-5">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2 capitalize">
                <Sparkles size={20} className={
                  type === 'opening' ? 'text-emerald-400' :
                  type === 'thinking' ? 'text-blue-400' : 'text-orange-400'
                } />
                {type === 'opening' ? 'Opening Phrases' :
                 type === 'thinking' ? 'Thinking Phrases (Buy Time)' : 'Confident Closing Phrases'}
              </h3>
              
              <div className="space-y-3">
                {powerPhrases
                  .filter(p => p.type === type)
                  .map((phrase, index) => (
                    <div key={index} className={`rounded-2xl p-4 border ${
                      type === 'opening' ? 'bg-emerald-500/10 border-emerald-500/20' :
                      type === 'thinking' ? 'bg-blue-500/10 border-blue-500/20' :
                      'bg-orange-500/10 border-orange-500/20'
                    }`}>
                      <p className="text-white font-medium">"{phrase.phrase}"</p>
                      <p className="text-slate-400 text-sm mt-1">{phrase.usage}</p>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Cheat Sheet Section */}
      {activeSection === 'cheat-sheet' && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-orange-500/20 px-4 py-2 rounded-full mb-4">
              <Bookmark size={16} className="text-orange-400" />
              <span className="text-orange-300 font-bold text-sm">Read this before entering the interview room</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Memorization Cheat Sheet</h2>
            <p className="text-slate-400">Quick reference for interview success</p>
          </div>
          
          {/* Must Remember Words */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Star size={20} className="text-amber-400" />
              20 Must-Remember Words
            </h3>
            <div className="flex flex-wrap gap-2">
              {cheatSheet.mustRememberWords.map((word, index) => (
                <span
                  key={index}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 text-amber-200 font-semibold text-sm"
                >
                  {word}
                </span>
              ))}
            </div>
          </div>
          
          {/* Power Sentences */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Sparkles size={20} className="text-emerald-400" />
              10 Ready-Made Power Sentences
            </h3>
            <div className="space-y-3">
              {cheatSheet.powerSentences.map((sentence, index) => (
                <div key={index} className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 font-bold">{index + 1}.</span>
                    <p className="text-slate-200">{sentence}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Phrases to Avoid */}
          <div className="bg-slate-800/40 rounded-3xl border border-slate-700/50 p-5">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-400" />
              5 Phrases to Avoid
            </h3>
            <div className="space-y-3">
              {cheatSheet.phrasesToAvoid.map((item, index) => (
                <div key={index} className="bg-red-500/10 rounded-xl p-4 border border-red-500/20">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-red-300 font-bold">"{item.phrase}"</p>
                      <p className="text-slate-400 text-sm mt-1">{item.reason}</p>
                    </div>
                    <XCircle size={20} className="text-red-400 flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Voice Practice Section */}
      {activeSection === 'voice-practice' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-violet-500/20 to-purple-500/20 px-4 py-2 rounded-full mb-4">
              <Headphones size={16} className="text-violet-400" />
              <span className="text-violet-300 font-bold text-sm">Practice Speaking Out Loud</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Voice Practice Mode</h2>
            <p className="text-slate-400">Learn by listening, repeating, and speaking confidently.</p>
          </div>
          
          {/* Chapter Selection View */}
          {practiceStep === 'select' && (
            <div className="space-y-6">
              {/* Level Selection */}
              <div className="flex justify-center gap-3">
                {Object.values(ProficiencyLevel).map((level) => (
                  <button
                    key={level}
                    onClick={() => setVoicePracticeLevel(level)}
                    className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all ${
                      voicePracticeLevel === level
                        ? level === ProficiencyLevel.BEGINNER
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : level === ProficiencyLevel.INTERMEDIATE
                            ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                            : 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60'
                    }`}
                  >
                    {level === ProficiencyLevel.BEGINNER && <GraduationCap size={16} className="inline mr-2" />}
                    {level === ProficiencyLevel.INTERMEDIATE && <Target size={16} className="inline mr-2" />}
                    {level === ProficiencyLevel.ADVANCED && <Trophy size={16} className="inline mr-2" />}
                    {level}
                  </button>
                ))}
              </div>
              
              {/* Level Description */}
              <div className={`rounded-2xl p-4 border text-center ${
                voicePracticeLevel === ProficiencyLevel.BEGINNER 
                  ? 'bg-emerald-500/10 border-emerald-500/20' 
                  : voicePracticeLevel === ProficiencyLevel.INTERMEDIATE 
                    ? 'bg-blue-500/10 border-blue-500/20'
                    : 'bg-purple-500/10 border-purple-500/20'
              }`}>
                <p className="text-slate-300 text-sm">
                  {voicePracticeLevel === ProficiencyLevel.BEGINNER && 'Slow pace, simple words, guided repetition. Perfect for building foundation.'}
                  {voicePracticeLevel === ProficiencyLevel.INTERMEDIATE && 'Natural pace, sentence building, confidence checks. Ready for real practice.'}
                  {voicePracticeLevel === ProficiencyLevel.ADVANCED && 'Interview-speed speaking, full sentences, real-world tone. Interview ready.'}
                </p>
              </div>
              
              {/* Chapter Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getChaptersForLevel(voicePracticeLevel).map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => startPractice(chapter.id)}
                    className="bg-slate-800/60 rounded-2xl p-5 border border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-800/80 transition-all text-left group"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-bold">{chapter.title}</h3>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
                    </div>
                    <p className="text-slate-400 text-sm mb-3">{chapter.items.length} words to practice</p>
                    <div className="flex items-center gap-2">
                      <Mic size={14} className="text-violet-400" />
                      <span className="text-violet-300 text-xs font-semibold">Start Practice</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Practice Session View */}
          {practiceStep !== 'select' && practiceStep !== 'complete' && getCurrentPracticeItem() && (
            <div className="space-y-6">
              {/* Progress Bar */}
              <div className="bg-slate-800/40 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-violet-500 to-purple-500 h-full transition-all duration-500"
                  style={{ width: `${practiceProgress}%` }}
                />
              </div>
              
              {/* Session Header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={resetPractice}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft size={20} />
                  <span>Exit Practice</span>
                </button>
                <div className="text-slate-400 text-sm">
                  {getCurrentChapter()?.title} - Word {currentItemIndex + 1} of {getCurrentChapter()?.items.length}
                </div>
              </div>
              
              {/* Practice Card */}
              <div className="bg-gradient-to-br from-violet-900/30 to-purple-900/30 rounded-3xl p-8 border border-violet-500/30">
                {/* Current Word Display */}
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-black text-white mb-2">{getCurrentPracticeItem()?.word}</h3>
                  <p className="text-slate-400">{getCurrentPracticeItem()?.meaning}</p>
                </div>
                
                {/* Step Content */}
                <div className="space-y-6">
                  {/* Listen Step */}
                  {practiceStep === 'listen' && (
                    <div className="text-center space-y-6">
                      <div className="bg-slate-800/60 rounded-2xl p-6">
                        <div className="flex items-center gap-3 justify-center mb-4">
                          <Volume2 size={24} className="text-violet-400" />
                          <span className="text-violet-300 font-bold">STEP 1: Listen</span>
                        </div>
                        <p className="text-slate-300 mb-4">{coachMessages.listen.intro}</p>
                        <p className="text-slate-400 text-sm">{coachMessages.listen.repeat}</p>
                      </div>
                      
                      <button
                        onClick={() => {
                          const item = getCurrentPracticeItem();
                          if (item) {
                            speak(`${item.word}. ${item.word}.`, () => {
                              setTimeout(() => nextStep(), 1000);
                            });
                          }
                        }}
                        disabled={isSpeaking}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                          isSpeaking 
                            ? 'bg-violet-500/50 text-white cursor-not-allowed'
                            : 'bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/30'
                        }`}
                      >
                        {isSpeaking ? (
                          <span className="flex items-center gap-2">
                            <Volume2 size={20} className="animate-pulse" />
                            Speaking...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Play size={20} />
                            Listen to Pronunciation
                          </span>
                        )}
                      </button>
                    </div>
                  )}
                  
                  {/* Repeat Step */}
                  {practiceStep === 'repeat' && (
                    <div className="text-center space-y-6">
                      <div className="bg-slate-800/60 rounded-2xl p-6">
                        <div className="flex items-center gap-3 justify-center mb-4">
                          <Mic size={24} className="text-emerald-400" />
                          <span className="text-emerald-300 font-bold">STEP 2: Repeat</span>
                        </div>
                        <p className="text-slate-300 mb-2">{coachMessages.repeat.intro}</p>
                        <p className="text-white text-2xl font-bold my-4">"{getCurrentPracticeItem()?.word}"</p>
                        <p className="text-slate-400 text-sm">{coachMessages.repeat.encouragement}</p>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => speak(getCurrentPracticeItem()?.word || '')}
                          disabled={isSpeaking}
                          className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-all flex items-center gap-2"
                        >
                          <Volume2 size={18} />
                          Hear Again
                        </button>
                        
                        <button
                          onClick={isListening ? stopListening : startListening}
                          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                            isListening 
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30'
                          }`}
                        >
                          {isListening ? (
                            <span className="flex items-center gap-2">
                              <MicOff size={20} />
                              Stop Recording
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Mic size={20} />
                              Speak Now
                            </span>
                          )}
                        </button>
                      </div>
                      
                      {userResponse && (
                        <div className="bg-emerald-500/10 rounded-xl p-4 border border-emerald-500/20">
                          <p className="text-slate-400 text-sm mb-1">You said:</p>
                          <p className="text-emerald-300 font-medium">"{userResponse}"</p>
                        </div>
                      )}
                      
                      <button
                        onClick={nextStep}
                        className="px-6 py-3 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        Continue
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                  
                  {/* Sentence Step */}
                  {practiceStep === 'sentence' && (
                    <div className="text-center space-y-6">
                      <div className="bg-slate-800/60 rounded-2xl p-6">
                        <div className="flex items-center gap-3 justify-center mb-4">
                          <MessageCircle size={24} className="text-blue-400" />
                          <span className="text-blue-300 font-bold">STEP 3: Use in Sentence</span>
                        </div>
                        <p className="text-slate-300 mb-4">{coachMessages.sentence.intro}</p>
                        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                          <p className="text-white text-lg">"{getCurrentPracticeItem()?.exampleSentence}"</p>
                        </div>
                        <p className="text-slate-400 text-sm mt-4">{coachMessages.sentence.task}</p>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => speak(getCurrentPracticeItem()?.exampleSentence || '')}
                          disabled={isSpeaking}
                          className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-all flex items-center gap-2"
                        >
                          <Volume2 size={18} />
                          {isSpeaking ? 'Speaking...' : 'Hear Sentence'}
                        </button>
                        
                        <button
                          onClick={isListening ? stopListening : startListening}
                          className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                            isListening 
                              ? 'bg-red-500 text-white animate-pulse'
                              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-lg shadow-blue-500/30'
                          }`}
                        >
                          {isListening ? (
                            <span className="flex items-center gap-2">
                              <MicOff size={20} />
                              Stop
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <Mic size={20} />
                              Speak Sentence
                            </span>
                          )}
                        </button>
                      </div>
                      
                      {userResponse && (
                        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/20">
                          <p className="text-slate-400 text-sm mb-1">You said:</p>
                          <p className="text-blue-300 font-medium">"{userResponse}"</p>
                        </div>
                      )}
                      
                      <button
                        onClick={nextStep}
                        className="px-6 py-3 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        Continue
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                  
                  {/* Mini Practice Step */}
                  {practiceStep === 'practice' && (
                    <div className="text-center space-y-6">
                      <div className="bg-slate-800/60 rounded-2xl p-6">
                        <div className="flex items-center gap-3 justify-center mb-4">
                          <Target size={24} className="text-amber-400" />
                          <span className="text-amber-300 font-bold">STEP 4: Mini Practice</span>
                        </div>
                        <p className="text-slate-300 mb-4">{coachMessages.practice.intro}</p>
                        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                          <p className="text-white text-lg">{getCurrentPracticeItem()?.miniTask}</p>
                        </div>
                        <p className="text-slate-400 text-sm mt-4">{coachMessages.practice.task}</p>
                      </div>
                      
                      <button
                        onClick={isListening ? stopListening : startListening}
                        className={`px-8 py-4 rounded-2xl font-bold text-lg transition-all ${
                          isListening 
                            ? 'bg-red-500 text-white animate-pulse'
                            : 'bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/30'
                        }`}
                      >
                        {isListening ? (
                          <span className="flex items-center gap-2">
                            <MicOff size={20} />
                            Stop Recording
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Mic size={20} />
                            Start Speaking
                          </span>
                        )}
                      </button>
                      
                      {userResponse && (
                        <div className="bg-amber-500/10 rounded-xl p-4 border border-amber-500/20">
                          <p className="text-slate-400 text-sm mb-1">Your response:</p>
                          <p className="text-amber-300 font-medium">"{userResponse}"</p>
                        </div>
                      )}
                      
                      <button
                        onClick={nextStep}
                        className="px-6 py-3 rounded-xl bg-violet-500/20 text-violet-300 hover:bg-violet-500/30 transition-all flex items-center gap-2 mx-auto"
                      >
                        Get Feedback
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  )}
                  
                  {/* Feedback Step */}
                  {practiceStep === 'feedback' && (
                    <div className="text-center space-y-6">
                      <div className={`rounded-2xl p-6 ${
                        feedbackType === 'great' ? 'bg-emerald-500/20 border border-emerald-500/30' :
                        feedbackType === 'good' ? 'bg-blue-500/20 border border-blue-500/30' :
                        'bg-amber-500/20 border border-amber-500/30'
                      }`}>
                        <div className="flex items-center gap-3 justify-center mb-4">
                          <ThumbsUp size={24} className={
                            feedbackType === 'great' ? 'text-emerald-400' :
                            feedbackType === 'good' ? 'text-blue-400' : 'text-amber-400'
                          } />
                          <span className={`font-bold ${
                            feedbackType === 'great' ? 'text-emerald-300' :
                            feedbackType === 'good' ? 'text-blue-300' : 'text-amber-300'
                          }`}>STEP 5: Feedback</span>
                        </div>
                        <p className="text-white text-lg mb-2">
                          {feedbackType === 'great' ? coachMessages.feedback.great :
                           feedbackType === 'good' ? coachMessages.feedback.good :
                           coachMessages.feedback.encourage}
                        </p>
                        <p className="text-slate-400 text-sm">{coachMessages.feedback.tip}</p>
                      </div>
                      
                      <div className="flex justify-center gap-4">
                        <button
                          onClick={() => {
                            setUserResponse('');
                            setPracticeStep('listen');
                          }}
                          className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-all flex items-center gap-2"
                        >
                          <RotateCcw size={18} />
                          Practice Again
                        </button>
                        
                        <button
                          onClick={nextStep}
                          className="px-8 py-4 rounded-2xl font-bold text-lg bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2"
                        >
                          {currentItemIndex < (getCurrentChapter()?.items.length || 1) - 1 ? 'Next Word' : 'Complete'}
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Session Complete View */}
          {practiceStep === 'complete' && (
            <div className="text-center space-y-8">
              <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 rounded-3xl p-8 border border-emerald-500/30">
                <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center mb-6">
                  <Trophy size={40} className="text-emerald-400" />
                </div>
                <h3 className="text-3xl font-black text-white mb-2">Session Complete</h3>
                <p className="text-emerald-300 text-lg mb-4">{coachMessages.complete.session}</p>
                <p className="text-slate-400">
                  You practiced {getCurrentChapter()?.items.length} words from "{getCurrentChapter()?.title}"
                </p>
              </div>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setCurrentItemIndex(0);
                    setPracticeStep('listen');
                    setSessionComplete(false);
                    setPracticeProgress(0);
                    setUserResponse('');
                  }}
                  className="px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 transition-all flex items-center gap-2"
                >
                  <RotateCcw size={18} />
                  Practice Again
                </button>
                
                <button
                  onClick={resetPractice}
                  className="px-8 py-4 rounded-2xl font-bold text-lg bg-violet-500 text-white hover:bg-violet-600 shadow-lg shadow-violet-500/30 transition-all flex items-center gap-2"
                >
                  Choose Another Chapter
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VocabularyBooster;
