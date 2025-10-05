/**
 * Health Summary Routes
 * Weekly health reports, trends, and analytics
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('./auth');

let pool;

// Initialize with database pool
router.initializePool = (dbPool) => {
    pool = dbPool;
};

/**
 * GET /api/health/weekly-summary
 * Get weekly heart health summary with daily ECG analysis for authenticated user
 */
router.get('/weekly-summary', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const weeksAgo = parseInt(req.query.weeksAgo) || 0; // 0 = current week, 1 = last week, etc.

    try {
        console.log(`📊 Fetching weekly summary for user ${userId}, weeksAgo: ${weeksAgo}`);
        
        // Calculate date range for the requested week
        const endDate = new Date();
        endDate.setDate(endDate.getDate() - (weeksAgo * 7));
        const startDate = new Date(endDate);
        startDate.setDate(startDate.getDate() - 7);

        console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

        // Get all ECG sessions with their analysis results for this week
        const sessionsResult = await pool.query(
            `SELECT 
                es.id, es.session_name, es.start_time, es.end_time, es.duration_seconds,
                es.is_completed, es.device_id,
                ear.predictions,
                ear.confidence_score,
                ear.risk_level,
                ear.abnormalities_detected,
                ear.processed_at as analysis_date
             FROM ecg_sessions es
             LEFT JOIN ecg_analysis_results ear ON es.id = ear.session_id
             WHERE es.user_id = $1 
               AND es.start_time >= $2 
               AND es.start_time < $3
             ORDER BY es.start_time ASC`,
            [userId, startDate, endDate]
        );

        const sessions = sessionsResult.rows.map(s => {
            // Extract heart rate and other metrics from predictions JSONB
            const predictions = s.predictions || {};
            const heartRate = predictions.heartRate || predictions.heart_rate_bpm || null;
            const classification = predictions.classification || predictions.diagnosis || null;
            
            return {
                ...s,
                heart_rate_bpm: heartRate > 0 ? heartRate : null, // Filter out zero/invalid values
                classification: classification,
                qrs_count: predictions.qrsCount || predictions.rPeaks || null,
                hrv_sdnn: predictions.hrv?.SDNN > 0 ? predictions.hrv.SDNN : null,
                hrv_rmssd: predictions.hrv?.RMSSD > 0 ? predictions.hrv.RMSSD : null,
                signal_quality_score: predictions.signalQuality?.score || null,
                risk_level: predictions.riskLevel || s.risk_level || null,
                confidence_score: predictions.confidence || s.confidence_score || null
            };
        });
        
        console.log(`✓ Found ${sessions.length} sessions`);
        const sessionsWithHR = sessions.filter(s => s.heart_rate_bpm).length;
        const sessionsWithClassification = sessions.filter(s => s.classification && s.classification !== 'Unknown' && s.classification !== 'Insufficient Data').length;
        console.log(`📊 Sessions with valid HR: ${sessionsWithHR}, with classification: ${sessionsWithClassification}`);

        // Calculate weekly statistics from actual analysis data
        const totalSessions = sessions.length;
        const totalDuration = sessions.reduce((sum, s) => sum + (s.duration_seconds || 0), 0);
        
        // Calculate heart rate statistics from analysis results
        const heartRates = sessions.filter(s => s.heart_rate_bpm).map(s => s.heart_rate_bpm);
        const avgHeartRate = heartRates.length > 0 
            ? heartRates.reduce((sum, hr) => sum + hr, 0) / heartRates.length 
            : null;
        const minHeartRate = heartRates.length > 0 ? Math.min(...heartRates) : null;
        const maxHeartRate = heartRates.length > 0 ? Math.max(...heartRates) : null;
        
        // Calculate HRV statistics
        const hrvSDNN = sessions.filter(s => s.hrv_sdnn).map(s => s.hrv_sdnn);
        const avgHRV = hrvSDNN.length > 0 
            ? hrvSDNN.reduce((sum, hrv) => sum + hrv, 0) / hrvSDNN.length 
            : null;
        
        const hrvRMSSD = sessions.filter(s => s.hrv_rmssd).map(s => s.hrv_rmssd);
        const avgRMSSD = hrvRMSSD.length > 0 
            ? hrvRMSSD.reduce((sum, hrv) => sum + hrv, 0) / hrvRMSSD.length 
            : null;

        // Collect all abnormalities detected during the week
        const detectedConditions = {};
        sessions.forEach(session => {
            if (session.abnormalities_detected) {
                try {
                    const abnormalities = typeof session.abnormalities_detected === 'string' 
                        ? JSON.parse(session.abnormalities_detected)
                        : session.abnormalities_detected;
                    
                    if (Array.isArray(abnormalities)) {
                        abnormalities.forEach(abn => {
                            const type = abn.type || 'Unknown';
                            detectedConditions[type] = (detectedConditions[type] || 0) + 1;
                        });
                    }
                } catch (e) {
                    console.error('Error parsing abnormalities:', e);
                }
            }
        });

        // Daily breakdown with full analysis data
        const dailyStats = {};
        sessions.forEach(session => {
            const day = new Date(session.start_time).toISOString().split('T')[0];
            if (!dailyStats[day]) {
                dailyStats[day] = {
                    date: day,
                    sessionCount: 0,
                    totalDuration: 0,
                    heartRates: [],
                    classifications: [],
                    hrvValues: [],
                    riskLevels: [],
                    sessions: []
                };
            }
            dailyStats[day].sessionCount++;
            dailyStats[day].totalDuration += session.duration_seconds || 0;
            
            if (session.heart_rate_bpm) dailyStats[day].heartRates.push(session.heart_rate_bpm);
            if (session.classification) dailyStats[day].classifications.push(session.classification);
            if (session.hrv_sdnn) dailyStats[day].hrvValues.push(session.hrv_sdnn);
            if (session.risk_level) dailyStats[day].riskLevels.push(session.risk_level);
            
            // Store session details for the day
            dailyStats[day].sessions.push({
                id: session.id,
                name: session.session_name,
                time: session.start_time,
                heartRate: session.heart_rate_bpm,
                classification: session.classification,
                confidence: session.confidence_score,
                riskLevel: session.risk_level,
                qrsCount: session.qrs_count,
                signalQuality: session.signal_quality_score
            });
        });

        // Calculate daily averages and summaries
        const dailyBreakdown = Object.values(dailyStats).map(day => {
            const avgHR = day.heartRates.length > 0 
                ? day.heartRates.reduce((sum, hr) => sum + hr, 0) / day.heartRates.length 
                : null;
            const avgHRV = day.hrvValues.length > 0 
                ? day.hrvValues.reduce((sum, hrv) => sum + hrv, 0) / day.hrvValues.length 
                : null;
            
            // Determine overall day health
            const highRiskCount = day.riskLevels.filter(r => r === 'High' || r === 'Critical').length;
            const mediumRiskCount = day.riskLevels.filter(r => r === 'Medium').length;
            
            let dayStatus = 'normal';
            let dayMessage = 'All readings normal';
            
            if (highRiskCount > 0) {
                dayStatus = 'critical';
                dayMessage = `${highRiskCount} high-risk reading${highRiskCount > 1 ? 's' : ''} detected`;
            } else if (mediumRiskCount > 0) {
                dayStatus = 'warning';
                dayMessage = `${mediumRiskCount} medium-risk reading${mediumRiskCount > 1 ? 's' : ''} detected`;
            } else if (day.sessionCount > 0) {
                dayStatus = 'good';
                dayMessage = 'All readings within normal range';
            }
            
            return {
                date: day.date,
                dayOfWeek: new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' }),
                sessionCount: day.sessionCount,
                totalDuration: day.totalDuration,
                avgHeartRate: avgHR ? Math.round(avgHR) : null,
                minHeartRate: day.heartRates.length > 0 ? Math.min(...day.heartRates) : null,
                maxHeartRate: day.heartRates.length > 0 ? Math.max(...day.heartRates) : null,
                avgHRV: avgHRV ? Math.round(avgHRV) : null,
                classifications: day.classifications,
                dayStatus,
                dayMessage,
                sessions: day.sessions
            };
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Get comparison with previous week
        const prevWeekStart = new Date(startDate);
        prevWeekStart.setDate(prevWeekStart.getDate() - 7);
        const prevWeekEnd = new Date(startDate);

        const prevWeekResult = await pool.query(
            `SELECT 
                COUNT(*) as session_count
             FROM ecg_sessions 
             WHERE user_id = $1 
               AND start_time >= $2 
               AND start_time < $3`,
            [userId, prevWeekStart, prevWeekEnd]
        );

        const prevWeekData = prevWeekResult.rows[0];
        const comparison = {
            sessions: {
                current: totalSessions,
                previous: parseInt(prevWeekData.session_count),
                change: totalSessions - parseInt(prevWeekData.session_count)
            },
            heartRate: {
                current: avgHeartRate,
                previous: null,
                change: null
            },
            hrv: {
                current: avgHRV,
                previous: null,
                change: null
            }
        };

        // Generate health insights based on data
        const insights = generateHealthInsights({
            avgHeartRate,
            minHeartRate,
            maxHeartRate,
            avgHRV,
            avgRMSSD,
            totalSessions,
            detectedConditions,
            comparison
        });

        console.log('✓ Weekly summary generated successfully');
        console.log(`📈 Daily breakdown: ${dailyBreakdown.length} days, Avg HR: ${avgHeartRate}, Avg HRV: ${avgHRV}`);
        
        res.json({
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
                weeksAgo
            },
            summary: {
                totalSessions,
                totalDuration,
                avgHeartRate,
                minHeartRate,
                maxHeartRate,
                avgHRV,
                avgRMSSD,
                detectedConditions
            },
            dailyBreakdown,
            comparison,
            insights,
            sessions: sessions.map(s => ({
                id: s.id,
                name: s.session_name,
                startTime: s.start_time,
                duration: s.duration_seconds,
                avgHeartRate: s.heart_rate_bpm,
                hrv: s.hrv_sdnn
            }))
        });

    } catch (err) {
        console.error('❌ Weekly summary error:', err);
        console.error('Error stack:', err.stack);
        res.status(500).json({ 
            error: 'Failed to generate weekly summary',
            message: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

/**
 * Generate health insights based on weekly data
 */
function generateHealthInsights(data) {
    const insights = [];

    // Heart Rate insights
    if (data.avgHeartRate) {
        if (data.avgHeartRate < 60) {
            insights.push({
                type: 'heart_rate',
                level: 'info',
                title: 'Resting Heart Rate Below Normal',
                message: `Your average heart rate is ${data.avgHeartRate} bpm, which is below the typical range. This could indicate good cardiovascular fitness, but consult a doctor if you feel fatigued.`,
                icon: '💙'
            });
        } else if (data.avgHeartRate > 100) {
            insights.push({
                type: 'heart_rate',
                level: 'warning',
                title: 'Elevated Heart Rate',
                message: `Your average heart rate is ${data.avgHeartRate} bpm, which is higher than normal. Consider stress management techniques and consult your healthcare provider.`,
                icon: '⚠️'
            });
        } else {
            insights.push({
                type: 'heart_rate',
                level: 'success',
                title: 'Healthy Heart Rate',
                message: `Your average heart rate of ${data.avgHeartRate} bpm is within the normal range (60-100 bpm).`,
                icon: '✅'
            });
        }
    }

    // HRV insights
    if (data.avgHRV) {
        if (data.avgHRV < 50) {
            insights.push({
                type: 'hrv',
                level: 'warning',
                title: 'Low Heart Rate Variability',
                message: `Your HRV of ${data.avgHRV}ms suggests your body may be under stress. Focus on recovery, sleep, and stress reduction.`,
                icon: '😰'
            });
        } else if (data.avgHRV > 100) {
            insights.push({
                type: 'hrv',
                level: 'success',
                title: 'Excellent Heart Rate Variability',
                message: `Your HRV of ${data.avgHRV}ms indicates good recovery and low stress levels. Keep up the healthy habits!`,
                icon: '🌟'
            });
        } else {
            insights.push({
                type: 'hrv',
                level: 'success',
                title: 'Good Heart Rate Variability',
                message: `Your HRV of ${data.avgHRV}ms is in a healthy range, suggesting balanced stress and recovery.`,
                icon: '👍'
            });
        }
    }

    // Activity insights
    if (data.totalSessions < 3) {
        insights.push({
            type: 'activity',
            level: 'info',
            title: 'Increase Monitoring Frequency',
            message: `You recorded ${data.totalSessions} sessions this week. For better health tracking, aim for at least 3-4 sessions per week.`,
            icon: '📊'
        });
    } else {
        insights.push({
            type: 'activity',
            level: 'success',
            title: 'Consistent Monitoring',
            message: `Great job! You recorded ${data.totalSessions} sessions this week. Consistent monitoring helps track your progress.`,
            icon: '🎯'
        });
    }

    // Trend insights
    if (data.comparison.heartRate.change !== null) {
        if (Math.abs(data.comparison.heartRate.change) > 10) {
            insights.push({
                type: 'trend',
                level: 'warning',
                title: 'Significant Heart Rate Change',
                message: `Your average heart rate ${data.comparison.heartRate.change > 0 ? 'increased' : 'decreased'} by ${Math.abs(data.comparison.heartRate.change)} bpm compared to last week. Monitor this trend.`,
                icon: '📈'
            });
        }
    }

    // Abnormality insights
    if (Object.keys(data.detectedConditions).length > 0) {
        const totalAbnormalities = Object.values(data.detectedConditions).reduce((a, b) => a + b, 0);
        insights.push({
            type: 'abnormality',
            level: 'warning',
            title: 'Abnormalities Detected',
            message: `${totalAbnormalities} potential abnormalities were detected across your sessions. Review the detailed analysis and consult your doctor if concerned.`,
            icon: '🔍',
            details: data.detectedConditions
        });
    }

    return insights;
}

/**
 * GET /api/health/monthly-trends
 * Get monthly heart health trends
 */
router.get('/monthly-trends', authenticateToken, async (req, res) => {
    const userId = req.user.userId;
    const months = parseInt(req.query.months) || 3; // Default 3 months

    try {
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);

        const trendsResult = await pool.query(
            `SELECT 
                DATE_TRUNC('week', start_time) as week,
                COUNT(*) as session_count,
                AVG(avg_heart_rate) as avg_hr,
                MIN(min_heart_rate) as min_hr,
                MAX(max_heart_rate) as max_hr,
                AVG(hrv_sdnn) as avg_hrv,
                AVG(hrv_rmssd) as avg_rmssd
             FROM ecg_sessions 
             WHERE user_id = $1 
               AND start_time >= $2
               AND deleted_at IS NULL
             GROUP BY DATE_TRUNC('week', start_time)
             ORDER BY week ASC`,
            [userId, startDate]
        );

        const trends = trendsResult.rows.map(row => ({
            week: row.week,
            sessionCount: parseInt(row.session_count),
            avgHeartRate: row.avg_hr ? Math.round(row.avg_hr) : null,
            minHeartRate: row.min_hr ? Math.round(row.min_hr) : null,
            maxHeartRate: row.max_hr ? Math.round(row.max_hr) : null,
            avgHRV: row.avg_hrv ? Math.round(row.avg_hrv) : null,
            avgRMSSD: row.avg_rmssd ? Math.round(row.avg_rmssd) : null
        }));

        res.json({
            period: {
                months,
                start: startDate.toISOString(),
                end: new Date().toISOString()
            },
            trends
        });

    } catch (err) {
        console.error('Monthly trends error:', err);
        res.status(500).json({ error: 'Failed to generate monthly trends' });
    }
});

module.exports = router;
