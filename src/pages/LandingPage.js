import React from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, FileSpreadsheet, Brain, ShieldCheck, Upload, CheckCircle2 } from 'lucide-react';
import PublicNavbar from '../components/PublicNavbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <PublicNavbar />
        <div className="absolute inset-0 -z-10 edu-gradient-bg" />
        <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-indigo-700 text-sm mb-4">
                <ShieldCheck className="w-4 h-4" />
                Secure, scalable assessment
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight">
                AI‑assisted grading platform for modern educators
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Streamline marking with OCR, LLM-based scoring, and human review. Focus on feedback—let Smartscript handle the rest.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/signup" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 text-white shadow hover:bg-indigo-700 transition">
                  Get started
                </Link>
                <a href="#features" className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-3 text-gray-700 hover:bg-gray-50 transition">
                  Learn more
                </a>
                <Link to="/pricing" className="inline-flex items-center gap-2 rounded-md border border-indigo-600 text-indigo-600 px-5 py-3 hover:bg-indigo-50 transition">
                  View pricing
                </Link>
              </div>
              <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Privacy-first</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Role-based access</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500"/> Export-ready</div>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-xl bg-white/80 backdrop-blur shadow-xl ring-1 ring-black/5 p-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <FeatureCard icon={Upload} title="OCR Intake" desc="Upload scripts; we extract text automatically."/>
                  <FeatureCard icon={Brain} title="LLM Scoring" desc="Consistent AI scoring aligned to schemes."/>
                  <FeatureCard icon={ShieldCheck} title="Human Review" desc="Override and validate with transparency."/>
                  <FeatureCard icon={FileSpreadsheet} title="Export" desc="Stream results to CSV/Excel or APIs."/>
                </div>
              </div>
              <div className="absolute -right-4 -bottom-4 w-44 h-44 rounded-full bg-edu-green/20 blur-2xl"/>
            </div>
          </div>
        </div>
      </header>

      {/* Stats / badges */}
      <section className="py-12 border-t border-gray-100">
        <div className="mx-auto max-w-7xl px-6 grid sm:grid-cols-3 gap-6 text-center">
          <Stat title="Faster marking" value="5x"/>
          <Stat title="Manual effort saved" value="60%"/>
          <Stat title="Exports generated" value="1K+"/>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-16 sm:py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Purpose‑built for academic workflows</h2>
          <p className="mt-3 text-gray-600 text-center max-w-2xl mx-auto">From intake to export, Smartscript integrates seamlessly with your marking schemes and group structures.</p>

          <div className="mt-10 grid lg:grid-cols-3 gap-6">
            <BigFeature
              icon={Upload}
              title="Flexible intake"
              desc="Drag‑and‑drop PDFs or images, auto‑classified by group and scheme."
              bullets={["Bulk uploads","File validation","Retry & resume"]}
            />
            <BigFeature
              icon={Brain}
              title="Explainable AI"
              desc="Transparent scoring with rationales aligned to your criteria."
              bullets={["Policy versions","Prompt controls","Threshold tuning"]}
            />
            <BigFeature
              icon={GraduationCap}
              title="Academic integrity"
              desc="Human review, audit trails, and exportable reports for moderation."
              bullets={["Role permissions","Change history","CSV/Excel export"]}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl text-center px-6">
          <h3 className="text-2xl sm:text-3xl font-semibold text-gray-900">Ready to modernize your marking?</h3>
          <p className="mt-3 text-gray-600">Sign up to start a secure trial in your environment. No data leaves your machine.</p>
          <Link to="/signup" className="mt-6 inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-white shadow hover:bg-indigo-700 transition">
            Get started
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-sm text-gray-600">
        <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-smart-indigo"/>
            <span className="font-semibold text-gray-900">Smartscript</span>
          </div>
          <nav className="flex items-center gap-6">
            <a className="hover:text-gray-900" href="#features">Features</a>
            <a className="hover:text-gray-900" href="#">Docs</a>
            <a className="hover:text-gray-900" href="#">Privacy</a>
            <Link className="hover:text-gray-900" to="/pricing">Pricing</Link>
          </nav>
          <div className="text-gray-500">© {new Date().getFullYear()} Smartscript</div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }){
  return (
    <div className="rounded-lg border border-gray-100 p-4 bg-white hover:shadow-md transition">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-indigo-50">
          <Icon className="w-5 h-5 text-smart-indigo" />
        </span>
        <div>
          <div className="font-semibold text-gray-900">{title}</div>
          <div className="text-sm text-gray-600">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function Stat({ title, value }){
  return (
    <div className="rounded-xl bg-white border border-gray-100 p-6 shadow-sm">
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      <div className="mt-1 text-gray-600">{title}</div>
    </div>
  );
}

function BigFeature({ icon: Icon, title, desc, bullets = [] }){
  return (
    <div className="rounded-xl bg-white p-6 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-edu-muted">
          <Icon className="w-5 h-5 text-smart-indigo" />
        </span>
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <p className="mt-2 text-gray-600">{desc}</p>
      <ul className="mt-4 space-y-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
