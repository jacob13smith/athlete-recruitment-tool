"use client"

import { useEffect, useState, useCallback } from "react"
import { driver } from "driver.js"
import "driver.js/dist/driver.css"
import WelcomeModal from "./WelcomeModal"
import { ONBOARDING_STEPS, getReplayKey } from "@/lib/onboarding-tour"

const ICON_WRAP = "driver-popover-btn-icon"
const SVG = {
  leftArrow: `<span class="${ICON_WRAP}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M19 12H5m0 0l7 7m-7-7l7-7"/></svg></span>`,
  rightArrow: `<span class="${ICON_WRAP}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M5 12h14m0 0l-7-7m7 7l-7 7"/></svg></span>`,
  check: `<span class="${ICON_WRAP}"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20" aria-hidden="true"><path d="M5 13l4 4L19 7"/></svg></span>`,
}

export default function DashboardOnboarding() {
  const [showModal, setShowModal] = useState(false)
  const [checked, setChecked] = useState(false)

  const runTour = useCallback(() => {
    const driverObj = driver({
      showProgress: true,
      allowClose: true,
      smoothScroll: true,
      overlayColor: "rgb(0,0,0)",
      overlayOpacity: 0.5,
      prevBtnText: "",
      nextBtnText: "",
      doneBtnText: "",
      progressText: "{{current}} of {{total}}",
      popoverClass: "driver-popover-recruitme",
      onPopoverRender(popover, { driver: d }) {
        const { footer, progress, previousButton, nextButton, footerButtons } = popover
        previousButton.remove()
        nextButton.remove()
        footerButtons.remove()
        previousButton.innerHTML = SVG.leftArrow
        previousButton.setAttribute("aria-label", "Previous")
        nextButton.innerHTML = d.isLastStep() ? SVG.check : SVG.rightArrow
        nextButton.setAttribute("aria-label", d.isLastStep() ? "Done" : "Next")
        footer.appendChild(previousButton)
        footer.appendChild(progress)
        footer.appendChild(nextButton)
        footer.style.display = "flex"
        footer.style.justifyContent = "space-between"
        footer.style.alignItems = "center"
        footer.style.gap = "0.75rem"
      },
      steps: ONBOARDING_STEPS.map((s) => ({
        element: s.element,
        popover: { ...s.popover, side: "right" as const, align: "center" as const },
      })),
    })
    driverObj.drive()
  }, [])

  const completeOnboarding = useCallback(async () => {
    try {
      await fetch("/api/profile/onboarding-complete", { method: "POST" })
    } catch (e) {
      console.error("Failed to complete onboarding:", e)
    }
  }, [])

  const handleGotIt = useCallback(async () => {
    await completeOnboarding()
    setShowModal(false)
  }, [completeOnboarding])

  const handleShowMeAround = useCallback(async () => {
    await completeOnboarding()
    setShowModal(false)
    // Brief delay so modal unmount + DOM settle before tour
    requestAnimationFrame(() => {
      setTimeout(runTour, 100)
    })
  }, [completeOnboarding, runTour])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const key = getReplayKey()
      const replay = typeof window !== "undefined" && localStorage.getItem(key)
      if (replay) {
        localStorage.removeItem(key)
        setChecked(true)
        requestAnimationFrame(() => setTimeout(runTour, 150))
        return
      }

      // Brief delay so session cookie is available after redirect (e.g. post-login)
      // and we avoid strict-mode double-mount cancelling the fetch before it resolves.
      await new Promise((r) => setTimeout(r, 150))

      if (cancelled) {
        setChecked(true)
        return
      }

      try {
        const res = await fetch("/api/profile/onboarding-status", {
          credentials: "include",
        })
        if (!res.ok) {
          setChecked(true)
          return
        }
        const { hasCompletedOnboarding } = await res.json()
        if (!cancelled) setShowModal(!hasCompletedOnboarding)
      } catch (e) {
        console.error("Failed to fetch onboarding status:", e)
      } finally {
        setChecked(true)
      }
    }

    init()
    return () => { cancelled = true }
  }, [runTour])

  if (!checked) return null

  return (
    <>
      {showModal && (
        <WelcomeModal onGotIt={handleGotIt} onShowMeAround={handleShowMeAround} />
      )}
    </>
  )
}
