import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import { DollarSign, Calendar, FileText, Tag } from 'lucide-react';

const EditCampaign = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    category: 'Technology',
  });

  const categories = ['Technology', 'Health', 'Education', 'Environment', 'Arts', 'Social', 'Other'];

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const { data } = await axios.get(`/api/campaigns/${id}`);
        setFormData({
          title: data.title,
          description: data.description,
          goalAmount: data.goalAmount,
          deadline: new Date(data.deadline).toISOString().split('T')[0],
          category: data.category,
        });
      } catch {
        showError('Failed to load campaign');
        navigate('/dashboard');
      } finally {
        setFetching(false);
      }
    };
    fetchCampaign();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) { showError('Title is required'); return; }
    if (!formData.description.trim()) { showError('Description is required'); return; }
    if (!formData.goalAmount) { showError('Goal amount is required'); return; }
    if (!formData.deadline) { showError('Deadline is required'); return; }

    setLoading(true);
    try {
      await axios.put(`/api/campaigns/${id}`, {
        ...formData,
        goalAmount: parseInt(formData.goalAmount),
      });
      showSuccess('Campaign updated successfully!');
      navigate(`/campaign/${id}`);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'startup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only startups can edit campaigns.</p>
        </div>
      </div>
    );
  }

  if (fetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Edit Campaign</h1>
            <p className="text-gray-600 mt-2">Update your campaign details</p>
          </div>

          <div className="p-8 space-y-8">
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Basic Information
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Funding Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Funding Goal (₹) *</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      name="goalAmount"
                      value={formData.goalAmount}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Deadline *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCampaign;
