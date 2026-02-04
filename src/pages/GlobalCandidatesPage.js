import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Users,
    Search,
    BookOpen,
    FileText,
    ChevronRight
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import EnhancedDataTable from '../components/EnhancedDataTable';
import StatsCard from '../components/StatsCard';
import LoadingOverlay from '../components/LoadingOverlay';
import api from '../api/axios';

const GlobalCandidatesPage = () => {
    const navigate = useNavigate();
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pagination, setPagination] = useState({
        page: 1,
        per_page: 20,
        total: 0,
        total_pages: 0
    });

    useEffect(() => {
        fetchCandidates();
    }, [pagination.page, pagination.per_page, searchTerm]);

    const fetchCandidates = async () => {
        try {
            setLoading(true);

            // Mock Data Check
            if (localStorage.getItem('token') === 'mock-jwt-token') {
                const mockCandidates = Array.from({ length: 5 }).map((_, i) => ({
                    id: `mock-cand-${i}`,
                    index_number: `IDX-${1000 + i}`,
                    page_count: Math.floor(Math.random() * 10) + 1,
                    bound_pages: Math.floor(Math.random() * 10) + 1,
                    created_at: new Date().toISOString()
                }));
                setCandidates(mockCandidates);
                setPagination(prev => ({ ...prev, total: 5, total_pages: 1 }));
                setLoading(false);
                return;
            }

            const params = new URLSearchParams({
                page: pagination.page,
                per_page: pagination.per_page,
                search: searchTerm
            });

            const response = await api.get(`/candidates?${params.toString()}`);
            // Response format: { candidates: [...], pagination: { ... } }

            setCandidates(response.data.candidates || []);
            if (response.data.pagination) {
                setPagination(prev => ({
                    ...prev,
                    total: response.data.pagination.total,
                    total_pages: response.data.pagination.total_pages
                }));
            }
        } catch (err) {
            console.error("Failed to load candidates", err);
            setError('Failed to load candidates');
            toast.error('Failed to load candidates');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (term) => {
        setSearchTerm(term);
        setPagination(prev => ({ ...prev, page: 1 }));
    };

    const handlePageChange = (page, perPage = pagination.per_page) => {
        setPagination(prev => ({ ...prev, page, per_page: perPage }));
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const columns = [
        {
            key: 'index_number',
            title: 'Index Number',
            render: (value, row) => (
                <div className="flex items-center">
                    <div className="flex-shrink-0 h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mr-3">
                        <Users className="h-4 w-4" />
                    </div>
                    <div className="font-medium text-gray-900">{value}</div>
                </div>
            )
        },
        {
            key: 'page_count',
            title: 'Pages',
            render: (value) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {value || 0} pages
                </span>
            )
        },
        {
            key: 'bound_pages',
            title: 'Bound Pages',
            render: (value) => (
                <span className="text-sm text-gray-500">{value || 0}</span>
            )
        },
        {
            key: 'created_at',
            title: 'Created',
            render: (value) => <span className="text-sm text-gray-500">{formatDate(value)}</span>
        },
        {
            key: 'actions',
            title: 'Actions',
            render: (value, row) => (
                <div className="flex items-center space-x-2">
                    {/* 
                We don't strictly have a "Candidate Detail" page yet for *Global* candidates.
                But we can reuse the results view if they have results, or just list pages.
                Handler uses `GetCandidatePages` at `/candidates/{id}/pages`.
                Maybe we create a `CandidateDetailsPage.js`?
                For now, let's just disabling Deep Link or link to results if implemented.
                Actually `ResultsHandler` has `GetCandidateDetail` at `/results/candidates/{candidate_id}`.
                Let's link there.
            */}
                    <button
                        onClick={() => navigate(`/results/candidates/${row.id}`)}
                        className="text-indigo-600 hover:text-indigo-900 text-xs font-medium bg-indigo-50 px-2 py-1 rounded border border-indigo-200 flex items-center"
                    >
                        View Results <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                </div>
            )
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="md:flex md:items-center md:justify-between mb-8"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">All Candidates</h1>
                        <p className="mt-2 text-gray-600">Global list of all candidates across all exams</p>
                    </div>
                </motion.div>

                <EnhancedDataTable
                    data={candidates}
                    columns={columns}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handlePageChange}
                    onSearch={handleSearch}
                    searchTerm={searchTerm}
                    title="Candidates Directory"
                    showSearch={true}
                    showStartMarking={false}
                    emptyStateMessage="No candidates found."
                    emptyStateIcon="👥"
                />
            </div>
        </div>
    );
};

export default GlobalCandidatesPage;
