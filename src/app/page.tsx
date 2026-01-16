// app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Search, Trophy, TrendingUp, Award } from 'lucide-react';

interface LeetCodeUser {
    username: string;
    easy: number;
    medium: number;
    hard: number;
    total: number;
}

export default function LeaderboardPage() {
    const [users, setUsers] = useState<LeetCodeUser[]>([]);
    const [username, setUsername] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const stored = localStorage.getItem('leetcode_users');
            if (stored) {
                const usernames: string[] = JSON.parse(stored);
                const userData = await Promise.all(
                    usernames.map(name => fetchUserData(name))
                );
                const validUsers = userData.filter((user): user is LeetCodeUser => user !== null);
                setUsers(validUsers.sort((a, b) => b.total - a.total));
            }
        } catch (err) {
            console.error('Error loading users:', err);
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

    const addUser = async (e: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (!username.trim()) return;

        setLoading(true);
        setError('');

        try {
            const userData = await fetchUserData(username.trim());

            if (!userData) {
                setError('User not found. Please check the username.');
                setLoading(false);
                return;
            }

            const stored = localStorage.getItem('leetcode_users');
            const existing: string[] = stored ? JSON.parse(stored) : [];

            if (existing.includes(userData.username)) {
                setError('User already in leaderboard.');
                setLoading(false);
                return;
            }

            const updated = [...existing, userData.username];
            localStorage.setItem('leetcode_users', JSON.stringify(updated));

            setUsers([...users, userData].sort((a, b) => b.total - a.total));
            setUsername('');
        } catch (err) {
            setError('Failed to add user. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const removeUser = (usernameToRemove: string) => {
        const stored = localStorage.getItem('leetcode_users');
        if (stored) {
            const existing: string[] = JSON.parse(stored);
            const updated = existing.filter(u => u !== usernameToRemove);
            localStorage.setItem('leetcode_users', JSON.stringify(updated));
            setUsers(users.filter(u => u.username !== usernameToRemove));
        }
    };

    const getRankIcon = (index: number) => {
        if (index === 0) return <Trophy className="w-6 h-6 text-yellow-500" />;
        if (index === 1) return <Award className="w-6 h-6 text-gray-400" />;
        if (index === 2) return <Award className="w-6 h-6 text-amber-600" />;
        return <span className="text-lg font-semibold text-gray-500">#{index + 1}</span>;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                        <TrendingUp className="w-12 h-12 text-purple-400" />
                        LeetCode Leaderboard
                    </h1>
                    <p className="text-purple-200">Track and compare your coding progress</p>
                </div>

                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 mb-8 shadow-2xl border border-white/20">
                    <div className="flex gap-3">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addUser(e)}
                                placeholder="Enter LeetCode username"
                                className="w-full pl-11 pr-4 py-3 bg-white/90 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-900"
                                disabled={loading}
                            />
                        </div>
                        <button
                            onClick={addUser}
                            disabled={loading}
                            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-semibold rounded-lg transition-colors"
                        >
                            {loading ? 'Adding...' : 'Add User'}
                        </button>
                    </div>
                    {error && <p className="mt-3 text-red-300 text-sm">{error}</p>}
                </div>

                <div className="space-y-4">
                    {users.length === 0 ? (
                        <div className="text-center py-16 text-purple-200">
                            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-xl">No users yet. Add someone to get started!</p>
                        </div>
                    ) : (
                        users.map((user, index) => (
                            <div
                                key={user.username}
                                className="bg-white/10 backdrop-blur-lg rounded-xl p-6 shadow-xl border border-white/20 hover:bg-white/15 transition-all"
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
                                            <p className="text-green-400 text-2xl font-bold">{user.easy}</p>
                                            <p className="text-green-300 text-xs">Easy</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-yellow-400 text-2xl font-bold">{user.medium}</p>
                                            <p className="text-yellow-300 text-xs">Medium</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-red-400 text-2xl font-bold">{user.hard}</p>
                                            <p className="text-red-300 text-xs">Hard</p>
                                        </div>
                                        <button
                                            onClick={() => removeUser(user.username)}
                                            className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg transition-colors text-sm"
                                        >
                                            Remove
                                        </button>
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