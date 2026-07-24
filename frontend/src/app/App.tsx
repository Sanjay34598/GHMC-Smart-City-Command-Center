import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Route-level code splitting — each page is a separate JS chunk.
// This eliminates the monolithic 977KB bundle and improves initial load time.
const HomePage = lazy(() =>
  import('@/pages/HomePage').then((m) => ({ default: m.HomePage }))
)
const IncidentUploadPage = lazy(() =>
  import('@/pages/IncidentUploadPage').then((m) => ({ default: m.IncidentUploadPage }))
)
const IncidentDetailPage = lazy(() =>
  import('@/pages/IncidentDetailPage').then((m) => ({ default: m.IncidentDetailPage }))
)
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage }))
)
const CivicSenseBoardPage = lazy(() =>
  import('@/pages/CivicSenseBoardPage').then((m) => ({ default: m.CivicSenseBoardPage }))
)
const EmergencyMapPage = lazy(() =>
  import('@/pages/EmergencyMapPage').then((m) => ({ default: m.EmergencyMapPage }))
)
const OperationsHistoryPage = lazy(() =>
  import('@/pages/OperationsHistoryPage').then((m) => ({ default: m.OperationsHistoryPage }))
)
const ResourceManagementPage = lazy(() =>
  import('@/pages/ResourceManagementPage').then((m) => ({ default: m.ResourceManagementPage }))
)
const AICityIntelligencePage = lazy(() =>
  import('@/pages/AICityIntelligencePage').then((m) => ({ default: m.AICityIntelligencePage }))
)

// Minimal full-screen loading fallback shown during chunk download
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas">
      <div className="size-8 animate-spin rounded-full border-2 border-slate-700 border-t-blue-500" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Toaster position="bottom-right" />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/civic-sense" element={<CivicSenseBoardPage />} />
          <Route path="/map" element={<EmergencyMapPage />} />
          <Route path="/history" element={<OperationsHistoryPage />} />
          <Route path="/resources" element={<ResourceManagementPage />} />
          <Route path="/intelligence" element={<AICityIntelligencePage />} />
          <Route path="/report-incident" element={<IncidentUploadPage />} />
          <Route path="/incidents/:id" element={<IncidentDetailPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </Suspense>
    </>
  )
}
