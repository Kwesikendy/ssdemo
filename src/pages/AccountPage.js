import React, { useEffect, useState, useContext } from 'react';
import api from '../api/axios';
import { Link } from 'react-router-dom';
import PaystackPayment from '../components/PaystackPayment';
import LoadingSpinner from '../components/LoadingSpinner';
import { CreditCard, Coins, Save } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../components/ToastProvider';
import Select from 'react-select';

export default function AccountPage(){
  const { user, setUser } = useContext(AuthContext);
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [billing, setBilling] = useState(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [credits, setCredits] = useState(0);
  const [showCreditPackages, setShowCreditPackages] = useState(false);
  const [changingPlan, setChangingPlan] = useState(false);
  const [llmModel, setLlmModel] = useState(() => localStorage.getItem('preferredLLMModel') || '');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, b] = await Promise.all([
          api.get('/account/profile'),
          api.get('/account/billing')
        ]);
        setProfile(p.data.data);
        setBilling(b.data.data);
        setFirstName(p.data.data.first_name || '');
        setLastName(p.data.data.last_name || '');
        
        // Set credits from billing data
        setCredits(b.data.data.credits || 0);
      } catch (e){
        setError(e?.response?.data?.error?.message || 'Failed to load account');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    toast.info('Saving profile...');
    try {
      const res = await api.patch('/account/profile', { first_name: firstName, last_name: lastName });
      setProfile(res.data.data);
      const successMsg = 'Profile updated successfully';
      setMessage(successMsg);
      toast.success(successMsg);
    } catch (e){
      const errorMsg = e?.response?.data?.error?.message || 'Failed to update';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const fetchBillingData = async () => {
    try {
      const response = await api.get('/account/billing');
      setBilling(response.data.data);
      setCredits(response.data.data.credits || 0);
      
  // Update user context credits/plan immediately to refresh navbar
  setUser(prev => prev ? { ...prev, credits: response.data.data.credits || 0, plan: response.data.data.plan } : prev);
    } catch (e) {
      console.error('Failed to fetch billing data:', e);
    }
  };

  const changePlan = async (plan) => {
    setChangingPlan(true);
    setMessage('');
    setError('');
    toast.info(`Changing plan to ${plan.toUpperCase()}...`);
    try {
      const res = await api.post('/account/change-plan', { plan });
      setBilling(res.data.data);
      setCredits(res.data.data.credits || 0);
      const successMsg = `Plan changed to ${res.data.data.plan.toUpperCase()}. Credits converted.`;
      setMessage(successMsg);
      toast.success(successMsg);
      await fetchBillingData();
    } catch (e) {
      const errorMsg = e?.response?.data?.error?.message || 'Failed to change plan';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setChangingPlan(false);
    }
  };

  // LLM model options from Groq, covering major makers
  const llmOptions = [
    { label: 'Meta - Llama 3.3 70B', value: 'llama-3.3-70b-versatile' },
    { label: 'OpenAI - GPT-OSS 120B', value: 'openai/gpt-oss-120b' }
  ];

  const savePreferredModel = async (option) => {
    const value = option?.value || '';
    setLlmModel(value);
    localStorage.setItem('preferredLLMModel', value);
    setMessage('Preferred LLM saved');
    // Best-effort persist to backend if supported
    try {
      await api.post('/account/preferences', { llm_model: value });
    } catch (e) {
      // ignore if endpoint not available
    }
  };

  const planBadge = () => {
    if (!billing) return null;
    const base = 'inline-flex items-center px-2 py-1 rounded text-xs font-medium';
    const color = billing.on_prem ? 'bg-gray-900 text-white' : billing.plan === 'pro' ? 'bg-fuchsia-600 text-white' : 'bg-blue-600 text-white';
    const label = billing.on_prem ? 'On-Premise' : billing.plan ? billing.plan.charAt(0).toUpperCase()+billing.plan.slice(1) : 'Starter';
    return <span className={`${base} ${color}`}>{label}</span>;
  };

  // Dynamic package pricing based on plan
  // Assumption: per-credit price scales up with package size as requested.
  // Starter per-credit: 50->1.00, 100->0.90, 250->0.80, 500->0.70 (decreasing)
  // Pro per-credit:     50->1.30, 100->1.20, 250->1.10, 500->1.00 (decreasing)
  const getPerCreditPrice = (plan, credits) => {
    const p = plan === 'pro' ? 'pro' : 'starter';
    const table = {
      starter: { 50: 1.0, 100: 0.9, 250: 0.8, 500: 0.7 },
      pro: { 50: 1.3, 100: 1.2, 250: 1.1, 500: 1.0 },
    };
    return table[p][credits] || table[p][50];
  };

  const computePackagePrice = (plan, credits) => {
    const unit = getPerCreditPrice(plan, credits);
    // Round to 2 decimals for display
    return Math.round(credits * unit * 100) / 100;
  };

  const creditPackages = [50, 100, 250, 500].map((c, idx) => ({
    credits: c,
    // Compute price by plan; if billing not loaded yet, assume starter
    price: computePackagePrice(billing?.plan || 'starter', c),
    unit: getPerCreditPrice(billing?.plan || 'starter', c),
    popular: c === 100,
  }));

  const handlePaymentSuccess = async (response) => {
    try {
      // Verify payment on backend
      const verifyResponse = await api.post('/account/verify-payment', {
        reference: response.reference
      });
      
      if (verifyResponse.data.success) {
        const creditsAdded = verifyResponse.data.data.credits_added;
        setMessage(`Payment successful! ${creditsAdded} credits have been added to your account.`);
        setShowCreditPackages(false);
        
        // Refresh billing data to get updated credits
        await fetchBillingData();
      } else {
        setError('Payment verification failed. Please contact support.');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setError('Payment verification failed. Please contact support.');
    }
  };

  const handlePaymentClose = () => {
    // Payment popup was closed
  };

  if (loading){
    return <div className="p-8">Loading account…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Account</h1>
        <div>{planBadge()}</div>
      </div>

      {error && <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">{error}</div>}
      {message && <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm">{message}</div>}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Credits & Usage</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-yellow-500" />
                <span className="text-gray-700">Available Credits</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{credits}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Credits are used for OCR processing and AI marking.</p>
              <p className="mt-1">• 1 credit = 1 script (up to 3 pages)</p>
            </div>

            <button 
              onClick={() => setShowCreditPackages(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md text-white bg-green-600 hover:bg-green-700 transition"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <form onSubmit={saveProfile} className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">First name</label>
              <input value={firstName} onChange={e=>setFirstName(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Last name</label>
              <input value={lastName} onChange={e=>setLastName(e.target.value)} className="mt-1 w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Email</label>
              <input value={profile?.email || ''} disabled className="mt-1 w-full border rounded-md p-2 bg-gray-50" />
            </div>
            <button disabled={saving} className="mt-2 inline-flex items-center justify-center px-4 py-2 rounded-md text-white bg-smart-indigo hover:opacity-90 disabled:opacity-50">
              {saving ? (
                <>
                  <LoadingSpinner size="small" className="mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save changes
                </>
              )}
            </button>
          </form>
          <div className="mt-6">
            <label className="text-sm text-gray-600">Preferred LLM (Groq)</label>
            <Select
              className="mt-1"
              options={llmOptions}
              value={llmOptions.find(o => o.value === llmModel) || null}
              onChange={savePreferredModel}
              placeholder="Select a model"
            />
            <p className="mt-1 text-xs text-gray-500">Used by AI marking. Covers one from Meta, Mistral, Qwen, and an OpenAI-compatible family hosted by Groq.</p>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Billing</h2>
          {billing ? (
            <div className="space-y-2 text-sm text-gray-700">
              <div>Current plan: <strong className="text-gray-900">{billing.on_prem ? 'On-Premise' : (billing.plan?.toUpperCase() || 'STARTER')}</strong></div>
              {billing.plan_seats ? <div>Seats: <strong className="text-gray-900">{billing.plan_seats}</strong></div> : null}
              {billing.is_seat && billing.parent_tenant_id ? (
                <div className="text-gray-600">You’re a seat under organization <code className="px-1 py-0.5 bg-gray-100 rounded">{billing.parent_tenant_id}</code></div>
              ) : null}
              {!billing.on_prem && (
                <div className="flex gap-2 pt-2">
                  {billing.plan !== 'pro' ? (
                    <button
                      disabled={changingPlan}
                      onClick={() => changePlan('pro')}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md text-white bg-fuchsia-600 hover:bg-fuchsia-700 disabled:opacity-50"
                    >{changingPlan ? 'Upgrading…' : 'Upgrade to Pro'}</button>
                  ) : (
                    <button
                      disabled={changingPlan}
                      onClick={() => changePlan('starter')}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 disabled:opacity-50"
                    >{changingPlan ? 'Switching…' : 'Switch to Starter'}</button>
                  )}
                </div>
              )}
              {!billing.on_prem && (
                <div className="pt-2">
                  <Link to="/pricing" className="inline-flex items-center justify-center px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">View plans</Link>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-600">Unable to load billing info.</div>
          )}
        </div>
      </div>

      {/* Credit Packages Modal */}
      {showCreditPackages && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Buy Credits</h3>
                <button 
                  onClick={() => setShowCreditPackages(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-gray-600 mt-2">Choose a credit package to continue using SmartScript for OCR and AI marking.</p>
            </div>
            
            <div className="p-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {creditPackages.map((pkg, index) => (
                  <div key={index} className={`relative border rounded-lg p-4 hover:shadow-md transition ${pkg.popular ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'}`}>
                    {pkg.popular && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">Popular</span>
                      </div>
                    )}
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">{pkg.credits}</div>
                      <div className="text-sm text-gray-600">Credits</div>
                      <div className="mt-2 text-lg font-semibold text-green-600">₵{pkg.price}</div>
                      <div className="text-xs text-gray-500">₵{pkg.unit.toFixed(2)} per credit</div>
                    </div>
                    
                    <PaystackPayment
                      amount={pkg.price}
                      credits={pkg.credits}
                      metadata={{
                        package_type: 'credits',
                        user_id: profile?.user_id,
                        plan: billing?.plan || 'starter',
                        unit_price: pkg.unit,
                      }}
                      onSuccess={handlePaymentSuccess}
                      onClose={handlePaymentClose}
                    >
                      <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition">
                        Buy {pkg.credits} Credits
                      </button>
                    </PaystackPayment>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div className="text-sm text-blue-800">
                    <p className="font-medium">About Credits:</p>
                    <ul className="mt-1 space-y-1">
                      <li>• Credits are used for OCR processing and AI marking</li>
                      <li>• 1 credit = 1 script (up to 3 pages)</li>
                      <li>• Additional pages cost extra credits</li>
                      <li>• Credits never expire</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
