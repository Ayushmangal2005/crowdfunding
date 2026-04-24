import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { load } from '@cashfreepayments/cashfree-js';
import axios from 'axios';
import { CheckCircle, TrendingUp, MessageCircle, BarChart3, Shield, Zap } from 'lucide-react';

const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_ENV || 'sandbox';

const investorFeatures = [
  { icon: <TrendingUp className="h-5 w-5 text-blue-500" />, text: 'Invest in unlimited campaigns' },
  { icon: <MessageCircle className="h-5 w-5 text-blue-500" />, text: 'Chat directly with startups' },
  { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, text: 'Full portfolio tracking & analytics' },
  { icon: <Shield className="h-5 w-5 text-blue-500" />, text: 'Verified startup profiles' },
  { icon: <Zap className="h-5 w-5 text-blue-500" />, text: 'Early access to new campaigns' },
  { icon: <CheckCircle className="h-5 w-5 text-blue-500" />, text: 'Priority customer support' },
];

const startupFeatures = [
  { icon: <Zap className="h-5 w-5 text-blue-500" />, text: 'Create and publish campaigns' },
  { icon: <TrendingUp className="h-5 w-5 text-blue-500" />, text: 'Raise funds from verified investors' },
  { icon: <MessageCircle className="h-5 w-5 text-blue-500" />, text: 'Chat directly with investors' },
  { icon: <BarChart3 className="h-5 w-5 text-blue-500" />, text: 'Campaign analytics & tracking' },
  { icon: <Shield className="h-5 w-5 text-blue-500" />, text: 'Verified startup badge' },
  { icon: <CheckCircle className="h-5 w-5 text-blue-500" />, text: 'Priority customer support' },
];

const Subscription = () => {
  const { user, fetchUser } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);

  const isStartup = user?.role === 'startup';
  const price = isStartup ? 50 : 100;
  const features = isStartup ? startupFeatures : investorFeatures;

  // Handle redirect back from Cashfree
  useEffect(() => {
    const orderId = searchParams.get('order_id');
    if (orderId && user) {
      verifyAndActivate(orderId);
    }
  }, [user]);

  const verifyAndActivate = async (orderId) => {
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_SERVER_URL}/api/subscriptions/verify`, { orderId }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      await fetchUser();
      showSuccess('Subscription activated! Welcome to FundFlow.');
      navigate('/dashboard');
    } catch (err) {
      showError(err.response?.data?.message || 'Subscription verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data } = await axios.post(
        `${import.meta.env.VITE_SERVER_URL}/api/subscriptions/create-order`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const cashfree = await load({ mode: CASHFREE_MODE });
      cashfree.checkout({
        paymentSessionId: data.paymentSessionId,
        redirectTarget: '_modal',
      }).then(async (result) => {
        if (result.error) {
          showError(result.error.message || 'Payment failed');
          setLoading(false);
          return;
        }
        if (result.paymentDetails || result.redirect) {
          await verifyAndActivate(data.orderId);
        }
      });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to initiate payment');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isStartup ? 'Startup Access' : 'Investor Access'}
          </h1>
          <p className="text-gray-600 mt-2">
            {isStartup ? 'Subscribe to create and publish campaigns' : 'Subscribe to start investing in startups'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Plan header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white text-center">
            <p className="text-sm font-medium uppercase tracking-wide opacity-80">Monthly Plan</p>
            <div className="mt-2 flex items-baseline justify-center">
              <span className="text-5xl font-bold">₹{price}</span>
              <span className="ml-2 text-lg opacity-80">/month</span>
            </div>
            <p className="mt-2 text-sm opacity-80">30 days access · Cancel anytime</p>
          </div>

          {/* Features */}
          <div className="p-6 space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3">
                {f.icon}
                <span className="text-gray-700">{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="px-6 pb-6">
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
            >
              {isStartup ? 'Subscribe & Start Creating' : 'Subscribe & Start Investing'}
            </button>
            <p className="text-center text-xs text-gray-500 mt-3">
              Secure payment powered by Cashfree
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
