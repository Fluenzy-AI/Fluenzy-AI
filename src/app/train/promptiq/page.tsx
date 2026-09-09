'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Sparkles, Shield, DollarSign, Zap, Copy, Check,
  ChevronDown, ChevronUp, AlertTriangle, AlertCircle, Info,
  CheckCircle2, ArrowRight, RotateCcw, Settings, Lock,
  Code2, FileText, MessageSquare, Database, Search, Cpu, BarChart3,
  Shuffle, ImageIcon, ListChecks, Target, RefreshCw,
  XCircle, TrendingUp, Lightbulb, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import {
  analyzePrompt, optimizePrompt, classifyTask,
  MODEL_CATALOGUE,
  type PromptAnalysisResult, type OptimizationResult,
  type OptimizationMode, type TaskType, type ModelConfig,
  type IssueSeverity,
} from './engine';

// ── Challenge Data ─────────────────────────────────────────────────────────────

interface SubTask { id: string; label: string; keywords: string[] }
interface ChallengeTask { task: string; subTasks: SubTask[] }
interface Challenge {
  id: string; category: string; title: string; description: string;
  image: string; color: string; gradient: string;
  taskTypes: (TaskType | 'Other')[];
  tasks: ChallengeTask[];
}

const CHALLENGES: Challenge[] = [
  {
    id: 'hospital', category: 'Healthcare', title: 'Hospital Management Website',
    description: 'Build a modern healthcare platform for patients and staff',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&q=80',
    color: 'text-blue-400', gradient: 'from-blue-500 to-cyan-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build a patient appointment booking system with doctor availability slots',
        subTasks: [
          { id: 'role',      label: 'Define AI role (e.g. healthcare developer)', keywords: ['you are','act as','developer','healthcare','medical'] },
          { id: 'booking',   label: 'Mention booking/scheduling logic',           keywords: ['book','appointment','schedule','slot','calendar','availability'] },
          { id: 'doctor',    label: 'Specify doctor/specialist selection',        keywords: ['doctor','specialist','physician','department'] },
          { id: 'validation',label: 'Include form validation requirements',       keywords: ['validate','error','required','form','input'] },
          { id: 'output',    label: 'Define output format (HTML/React/etc.)',     keywords: ['html','react','next','vue','component','page','code'] },
          { id: 'responsive',label: 'Mention responsive/mobile design',           keywords: ['responsive','mobile','tailwind','css','design'] },
        ]},
      { task: 'Create a doctor directory with specialty filters and profile cards',
        subTasks: [
          { id: 'role',    label: 'Define developer role',          keywords: ['you are','act as','developer','engineer'] },
          { id: 'listing', label: 'Mention directory/listing layout',keywords: ['directory','list','grid','card','profile'] },
          { id: 'filter',  label: 'Specify filter/search',           keywords: ['filter','search','specialty','department','sort'] },
          { id: 'profile', label: 'Describe profile card contents',  keywords: ['name','photo','specialty','experience','rating','bio'] },
          { id: 'output',  label: 'Define output format',            keywords: ['html','react','component','page','code'] },
        ]},
      { task: 'Design an emergency services page with real-time bed availability',
        subTasks: [
          { id: 'role',     label: 'Define the role',           keywords: ['you are','act as','developer'] },
          { id: 'emergency',label: 'Address emergency context', keywords: ['emergency','urgent','critical','ambulance','icu'] },
          { id: 'realtime', label: 'Mention live/real-time data',keywords: ['real-time','live','update','websocket','refresh','dynamic'] },
          { id: 'beds',     label: 'Specify bed availability',  keywords: ['bed','ward','icu','available','capacity'] },
          { id: 'output',   label: 'Define output format',      keywords: ['html','react','component','page','code','dashboard'] },
        ]},
    ],
  },
  {
    id: 'restaurant', category: 'Food & Beverage', title: 'Restaurant Ordering Platform',
    description: 'Create an online food ordering and table reservation system',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    color: 'text-orange-400', gradient: 'from-orange-500 to-red-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build an interactive menu page with categories, filters, and cart',
        subTasks: [
          { id: 'role',   label: 'Define developer role',          keywords: ['you are','act as','developer','engineer'] },
          { id: 'menu',   label: 'Mention menu/food items display', keywords: ['menu','food','dish','item','category'] },
          { id: 'cart',   label: 'Include cart/order functionality',keywords: ['cart','order','add','quantity','checkout'] },
          { id: 'filter', label: 'Specify dietary filters',         keywords: ['filter','veg','vegetarian','allergen','search','sort'] },
          { id: 'output', label: 'Define output format',            keywords: ['html','react','component','page','code'] },
          { id: 'design', label: 'Mention UI/design requirements',  keywords: ['design','image','photo','ui','card','responsive'] },
        ]},
      { task: 'Create a table reservation system with date/time picker',
        subTasks: [
          { id: 'role',        label: 'Define role',                  keywords: ['you are','act as','developer'] },
          { id: 'reservation', label: 'Address reservation logic',    keywords: ['reserve','reservation','table','book','booking'] },
          { id: 'datetime',    label: 'Include date/time selection',  keywords: ['date','time','picker','calendar','slot'] },
          { id: 'party',       label: 'Mention party size/guests',    keywords: ['party','guests','people','size','capacity'] },
          { id: 'output',      label: 'Define output format',         keywords: ['html','react','form','component','code'] },
        ]},
    ],
  },
  {
    id: 'ecommerce', category: 'E-Commerce', title: 'E-Commerce Store',
    description: 'Build a full-featured online shopping platform',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80',
    color: 'text-purple-400', gradient: 'from-purple-500 to-pink-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build a product listing page with search, filters, and infinite scroll',
        subTasks: [
          { id: 'role',      label: 'Define developer role',          keywords: ['you are','act as','developer'] },
          { id: 'listing',   label: 'Mention product listing/grid',  keywords: ['product','listing','grid','card','catalog'] },
          { id: 'search',    label: 'Include search functionality',  keywords: ['search','query','filter','find'] },
          { id: 'filter',    label: 'Specify filter options',        keywords: ['filter','price','category','sort','range'] },
          { id: 'paginate',  label: 'Mention scroll/pagination',     keywords: ['infinite','scroll','pagination','load more','page'] },
          { id: 'output',    label: 'Define output format',          keywords: ['html','react','next','component','code'] },
        ]},
      { task: 'Design a checkout flow with address, payment, and order confirmation',
        subTasks: [
          { id: 'role',         label: 'Define role',              keywords: ['you are','act as','developer'] },
          { id: 'checkout',     label: 'Address checkout flow',    keywords: ['checkout','step','flow','process','wizard'] },
          { id: 'address',      label: 'Include address/shipping', keywords: ['address','shipping','delivery','location','zip'] },
          { id: 'payment',      label: 'Specify payment',          keywords: ['payment','card','stripe','razorpay','upi','pay'] },
          { id: 'confirmation', label: 'Mention order confirmation',keywords: ['confirm','success','order','receipt','email'] },
          { id: 'output',       label: 'Define output format',     keywords: ['html','react','component','code'] },
        ]},
    ],
  },
  {
    id: 'school', category: 'Education', title: 'School Management System',
    description: 'Create a comprehensive school portal for students and teachers',
    image: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&q=80',
    color: 'text-green-400', gradient: 'from-green-500 to-teal-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build a student attendance tracking system with daily reports and alerts',
        subTasks: [
          { id: 'role',       label: 'Define developer role',           keywords: ['you are','act as','developer'] },
          { id: 'attendance', label: 'Mention attendance tracking',     keywords: ['attendance','present','absent','mark','record'] },
          { id: 'report',     label: 'Specify report generation',       keywords: ['report','daily','weekly','monthly','summary'] },
          { id: 'alert',      label: 'Include alerts/notifications',    keywords: ['alert','notify','email','sms','parent','threshold'] },
          { id: 'output',     label: 'Define output format',            keywords: ['html','react','dashboard','component','code'] },
        ]},
      { task: 'Create an online exam portal with timer, MCQs, and instant results',
        subTasks: [
          { id: 'role',   label: 'Define role',              keywords: ['you are','act as','developer'] },
          { id: 'exam',   label: 'Address exam/quiz logic',  keywords: ['exam','quiz','test','question','mcq'] },
          { id: 'timer',  label: 'Include countdown timer',  keywords: ['timer','countdown','time','duration','limit'] },
          { id: 'result', label: 'Mention instant result',   keywords: ['result','score','mark','grade','answer','correct'] },
          { id: 'output', label: 'Define output format',     keywords: ['html','react','component','code'] },
        ]},
    ],
  },
  {
    id: 'hotel', category: 'Hospitality', title: 'Hotel Booking Platform',
    description: 'Build a luxury hotel reservation and management system',
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
    color: 'text-yellow-400', gradient: 'from-yellow-500 to-amber-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build a room search and availability checker with filters and comparison',
        subTasks: [
          { id: 'role',    label: 'Define role',               keywords: ['you are','act as','developer'] },
          { id: 'search',  label: 'Include room search',       keywords: ['room','search','available','check-in','check-out'] },
          { id: 'filter',  label: 'Specify filter options',    keywords: ['filter','price','type','amenity','sort','view'] },
          { id: 'compare', label: 'Mention room comparison',   keywords: ['compare','side by side','vs','difference'] },
          { id: 'output',  label: 'Define output format',      keywords: ['html','react','component','code'] },
        ]},
      { task: 'Create a hotel admin dashboard with booking management and analytics',
        subTasks: [
          { id: 'role',      label: 'Define role',               keywords: ['you are','act as','developer','admin'] },
          { id: 'bookings',  label: 'Address booking management',keywords: ['booking','reservation','manage','cancel','modify'] },
          { id: 'analytics', label: 'Include analytics charts',  keywords: ['revenue','analytics','chart','graph','stats','kpi'] },
          { id: 'dashboard', label: 'Specify dashboard layout',  keywords: ['dashboard','panel','overview','summary'] },
          { id: 'output',    label: 'Define output format',      keywords: ['html','react','component','code'] },
        ]},
    ],
  },
  {
    id: 'bank', category: 'FinTech', title: 'Banking Dashboard',
    description: 'Design a secure internet banking and financial management portal',
    image: 'https://images.unsplash.com/photo-1601597111158-2fceff292cdc?w=800&q=80',
    color: 'text-emerald-400', gradient: 'from-emerald-500 to-green-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build an account dashboard with balance, transactions, and spending analytics',
        subTasks: [
          { id: 'role',         label: 'Define role',                     keywords: ['you are','act as','developer','fintech'] },
          { id: 'balance',      label: 'Show account balance display',    keywords: ['balance','account','funds','amount'] },
          { id: 'transactions', label: 'Include transaction history',     keywords: ['transaction','history','transfer','debit','credit'] },
          { id: 'analytics',    label: 'Mention spending analytics',      keywords: ['analytics','chart','spending','category','graph'] },
          { id: 'security',     label: 'Address security requirements',   keywords: ['secure','auth','encrypt','mask','otp','2fa'] },
          { id: 'output',       label: 'Define output format',            keywords: ['html','react','component','dashboard','code'] },
        ]},
      { task: 'Create a fund transfer flow with beneficiary management and OTP verification',
        subTasks: [
          { id: 'role',        label: 'Define role',                 keywords: ['you are','act as','developer'] },
          { id: 'transfer',    label: 'Address fund transfer logic', keywords: ['transfer','send','neft','imps','rtgs','upi'] },
          { id: 'beneficiary', label: 'Include beneficiary management',keywords: ['beneficiary','recipient','payee','account','ifsc'] },
          { id: 'otp',         label: 'Specify OTP/2FA verification',keywords: ['otp','verify','2fa','confirm','code','secure'] },
          { id: 'output',      label: 'Define output format',        keywords: ['html','react','form','component','code'] },
        ]},
    ],
  },
  {
    id: 'realestate', category: 'Real Estate', title: 'Property Listing Platform',
    description: 'Build a real estate search and property management portal',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    color: 'text-rose-400', gradient: 'from-rose-500 to-pink-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Create a property search page with map integration and advanced filters',
        subTasks: [
          { id: 'role',   label: 'Define role',             keywords: ['you are','act as','developer'] },
          { id: 'search', label: 'Include property search', keywords: ['property','search','listing','find','location'] },
          { id: 'map',    label: 'Mention map integration', keywords: ['map','google maps','mapbox','location','geo','pin'] },
          { id: 'filter', label: 'Specify filter options',  keywords: ['filter','price','bhk','bedroom','area','type'] },
          { id: 'output', label: 'Define output format',    keywords: ['html','react','component','code'] },
        ]},
    ],
  },
  {
    id: 'fitness', category: 'Health & Fitness', title: 'Gym & Fitness Platform',
    description: 'Build a fitness tracking and gym management system',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
    color: 'text-red-400', gradient: 'from-red-500 to-orange-500',
    taskTypes: ['Coding'],
    tasks: [
      { task: 'Build a workout plan generator with exercise database and progress tracking',
        subTasks: [
          { id: 'role',     label: 'Define role',                    keywords: ['you are','act as','developer','fitness'] },
          { id: 'workout',  label: 'Address workout plan logic',     keywords: ['workout','exercise','plan','routine','set','rep'] },
          { id: 'database', label: 'Mention exercise database',      keywords: ['database','library','exercise','movement','muscle'] },
          { id: 'progress', label: 'Include progress tracking',      keywords: ['progress','track','log','history','chart','weight'] },
          { id: 'output',   label: 'Define output format',           keywords: ['html','react','component','code'] },
        ]},
    ],
  },

  // ── SQL GENERATION ────────────────────────────────────────────────────────
  {
    id: 'sql-ecom', category: 'SQL · E-Commerce', title: 'E-Commerce SQL Queries',
    description: 'Write precise SQL queries for an online store database',
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80',
    color: 'text-cyan-400', gradient: 'from-cyan-500 to-blue-500',
    taskTypes: ['SQL Generation'],
    tasks: [
      { task: 'Write a SQL query to find the top 10 customers by total order value in the last 90 days',
        subTasks: [
          { id: 'role',     label: 'Define role (SQL expert)',           keywords: ['you are','act as','sql','database','expert','engineer'] },
          { id: 'tables',   label: 'Specify the relevant tables',        keywords: ['table','customers','orders','schema','database'] },
          { id: 'metric',   label: 'State the metric (total value)',     keywords: ['total','sum','value','amount','revenue'] },
          { id: 'filter',   label: 'Include the time filter (90 days)',  keywords: ['90','days','last','date','where','between'] },
          { id: 'output',   label: 'Request SQL-only output',            keywords: ['sql','query','return','output','only','select'] },
        ]},
      { task: 'Write a SQL query to find products with declining sales: lower this month vs last month',
        subTasks: [
          { id: 'role',      label: 'Define role',                        keywords: ['you are','act as','sql','database'] },
          { id: 'compare',   label: 'Mention month-over-month comparison', keywords: ['month','last month','this month','compare','previous'] },
          { id: 'tables',    label: 'Reference product/sales tables',     keywords: ['product','sales','order','table','schema'] },
          { id: 'declining', label: 'Specify declining/lower condition',  keywords: ['decline','lower','decrease','less than','drop','fewer'] },
          { id: 'output',    label: 'Request clean SQL output',           keywords: ['sql','query','select','return','only'] },
        ]},
    ],
  },
  {
    id: 'sql-hr', category: 'SQL · HR', title: 'HR Database Queries',
    description: 'Query employee, department, and payroll data with SQL',
    image: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&q=80',
    color: 'text-violet-400', gradient: 'from-violet-500 to-indigo-500',
    taskTypes: ['SQL Generation'],
    tasks: [
      { task: 'Write a SQL query listing employees who have not received a salary raise in the last 2 years',
        subTasks: [
          { id: 'role',      label: 'Define role (SQL/database expert)',  keywords: ['you are','act as','sql','database','expert'] },
          { id: 'tables',    label: 'Mention employee/salary tables',    keywords: ['employee','salary','raise','table','schema'] },
          { id: 'timeframe', label: 'Specify the 2-year timeframe',      keywords: ['2 year','two year','years','date','last','since'] },
          { id: 'condition', label: 'State the no-raise condition',      keywords: ['no raise','not received','without','less'] },
          { id: 'output',    label: 'Request SQL-only output',           keywords: ['sql','query','select','return','only','output'] },
        ]},
    ],
  },

  // ── SUMMARIZATION ─────────────────────────────────────────────────────────
  {
    id: 'sum-research', category: 'Summarization · Research', title: 'Research Paper Summarizer',
    description: 'Condense academic papers into clear, accurate summaries',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=800&q=80',
    color: 'text-amber-400', gradient: 'from-amber-500 to-yellow-500',
    taskTypes: ['Summarization'],
    tasks: [
      { task: 'Summarize a 15-page AI research paper into a 300-word executive summary for a non-technical audience',
        subTasks: [
          { id: 'role',      label: 'Define summarizer role',                 keywords: ['you are','act as','summarizer','writer','analyst','editor'] },
          { id: 'length',    label: 'Specify word limit (300 words)',          keywords: ['300','word','limit','concise','brief','short'] },
          { id: 'audience',  label: 'Mention target audience (non-technical)',keywords: ['non-technical','audience','simple','layman','beginner','business'] },
          { id: 'structure', label: 'Request structured output (sections)',   keywords: ['section','heading','bullet','key point','structure','format'] },
          { id: 'accuracy',  label: 'Require accuracy / no hallucination',   keywords: ['accurate','faithful','do not','not add','only from','based on'] },
        ]},
      { task: 'Write a TL;DR of a legal contract highlighting obligations, deadlines, and risks',
        subTasks: [
          { id: 'role',     label: 'Define role (legal analyst / summarizer)', keywords: ['you are','act as','legal','analyst','lawyer','summarizer'] },
          { id: 'tldr',     label: 'Mention TL;DR or brief format',           keywords: ['tldr','tl;dr','brief','short','concise','summary'] },
          { id: 'risks',    label: 'Highlight risks and obligations',          keywords: ['risk','obligation','deadline','liability','clause','penalty'] },
          { id: 'output',   label: 'Specify output format',                   keywords: ['bullet','list','section','format','structure','markdown'] },
          { id: 'accuracy', label: 'Require accuracy / no additions',         keywords: ['accurate','faithful','do not add','only from','based on','text'] },
        ]},
    ],
  },

  // ── INFORMATION EXTRACTION ────────────────────────────────────────────────
  {
    id: 'extract-resume', category: 'Extraction · HR', title: 'Resume Data Extractor',
    description: 'Extract structured fields from unstructured resume text',
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80',
    color: 'text-teal-400', gradient: 'from-teal-500 to-cyan-500',
    taskTypes: ['Information Extraction'],
    tasks: [
      { task: 'Extract name, email, phone, LinkedIn URL, years of experience, skills, and current company from a resume',
        subTasks: [
          { id: 'role',     label: 'Define extractor role',                    keywords: ['you are','act as','extractor','parser','specialist','analyst'] },
          { id: 'fields',   label: 'List all fields to extract',               keywords: ['name','email','phone','linkedin','experience','skills','company'] },
          { id: 'format',   label: 'Specify JSON output format',               keywords: ['json','object','structured','key','value','format'] },
          { id: 'missing',  label: 'Handle missing fields (null)',             keywords: ['null','missing','not found','absent','empty','if not'] },
          { id: 'accuracy', label: 'Require exact extraction (no inference)', keywords: ['exact','only','do not infer','verbatim','as is','from text'] },
        ]},
      { task: 'Extract invoice data: vendor name, invoice number, line items, subtotal, tax, and total amount',
        subTasks: [
          { id: 'role',     label: 'Define role (data extraction specialist)', keywords: ['you are','act as','extractor','specialist','parser'] },
          { id: 'fields',   label: 'Name all invoice fields',                  keywords: ['vendor','invoice','line item','subtotal','tax','total','amount'] },
          { id: 'format',   label: 'Require JSON output',                      keywords: ['json','structured','format','object','array'] },
          { id: 'missing',  label: 'Handle missing / unclear fields',          keywords: ['null','missing','unclear','not found','empty','if absent'] },
          { id: 'accuracy', label: 'State accuracy requirement',               keywords: ['exact','accurate','do not guess','only from','verbatim'] },
        ]},
    ],
  },

  // ── RAG ───────────────────────────────────────────────────────────────────
  {
    id: 'rag-support', category: 'RAG · Customer Support', title: 'Support Knowledge Base Q&A',
    description: 'Answer questions strictly from a given knowledge base',
    image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80',
    color: 'text-blue-400', gradient: 'from-blue-500 to-violet-500',
    taskTypes: ['RAG'],
    tasks: [
      { task: 'Answer a customer question using ONLY the provided knowledge base. If the answer is not there, say so clearly.',
        subTasks: [
          { id: 'role',      label: 'Define role (support agent / assistant)', keywords: ['you are','act as','support','assistant','agent','specialist'] },
          { id: 'context',   label: 'Reference the provided context / KB',    keywords: ['provided','context','knowledge base','document','following','given'] },
          { id: 'grounding', label: 'Restrict to context (no training data)', keywords: ['only','context','do not use','training','prior','general knowledge'] },
          { id: 'fallback',  label: 'Handle unanswerable questions',          keywords: ['not found','not in','cannot','unavailable','say so','if not'] },
          { id: 'tone',      label: 'Specify response tone / format',         keywords: ['friendly','professional','concise','bullet','format','clear'] },
        ]},
    ],
  },
  {
    id: 'rag-legal', category: 'RAG · Legal', title: 'Contract Q&A System',
    description: 'Answer legal questions strictly from contract text with citations',
    image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80',
    color: 'text-slate-400', gradient: 'from-slate-500 to-gray-600',
    taskTypes: ['RAG'],
    tasks: [
      { task: 'Answer questions about a contract by citing exact clauses. Never infer beyond what is written.',
        subTasks: [
          { id: 'role',      label: 'Define role (legal analyst)',             keywords: ['you are','act as','legal','analyst','lawyer','assistant'] },
          { id: 'context',   label: 'Reference the contract text as source',  keywords: ['contract','document','provided','context','text','given','following'] },
          { id: 'citation',  label: 'Require clause citation in answers',     keywords: ['cite','clause','section','according to','states','says','reference'] },
          { id: 'grounding', label: 'Restrict to written content only',       keywords: ['only','do not infer','do not assume','written','exactly','verbatim'] },
          { id: 'fallback',  label: 'Handle questions not in contract',       keywords: ['not found','not mentioned','cannot determine','say so','if not','unclear'] },
        ]},
    ],
  },

  // ── DEBUGGING ─────────────────────────────────────────────────────────────
  {
    id: 'debug-js', category: 'Debugging · JavaScript', title: 'JavaScript Bug Hunt',
    description: 'Identify and fix bugs in JavaScript / TypeScript code',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    color: 'text-yellow-400', gradient: 'from-yellow-500 to-orange-500',
    taskTypes: ['Debugging'],
    tasks: [
      { task: 'Find and fix the bug causing incorrect output in this async JavaScript function with Promise chaining',
        subTasks: [
          { id: 'role',      label: 'Define role (JavaScript debugger)', keywords: ['you are','act as','debugger','developer','javascript','engineer'] },
          { id: 'rootcause', label: 'Ask for root cause explanation',   keywords: ['root cause','why','explain','reason','cause','issue'] },
          { id: 'fix',       label: 'Request the corrected code',       keywords: ['fix','corrected','fixed','working','solution','code'] },
          { id: 'context',   label: 'Reference the provided code',      keywords: ['code','function','error','following','provided','below'] },
          { id: 'output',    label: 'Specify output (code + explanation)',keywords: ['explanation','comment','fixed code','annotate','describe'] },
        ]},
    ],
  },
  {
    id: 'debug-python', category: 'Debugging · Python', title: 'Python Error Detective',
    description: 'Diagnose and fix Python runtime and logic errors',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&q=80',
    color: 'text-green-400', gradient: 'from-green-500 to-emerald-500',
    taskTypes: ['Debugging'],
    tasks: [
      { task: 'Find why this Python script produces a KeyError when processing a JSON API response',
        subTasks: [
          { id: 'role',      label: 'Define role (Python debugger)',    keywords: ['you are','act as','python','debugger','developer','engineer'] },
          { id: 'error',     label: 'Reference the specific error',    keywords: ['keyerror','error','exception','traceback','key','json'] },
          { id: 'rootcause', label: 'Ask for root cause analysis',     keywords: ['root cause','why','reason','cause','explain','because'] },
          { id: 'fix',       label: 'Request the fixed code',          keywords: ['fix','corrected','solution','working','resolve'] },
          { id: 'prevent',   label: 'Ask for prevention best practices',keywords: ['prevent','best practice','avoid','safe','validate','check'] },
        ]},
    ],
  },

  // ── CODE REVIEW ───────────────────────────────────────────────────────────
  {
    id: 'review-api', category: 'Code Review · Backend', title: 'REST API Code Review',
    description: 'Review API code for quality, security, and performance',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80',
    color: 'text-orange-400', gradient: 'from-orange-500 to-amber-500',
    taskTypes: ['Code Review'],
    tasks: [
      { task: 'Review this Node.js Express API for security vulnerabilities, error handling gaps, and performance issues',
        subTasks: [
          { id: 'role',     label: 'Define role (senior reviewer / security expert)',keywords: ['you are','act as','reviewer','senior','security','engineer'] },
          { id: 'security', label: 'Ask for security review',                keywords: ['security','vulnerability','injection','auth','sanitize','xss','csrf'] },
          { id: 'errors',   label: 'Request error handling review',          keywords: ['error handling','exception','try catch','edge case','fallback'] },
          { id: 'perf',     label: 'Include performance analysis',           keywords: ['performance','optimize','slow','n+1','query','cache','bottleneck'] },
          { id: 'output',   label: 'Specify review output format',           keywords: ['list','issue','finding','recommendation','format','severity'] },
        ]},
    ],
  },

  // ── TRANSLATION ───────────────────────────────────────────────────────────
  {
    id: 'translate-ui', category: 'Translation · UI', title: 'UI String Translator',
    description: 'Translate UI copy with tone and cultural accuracy',
    image: 'https://images.unsplash.com/photo-1576153192396-180ecef2a715?w=800&q=80',
    color: 'text-pink-400', gradient: 'from-pink-500 to-rose-500',
    taskTypes: ['Translation'],
    tasks: [
      { task: 'Translate these English UI labels, error messages, and tooltips to Hindi preserving technical clarity',
        subTasks: [
          { id: 'role',     label: 'Define role (professional translator)', keywords: ['you are','act as','translator','linguist','professional','hindi'] },
          { id: 'language', label: 'Specify source and target languages',  keywords: ['english','hindi','from','to','translate','language'] },
          { id: 'tone',     label: 'Mention tone / formality level',       keywords: ['formal','informal','friendly','professional','tone','natural'] },
          { id: 'context',  label: 'Provide UI context (buttons, labels)', keywords: ['ui','button','label','error','tooltip','interface','app'] },
          { id: 'output',   label: 'Define output format (table / JSON)',  keywords: ['table','json','format','english','hindi','output','original','translated'] },
        ]},
    ],
  },
  {
    id: 'translate-marketing', category: 'Translation · Marketing', title: 'Marketing Copy Translator',
    description: 'Localize marketing content preserving persuasive tone',
    image: 'https://images.unsplash.com/photo-1432888622747-4eb9a8f2c293?w=800&q=80',
    color: 'text-fuchsia-400', gradient: 'from-fuchsia-500 to-purple-500',
    taskTypes: ['Translation'],
    tasks: [
      { task: 'Translate this product launch email from English to Spanish for Latin America, preserving marketing tone and CTA urgency',
        subTasks: [
          { id: 'role',     label: 'Define role (professional translator)', keywords: ['you are','act as','translator','marketer','localiz','spanish'] },
          { id: 'language', label: 'Specify language pair',                keywords: ['english','spanish','from','to','translate','latin america'] },
          { id: 'tone',     label: 'Preserve marketing tone / urgency',   keywords: ['tone','urgency','cta','persuasive','marketing','emotion','preserve'] },
          { id: 'audience', label: 'Mention target audience',             keywords: ['latin america','audience','regional','local','culture','market'] },
          { id: 'output',   label: 'Define output (translated copy only)',keywords: ['translated','output','copy','only','return','final'] },
        ]},
    ],
  },

  // ── CLASSIFICATION ────────────────────────────────────────────────────────
  {
    id: 'classify-sentiment', category: 'Classification · Sentiment', title: 'Product Review Classifier',
    description: 'Classify customer reviews by sentiment and aspect',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    color: 'text-lime-400', gradient: 'from-lime-500 to-green-500',
    taskTypes: ['Classification'],
    tasks: [
      { task: 'Classify customer reviews as Positive, Negative, or Neutral and identify the aspect reviewed (delivery, quality, price)',
        subTasks: [
          { id: 'role',   label: 'Define role (classification specialist)', keywords: ['you are','act as','classifier','analyst','specialist','sentiment'] },
          { id: 'labels', label: 'Define output labels (Positive/Negative/Neutral)',keywords: ['positive','negative','neutral','label','classify','category'] },
          { id: 'aspect', label: 'Include aspect-based classification',    keywords: ['aspect','delivery','quality','price','feature','attribute'] },
          { id: 'format', label: 'Specify output format',                  keywords: ['json','format','output','label only','return','structured'] },
          { id: 'multi',  label: 'Handle multi-aspect reviews',            keywords: ['multiple','each','aspect','all','per','separate'] },
        ]},
    ],
  },
  {
    id: 'classify-support', category: 'Classification · Support', title: 'Support Ticket Router',
    description: 'Automatically route support tickets to the right team',
    image: 'https://images.unsplash.com/photo-1534536281715-e28d76689b4d?w=800&q=80',
    color: 'text-blue-300', gradient: 'from-blue-400 to-cyan-500',
    taskTypes: ['Classification', 'Customer Support'],
    tasks: [
      { task: 'Classify each support ticket into: Billing, Technical, Account, Refund, or General — return only the category',
        subTasks: [
          { id: 'role',       label: 'Define role (classifier / triage agent)',  keywords: ['you are','act as','classifier','triage','support','agent'] },
          { id: 'categories', label: 'List all classification categories',       keywords: ['billing','technical','account','refund','general','category'] },
          { id: 'output',     label: 'Specify label-only output',               keywords: ['only','return','label','category','no explanation','just'] },
          { id: 'edge',       label: 'Handle ambiguous / multi-topic tickets',  keywords: ['ambiguous','unclear','multiple','primary','main','if unclear'] },
          { id: 'format',     label: 'Define output format',                    keywords: ['json','list','single word','format','structured','output'] },
        ]},
    ],
  },

  // ── DATA ANALYSIS ─────────────────────────────────────────────────────────
  {
    id: 'data-sales', category: 'Data Analysis · Sales', title: 'Sales Performance Analyzer',
    description: 'Analyze sales data and surface actionable insights',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    color: 'text-emerald-400', gradient: 'from-emerald-500 to-teal-500',
    taskTypes: ['Data Analysis'],
    tasks: [
      { task: 'Analyze monthly sales CSV: identify top 3 trends, underperforming regions, and recommend one action each',
        subTasks: [
          { id: 'role',   label: 'Define role (data / business analyst)',      keywords: ['you are','act as','analyst','data','business','insight'] },
          { id: 'data',   label: 'Reference the provided data / CSV',         keywords: ['data','csv','provided','following','below','dataset','table'] },
          { id: 'trends', label: 'Ask for trend identification',              keywords: ['trend','pattern','growth','decline','increase','decrease','top'] },
          { id: 'region', label: 'Include regional breakdown',                keywords: ['region','area','location','territory','underperform','segment'] },
          { id: 'action', label: 'Request actionable recommendations',        keywords: ['recommend','action','suggest','improve','strategy','next step'] },
        ]},
    ],
  },

  // ── CONTENT GENERATION ────────────────────────────────────────────────────
  {
    id: 'content-blog', category: 'Content · Blog', title: 'Tech Blog Writer',
    description: 'Generate SEO-optimized blog content for a tech audience',
    image: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80',
    color: 'text-violet-400', gradient: 'from-violet-500 to-purple-500',
    taskTypes: ['Content Generation'],
    tasks: [
      { task: 'Write an SEO-optimized 1000-word blog post about the benefits of AI in healthcare for a non-technical reader',
        subTasks: [
          { id: 'role',     label: 'Define role (content writer / SEO expert)', keywords: ['you are','act as','writer','content','seo','blogger','journalist'] },
          { id: 'topic',    label: 'Specify the exact topic',                   keywords: ['ai','healthcare','artificial intelligence','medical','health','topic'] },
          { id: 'length',   label: 'State word count (1000 words)',              keywords: ['1000','word','length','count','approximately','around'] },
          { id: 'seo',      label: 'Mention SEO requirements',                  keywords: ['seo','keyword','meta','heading','h1','h2','search','optimize'] },
          { id: 'audience', label: 'Define target audience (non-technical)',    keywords: ['non-technical','audience','beginner','simple','layman','reader'] },
        ]},
    ],
  },

  // ── CUSTOMER SUPPORT ──────────────────────────────────────────────────────
  {
    id: 'cs-refund', category: 'Customer Support · Retail', title: 'Refund & Return Agent',
    description: 'Handle customer refund and return requests professionally',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80',
    color: 'text-cyan-400', gradient: 'from-cyan-500 to-sky-500',
    taskTypes: ['Customer Support'],
    tasks: [
      { task: 'Handle a customer complaint about a delayed refund: acknowledge, apologize, investigate steps, and offer resolution',
        subTasks: [
          { id: 'role',       label: 'Define role (customer support specialist)', keywords: ['you are','act as','support','agent','specialist','representative'] },
          { id: 'empathy',    label: 'Require empathy and acknowledgment',        keywords: ['sorry','apologize','understand','empathize','acknowledge','concern'] },
          { id: 'policy',     label: 'Mention company policy / process',          keywords: ['policy','process','procedure','timeline','business day','working'] },
          { id: 'resolution', label: 'Offer a clear resolution / next step',     keywords: ['resolve','resolution','next step','action','escalate','compensate'] },
          { id: 'tone',       label: 'Specify professional and friendly tone',   keywords: ['professional','friendly','polite','tone','respectful','warm'] },
        ]},
    ],
  },
];

function pickRandom<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

/** Returns challenges that match the selected task type (or all if Auto-detect) */
function getChallengesForTask(taskType: TaskType | ''): Challenge[] {
  if (!taskType) return CHALLENGES;
  const filtered = CHALLENGES.filter(c => (c.taskTypes as string[]).includes(taskType));
  return filtered.length > 0 ? filtered : CHALLENGES;
}

function getRandomChallenge(taskType: TaskType | '' = ''): { challenge: Challenge; taskIdx: number } {
  const pool = getChallengesForTask(taskType);
  const challenge = pickRandom(pool);
  return { challenge, taskIdx: Math.floor(Math.random() * challenge.tasks.length) };
}

// ── Loading stages ─────────────────────────────────────────────────────────────

const ANALYZE_STAGES = [
  'Parsing prompt structure…',
  'Detecting task type…',
  'Extracting requirements…',
  'Evaluating quality dimensions…',
  'Checking security…',
  'Estimating tokens & cost…',
  'Generating recommendations…',
];

const OPTIMIZE_STAGES = [
  'Understanding requirements…',
  'Identifying weaknesses…',
  'Rewriting prompt…',
  'Validating requirements…',
  'Re-scoring optimized prompt…',
  'Calculating savings…',
];

// ── Sub-components ─────────────────────────────────────────────────────────────

const issueMeta: Record<IssueSeverity, { icon: typeof AlertCircle; color: string; bg: string; border: string }> = {
  critical: { icon: XCircle,       color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'    },
  high:     { icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30' },
  medium:   { icon: AlertCircle,   color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  low:      { icon: Info,          color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/30'   },
  info:     { icon: Info,          color: 'text-slate-400',  bg: 'bg-slate-500/10',  border: 'border-slate-700'     },
};

function IssueCard({ issue }: { issue: PromptAnalysisResult['issues'][0] }) {
  const [open, setOpen] = useState(false);
  const { icon: Icon, color, bg, border } = issueMeta[issue.severity];
  return (
    <div className={`rounded-xl border ${border} ${bg} overflow-hidden`}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between p-3 text-left gap-3 hover:bg-white/5 transition-colors">
        <div className="flex items-center gap-3 min-w-0">
          <Icon size={14} className={`${color} flex-shrink-0`} />
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{issue.severity} · {issue.importance}</span>
            <p className="text-sm font-semibold text-white truncate leading-tight">{issue.title}</p>
          </div>
        </div>
        {open ? <ChevronUp size={12} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={12} className="text-slate-500 flex-shrink-0" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.16 }} className="overflow-hidden">
            <div className="px-4 pb-4 pt-2 space-y-2.5 border-t border-white/5">
              {issue.evidence && (
                <div className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700">
                  <p className="text-[10px] text-slate-500 mb-0.5 uppercase tracking-wider font-semibold">Evidence</p>
                  <p className="text-xs text-slate-300 font-mono">{issue.evidence}</p>
                </div>
              )}
              <p className="text-xs text-slate-300 leading-relaxed">{issue.explanation}</p>
              <div className="flex gap-2 bg-emerald-500/10 rounded-lg p-2.5 border border-emerald-500/20">
                <CheckCircle2 size={11} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-emerald-300 leading-relaxed">{issue.recommendation}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DimBar({ label, value }: { label: string; value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-400' : value >= 40 ? 'bg-orange-500' : 'bg-red-500';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs"><span className="text-slate-400">{label}</span><span className={`font-bold ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-amber-400' : 'text-red-400'}`}>{value}</span></div>
      <div className="h-1.5 rounded-full bg-slate-700/60">
        <motion.div className={`h-full rounded-full ${color}`} initial={{ width: 0 }} animate={{ width: `${value}%` }} transition={{ duration: 0.6, ease: 'easeOut' }} />
      </div>
    </div>
  );
}

function ScoreBadge({ score, label }: { score: number; label: string }) {
  const gradient =
    score >= 90 ? 'from-emerald-500 to-green-400' :
    score >= 80 ? 'from-blue-500 to-indigo-400'   :
    score >= 70 ? 'from-yellow-500 to-amber-400'  :
    score >= 50 ? 'from-orange-500 to-red-400'    : 'from-red-600 to-rose-700';
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-xl shadow-black/30`}>
        <span className="text-3xl font-black text-white">{score}</span>
      </div>
      <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase text-center">{label}</span>
    </div>
  );
}

const readinessCfg = {
  'NOT READY':         { color: 'text-red-400',    bg: 'bg-red-500/10',    border: 'border-red-500/30'     },
  'NEEDS REVIEW':      { color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/30'  },
  'READY FOR STAGING': { color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30'  },
  'PRODUCTION READY':  { color: 'text-emerald-400',bg: 'bg-emerald-500/10',border: 'border-emerald-500/30' },
};

const TASK_TYPES: TaskType[] = [
  'Coding','Debugging','Code Review','SQL Generation','Summarization',
  'Classification','Information Extraction','Translation','Question Answering',
  'Content Generation','Research','Reasoning','Data Analysis','Customer Support',
  'RAG','Structured Output','Agentic Task','Document Processing','Image Generation','Other',
];

const taskIconMap: Partial<Record<TaskType, typeof Code2>> = {
  'Coding': Code2, 'Debugging': AlertTriangle, 'Code Review': Search,
  'SQL Generation': Database, 'Summarization': FileText, 'Classification': BarChart3,
  'Information Extraction': Search, 'Translation': MessageSquare,
  'Question Answering': MessageSquare, 'Content Generation': FileText,
  'Research': Search, 'Reasoning': Brain, 'Data Analysis': BarChart3,
  'Customer Support': MessageSquare, 'RAG': Database, 'Structured Output': Code2, 'Other': Cpu,
};

const OPT_MODES: { key: OptimizationMode; label: string; icon: typeof Sparkles; desc: string }[] = [
  { key: 'quality',     label: 'Quality',     icon: Sparkles,   desc: 'Max response quality'          },
  { key: 'cost',        label: 'Cost',        icon: DollarSign, desc: 'Minimize token cost'           },
  { key: 'speed',       label: 'Speed',       icon: Zap,        desc: 'Low-latency optimized'         },
  { key: 'balanced',    label: 'Balanced',    icon: Settings,   desc: 'Quality + cost + speed'        },
  { key: 'reliability', label: 'Reliability', icon: Shield,     desc: 'Consistent, robust outputs'    },
  { key: 'security',    label: 'Security',    icon: Lock,       desc: 'Injection resistance + safety' },
];

// ── Page ───────────────────────────────────────────────────────────────────────

export default function PromptIQPage() {
  const { status } = useSession();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme !== 'parchment';

  // Challenge state
  const [{ challenge, taskIdx }, setCurrentChallenge] = useState(() => getRandomChallenge());
  const [imageError, setImageError] = useState(false);
  const [shuffling, setShuffling] = useState(false);
  const currentTask = challenge.tasks[taskIdx];

  // Editor state
  const [prompt, setPrompt]           = useState('');
  const [analysis, setAnalysis]       = useState<PromptAnalysisResult | null>(null);
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [optMode, setOptMode]         = useState<OptimizationMode>('balanced');
  const [selectedModel, setSelectedModel] = useState<ModelConfig>(MODEL_CATALOGUE[0]);

  // Task override
  const [taskOverride, setTaskOverride] = useState<TaskType | ''>('');
  const [overrideOpen, setOverrideOpen] = useState(false);

  // Loading
  const [analyzing, setAnalyzing]     = useState(false);
  const [analyzeStage, setAnalyzeStage] = useState(0);
  const [optimizing, setOptimizing]   = useState(false);
  const [optimizeStage, setOptimizeStage] = useState(0);

  // Gemini AI validation
  const [geminiResult, setGeminiResult] = useState<import('@/app/api/train/promptiq/validate/route').GeminiResult | null>(null);
  const [validating, setValidating]     = useState(false);

  // Tabs
  const [tab, setTab] = useState<'analysis' | 'optimize' | 'cost'>('analysis');

  // Copy
  const [copiedOrig, setCopiedOrig] = useState(false);
  const [copiedOpt,  setCopiedOpt]  = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { if (status === 'unauthenticated') router.push('/'); }, [status, router]);

  // Live debounced analysis
  useEffect(() => {
    if (!prompt.trim()) { setAnalysis(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      try {
        const res = analyzePrompt(prompt, {
          taskOverride: taskOverride as TaskType || undefined,
          model: selectedModel,
        });
        setAnalysis(res);
      } catch {}
    }, 700);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [prompt, taskOverride, selectedModel]);

  const handleAnalyze = useCallback(() => {
    if (!prompt.trim()) return;
    setAnalyzing(true);
    setAnalyzeStage(0);
    const stages = ANALYZE_STAGES.map((_, i) =>
      setTimeout(() => setAnalyzeStage(i + 1), (i + 1) * 250)
    );
    setTimeout(() => {
      try {
        const res = analyzePrompt(prompt, { taskOverride: taskOverride as TaskType || undefined, model: selectedModel });
        setAnalysis(res);
        setOptimization(null);
      } catch {}
      stages.forEach(clearTimeout);
      setAnalyzing(false);
    }, ANALYZE_STAGES.length * 260);
  }, [prompt, taskOverride, selectedModel]);

  const handleOptimize = useCallback(() => {
    if (!analysis) return;
    setOptimizing(true);
    setOptimizeStage(0);
    const stages = OPTIMIZE_STAGES.map((_, i) =>
      setTimeout(() => setOptimizeStage(i + 1), (i + 1) * 300)
    );
    setTimeout(() => {
      try {
        const res = optimizePrompt(prompt, optMode, analysis, selectedModel);
        setOptimization(res);
        setTab('optimize');
      } catch {}
      stages.forEach(clearTimeout);
      setOptimizing(false);
    }, OPTIMIZE_STAGES.length * 310);
  }, [prompt, optMode, analysis, selectedModel]);

  const handleShuffle = useCallback(() => {
    setShuffling(true);
    setImageError(false);
    setTimeout(() => {
      setCurrentChallenge(getRandomChallenge(taskOverride));
      setPrompt(''); setAnalysis(null); setOptimization(null); setGeminiResult(null); setShuffling(false);
    }, 350);
  }, [taskOverride]);

  const handleGeminiValidate = useCallback(async () => {
    if (!prompt.trim() || !analysis) return;
    setValidating(true);
    setGeminiResult(null);
    try {
      const res = await fetch('/api/train/promptiq/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          taskType: taskOverride || analysis.task.primary,
          challengeTask: currentTask.task,
          requirements: currentTask.subTasks.map(s => s.label),
        }),
      });
      const json = await res.json();
      setGeminiResult(json);
    } catch {
      setGeminiResult({ available: false, reason: 'Network error — could not reach the validation endpoint.' });
    } finally {
      setValidating(false);
    }
  }, [prompt, analysis, taskOverride, currentTask]);

  const copy = useCallback((text: string, kind: 'orig' | 'opt') => {
    navigator.clipboard.writeText(text).then(() => {
      if (kind === 'orig') { setCopiedOrig(true); setTimeout(() => setCopiedOrig(false), 2000); }
      else                  { setCopiedOpt(true);  setTimeout(() => setCopiedOpt(false),  2000); }
    });
  }, []);

  const wordCount = prompt.trim().split(/\s+/).filter(Boolean).length;
  const panel = `rounded-2xl border ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} p-4`;
  const label10 = `text-[10px] font-bold uppercase tracking-widest ${dark ? 'text-slate-500' : 'text-slate-400'}`;

  // Challenge coverage from live engine (re-evaluate sub-tasks)
  const challengeCoverage = analysis ? currentTask.subTasks.map(st => ({
    ...st,
    covered: st.keywords.some(kw => prompt.toLowerCase().includes(kw)),
  })) : null;
  const challengeScore = challengeCoverage
    ? Math.round(challengeCoverage.filter(c => c.covered).length / currentTask.subTasks.length * 100)
    : null;

  return (
    <div className={`min-h-screen ${dark ? 'bg-[#080810]' : 'bg-slate-50'} pb-20`}>

      {/* Header */}
      <header className={`sticky top-0 z-30 border-b backdrop-blur-xl ${dark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-white/90'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-700 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Brain size={16} className="text-white" />
            </div>
            <div>
              <span className={`text-sm font-black tracking-tight ${dark ? 'text-white' : 'text-slate-900'}`}>
                Prompt<span className="text-violet-400">IQ</span>
              </span>
              <span className="hidden sm:inline text-[10px] text-slate-500 ml-2">AI Prompt Intelligence & Optimization</span>
            </div>
          </div>
          {/* Task override selector */}
          <div className="relative">
            <button
              onClick={() => setOverrideOpen(o => !o)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                taskOverride
                  ? 'border-violet-500 bg-violet-600/15 text-violet-300'
                  : dark ? 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500' : 'border-slate-200 text-slate-500 hover:border-slate-400'
              }`}
            >
              <Settings size={11} />
              {taskOverride || 'Auto-detect task'}
              <ChevronDown size={10} />
            </button>
            <AnimatePresence>
              {overrideOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className={`absolute right-0 top-full mt-1.5 w-56 rounded-xl border shadow-xl z-50 overflow-hidden ${dark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}
                >
                  <div className="max-h-64 overflow-y-auto p-1">
                    <button onClick={() => { setTaskOverride(''); setOverrideOpen(false);
                        setCurrentChallenge(getRandomChallenge(''));
                        setPrompt(''); setAnalysis(null); setOptimization(null);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/15 transition-colors ${!taskOverride ? 'text-violet-400 font-bold' : dark ? 'text-slate-300' : 'text-slate-700'}`}>
                      Auto-detect (recommended)
                    </button>
                    {TASK_TYPES.map(t => (
                      <button key={t} onClick={() => {
                          setTaskOverride(t); setOverrideOpen(false);
                          setCurrentChallenge(getRandomChallenge(t));
                          setPrompt(''); setAnalysis(null); setOptimization(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded-lg hover:bg-violet-600/15 transition-colors ${taskOverride === t ? 'text-violet-400 font-bold' : dark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dark ? 'border-slate-700 bg-slate-800 text-slate-400' : 'border-slate-200 bg-slate-100 text-slate-500'}`}>BETA</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">

        {/* ══ LEFT ══ */}
        <div className="space-y-4">

          {/* Challenge card */}
          <motion.div key={challenge.id + taskIdx}
            animate={{ opacity: shuffling ? 0 : 1, y: shuffling ? -8 : 0 }} transition={{ duration: 0.3 }}
            className={`rounded-2xl border ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} overflow-hidden`}
          >
            <div className="relative h-36 w-full bg-slate-800 overflow-hidden">
              {!imageError ? (
                <img src={challenge.image} alt={challenge.title} className="w-full h-full object-cover" onError={() => setImageError(true)} />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${challenge.gradient} opacity-20 flex items-center justify-center`}>
                  <ImageIcon size={36} className="text-white/30" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/40 to-transparent" />
              <div className="absolute top-3 left-3">
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gradient-to-r ${challenge.gradient} text-white shadow-lg`}>
                  {challenge.category}
                </span>
              </div>
              <button onClick={handleShuffle} disabled={shuffling}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-white/20 text-white text-xs font-semibold hover:bg-black/60 transition-colors disabled:opacity-50">
                <Shuffle size={10} className={shuffling ? 'animate-spin' : ''} /> New Challenge
              </button>
              <p className="absolute bottom-2 left-3 text-xs text-slate-400">{challenge.title}</p>
            </div>

            <div className="p-4 space-y-3">
              <div>
                <p className={`${label10} mb-1`}>{(taskOverride || 'Coding')} Challenge</p>
                <p className={`text-sm font-bold leading-snug ${dark ? 'text-white' : 'text-slate-900'}`}>{currentTask.task}</p>
              </div>

              {/* Sub-task checklist */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ListChecks size={12} className="text-violet-400" />
                  <span className={`${label10}`}>Prompt coverage ({currentTask.subTasks.length} requirements)</span>
                </div>
                <div className="space-y-1.5">
                  {currentTask.subTasks.map(st => {
                    const c = challengeCoverage?.find(x => x.id === st.id);
                    const covered = c?.covered;
                    return (
                      <div key={st.id} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 transition-all border ${
                          covered == null ? 'border-slate-700 bg-slate-800' :
                          covered ? 'border-emerald-500/40 bg-emerald-500/20' : 'border-slate-700 bg-slate-800'
                        }`}>
                          {covered && <Check size={9} className="text-emerald-400" />}
                        </div>
                        <span className={`text-xs leading-tight ${covered == null ? 'text-slate-500' : covered ? 'text-slate-300' : 'text-slate-600'}`}>{st.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Challenge score */}
              {challengeScore != null && (
                <div className={`flex items-center gap-3 px-3 py-2 rounded-xl border ${
                  challengeScore >= 80 ? 'border-emerald-500/30 bg-emerald-500/10' :
                  challengeScore >= 50 ? 'border-yellow-500/30 bg-yellow-500/10' :
                                         'border-red-500/30 bg-red-500/10'
                }`}>
                  <Target size={13} className={challengeScore >= 80 ? 'text-emerald-400' : challengeScore >= 50 ? 'text-yellow-400' : 'text-red-400'} />
                  <div>
                    <p className="text-[10px] text-slate-500">Task Coverage Score</p>
                    <p className={`text-sm font-bold ${challengeScore >= 80 ? 'text-emerald-400' : challengeScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {challengeScore}% — {challengeScore >= 80 ? 'Great coverage!' : challengeScore >= 50 ? 'Partially covered' : 'Missing key requirements'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Editor */}
          <div className={`rounded-2xl border ${dark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'} overflow-hidden`}>
            <div className={`flex items-center justify-between px-4 py-2 border-b ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={label10}>Your Prompt</span>
              <div className="flex items-center gap-3">
                <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>{wordCount} words · ~{Math.ceil(wordCount * 1.3)} tokens</span>
                {prompt && (
                  <button onClick={() => copy(prompt, 'orig')} className={`flex items-center gap-1 text-xs transition-colors ${dark ? 'text-slate-500 hover:text-white' : 'text-slate-400 hover:text-slate-700'}`}>
                    {copiedOrig ? <Check size={10} className="text-emerald-400" /> : <Copy size={10} />}
                    {copiedOrig ? 'Copied' : 'Copy'}
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder={`Write an AI prompt to complete this challenge:\n\n"${currentTask.task}"\n\nTip: Mention your role, tech stack, output format, and validation requirements for a higher score.`}
              className={`w-full h-52 p-4 text-sm resize-none outline-none font-mono leading-relaxed ${dark ? 'bg-slate-900 text-slate-200 placeholder-slate-700' : 'bg-white text-slate-800 placeholder-slate-300'}`}
            />
            <div className={`flex items-center justify-between px-4 py-2 border-t ${dark ? 'border-slate-800' : 'border-slate-200'}`}>
              <span className={`text-xs ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                {analysis ? `Score: ${analysis.score.overall} · ${analysis.score.label}` : 'Type to auto-analyze…'}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"
                  onClick={() => { setPrompt(''); setAnalysis(null); setOptimization(null); }}
                  className={`h-7 text-xs gap-1 ${dark ? 'border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800' : ''}`}>
                  <RotateCcw size={10} /> Clear
                </Button>
                <Button size="sm" onClick={handleAnalyze} disabled={!prompt.trim() || analyzing}
                  className="h-7 text-xs gap-1.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold shadow-md shadow-violet-600/25 disabled:opacity-50">
                  {analyzing
                    ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> {ANALYZE_STAGES[analyzeStage - 1] || 'Analyzing…'}</>
                    : <><Brain size={11} /> Analyze</>}
                </Button>
                <Button size="sm" onClick={handleGeminiValidate} disabled={!prompt.trim() || !analysis || validating}
                  className="h-7 text-xs gap-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold shadow-md shadow-blue-600/25 disabled:opacity-40">
                  {validating
                    ? <><span className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" /> AI Validating…</>
                    : <><Sparkles size={11} /> AI Validate</>}
                </Button>
              </div>
            </div>
            {/* Analyze stage progress */}
            {analyzing && (
              <div className="px-4 pb-3 space-y-1">
                {ANALYZE_STAGES.map((s, i) => (
                  <div key={s} className={`flex items-center gap-2 text-xs transition-all ${i < analyzeStage ? 'text-emerald-400' : i === analyzeStage ? 'text-violet-400' : 'text-slate-600'}`}>
                    {i < analyzeStage ? <Check size={10} /> : i === analyzeStage ? <RefreshCw size={10} className="animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />}
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Optimization controls */}
          <AnimatePresence>
            {analysis && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`${panel} space-y-3`}>
                <span className={`${label10} block mb-1`}>Optimization Mode</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {OPT_MODES.map(({ key, label, icon: Icon, desc }) => (
                    <button key={key} onClick={() => setOptMode(key)}
                      className={`flex flex-col items-start gap-0.5 p-2.5 rounded-xl border text-left transition-all ${
                        optMode === key
                          ? 'border-violet-500 bg-violet-600/15 text-white'
                          : dark ? 'border-slate-700 bg-slate-800/40 text-slate-400 hover:border-slate-500 hover:text-slate-200'
                                 : 'border-slate-200 text-slate-500 hover:border-violet-300 hover:bg-violet-50'
                      }`}>
                      <Icon size={12} className={optMode === key ? 'text-violet-400' : 'text-slate-500'} />
                      <span className="text-xs font-semibold">{label}</span>
                      <span className="text-[10px] opacity-50 leading-tight">{desc}</span>
                    </button>
                  ))}
                </div>
                {optimizing && (
                  <div className="space-y-1">
                    {OPTIMIZE_STAGES.map((s, i) => (
                      <div key={s} className={`flex items-center gap-2 text-xs ${i < optimizeStage ? 'text-emerald-400' : i === optimizeStage ? 'text-violet-400' : 'text-slate-600'}`}>
                        {i < optimizeStage ? <Check size={10} /> : i === optimizeStage ? <RefreshCw size={10} className="animate-spin" /> : <div className="w-2.5 h-2.5 rounded-full border border-slate-700" />}
                        {s}
                      </div>
                    ))}
                  </div>
                )}
                <Button onClick={handleOptimize} disabled={optimizing || !analysis}
                  className="w-full bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold shadow-lg shadow-violet-600/20 gap-2 disabled:opacity-50">
                  {optimizing
                    ? <><span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" /> Optimizing…</>
                    : <><Sparkles size={14} /> Optimize Prompt <ArrowRight size={12} /></>}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ══ RIGHT ══ */}
        <div>
          {/* Empty state */}
          {!analysis && !analyzing && (
            <div className={`${panel} h-72 flex flex-col items-center justify-center gap-4 text-center`}>
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
                <Brain size={26} className="text-violet-400" />
              </div>
              <div>
                <p className={`text-base font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>Write your prompt to start analysis</p>
                <p className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
                  PromptIQ evaluates every dimension of your prompt using deterministic, evidence-based scoring.
                </p>
              </div>
            </div>
          )}

          {analysis && (
            <motion.div key="results" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

              {/* Tabs */}
              <div className={`flex gap-1 p-1 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                {(['analysis', 'optimize', 'cost'] as const).map(t => (
                  <button key={t} onClick={() => setTab(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                      tab === t ? 'bg-violet-600 text-white shadow-sm' :
                      dark ? 'text-slate-500 hover:text-slate-200' : 'text-slate-500 hover:text-slate-700'
                    }`}>
                    {t === 'optimize' ? 'Optimized' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>

              {/* ── Analysis Tab ── */}
              {tab === 'analysis' && (
                <motion.div key="tab-a" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                  {/* Score + Task */}
                  <div className={panel}>
                    <div className="flex items-center gap-4">
                      <ScoreBadge score={analysis.score.overall} label={analysis.score.label} />
                      <div className="flex-1 space-y-2">
                        {/* Task detection */}
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                          {(() => { const I = taskIconMap[analysis.task.primary] || Cpu; return <I size={12} className="text-violet-400 flex-shrink-0" />; })()}
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] text-slate-500 leading-none mb-0.5">
                              {analysis.task.source === 'manual' ? 'Manual Selection' : `Auto-detected · ${Math.round(analysis.task.confidence * 100)}% confidence`}
                            </p>
                            <p className={`text-sm font-bold leading-tight truncate ${dark ? 'text-white' : 'text-slate-900'}`}>
                              {analysis.task.primary}
                              {analysis.task.useCase ? ` · ${analysis.task.useCase}` : ''}
                            </p>
                            {analysis.task.alternates && analysis.task.alternates.length > 0 && (
                              <p className="text-[10px] text-slate-500 mt-0.5">
                                Also: {analysis.task.alternates.map(a => `${a.task} (${Math.round(a.confidence * 100)}%)`).join(', ')}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Readiness */}
                        <div className={`px-3 py-2 rounded-xl border ${readinessCfg[analysis.readiness.status].bg} ${readinessCfg[analysis.readiness.status].border}`}>
                          <p className="text-[10px] text-slate-500 leading-none mb-0.5">Production Readiness</p>
                          <p className={`text-xs font-bold leading-tight ${readinessCfg[analysis.readiness.status].color}`}>{analysis.readiness.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Readiness gates */}
                  <div className={`${panel} space-y-2`}>
                    <p className={`${label10} mb-2`}>Readiness Gates</p>
                    {analysis.readiness.gates.map(g => (
                      <div key={g.id} className="flex items-center gap-2.5">
                        {g.passed
                          ? <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
                          : <XCircle      size={13} className="text-red-400 flex-shrink-0" />}
                        <span className={`text-xs flex-1 leading-tight ${g.passed ? 'text-slate-400' : dark ? 'text-white' : 'text-slate-800'}`}>{g.label}</span>
                        {g.value != null && <span className={`text-xs font-bold flex-shrink-0 ${g.passed ? 'text-emerald-400' : 'text-red-400'}`}>{g.value}</span>}
                        {!g.passed && g.reason && (
                          <span className="text-[10px] text-red-400 truncate max-w-[140px]">{g.reason}</span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Quality dimensions */}
                  <div className={`${panel} space-y-2.5`}>
                    <p className={`${label10} mb-2`}>Quality Dimensions</p>
                    {(Object.entries(analysis.score.dimensions) as [string, number][]).map(([k, v]) => (
                      <DimBar key={k} label={k.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())} value={v} />
                    ))}
                  </div>

                  {/* Issues */}
                  {analysis.issues.length > 0 ? (
                    <div className={`${panel} space-y-2`}>
                      <p className={`${label10} mb-2`}>Issues ({analysis.issues.length})</p>
                      {analysis.issues.map(i => <IssueCard key={i.id} issue={i} />)}
                    </div>
                  ) : (
                    <div className={`${panel} flex items-center gap-3`}>
                      <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-400">No significant issues detected</p>
                        <p className="text-xs text-slate-500">This prompt is well-specified for its intended task.</p>
                      </div>
                    </div>
                  )}

                  {/* Prompt structure */}
                  <div className={`${panel} space-y-2`}>
                    <p className={`${label10} mb-2`}>Prompt Structure</p>
                    <div className="grid grid-cols-2 gap-2">
                      {(Object.entries(analysis.structure) as [string, { present: boolean; quality: number; evidence?: string }][]).map(([sKey, val]) => (
                        <div key={sKey} className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${val.present ? (dark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200') : (dark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-50 border border-slate-200')}`}>
                          {val.present ? <Check size={10} className="text-emerald-400 flex-shrink-0" /> : <span className="w-2.5 h-2.5 rounded-full border border-slate-600 flex-shrink-0" />}
                          <span className={`text-xs font-medium capitalize leading-tight ${val.present ? (dark ? 'text-emerald-300' : 'text-emerald-700') : (dark ? 'text-slate-600' : 'text-slate-400')}`}>
                            {sKey.replace(/([A-Z])/g, ' $1')}
                          </span>
                          {val.present && <span className="ml-auto text-[10px] text-slate-500 flex-shrink-0">{val.quality}</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Challenge coverage */}
                  {challengeCoverage && challengeScore != null && (
                    <div className={`${panel} space-y-2`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className={label10}>Challenge Coverage</p>
                        <span className={`text-xs font-bold ${challengeScore >= 80 ? 'text-emerald-400' : challengeScore >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {challengeCoverage.filter(c => c.covered).length}/{challengeCoverage.length}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-700/60 mb-2">
                        <motion.div className={`h-full rounded-full ${challengeScore >= 80 ? 'bg-emerald-500' : challengeScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          initial={{ width: 0 }} animate={{ width: `${challengeScore}%` }} transition={{ duration: 0.7, ease: 'easeOut' }} />
                      </div>
                      {challengeCoverage.map(c => (
                        <div key={c.id} className="flex items-center gap-2">
                          {c.covered ? <CheckCircle2 size={11} className="text-emerald-400 flex-shrink-0" /> : <AlertCircle size={11} className="text-slate-600 flex-shrink-0" />}
                          <span className={`text-xs flex-1 ${c.covered ? 'text-slate-300' : 'text-slate-600'}`}>{c.label}</span>
                          <span className={`text-[10px] font-bold flex-shrink-0 ${c.covered ? 'text-emerald-400' : 'text-slate-700'}`}>{c.covered ? '✓' : '✗'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {/* ── Optimize Tab ── */}
              {tab === 'optimize' && (
                <motion.div key="tab-o" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {!optimization ? (
                    <div className={`${panel} h-52 flex flex-col items-center justify-center gap-3 text-center`}>
                      <Sparkles size={24} className="text-violet-400 opacity-60" />
                      <p className={`text-sm font-semibold ${dark ? 'text-white' : 'text-slate-800'}`}>No optimized version yet</p>
                      <p className="text-xs text-slate-500">Choose an optimization mode and click <strong className="text-violet-400">Optimize Prompt</strong></p>
                    </div>
                  ) : (
                    <>
                      {/* Before / After */}
                      <div className={panel}>
                        <p className={`${label10} mb-3`}>Before vs After</p>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className={`p-3 rounded-xl ${dark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <p className={`${label10} mb-1`}>Original</p>
                            <p className="text-2xl font-black text-slate-400">{optimization.before.score.overall}</p>
                            <p className="text-[10px] text-slate-500">{optimization.before.score.label}</p>
                            <p className="text-[10px] text-slate-600 mt-1">{optimization.before.tokens.inputTokens} tokens</p>
                            <p className="text-[10px] text-slate-600">{optimization.before.issues.length} issues</p>
                          </div>
                          <div className="flex flex-col items-center justify-center gap-1">
                            <ArrowRight size={16} className="text-violet-400" />
                            <span className={`text-xs font-bold ${optimization.scoreDelta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {optimization.scoreDelta > 0 ? '+' : ''}{optimization.scoreDelta}
                            </span>
                          </div>
                          <div className={`p-3 rounded-xl border ${optimization.scoreDelta > 0 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}>
                            <p className={`${label10} mb-1`}>Optimized</p>
                            <p className={`text-2xl font-black ${optimization.scoreDelta > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>{optimization.after.score.overall}</p>
                            <p className="text-[10px] text-slate-500">{optimization.after.score.label}</p>
                            <p className={`text-[10px] mt-1 ${optimization.tokenDelta <= 0 ? 'text-emerald-400' : 'text-orange-400'}`}>
                              {optimization.after.tokens.inputTokens} tokens ({optimization.tokenDelta > 0 ? '+' : ''}{optimization.tokenDeltaPct}%)
                            </p>
                            <p className={`text-[10px] ${optimization.issuesDelta > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {optimization.after.issues.length} issues {optimization.issuesDelta > 0 ? `(−${optimization.issuesDelta} fixed)` : ''}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Warning if requirements removed */}
                      {!optimization.requirementsPreserved && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-orange-500/30 bg-orange-500/10">
                          <AlertTriangle size={13} className="text-orange-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-bold text-orange-400">Requirements may have shifted</p>
                            <p className="text-xs text-slate-400 mt-0.5">Review: {optimization.removedRequirements.join(', ')}</p>
                          </div>
                        </div>
                      )}

                      {/* Changes */}
                      <div className={`${panel} space-y-1.5`}>
                        <p className={`${label10} mb-2`}>Changes Made</p>
                        {optimization.changes.map((c, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ${
                              c.type === 'added' ? 'bg-emerald-500/20 text-emerald-400' :
                              c.type === 'removed' ? 'bg-red-500/20 text-red-400' :
                              c.type === 'modified' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-700 text-slate-400'
                            }`}>{c.type}</span>
                            <span className="text-xs text-slate-400 leading-snug">{c.description}</span>
                          </div>
                        ))}
                      </div>

                      {/* Optimized prompt */}
                      <div className={`rounded-2xl border ${dark ? 'border-violet-500/25 bg-slate-900' : 'border-violet-300/60 bg-violet-50/30'} overflow-hidden`}>
                        <div className={`flex items-center justify-between px-4 py-2 border-b ${dark ? 'border-violet-500/15' : 'border-violet-200'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-400">Optimized Prompt</span>
                          <div className="flex gap-2">
                            <button onClick={() => copy(optimization.optimizedPrompt, 'opt')} className="flex items-center gap-1 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                              {copiedOpt ? <Check size={10} /> : <Copy size={10} />}
                              {copiedOpt ? 'Copied!' : 'Copy'}
                            </button>
                            <button onClick={() => { setPrompt(optimization.optimizedPrompt); setOptimization(null); setTab('analysis'); }}
                              className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                              <Check size={10} /> Accept
                            </button>
                          </div>
                        </div>
                        <pre className={`p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap max-h-80 overflow-y-auto ${dark ? 'text-slate-300' : 'text-slate-700'}`}>{optimization.optimizedPrompt}</pre>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {/* ── Cost Tab ── */}
              {tab === 'cost' && (
                <motion.div key="tab-c" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                  {/* Model selector */}
                  <div className={panel}>
                    <p className={`${label10} mb-2`}>Model</p>
                    <div className="grid grid-cols-1 gap-1.5">
                      {MODEL_CATALOGUE.map(m => (
                        <button key={m.id} onClick={() => setSelectedModel(m)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                            selectedModel.id === m.id
                              ? 'border-violet-500 bg-violet-600/15'
                              : dark ? 'border-slate-700 bg-slate-800/40 hover:border-slate-600' : 'border-slate-200 hover:border-violet-300'
                          }`}>
                          <div>
                            <p className={`text-xs font-semibold ${selectedModel.id === m.id ? 'text-violet-300' : dark ? 'text-slate-300' : 'text-slate-700'}`}>{m.name}</p>
                            <p className="text-[10px] text-slate-500">{m.provider}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-slate-500">${m.inputPricePer1M}/1M in · ${m.outputPricePer1M}/1M out</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Token breakdown */}
                  <div className={panel}>
                    <p className={`${label10} mb-2`}>Token Breakdown <span className="normal-case font-normal text-slate-600">(estimated)</span></p>
                    {[
                      { label: 'Input tokens',  val: analysis.tokens.inputTokens,  color: 'text-blue-400' },
                      { label: 'Output tokens', val: analysis.tokens.outputTokens, color: 'text-purple-400' },
                      { label: 'Total',          val: analysis.tokens.total,        color: dark ? 'text-white' : 'text-slate-900' },
                    ].map(({ label, val, color }) => (
                      <div key={label} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className={`text-sm font-bold ${color}`}>{val.toLocaleString()}</span>
                      </div>
                    ))}
                    {analysis.tokens.redundancyTokens > 0 && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-amber-400">
                        <TrendingUp size={11} />
                        ~{analysis.tokens.redundancyTokens} redundant tokens · {analysis.tokens.potentialSavingsPct}% potential saving
                      </div>
                    )}
                  </div>

                  {/* Cost */}
                  <div className={panel}>
                    <p className={`${label10} mb-2`}>Cost Estimate · {analysis.cost.model.name}</p>
                    {[
                      { label: 'Input cost',          val: `$${analysis.cost.inputCost.toFixed(6)}`      },
                      { label: 'Output cost',         val: `$${analysis.cost.outputCost.toFixed(6)}`     },
                      { label: 'Per request',         val: `$${analysis.cost.totalPerRequest.toFixed(6)}`},
                      { label: 'Daily (1K requests)', val: `$${analysis.cost.dailyCost.toFixed(4)}`      },
                      { label: 'Monthly (30K req.)',  val: `$${analysis.cost.monthlyCost.toFixed(2)}`    },
                    ].map(({ label, val }) => (
                      <div key={label} className={`flex items-center justify-between py-1.5 border-b last:border-0 ${dark ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="text-xs text-slate-500">{label}</span>
                        <span className="text-sm font-bold text-emerald-400">{val}</span>
                      </div>
                    ))}
                    <p className="text-[10px] text-slate-600 mt-2">* Output token count is estimated based on typical task output length</p>
                  </div>

                  {/* Security summary */}
                  {analysis.security.findings.length > 0 && (
                    <div className={`${panel} space-y-2`}>
                      <p className={`${label10} mb-2`}>Security Findings</p>
                      {analysis.security.findings.map(f => (
                        <div key={f.id} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border ${issueMeta[f.severity].border} ${issueMeta[f.severity].bg}`}>
                          {(() => { const I = issueMeta[f.severity].icon; return <I size={12} className={`${issueMeta[f.severity].color} flex-shrink-0 mt-0.5`} />; })()}
                          <div>
                            <p className={`text-xs font-bold ${issueMeta[f.severity].color}`}>{f.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{f.recommendation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Gemini AI Validation Panel ── */}
          {(geminiResult || validating) && (
            <motion.div
              key="gemini-panel"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${panel} space-y-4 mt-4`}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
                    <Sparkles size={12} className="text-blue-400" />
                  </div>
                  <div>
                    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-slate-900'}`}>
                      Gemini AI Validation
                    </p>
                    <p className="text-[10px] text-slate-500">Independent semantic evaluation · gemini-3.8-flash</p>
                  </div>
                </div>
                {geminiResult?.available && analysis && (() => {
                  const diff = Math.abs(geminiResult.overallScore - analysis.score.overall);
                  return diff > 15 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
                      ⚠ Needs Review
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                      ✓ Evaluators Agree
                    </span>
                  );
                })()}
              </div>

              {validating && !geminiResult && (
                <div className="flex items-center gap-3 py-6 justify-center">
                  <span className="w-5 h-5 rounded-full border-2 border-blue-500/30 border-t-blue-400 animate-spin" />
                  <span className="text-sm text-slate-500">Sending to Gemini for evaluation…</span>
                </div>
              )}

              {geminiResult && !geminiResult.available && (
                <div className={`flex items-start gap-3 px-3 py-3 rounded-xl border border-yellow-500/25 bg-yellow-500/10`}>
                  <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-yellow-400">Gemini Validation Unavailable</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{geminiResult.reason}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Internal rule-based analysis is still shown above. To enable AI validation, add <code className="text-blue-400">GEMINI_API_KEY=your_key</code> to your <code className="text-blue-400">.env.local</code> file.</p>
                  </div>
                </div>
              )}

              {geminiResult?.available && analysis && (() => {
                const g = geminiResult;
                const internalScore = analysis.score.overall;
                const diff = g.overallScore - internalScore;
                return (
                  <div className="space-y-4">

                    {/* Score comparison */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`px-4 py-3 rounded-xl border ${dark ? 'border-slate-700 bg-slate-800/60' : 'border-slate-200 bg-slate-50'} text-center`}>
                        <p className="text-[10px] text-slate-500 mb-1">Internal Engine</p>
                        <p className={`text-3xl font-black ${internalScore >= 80 ? 'text-emerald-400' : internalScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {internalScore}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{analysis.score.label}</p>
                      </div>
                      <div className={`px-4 py-3 rounded-xl border border-blue-500/25 bg-blue-500/10 text-center`}>
                        <p className="text-[10px] text-blue-400 mb-1">Gemini AI</p>
                        <p className={`text-3xl font-black ${g.overallScore >= 80 ? 'text-emerald-400' : g.overallScore >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {g.overallScore}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${diff > 0 ? 'text-emerald-400' : diff < 0 ? 'text-red-400' : 'text-slate-500'}`}>
                          {diff > 0 ? `+${diff} vs internal` : diff < 0 ? `${diff} vs internal` : 'Same as internal'}
                        </p>
                      </div>
                    </div>

                    {/* Requirement pass/fail */}
                    {g.requirementResults.length > 0 && (
                      <div>
                        <p className={`${label10} mb-2`}>Requirement Check (Gemini)</p>
                        <div className="space-y-1.5">
                          {g.requirementResults.map((r, i) => (
                            <div key={i} className={`flex items-start gap-2.5 px-3 py-2 rounded-xl border ${r.passed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-red-500/20 bg-red-500/5'}`}>
                              <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${r.passed ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                                {r.passed ? <Check size={9} className="text-emerald-400" /> : <X size={9} className="text-red-400" />}
                              </div>
                              <div className="min-w-0">
                                <p className={`text-xs font-semibold ${r.passed ? 'text-emerald-300' : 'text-red-300'}`}>{r.requirement}</p>
                                {r.note && <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{r.note}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Dimension scores comparison */}
                    <div>
                      <p className={`${label10} mb-2`}>Dimension Scores (Gemini)</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Req. Coverage', value: g.requirementCoverage },
                          { label: 'Clarity', value: g.clarity },
                          { label: 'Specificity', value: g.specificity },
                          { label: 'Task Definition', value: g.taskDefinition },
                          { label: 'Output Definition', value: g.outputDefinition },
                          { label: 'Reliability', value: g.reliability },
                          { label: 'Security', value: g.security },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex items-center gap-3">
                            <span className={`text-[10px] text-slate-500 w-28 flex-shrink-0`}>{label}</span>
                            <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${dark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                              <div
                                className={`h-full rounded-full transition-all ${value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-yellow-500' : value >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                                style={{ width: `${value}%` }}
                              />
                            </div>
                            <span className={`text-xs font-bold w-8 text-right ${value >= 80 ? 'text-emerald-400' : value >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Missing requirements */}
                    {g.missingRequirements.length > 0 && (
                      <div>
                        <p className={`${label10} mb-2`}>Missing Requirements</p>
                        <div className="space-y-1">
                          {g.missingRequirements.map((m, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-1.5 rounded-lg border border-red-500/20 bg-red-500/5">
                              <AlertTriangle size={10} className="text-red-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-slate-400 leading-relaxed">{m}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Ambiguities */}
                    {g.ambiguities.length > 0 && (
                      <div>
                        <p className={`${label10} mb-2`}>Ambiguities Detected</p>
                        <div className="space-y-1">
                          {g.ambiguities.map((a, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-1.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                              <Info size={10} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-slate-400 leading-relaxed">{a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {g.recommendations.length > 0 && (
                      <div>
                        <p className={`${label10} mb-2`}>Gemini Recommendations</p>
                        <div className="space-y-1.5">
                          {g.recommendations.map((r, i) => (
                            <div key={i} className="flex items-start gap-2 px-3 py-1.5 rounded-lg border border-blue-500/20 bg-blue-500/5">
                              <Lightbulb size={10} className="text-blue-400 mt-0.5 flex-shrink-0" />
                              <p className="text-[11px] text-slate-300 leading-relaxed">{r}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Gemini-optimized prompt */}
                    {g.optimizedPrompt && g.optimizedPrompt !== prompt && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className={`${label10}`}>Gemini Suggested Prompt</p>
                          <button
                            onClick={() => { setPrompt(g.optimizedPrompt); setGeminiResult(null); }}
                            className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-colors px-2 py-0.5 rounded border border-blue-500/30 hover:border-blue-400/50"
                          >
                            Use This Prompt ↑
                          </button>
                        </div>
                        <div className={`p-3 rounded-xl border text-[11px] font-mono leading-relaxed max-h-48 overflow-y-auto ${dark ? 'border-slate-700 bg-slate-800/60 text-slate-300' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
                          {g.optimizedPrompt}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}
