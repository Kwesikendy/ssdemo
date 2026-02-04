import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Gavel,
    CheckCircle,
    XCircle,
    Clock,
    FileText,
    User,
    Search,
    Filter
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import EnhancedDataTable from '../components/EnhancedDataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import StatusBadge from '../components/StatusBadge';
import api from '../api/axios';

const AppealsPage = () => {
    const navigate = useNavigate();
    const [appeals, setAppeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({});
    const [sortField, setSortField] = useState('created_at');
    const [sortDirection, setSortDirection] = useState('desc');
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 10,
        total: 0,
        total_pages: 0
    });

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [selectedAppeal, setSelectedAppeal] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');
    const [reviewAction, setReviewAction] = useState(null); // 'approved' or 'rejected'

    useEffect(() => {
        fetchAppeals();
    }, [pagination.page, pagination.per_page, searchTerm, filters, sortField, sortDirection]);

    const fetchAppeals = async () => {
        try {
            setLoading(true);

            // Mock Data Check
            if (localStorage.getItem('token') === 'mock-jwt-token') {
                const mockAppeals = [
                    {
                        id: 'mock-appeal-1',
                        candidate_id: 'cand-123',
                        candidate_index: 'IDX-001',
                        exam_name: 'Mathematics Class 101',
                        reason: 'I believe my answer for Q2 was correct according to the textbook.',
                        original_mark: 45,
                        proposed_mark: 50,
                        status: 'pending',
                        created_at: new Date(Date.now() - 86400000).toISOString()
                    },
                    {
                        id: 'mock-appeal-2',
                        candidate_id: 'cand-456',
                        candidate_index: 'IDX-002',
                        exam_name: 'Science Finals',
                        reason: 'Calculation error in total sum.',
                        original_mark: 78,
                        proposed_mark: 80,
                        status: 'approved',
                        reviewed_by: 'Teacher A',
                        created_at: new Date(Date.now() - 172800000).toISOString()
                    }
                ];
                setAppeals(mockAppeals);
                setPagination(prev => ({ ...prev, total: 2, total_pages: 1 }));
                setLoading(false);
                return;
            }

            // Build Query Params
            const params = new URLSearchParams({
                limit: pagination.per_page,
                offset: (pagination.page - 1) * pagination.per_page,
                status: filters.status || ''
            });

            const response = await api.get(`/appeals?${params.toString()}`);

            // Handle response structure { appeals: [], limit: 50, offset: 0 }
            const data = response.data.appeals || [];
            // If backend doesn't return total count in list response, handling pagination might be tricky without it. 
            // Assuming for now simple pagination or that backend matches standard response.
            // The backend code shows `appeals` array return.

            setAppeals(data);
            // Rough total estimate if not provided (or fix backend to provide it)
            const total = response.data.total || data.length;

            setPagination(prev => ({
                ...prev,
                total: total,
                total_pages: Math.ceil(total / prev.per_page) || 1
            }));

        } catch (err) {
            console.error("Failed to load appeals", err);
            setError('Failed to load appeals');
            toast.error('Failed to load appeals');
        } finally {
            setLoading(false);
        }
    };

    const handleReview = (appeal) => {
        setSelectedAppeal(appeal);
        setReviewNotes('');
        setReviewAction(null);
        setReviewModalOpen(true);
    };

    const submitReview = async (status) => {
        if (!selectedAppeal) return;
        try {
            if (localStorage.getItem('token') === 'mock-jwt-token') {
                toast.success(`Appeal ${status} successfully (Mock)`);
                setAppeals(prev => prev.map(a => a.id === selectedAppeal.id ? { ...a, status: status, review_notes: reviewNotes } : a));
                setReviewModalOpen(false);
                return;
            }

            await api.put(`/appeals/${selectedAppeal.id}`, {
                status: status,
                review_notes: reviewNotes
            });

            toast.success(`Appeal ${status} successfully`);
            fetchAppeals();
            setReviewModalOpen(false);
        } catch (err) {
            toast.error('Failed to update appeal');
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const columns = [
        {
            key: 'candidate',
            title: 'Candidate',
            render: (value, row) => (
                <div>
                    <div className="font-medium text-gray-900">{row.candidate_index || 'Unknown Index'}</div>
                    <div className="text-xs text-gray-500">{row.exam_name || 'Exam'}</div>
                </div>
            )
        },
        {
            key: 'reason',
            title: 'Reason',
            render: (value) => (
                <div className="max-w-xs truncate text-sm text-gray-600" title={value}>
                    {value}
                </div>
            )
        },
        {
            key: 'marks',
            title: 'Marks',
            render: (value, row) => (
                <div className="text-sm">
                    <span className="text-gray-500">Original:</span> <span className="font-semibold">{row.original_mark}</span>
                    <span className="mx-2">→</span>
                    <span className="text-gray-500">Proposed:</span> <span className="font-semibold text-indigo-600">{row.proposed_mark}</span>
                </div>
            )
        },
        {
            key: 'status',
            title: 'Status',
            render: (value) => <StatusBadge status={value} />
        },
        {
            key: 'created_at',
            title: 'Submitted',
            render: (value) => (
                <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(value)}
                </div>
            )
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value, row) => (
                row.status === 'pending' ? (
                    <button
                        onClick={() => handleReview(row)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-200"
                    >
                        Review
                    </button>
                ) : (
                    <span className="text-xs text-gray-400">Resolved</span>
                )
            )
        }
    ];

    const availableFilters = [
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' }
            ]
        }
    ];

    const stats = {
        total: appeals.length,
        pending: appeals.filter(a => a.status === 'pending').length,
        approved: appeals.filter(a => a.status === 'approved').length,
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:flex md:items-center md:justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Appeals</h1>
                        <p className="mt-2 text-gray-600">Manage candidate appeals and re-marking requests</p>
                    </div>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <StatsCard title="Total Appeals" value={stats.total} icon={FileText} iconColor="blue" />
                    <StatsCard title="Pending Review" value={stats.pending} icon={Clock} iconColor="orange" />
                    <StatsCard title="Approved" value={stats.approved} icon={CheckCircle} iconColor="green" />
                </div>

                {/* Table */}
                <EnhancedDataTable
                    data={appeals}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={(p) => setPagination(prev => ({ ...prev, page: p }))}
                    availableFilters={availableFilters}
                    onFilter={setFilters}
                    title="Appeals List"
                    showSearch={false} // Backend search might not be ready, simple filter
                />

                {/* Review Modal */}
                {reviewModalOpen && selectedAppeal && (
                    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => setReviewModalOpen(false)}></div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                            <Gavel className="h-6 w-6 text-indigo-600" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                                Review Appeal
                                            </h3>
                                            <div className="mt-2 text-sm text-gray-500">
                                                <p className="mb-2"><span className="font-semibold">Candidate:</span> {selectedAppeal.candidate_index}</p>
                                                <p className="mb-2"><span className="font-semibold">Reason:</span> {selectedAppeal.reason}</p>
                                                <p className="mb-4"><span className="font-semibold">Marks:</span> {selectedAppeal.original_mark} → {selectedAppeal.proposed_mark}</p>

                                                <label className="block text-sm font-medium text-gray-700 mb-1">Review Notes</label>
                                                <textarea
                                                    className="w-full shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
                                                    rows="3"
                                                    placeholder="Enter justification for decision..."
                                                    value={reviewNotes}
                                                    onChange={(e) => setReviewNotes(e.target.value)}
                                                ></textarea>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => submitReview('approved')}
                                    >
                                        Approve
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => submitReview('rejected')}
                                    >
                                        Reject
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={() => setReviewModalOpen(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AppealsPage;
