import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import axios from 'axios';
import { load } from '@cashfreepayments/cashfree-js';
import {
  IndianRupee,
  Calendar,
  Target,
  FileText,
  Tag
} from 'lucide-react';

const CASHFREE_MODE = import.meta.env.VITE_CASHFREE_ENV || 'sandbox';

const CreateCampaign = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useSnackbar();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [feeModal, setFeeModal] = useState(null); // { orderId, paymentSessionId, fee }
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    deadline: '',
    category: 'Technology',
    images: []
  });

  const categories = ['Technology', 'Health', 'Education', 'Environment', 'Arts', 'Social', 'Other'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!formData.title.trim()) { showError('Campaign title is required'); return false; }
    if (!formData.description.trim()) { showError('Campaign description is required'); return false; }
    if (!formData.goalAmount) { showError('Funding goal is required'); return false; }
    if (parseInt(formData.goalAmount) < 1000) { showError('Minimum goal amount is ₹1,000'); return false; }
    if (!formData.deadline) { showError('Campaign deadline is required'); return false; }
    const deadline = new Date(formData.deadline);
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    if (deadline <= new Date()) { showError('Deadline must be in the future'); return false; }
    if (deadline < thirtyDaysFromNow) { showError('Deadline must be at least 30 days from now'); return false; }
    return true;
  };

  // Step 1: validate form and create fee order
  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data } = await axios.post('/api/campaigns/create-order', {
        goalAmount: parseInt(formData.goalAmount),
      });
      setFeeModal(data); // show fee confirmation modal
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: open Cashfree and on success create campaign
  const handlePayAndCreate = async () => {
    if (!feeModal) return;
    setLoading(true);
    try {
      const cashfree = await load({ mode: CASHFREE_MODE });

      cashfree.checkout({
        paymentSessionId: feeModal.paymentSessionId,
        redirectTarget: '_modal',
      }).then(async (result) => {
        if (result.error) {
          showError(result.error.message || 'Payment failed');
          setLoading(false);
          return;
        }

        if (result.paymentDetails || result.redirect) {
          try {
            const response = await axios.post('/api/campaigns', {
              ...formData,
              goalAmount: parseInt(formData.goalAmount),
              orderId: feeModal.orderId,
            });
            showSuccess('Campaign created successfully!');
            setFeeModal(null);
            navigate(`/campaign/${response.data._id}`);
          } catch (err) {
            showError(err.response?.data?.message || 'Failed to create campaign after payment');
          }
          setLoading(false);
        }
      });
    } catch (error) {
      showError('Payment failed. Please try again.');
      setLoading(false);
    }
  };

  if (user?.role !== 'startup') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">Only startups can create campaigns.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-8 py-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New Campaign</h1>
            <p className="text-gray-600 mt-2">
              Launch your fundraising campaign and connect with investors
            </p>
          </div>

          <form className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Basic Information
              </h2>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter a compelling title for your campaign"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe your project, its goals, and why people should invest in it..."
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <select
                    id="category"
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

            {/* Funding Information */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <IndianRupee className="h-5 w-5 mr-2" />
                Funding Information
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Goal (₹) *
                  </label>
                  <div className="relative">
                    <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="number"
                      id="goalAmount"
                      name="goalAmount"
                      value={formData.goalAmount}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="50000"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Minimum goal: ₹1,000</p>
                </div>

                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Deadline *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="date"
                      id="deadline"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Must be at least 30 days from today</p>
                </div>
              </div>
            </div>

            {/* Campaign Preview */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Preview</h2>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4"></div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {formData.title || 'Your Campaign Title'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {formData.description || 'Your campaign description will appear here...'}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">{formData.category}</span>
                  <span className="text-gray-500">
                    Goal: ₹{formData.goalAmount ? parseInt(formData.goalAmount).toLocaleString() : '0'}
                  </span>
                </div>
              </div>
            </div>

            {/* Platform fee notice */}
            {formData.goalAmount && parseInt(formData.goalAmount) >= 1000 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-semibold">Platform fee:</span> A one-time fee of{' '}
                  <span className="font-semibold">
                    ₹{Math.ceil(parseInt(formData.goalAmount) * 0.05).toLocaleString()}
                  </span>{' '}
                  (5% of goal) is required to publish your campaign.
                </p>
              </div>
            )}

            {/* Actions */}
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
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Processing...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Fee Confirmation Modal */}
      {feeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Platform Fee Required</h3>
            <p className="text-gray-600 mb-6">
              To publish your campaign, a one-time platform fee is charged.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Funding Goal</span>
                <span className="font-medium">₹{parseInt(formData.goalAmount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Platform Fee (5%)</span>
                <span className="font-semibold text-blue-600">₹{feeModal.fee.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setFeeModal(null); setLoading(false); }}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePayAndCreate}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50"
              >
                {loading ? 'Processing...' : `Pay ₹${feeModal.fee.toLocaleString()} & Create`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateCampaign;
