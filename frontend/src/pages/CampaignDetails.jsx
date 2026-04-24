import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import {
  Calendar,
  Target,
  MessageCircle,
  Building,
  User,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';


const CampaignDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showError } = useSnackbar();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
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
                    <span>{campaign.creator?.company}</span>
                  </div>
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    <span>{campaign.creator?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Created {new Date(campaign.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action */}
            {user && user.role === 'investor' && (
              <div className="mt-6">
                <button
                  onClick={handleStartChat}
                  className="bg-white border border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  <MessageCircle className="inline h-5 w-5 mr-2" />
                  Start Chat
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overview */}
        <div className="bg-white rounded-xl shadow-sm mb-8">
          <div className="p-8 space-y-6">
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
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default CampaignDetails;
