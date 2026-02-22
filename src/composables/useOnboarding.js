import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import { useAuthStore } from '../stores/auth'
import { usePreferencesStore } from '../stores/preferences'

const STORAGE_KEY = 'rfe_onboarding_completed'
let driverInstance = null

const tourSteps = [
  {
    element: '#nav-dashboard',
    popover: {
      title: 'Dashboard',
      description: 'Your home base — see case stats, charts, and recent activity at a glance.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#nav-cases',
    popover: {
      title: 'Cases',
      description: 'Manage all your RFE cases here. Create new cases, track statuses, and generate AI-powered draft responses.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#nav-knowledge',
    popover: {
      title: 'Knowledge Base',
      description: 'Upload legal documents, memos, and templates. The AI uses these to generate better draft responses.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#nav-settings',
    popover: {
      title: 'Settings',
      description: 'Configure your firm\'s settings, manage subscription, and customize the platform.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#nav-users',
    popover: {
      title: 'Team Members',
      description: 'Invite attorneys, paralegals, and staff to collaborate on cases.',
      side: 'right',
      align: 'start',
    },
  },
]

function markCompleted() {
  // Save locally immediately so it never shows again on refresh
  localStorage.setItem(STORAGE_KEY, 'true')
  // Also persist to server
  const prefStore = usePreferencesStore()
  prefStore.updatePreferences({ onboarding_completed: true }).catch(() => {})
}

function startTour() {
  driverInstance = driver({
    showProgress: true,
    animate: true,
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    stagePadding: 6,
    stageRadius: 8,
    popoverClass: 'rfe-tour-popover',
    nextBtnText: 'Next',
    prevBtnText: 'Back',
    doneBtnText: 'Done',
    steps: tourSteps.filter(step => document.querySelector(step.element)),
    onDestroyStarted: () => {
      driverInstance.destroy()
      markCompleted()
    },
  })
  driverInstance.drive()
}

export function useOnboarding() {
  function checkAndStart() {
    // Check localStorage first (instant, survives refresh)
    if (localStorage.getItem(STORAGE_KEY) === 'true') return

    // Check server preference
    const authStore = useAuthStore()
    const prefs = authStore.user?.preferences || {}
    if (prefs.onboarding_completed) {
      localStorage.setItem(STORAGE_KEY, 'true')
      return
    }

    // Small delay to let the layout render
    setTimeout(startTour, 500)
  }

  function restartTour() {
    startTour()
  }

  return { checkAndStart, restartTour }
}
