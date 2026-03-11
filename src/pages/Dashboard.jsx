import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import { 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Star,
  ArrowRight,
  Target,
  Edit,
  Trash2
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const [campaigns, setCampaigns] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      if (user.role === 'startup') {
        const campaignsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/campaigns/user/${user._id}`);
        setCampaigns(campaignsResponse.data);
        
        const statsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/campaigns/stats/${user._id}`);
        setStats(statsResponse.data);
      } else if (user.role === 'investor') {
        const investmentsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/investments/user/${user._id}`);
        setInvestments(investmentsResponse.data);
        
        const campaignsResponse = await axios.get(`${import.meta.env.VITE_SERVER_URL}/api/campaigns`);
        setCampaigns(campaignsResponse.data.campaigns);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (window.confirm('Are you sure you want to delete this campaign?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_SERVER_URL}/api/campaigns/${campaignId}`);
        showSuccess('Campaign deleted successfully');
        fetchData();
      } catch (error) {
        showError('Failed to delete campaign');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateProgress = (raised, goal) => {
    return Math.min((raised / goal) * 100, 100);
  };

  if (loading) {
    return <LoadingSpinner fullScreen text="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user.name}!
          </h1>
          <p className="mt-2 text-gray-600">
            {user.role === 'startup' 
              ? 'Manage your campaigns and track your progress' 
              : 'Discover and invest in innovative startups'
            }
          </p>
        </div>

        {/* Stats Cards */}
        {user.role === 'startup' && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Campaigns</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCampaigns || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="bg-green-100 p-3 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Raised</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRaised || 0)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Backers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalBackers || 0}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Target className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.successRate || 0}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Startup Dashboard */}
        {user.role === 'startup' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Your Campaigns</h2>
              <Link
                to="/create-campaign"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create Campaign
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-6">Start by creating your first campaign to raise funds for your startup</p>
                <Link
                  to="/create-campaign"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Create Your First Campaign
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {campaigns.map((campaign) => (
                  <div key={campaign._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">{campaign.title}</h3>
                        <div className="flex space-x-2">
                          <button className="text-blue-600 hover:text-blue-700">
                            <Edit className="h-5 w-5" />
                          </button>
                          <button 
                            onClick={() => deleteCampaign(campaign._id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">{campaign.description}</p>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(calculateProgress(campaign.raisedAmount, campaign.goalAmount))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${calculateProgress(campaign.raisedAmount, campaign.goalAmount)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Raised</p>
                          <p className="font-semibold">{formatCurrency(campaign.raisedAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Goal</p>
                          <p className="font-semibold">{formatCurrency(campaign.goalAmount)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Deadline</p>
                          <p className="font-semibold">{new Date(campaign.deadline).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <Link
                        to={`/campaign/${campaign._id}`}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-semibold transition-colors inline-flex items-center justify-center"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Investor Dashboard */}
        {user.role === 'investor' && (
          <div className="space-y-8">
            {/* My Investments */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">My Investments</h2>
              {investments.length === 0 ? (
                <div className="bg-white p-12 rounded-xl shadow-sm text-center">
                  <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No investments yet</h3>
                  <p className="text-gray-600">Start investing in innovative startups below</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {investments.map((investment) => (
                    <div key={investment._id} className="bg-white p-6 rounded-xl shadow-sm">
                      <h3 className="font-semibold text-gray-900 mb-2">{investment.campaign.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">Invested: {formatCurrency(investment.amount)}</p>
                      <Link
                        to={`/campaign/${investment.campaign._id}`}
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        View Campaign →
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Available Campaigns */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Campaigns</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.slice(0, 6).map((campaign) => (
                  <div key={campaign._id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          {campaign.category}
                        </span>
                        <div className="flex items-center text-yellow-500">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-sm text-gray-600 ml-1">4.8</span>
                        </div>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {campaign.description}
                      </p>

                      <div className="mb-4">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(calculateProgress(campaign.raisedAmount, campaign.goalAmount))}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                            style={{ width: `${calculateProgress(campaign.raisedAmount, campaign.goalAmount)}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <p className="text-sm text-gray-600">Raised</p>
                          <p className="font-semibold">{formatCurrency(campaign.raisedAmount)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Goal</p>
                          <p className="font-semibold">{formatCurrency(campaign.goalAmount)}</p>
                        </div>
                      </div>

                      <Link
                        to={`/campaign/${campaign._id}`}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 inline-flex items-center justify-center"
                      >
                        View Details
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;