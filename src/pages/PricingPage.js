import React from 'react';
import { Link } from 'react-router-dom';
import { Check, X, Crown, Building2, ServerCog, Rocket, Sprout, Gift } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

const features = {
  exports: 'Exports (PDF/Excel)',
  priority: 'Priority queue',
  teams: 'Multi-user / Teams',
  sso: 'SSO / SCIM',
  lms: 'LMS Integration',
  residency: 'On-Prem / Data Residency',
  support: 'Support',
  setup: 'One-time Setup Fee',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      <PublicNavbar />
      {/* Hero */}
      <section className="relative edu-gradient-bg overflow-hidden">
        <div className="absolute inset-0 login-hero-bg opacity-[0.08]" aria-hidden="true" />
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900">SmartScript — Pricing (GHS ₵)</h1>
          <p className="mt-4 text-gray-700 max-w-3xl mx-auto">Simple, flexible pricing for tutors, schools, and exam authorities. Uploads are free; just pay for what you mark.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link to="/signup?plan=standard" className="inline-flex items-center gap-2 rounded-md bg-smart-indigo px-5 py-3 text-white shadow hover:bg-indigo-700 transition">
              Get Started
            </Link>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="py-14">
        <div className="mx-auto max-w-5xl px-6 grid md:grid-cols-2 gap-8">
          <PlanCard
            icon={Rocket}
            color="from-blue-600 to-indigo-600"
            name="Pay As You Go"
            price="Credits from ₵0.35"
            desc="Buy credits as you need them. No monthly subscription."
            bullets={[
              'No monthly fees - pay only for what you use',
              'Credits never expire',
              'OCR + AI marking included',
              'Exports: PDF & Excel',
              'Basic reports & per-subject grouping',
              'Email support',
              'Volume discounts available',
            ]}
            cta={{ label: 'Get Started', to: '/signup?plan=standard', plan: 'standard' }}
          />

          <PlanCard
            icon={Building2}
            color="from-purple-600 to-fuchsia-600"
            name="Organization"
            price="Custom pricing"
            desc="For large institutions, exam boards, and national bodies."
            bullets={[
              'Flexible billing (per-student / bulk)',
              'Central admin dashboard',
              'Unlimited subjects & schemes',
              'Advanced analytics & cohort reports',
              'SSO & LMS integration',
              'Priority support & onboarding',
              'On-Premise options available',
            ]}
            cta={{ label: 'Contact Sales', to: '#contact' }}
          />
        </div>
      </section>

      {/* How Billing Works */}
      <section className="py-10 bg-gray-50">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="text-2xl font-bold text-gray-900">Simple & Fair Billing</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>• <strong>Pay As You Go:</strong> Purchase credits to scan and mark scripts. 1 credit covers 2 pages.</li>
            <li>• <strong>Credits:</strong> 1 credit = 2 pages processed. Extra pages use more credits.</li>
            <li>• <strong>Trial:</strong> New accounts get 5 free scripts to test the system.</li>
          </ul>
        </div>
      </section>

      {/* CTAs */}
      <section className="py-14">
        <div className="mx-auto max-w-4xl text-center px-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link to="/signup?plan=standard" className="inline-flex items-center gap-2 rounded-md bg-smart-blue px-6 py-3 text-white shadow hover:bg-blue-700 transition">Get Started</Link>
            <a href="#contact" className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-6 py-3 hover:bg-black transition">Contact Sales</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-sm text-gray-600">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-smart-indigo" />
            <span className="font-semibold text-gray-900">SmartScript</span>
          </div>
          <nav className="flex items-center gap-6">
            <a className="hover:text-gray-900" href="#contact">Contact</a>
            <Link className="hover:text-gray-900" to="/login">Sign in</Link>
          </nav>
          <div className="text-gray-500">© {new Date().getFullYear()} SmartScript</div>
        </div>
      </footer>
    </div>
  );
}

function PlanCard({ icon: Icon, color, name, price, desc, bullets = [], cta, promoted }) {
  return (
    <div className={`relative rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition h-full flex flex-col ${promoted ? 'ring-2 ring-fuchsia-200' : ''}`}>
      {promoted && (
        <div className="absolute -top-3 right-4 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-600 px-3 py-1 text-white text-xs shadow">Most popular</div>
      )}
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 rounded-xl text-white grid place-items-center bg-gradient-to-r ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
          <div className="text-gray-700">{price}</div>
        </div>
      </div>
      <p className="mt-2 text-gray-700">{desc}</p>
      <ul className="mt-4 space-y-2 text-gray-700">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> {b}</li>
        ))}
      </ul>
      {cta && (
        <div className="mt-auto pt-4">
          <Link to={cta.to} onClick={() => { if (cta.plan) localStorage.setItem('selectedPlan', cta.plan); }} className="inline-flex items-center gap-2 rounded-md bg-gray-900 text-white px-5 py-3 hover:bg-black transition w-full justify-center">{cta.label}</Link>
        </div>
      )}
    </div>
  );
}

function Th({ children }) {
  return <th className="px-4 py-3 text-left font-semibold">{children}</th>;
}

function Tr({ label, cells = [] }) {
  return (
    <tr>
      <td className="px-4 py-3 font-medium text-gray-900 align-top">{label}</td>
      {cells.map((c, i) => (
        <td key={i} className="px-4 py-3 text-gray-700 align-top">{renderCell(c)}</td>
      ))}
    </tr>
  );
}

function True() {
  return <span className="inline-flex items-center gap-1 text-emerald-600"><Check className="w-4 h-4" /> <span className="hidden sm:inline">Yes</span></span>;
}
function False() {
  return <span className="inline-flex items-center gap-1 text-rose-600"><X className="w-4 h-4" /> <span className="hidden sm:inline">No</span></span>;
}
function renderCell(value) {
  if (value === True()) return True();
  if (value === False()) return False();
  if (value === true) return True();
  if (value === false) return False();
  return value;
}
