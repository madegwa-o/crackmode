// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, TrendingUp, Award, RefreshCw } from 'lucide-react';

interface LeetCodeUser {
    username: string;
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeetCodeUser[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        setLoading(true);
        setError('');

        try {
            // Fetch all usernames from database
            const usernamesResponse = await fetch('/api/users/usernames');

            if (!usernamesResponse.ok) {
                throw new Error('Failed to fetch usernames from database');
            }

            const { usernames } = await usernamesResponse.json();

            if (!usernames || usernames.length === 0) {
                setUsers([]);
                setLoading(false);
                return;
            }

            // Fetch LeetCode data for each username
            const userData = await Promise.all(
                usernames.map((name: string) => fetchUserData(name))
            );

            const validUsers = userData.filter((user): user is LeetCodeUser => user !== null);
            setUsers(validUsers.sort((a, b) => b.total - a.total));
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load leaderboard data');
        } finally {
            setLoading(false);
        }
    };

    const fetchUserData = async (username: string): Promise<LeetCodeUser | null> => {
        try {
            const response = await fetch('/api/leetcode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username })
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user data');
            }

            const data = await response.json();

            if (data.error) {
                return null;
            }

            return data as LeetCodeUser;
        } catch (err) {
            console.error(`Error fetching data for ${username}:`, err);
            return null;
        }
    };

    const refreshLeaderboard = async () => {
        setRefreshing(true);
        await loadUsers();
        setRefreshing(false);
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-chart-4" />;
        if (index === 1) return <Award className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Award className="w-6 h-6 text-chart-5" />;
        return <span className="text-lg font-semibold text-muted-foreground">#{index + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-700 to-purple-900 p-8 dotted-bg">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <TrendingUp className="w-12 h-12 text-purple-300" />
                        LeetCode Leaderboard
                    </h1>
                    <p className="text-purple-100">Track and compare your coding progress</p>
                </div>

                <div className="bg-card/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-border">
                    <div className="flex justify-between items-center">
                        <p className="text-white text-lg">
                            {users.length > 0 ? `Tracking ${users.length} user${users.length !== 1 ? 's' : ''}` : 'No users found'}
                        </p>
                        <button
                            onClick={refreshLeaderboard}
                            disabled={refreshing || loading}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
                        >
                            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                            {refreshing ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-destructive text-sm">{error}</p>}
                </div>

                <div className="space-y-4">
                    {loading && users.length === 0 ? (
                        <div className="text-center py-16 text-purple-100">
                            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-300 mx-auto mb-4"></div>
                            <p className="text-xl">Loading leaderboard...</p>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-16 text-purple-100">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No users with LeetCode usernames found</p>
                            <p className="text-sm mt-2 opacity-75">Users need to set their LeetCode username in their profile</p>
                        </div>
                    ) : (
                        users.map((user, index) => (
                            <div
                                key={user.username}
                                className="bg-card/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-border hover:bg-card/15 transition-all"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4 flex-1">
                                        <div className="flex items-center justify-center w-12">
                                            {getRankIcon(index)}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{user.username}</h3>
                                            <p className="text-purple-200 text-sm">Total Solved: {user.total}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-6 items-center">
                                        <div className="text-center">
                                            <p className="text-chart-2 text-2xl font-bold">{user.easy}</p>
                                            <p className="text-chart-2/80 text-xs">Easy</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-chart-4 text-2xl font-bold">{user.medium}</p>
                                            <p className="text-chart-4/80 text-xs">Medium</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-chart-5 text-2xl font-bold">{user.hard}</p>
                                            <p className="text-chart-5/80 text-xs">Hard</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}