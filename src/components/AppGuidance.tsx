import { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';
import type { Step, EventData } from 'react-joyride';
import { useAccount } from '@razorlabs/razorkit';
import { useLocation } from 'react-router-dom';

const steps: Step[] = [
  {
    target: 'body',
    content: (
      <div className="text-left p-2">
        <h3 className="text-lg font-bold mb-2 text-blue-400">Welcome to Puffer Walks! 🐧</h3>
        <p className="text-sm text-gray-300">Let's take a quick tour to get you started with your fitness journey on the Movement Network.</p>
      </div>
    ),
    placement: 'center',
  },
  {
    target: '#step-competitions',
    content: (
      <div className="text-left p-1">
        <p className="text-sm font-medium">Browse active competitions here. Each one has different rules and rewards!</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#step-join-code',
    content: (
      <div className="text-left p-1">
        <p className="text-sm font-medium">If you have a private link or code, enter it here to unlock exclusive challenges.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#step-wallet',
    content: (
      <div className="text-left p-1">
        <p className="text-sm font-medium">This is your command center. Connect your fitness device (like Fitbit) here to sync your steps.</p>
      </div>
    ),
    placement: 'bottom',
  },
  {
    target: '#step-profile',
    content: (
      <div className="text-left p-1">
        <p className="text-sm font-medium">Switch to your profile to see your historical data, earned badges, and overall ranking.</p>
      </div>
    ),
    placement: 'top',
  },
  {
    target: 'body',
    content: (
      <div className="text-left p-2">
        <h3 className="text-lg font-bold mb-2 text-green-400">You're Ready to Walk! 🚀</h3>
        <p className="text-sm text-gray-300">Stake your steps, climb the leaderboard, and earn rewards. Happy walking!</p>
      </div>
    ),
    placement: 'center',
  },
];

export function AppGuidance() {
  const { isConnected } = useAccount();
  const location = useLocation();
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Only run on the home/settings page or demo page
    if ((isConnected || location.pathname === '/guidance-demo') && (location.pathname === '/' || location.pathname === '/guidance-demo')) {
      const hasSeenTour = localStorage.getItem('puffer-tour-seen');
      if (!hasSeenTour || location.pathname === '/guidance-demo') {
        // Small delay to ensure everything is rendered
        const timer = setTimeout(() => setRun(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [isConnected, location.pathname]);

  useEffect(() => {
    const handleRestart = () => {
      // Only restart if on the home page or demo page
      if (location.pathname === '/' || location.pathname === '/guidance-demo') {
        setRun(false);
        setTimeout(() => {
          localStorage.removeItem('puffer-tour-seen');
          setRun(true);
        }, 100);
      } else {
        // Redirect to home then start
        window.location.href = '/?restartTour=true';
      }
    };
    window.addEventListener('restart-puffer-tour', handleRestart);
    return () => window.removeEventListener('restart-puffer-tour', handleRestart);
  }, [location.pathname]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('restartTour') === 'true' && (isConnected || location.pathname === '/guidance-demo') && (location.pathname === '/' || location.pathname === '/guidance-demo')) {
      // Clear the param
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
      
      localStorage.removeItem('puffer-tour-seen');
      setRun(true);
    }
  }, [isConnected, location.pathname]);

  const handleJoyrideEvent = (data: EventData) => {
    const { status } = data;
    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRun(false);
      if (location.pathname !== '/guidance-demo') {
        localStorage.setItem('puffer-tour-seen', 'true');
      }
    }
  };

  if (!isConnected && location.pathname !== '/guidance-demo') return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      onEvent={handleJoyrideEvent}
      options={{
        primaryColor: '#3b82f6',
        textColor: '#ffffff',
        backgroundColor: '#0a0a0a',
        overlayColor: 'rgba(0, 0, 0, 0.75)',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
        overlayClickAction: false,
      }}
      styles={{
        tooltip: {
          borderRadius: '20px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '15px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        },
        buttonPrimary: {
          borderRadius: '12px',
          fontSize: '13px',
          fontWeight: '600',
          padding: '8px 16px',
        },
        buttonBack: {
          color: '#94a3b8',
          fontSize: '13px',
          marginRight: '10px',
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: '13px',
        }
      }}
    />
  );
}
