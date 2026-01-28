const REPLAY_KEY = "recruitme-replay-tour"

export function setReplayOnboarding(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(REPLAY_KEY, "1")
  }
}

export function getReplayKey(): string {
  return REPLAY_KEY
}

export const ONBOARDING_SELECTORS = {
  athleteInfo: "[data-onboarding=\"athlete-info\"]",
  videos: "[data-onboarding=\"videos\"]",
  publishStatus: "[data-onboarding=\"publish-status\"]",
  saveFooter: "[data-onboarding=\"save-footer\"]",
  settings: "[data-onboarding=\"settings\"]",
} as const

export const ONBOARDING_STEPS = [
  {
    element: ONBOARDING_SELECTORS.athleteInfo,
    popover: {
      title: "Athlete Information",
      description:
        "Add your photo and basics — name, school, position. This is your draft.",
    },
  },
  {
    element: ONBOARDING_SELECTORS.videos,
    popover: {
      title: "Videos",
      description:
        "Add up to 10 YouTube videos. Highlights and game footage help recruiters.",
    },
  },
  {
    element: ONBOARDING_SELECTORS.saveFooter,
    popover: {
      title: "Save vs Publish",
      description:
        "Save stores your draft. Publish makes it live. You can edit and publish again anytime.",
    },
  },
  {
    element: ONBOARDING_SELECTORS.publishStatus,
    popover: {
      title: "Publish Status",
      description:
        "When you're ready, Save Changes first, then Publish. You'll get a shareable link.",
    },
  },
  {
    element: ONBOARDING_SELECTORS.settings,
    popover: {
      title: "Settings",
      description:
        "Change password, delete account, or replay this tour in Settings.",
    },
  },
] as const
