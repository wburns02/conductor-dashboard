import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import Layout from './components/Layout'
import DashboardPage from './pages/DashboardPage'
import TasksPage from './pages/TasksPage'
import TaskDetailPage from './pages/TaskDetailPage'
import WorkersPage from './pages/WorkersPage'
import HumanRequestsPage from './pages/HumanRequestsPage'
import EventsPage from './pages/EventsPage'
import SessionsPage from './pages/SessionsPage'
import TerminalPage from './pages/TerminalPage'
import IntelligencePage from './pages/IntelligencePage'

export default function App() {
  const location = useLocation()

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/tasks/:id" element={<TaskDetailPage />} />
          <Route path="/workers" element={<WorkersPage />} />
          <Route path="/requests" element={<HumanRequestsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/terminal" element={<TerminalPage />} />
          <Route path="/intelligence" element={<IntelligencePage />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  )
}
