# RecruitMe - Testing Checklist

## Phase 10: Testing & Hardening

This document provides a comprehensive testing checklist for the RecruitMe application.

---

## Manual Smoke Test Checklist

### Authentication Flow
- [ ] **Sign up new account**
  - Navigate to `/`
  - Click "Sign up"
  - Enter valid email and password (meets requirements)
  - Verify account is created
  - Verify redirected to dashboard

- [ ] **Login**
  - Navigate to `/`
  - Enter credentials
  - Verify successful login
  - Verify redirected to dashboard

- [ ] **Logout**
  - Click logout button
  - Verify session cleared
  - Verify redirected to home page

### Draft Profile Management
- [ ] **Create draft profile**
  - Login to dashboard
  - Verify draft profile is auto-created
  - Verify profile form is visible

- [ ] **Edit profile fields**
  - Fill in all profile fields
  - Click "Save Changes"
  - Verify success toast appears
  - Verify data persists after page reload

- [ ] **Empty profile fields**
  - Clear all fields
  - Save changes
  - Verify empty fields are saved as null

- [ ] **All fields filled**
  - Fill every single field
  - Save changes
  - Verify all data persists correctly

### Video Management
- [ ] **Add videos**
  - Add a valid YouTube URL
  - Verify video appears in grid
  - Verify thumbnail displays correctly
  - Add optional title
  - Verify title displays

- [ ] **Test max 10 videos limit**
  - Add 10 videos
  - Try to add 11th video
  - Verify error message appears
  - Verify 11th video is not added

- [ ] **Test duplicate video URLs**
  - Add a video
  - Try to add the same video again
  - Verify error message: "This video is already in your profile"
  - Verify duplicate is not added

- [ ] **Edit video**
  - Click edit on a video
  - Change URL or title
  - Save changes
  - Verify changes appear (but not saved to DB yet)
  - Click "Save Changes" button
  - Verify changes persist

- [ ] **Delete video**
  - Click delete on a video
  - Verify video disappears from UI
  - Verify video still exists in DB (not saved yet)
  - Click "Save Changes" button
  - Verify video is deleted from DB

- [ ] **Video order**
  - Add multiple videos
  - Verify videos appear in order added
  - Verify order persists after save

### Publish/Unpublish Flow
- [ ] **Publish profile (first time)**
  - Fill in profile and add videos
  - Click "Publish" button
  - Verify success modal appears
  - Verify public URL is displayed
  - Verify slug is generated (UUID format)
  - Click copy button
  - Verify URL is copied to clipboard
  - Click "open in new tab" button
  - Verify public profile opens

- [ ] **View public profile**
  - Navigate to public URL
  - Verify all profile fields display correctly
  - Verify all videos display correctly
  - Verify videos are embedded properly
  - Verify profile is read-only (no edit buttons)

- [ ] **Make draft changes**
  - After publishing, edit draft profile
  - Add/remove videos
  - Change profile fields
  - Save draft changes
  - Navigate to public profile
  - Verify public profile shows OLD data (unchanged)
  - Verify "Publish Changes" button is enabled

- [ ] **Publish changes**
  - Click "Publish Changes" button
  - Verify success modal
  - Navigate to public profile
  - Verify public profile shows NEW data
  - Verify all changes are reflected

- [ ] **Unpublish profile**
  - Click "Unpublish" button
  - Confirm unpublish
  - Verify status changes to "Not Published"
  - Navigate to public URL
  - Verify 404 page appears

- [ ] **Republish profile**
  - After unpublishing, click "Publish" button
  - Verify profile is published again
  - Navigate to public URL
  - Verify profile is accessible
  - Verify same slug is used (not regenerated)

---

## Edge Cases Testing

### Invalid Inputs
- [ ] **Invalid email format**
  - Enter invalid email in profile form
  - Try to save
  - Verify error message appears
  - Verify form does not submit

- [ ] **Invalid graduation year**
  - Enter non-4-digit year
  - Try to save
  - Verify error message: "Graduation year must be 4 digits"
  - Verify form does not submit

- [ ] **Invalid YouTube URLs**
  - Try to add non-YouTube URL
  - Verify error message appears
  - Try to add malformed YouTube URL
  - Verify error message appears
  - Try to add just video ID
  - Verify it works (should extract ID)

- [ ] **Empty YouTube URL**
  - Try to add video with empty URL
  - Verify "Add Video" button is disabled

### Rapid Actions
- [ ] **Rapid save/publish actions**
  - Make changes
  - Click "Save Changes" multiple times rapidly
  - Verify no duplicate saves
  - Verify no errors
  - Click "Publish" multiple times rapidly
  - Verify no duplicate publishes

- [ ] **Concurrent edits**
  - Open dashboard in two tabs
  - Make different changes in each tab
  - Save in first tab
  - Save in second tab
  - Verify last save wins

### Data Persistence
- [ ] **Browser refresh**
  - Make changes (don't save)
  - Refresh page
  - Verify unsaved changes are lost (expected)
  - Verify browser warns about unsaved changes

- [ ] **Session expiry**
  - Let session expire (or manually clear cookies)
  - Try to access dashboard
  - Verify redirected to login

---

## Security Verification

### Authorization
- [ ] **Users can only see/edit own profile**
  - Login as User A
  - Note User A's profile data
  - Logout
  - Login as User B
  - Verify User B cannot see User A's data
  - Verify User B can only edit their own profile

- [ ] **API route protection**
  - Try to access `/api/profile` without session
  - Verify 401 Unauthorized response
  - Try to access `/api/videos` without session
  - Verify 401 Unauthorized response

- [ ] **Video ownership verification**
  - As User A, note a video ID
  - Logout
  - Login as User B
  - Try to edit/delete User A's video via API
  - Verify 403 Forbidden response

### Data Isolation
- [ ] **Draft never visible on public route**
  - Make draft changes
  - Don't publish
  - Try to access public profile
  - Verify draft changes are NOT visible
  - Verify only published data is shown

- [ ] **Published snapshot immutable**
  - Publish profile
  - Make draft changes
  - Verify published profile unchanged
  - Publish changes
  - Verify new snapshot created (old one preserved in DB)

### Input Validation
- [ ] **SQL injection protection**
  - Try entering SQL in text fields
  - Verify data is sanitized
  - Verify no SQL execution

- [ ] **XSS protection**
  - Try entering script tags in text fields
  - Verify scripts are escaped
  - Verify no script execution

---

## Console Log Review

### Error Logging
- [ ] **API errors logged**
  - Trigger an API error (e.g., invalid input)
  - Check browser console
  - Verify error is logged with details
  - Check server logs
  - Verify error is logged server-side

- [ ] **Client-side errors logged**
  - Trigger a client error
  - Check browser console
  - Verify error is logged

### No Unexpected Errors
- [ ] **No console errors during normal flow**
  - Complete full user journey
  - Check browser console
  - Verify no unexpected errors
  - Verify no warnings

---

## Mobile Responsiveness Test

### Dashboard on Mobile
- [ ] **Profile form**
  - Open dashboard on mobile device
  - Verify form fields are readable
  - Verify form is usable
  - Verify "Save Changes" button is accessible (sticky footer)

- [ ] **Video grid**
  - Verify videos display in grid
  - Verify grid is responsive (1-2 columns on mobile)
  - Verify video cards are appropriately sized
  - Verify thumbnails are visible

- [ ] **Navigation**
  - Verify logout button is accessible
  - Verify all buttons are tappable
  - Verify no horizontal scrolling

### Public Profile on Mobile
- [ ] **Profile display**
  - Open public profile on mobile
  - Verify all fields are readable
  - Verify layout is responsive
  - Verify no horizontal scrolling

- [ ] **Video embeds**
  - Verify videos are embedded correctly
  - Verify videos are responsive
  - Verify videos play on mobile
  - Verify video grid is responsive

---

## Performance Testing

### Load Times
- [ ] **Initial page load**
  - Measure dashboard load time
  - Verify acceptable performance (< 2s)
  - Measure public profile load time
  - Verify acceptable performance

- [ ] **API response times**
  - Measure profile save time
  - Measure video add time
  - Measure publish time
  - Verify all are acceptable (< 1s)

### Large Data Sets
- [ ] **Maximum videos**
  - Add 10 videos (maximum)
  - Verify page still loads quickly
  - Verify no performance degradation

- [ ] **Long text fields**
  - Enter very long text in all fields
  - Verify no performance issues
  - Verify data saves correctly

---

## Browser Compatibility

- [ ] **Chrome** - Test all major flows
- [ ] **Firefox** - Test all major flows
- [ ] **Safari** - Test all major flows
- [ ] **Edge** - Test all major flows
- [ ] **Mobile Safari** - Test on iOS
- [ ] **Mobile Chrome** - Test on Android

---

## Notes

- Mark each item as complete after testing
- Note any issues found in the "Issues Found" section below
- Re-test after fixes are applied

---

## Issues Found

_Record any bugs, issues, or unexpected behavior discovered during testing:_

1. 
2. 
3. 

---

**Last Updated**: 2024
**Status**: Ready for Testing
