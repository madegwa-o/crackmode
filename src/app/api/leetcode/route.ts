
// ============================================
// app/api/leetcode/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json({ error: 'Username is required' }, { status: 400 });
        }

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify({
                query: `
          query getUserProfile($username: String!) {
            matchedUser(username: $username) {
              username
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
                variables: { username }
            })
        });

        const data = await response.json();

        if (data.data?.matchedUser) {
            const stats = data.data.matchedUser.submitStats.acSubmissionNum;
            const easy = stats.find((s: { difficulty: string; }) => s.difficulty === 'Easy')?.count || 0;
            const medium = stats.find((s: { difficulty: string; }) => s.difficulty === 'Medium')?.count || 0;
            const hard = stats.find((s: { difficulty: string; }) => s.difficulty === 'Hard')?.count || 0;
            const total = stats.find((s: { difficulty: string; }) => s.difficulty === 'All')?.count || 0;

            return NextResponse.json({
                username: data.data.matchedUser.username,
                easy,
                medium,
                hard,
                total
            });
        }

        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }
}
