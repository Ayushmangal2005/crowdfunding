import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Rocket,
  Users,
  DollarSign,
  TrendingUp,
  ArrowRight,
  Star,
  Calendar,
  Target,
} from 'lucide-react';

const Home = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    totalFunded: 0,
    totalUsers: 0,
    successRate: 0,
  });

  useEffect(() => {
    fetchCampaigns();
    fetchStats();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const API_URL = import.meta.env.VITE_SERVER_URL ;
      const response = await axios.get(`${API_URL}/api/campaigns?limit=6`);
      const fetchedCampaigns = response?.data?.campaigns ?? [];
      setCampaigns(fetchedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${API_URL}/api/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
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

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Fund the Future</h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Connect innovative startups with passionate investors. Transform ideas into reality through collaborative funding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center justify-center"
            >
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/dashboard"
              className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors inline-flex items-center justify-center"
            >
              Explore Campaigns
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <StatCard icon={<Rocket className="h-8 w-8 text-blue-600" />} label="Active Campaigns" value={stats.totalCampaigns} color="blue" />
          <StatCard icon={<DollarSign className="h-8 w-8 text-green-600" />} label="Total Funded" value={formatCurrency(stats.totalFunded)} color="green" />
          <StatCard icon={<Users className="h-8 w-8 text-purple-600" />} label="Community Members" value={stats.totalUsers} color="purple" />
          <StatCard icon={<TrendingUp className="h-8 w-8 text-orange-600" />} label="Success Rate" value={`${stats.successRate}%`} color="orange" />
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Campaigns</h2>
          <p className="text-xl text-gray-600 mb-12">Discover innovative projects seeking funding</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading campaigns...</p>
              </div>
            ) : campaigns && campaigns.length > 0 ? (
              campaigns.map((campaign) => (
                <div key={campaign._id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500" />
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">{campaign.category}</span>
                      <div className="flex items-center text-yellow-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="text-sm text-gray-600 ml-1">4.8</span>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{campaign.title}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">{campaign.description}</p>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(calculateProgress(campaign.raisedAmount, campaign.goalAmount))}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${calculateProgress(campaign.raisedAmount, campaign.goalAmount)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Raised</p>
                        <p className="font-semibold text-lg">{formatCurrency(campaign.raisedAmount)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Goal</p>
                        <p className="font-semibold text-lg">{formatCurrency(campaign.goalAmount)}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(campaign.deadline).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        <span>{campaign.backers || 0} backers</span>
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
              ))
            ) : (
              <div className="col-span-full text-center text-gray-500 py-8">
                No campaigns found.
              </div>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              to="/dashboard"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center"
            >
              View All Campaigns
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-xl text-gray-600 mb-12">Simple steps to fund or get funded</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <StepCard number={1} title="Create Account" description="Sign up as a startup or investor and complete your profile" color="blue" />
            <StepCard number={2} title="Launch or Invest" description="Create campaigns or browse and invest in exciting projects" color="purple" />
            <StepCard number={3} title="Connect & Grow" description="Chat with partners and watch your investments or projects grow" color="green" />
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, label, value, color }) => (
  <div className="text-center">
    <div className={`bg-${color}-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center`}>
      {icon}
    </div>
    <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
    <p className="text-gray-600">{label}</p>
  </div>
);

const StepCard = ({ number, title, description, color }) => (
  <div className="text-center">
    <div className={`bg-${color}-100 rounded-full p-6 w-20 h-20 mx-auto mb-6 flex items-center justify-center`}>
      <span className={`text-2xl font-bold text-${color}-600`}>{number}</span>
    </div>
    <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default Home;
