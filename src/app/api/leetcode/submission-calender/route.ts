// ============================================
// app/api/leetcode/submission-calender/route.ts
// ============================================

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { username } = await request.json();

        if (!username) {
            return NextResponse.json(
                { error: 'Username is required' },
                { status: 400 }
            );
        }

        const response = await fetch('https://leetcode.com/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify({
                query: `
          query getUserCalendar($username: String!) {
            matchedUser(username: $username) {
              username
              submissionCalendar
              submitStats {
                acSubmissionNum {
                  difficulty
                  count
                }
              }
            }
          }
        `,
                variables: { username },
            }),
        });

        const data = await response.json();

        const user = data?.data?.matchedUser;
        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Difficulty stats
        const stats = user.submitStats.acSubmissionNum;
        const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count ?? 0;
        const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count ?? 0;
        const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count ?? 0;
        const total = stats.find((s: any) => s.difficulty === 'All')?.count ?? 0;

        // Parse submission calendar
        const calendarRaw = JSON.parse(user.submissionCalendar || '{}');

        const calendar = Object.entries(calendarRaw).map(
            ([timestamp, count]) => ({
                date: new Date(Number(timestamp) * 1000)
                    .toISOString()
                    .split('T')[0],
                count,
            })
        );

        return NextResponse.json({
            username: user.username,
            easy,
            medium,
            hard,
            total,
            calendar, // <-- this powers the green heatmap
        });
    } catch (error) {
        console.error('Error fetching LeetCode data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}
