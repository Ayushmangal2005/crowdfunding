import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { 
  Calendar, 
  DollarSign, 
  Users, 
  Target, 
  MessageCircle,
  Share2,
  Heart,
  Clock,
  TrendingUp,
  User,
  Building,
  Mail
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_your_publishable_key_here');

const InvestmentForm = ({ campaign, onSuccess }) => {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useSnackbar();
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !amount) return;

    setLoading(true);

    try {
      // Create payment intent
      const { data } = await axios.post('/api/investments/create-payment-intent', {
        amount: parseInt(amount),
        campaignId: campaign._id
      });

      // Confirm payment
      const result = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (result.error) {
        showError(result.error.message);
      } else {
        // Payment succeeded
        await axios.post('/api/investments/confirm-payment', {
          paymentIntentId: result.paymentIntent.id,
          campaignId: campaign._id,
          amount: parseInt(amount)
        });

        showSuccess('Investment successful!');
        onSuccess();
      }
    } catch (error) {
      showError('Payment failed. Please try again.');
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Investment Amount ($)
        </label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          min="1"
          max={campaign.goalAmount - campaign.raisedAmount}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter amount"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <div className="p-4 border border-gray-300 rounded-lg">
          <CardElement 
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : `Invest $${amount || 0}`}
      </button>
    </form>
  );
};

const CampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showInvestModal, setShowInvestModal] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchCampaign();
  }, [id]);

  const fetchCampaign = async () => {
    try {
      const response = await axios.get(`/api/campaigns/${id}`);
      setCampaign(response.data);
    } catch (error) {
      console.error('Error fetching campaign:', error);
      showError('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!user) {
      showError('Please login to start a chat');
      return;
    }

    try {
      const response = await axios.post('/api/chat/create', {
        participantId: campaign.creator._id,
        campaignId: campaign._id
      });

      navigate('/chat', { state: { chatId: response.data._id } });
    } catch (error) {
      console.error('Error starting chat:', error);
      showError('Failed to start chat');
    }
  };

  const calculateProgress = () => {
    return Math.min((campaign.raisedAmount / campaign.goalAmount) * 100, 100);
  };

  const getDaysLeft = () => {
    const now = new Date();
    const deadline = new Date(campaign.deadline);
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading campaign..." />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign not found</h2>
          <p className="text-gray-600">The campaign you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="h-64 bg-gradient-to-br from-blue-400 to-purple-500"></div>
          <div className="p-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center mb-4">
                  <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                    {campaign.category}
                  </span>
                  <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                    campaign.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {campaign.status}
                  </span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
                <p className="text-lg text-gray-600 mb-6">{campaign.description}</p>
                
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    <span>{campaign.creator.company}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{campaign.creator.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-600">Funding Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(calculateProgress())}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${calculateProgress()}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.raisedAmount)}</div>
                    <div className="text-sm text-gray-600">Raised</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{formatCurrency(campaign.goalAmount)}</div>
                    <div className="text-sm text-gray-600">Goal</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{getDaysLeft()}</div>
                    <div className="text-sm text-gray-600">Days Left</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Take Action</h3>
                  <div className="space-y-4">
                    {user && user.role === 'investor' && (
                      <button
                        onClick={() => setShowInvestModal(true)}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                      >
                        <DollarSign className="inline h-5 w-5 mr-2" />
                        Invest Now
                      </button>
                    )}
                    
                    {user && user._id !== campaign.creator._id && (
                      <button
                        onClick={handleStartChat}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                      >
                        <MessageCircle className="inline h-5 w-5 mr-2" />
                        Start Chat
                      </button>
                    )}

                    <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      <Share2 className="inline h-5 w-5 mr-2" />
                      Share
                    </button>

                    <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      <Heart className="inline h-5 w-5 mr-2" />
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('updates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'updates'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Updates
              </button>
              <button
                onClick={() => setActiveTab('backers')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'backers'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Backers ({campaign.backers.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">About This Project</h3>
                  <p className="text-gray-600 leading-relaxed">{campaign.description}</p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">Campaign Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center">
                      <Target className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Funding Goal</div>
                        <div className="text-gray-600">{formatCurrency(campaign.goalAmount)}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Deadline</div>
                        <div className="text-gray-600">{new Date(campaign.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Progress</div>
                        <div className="text-gray-600">{Math.round(calculateProgress())}% funded</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 text-blue-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Backers</div>
                        <div className="text-gray-600">{campaign.backers.length} supporters</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'updates' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Project Updates</h3>
                {campaign.updates && campaign.updates.length > 0 ? (
                  <div className="space-y-6">
                    {campaign.updates.map((update, index) => (
                      <div key={index} className="border-b border-gray-200 pb-6 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{update.title}</h4>
                          <span className="text-sm text-gray-500">
                            {new Date(update.date).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-600">{update.content}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No updates available yet.</p>
                )}
              </div>
            )}

            {activeTab === 'backers' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Backers</h3>
                {campaign.backers.length > 0 ? (
                  <div className="space-y-4">
                    {campaign.backers.map((backer, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-gray-900">{backer.investor.name}</div>
                            <div className="text-sm text-gray-500">
                              {new Date(backer.date).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(backer.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No backers yet. Be the first to support this project!</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Investment Modal */}
      {showInvestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Invest in {campaign.title}</h3>
              <button
                onClick={() => setShowInvestModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <Elements stripe={stripePromise}>
              <InvestmentForm 
                campaign={campaign} 
                onSuccess={() => {
                  setShowInvestModal(false);
                  fetchCampaign();
                }}
              />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampaignDetails;