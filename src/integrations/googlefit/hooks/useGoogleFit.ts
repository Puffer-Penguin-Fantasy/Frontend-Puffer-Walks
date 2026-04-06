import { useState, useEffect, useCallback } from "react";
import { GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GOOGLE_SCOPES } from "../config";
import { toast } from "sonner";

export function useGoogleFit() {
    const [isConnected, setIsConnected] = useState(false);
    const [steps, setSteps] = useState<number | null>(null);
    const [weeklySteps, setWeeklySteps] = useState<number | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const token = localStorage.getItem('googlefit_token');

    useEffect(() => {
        setIsConnected(!!token);
    }, [token]);

    const fetchSteps = useCallback(async () => {
        if (!token) return;

        setIsSyncing(true);
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
            const endOfDay = now.getTime();
            const startOfWeek = startOfDay - (7 * 24 * 60 * 60 * 1000);

            const fetchAggregate = async (startTime: number, endTime: number) => {
                const res = await fetch('https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        aggregateBy: [{
                            dataTypeName: "com.google.step_count.delta"
                        }],
                        bucketByTime: { durationMillis: endTime - startTime },
                        startTimeMillis: startTime,
                        endTimeMillis: endTime
                    })
                });

                if (!res.ok) {
                    if (res.status === 401) {
                        localStorage.removeItem('googlefit_token');
                        setIsConnected(false);
                    }
                    throw new Error('Failed to fetch Google Fit data');
                }

                const data = await res.json();
                let totalSteps = 0;
                data.bucket.forEach((b: any) => {
                    b.dataset.forEach((d: any) => {
                        d.point.forEach((p: any) => {
                            p.value.forEach((v: any) => {
                                totalSteps += v.intVal || 0;
                            });
                        });
                    });
                });
                return totalSteps;
            };

            const todaySteps = await fetchAggregate(startOfDay, endOfDay);
            setSteps(todaySteps);

            const weekSteps = await fetchAggregate(startOfWeek, endOfDay);
            setWeeklySteps(weekSteps);

        } catch (err) {
            console.error('Google Fit step fetch error:', err);
        } finally {
            setIsSyncing(false);
        }
    }, [token]);

    useEffect(() => {
        if (isConnected) {
            fetchSteps();
        }
    }, [isConnected, fetchSteps]);

    const connect = () => {
        const scopeParam = encodeURIComponent(GOOGLE_SCOPES.join(' '));
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(
            GOOGLE_REDIRECT_URI,
        )}&response_type=token&scope=${scopeParam}&include_granted_scopes=true`;
        window.location.href = authUrl;
    };

    const disconnect = () => {
        localStorage.removeItem('googlefit_token');
        setIsConnected(false);
        setSteps(null);
        setWeeklySteps(null);
        toast.success("Google Fit disconnected");
    };

    return {
        isConnected,
        steps,
        weeklySteps,
        isSyncing,
        fetchSteps,
        connect,
        disconnect,
    };
}
