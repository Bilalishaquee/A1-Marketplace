import { Routes, Route, Navigate } from 'react-router-dom'
import RequireRole from './components/RequireRole'

// Public / User pages (existing)
import Home            from './pages/Home'
import Login           from './pages/Login'
import Register        from './pages/Register'
import QuoteUpload     from './pages/QuoteUpload'
import QuoteResult     from './pages/QuoteResult'
import Dashboard       from './pages/Dashboard'
import ProjectTracking from './pages/ProjectTracking'
import Scheduling      from './pages/Scheduling'
import BrowsePros      from './pages/BrowsePros'
import ProProfile      from './pages/ProProfile'
import CostGuides      from './pages/CostGuides'

// Admin pages
import AdminDashboard  from './pages/admin/AdminDashboard'
import AdminUsers      from './pages/admin/AdminUsers'
import AdminProviders  from './pages/admin/AdminProviders'
import AdminProjects   from './pages/admin/AdminProjects'
import AdminQuotes     from './pages/admin/AdminQuotes'
import AdminPayments   from './pages/admin/AdminPayments'
import AdminAnalytics  from './pages/admin/AdminAnalytics'
import AdminSettings     from './pages/admin/AdminSettings'
import AdminLLMTraining  from './pages/admin/AdminLLMTraining'

// Provider pages
import ProviderDashboard from './pages/provider/ProviderDashboard'
import ProviderJobs      from './pages/provider/ProviderJobs'
import ProviderQuotes    from './pages/provider/ProviderQuotes'
import ProviderSchedule  from './pages/provider/ProviderSchedule'
import ProviderEarnings  from './pages/provider/ProviderEarnings'
import ProviderMessages  from './pages/provider/ProviderMessages'
import ProviderProfile   from './pages/provider/ProviderProfile'

// App (mobile) — User
import AppUserHome          from './pages/app/user/AppUserHome'
import AppUserProjects      from './pages/app/user/AppUserProjects'
import AppUserMessages      from './pages/app/user/AppUserMessages'
import AppUserProfile       from './pages/app/user/AppUserProfile'
import AppUserNotifications from './pages/app/user/AppUserNotifications'
import AppUserBrowse        from './pages/app/user/AppUserBrowse'
import AppUserPayments      from './pages/app/user/AppUserPayments'
import AppUserQuote         from './pages/app/user/AppUserQuote'
import AppUserSchedule      from './pages/app/user/AppUserSchedule'
import AppUserSettings      from './pages/app/user/AppUserSettings'
import AppUserContractor         from './pages/app/user/AppUserContractor'
import AppUserRequestQuote       from './pages/app/user/AppUserRequestQuote'
import AppUserQuotes             from './pages/app/user/AppUserQuotes'
import AppUserBook               from './pages/app/user/AppUserBook'
import AppUserReview             from './pages/app/user/AppUserReview'
import AppUserEditProfile        from './pages/app/user/AppUserEditProfile'
import AppUserMyReviews          from './pages/app/user/AppUserMyReviews'
import AppUserSupport            from './pages/app/user/AppUserSupport'
import AppUserBookAppointment    from './pages/app/user/AppUserBookAppointment'
import AppUserAddCard            from './pages/app/user/AppUserAddCard'
import AppUserProjectPhotos      from './pages/app/user/AppUserProjectPhotos'
import AppUserProjectActivity    from './pages/app/user/AppUserProjectActivity'
import AppUserInvoice            from './pages/app/user/AppUserInvoice'
import AppUserContractorReviews  from './pages/app/user/AppUserContractorReviews'
import AppUserRewards            from './pages/app/user/AppUserRewards'

// App (mobile) — Provider
import AppProviderHome          from './pages/app/provider/AppProviderHome'
import AppProviderJobs          from './pages/app/provider/AppProviderJobs'
import AppProviderMessages      from './pages/app/provider/AppProviderMessages'
import AppProviderProfile       from './pages/app/provider/AppProviderProfile'
import AppProviderNotifications from './pages/app/provider/AppProviderNotifications'
import AppProviderEarnings      from './pages/app/provider/AppProviderEarnings'
import AppProviderSchedule      from './pages/app/provider/AppProviderSchedule'
import AppProviderQuotes        from './pages/app/provider/AppProviderQuotes'
import AppProviderSettings      from './pages/app/provider/AppProviderSettings'
import AppProviderJobDetail      from './pages/app/provider/AppProviderJobDetail'
import AppProviderEditProfile    from './pages/app/provider/AppProviderEditProfile'
import AppProviderSupport        from './pages/app/provider/AppProviderSupport'
import AppProviderBankAccount    from './pages/app/provider/AppProviderBankAccount'
import AppProviderPayoutDetail   from './pages/app/provider/AppProviderPayoutDetail'
import AppProviderAddBlockTime   from './pages/app/provider/AppProviderAddBlockTime'
import AppProviderLicense        from './pages/app/provider/AppProviderLicense'
import AppProviderMyReviews      from './pages/app/provider/AppProviderMyReviews'

export default function App() {
  return (
    <Routes>
      {/* ── Public (no auth) ── */}
      <Route path="/"             element={<Home />} />
      <Route path="/login"        element={<Login />} />
      <Route path="/register"     element={<Register />} />
      <Route path="/browse"       element={<BrowsePros />} />
      <Route path="/pro/:id"      element={<ProProfile />} />
      <Route path="/cost-guides"  element={<CostGuides />} />

      {/* ── Homeowner (auth: user) ── */}
      <Route element={<RequireRole roles={['user']} />}>
        <Route path="/quote"        element={<QuoteUpload />} />
        <Route path="/quote/result" element={<QuoteResult />} />
        <Route path="/dashboard"    element={<Dashboard />} />
        <Route path="/tracking/:id" element={<ProjectTracking />} />
        <Route path="/schedule"     element={<Scheduling />} />
      </Route>

      {/* ── Admin Web (auth: admin) ── */}
      <Route element={<RequireRole roles={['admin']} />}>
        <Route path="/admin"             element={<AdminDashboard />} />
        <Route path="/admin/users"       element={<AdminUsers />} />
        <Route path="/admin/providers"   element={<AdminProviders />} />
        <Route path="/admin/projects"    element={<AdminProjects />} />
        <Route path="/admin/quotes"      element={<AdminQuotes />} />
        <Route path="/admin/llm-training" element={<AdminLLMTraining />} />
        <Route path="/admin/payments"    element={<AdminPayments />} />
        <Route path="/admin/analytics"   element={<AdminAnalytics />} />
        <Route path="/admin/settings"    element={<AdminSettings />} />
      </Route>

      {/* ── Service Provider Web (auth: provider) ── */}
      <Route element={<RequireRole roles={['provider']} />}>
        <Route path="/provider"           element={<ProviderDashboard />} />
        <Route path="/provider/jobs"      element={<ProviderJobs />} />
        <Route path="/provider/quotes"    element={<ProviderQuotes />} />
        <Route path="/provider/schedule"  element={<ProviderSchedule />} />
        <Route path="/provider/earnings"  element={<ProviderEarnings />} />
        <Route path="/provider/messages"  element={<ProviderMessages />} />
        <Route path="/provider/profile"   element={<ProviderProfile />} />
      </Route>

      {/* ── Mobile App — User (auth: user) ── */}
      <Route element={<RequireRole roles={['user']} />}>
      <Route path="/app/user/home"          element={<AppUserHome />} />
      <Route path="/app/user/projects"      element={<AppUserProjects />} />
      <Route path="/app/user/messages"      element={<AppUserMessages />} />
      <Route path="/app/user/notifications" element={<AppUserNotifications />} />
      <Route path="/app/user/profile"       element={<AppUserProfile />} />
      <Route path="/app/user/browse"           element={<AppUserBrowse />} />
      <Route path="/app/user/payments"        element={<AppUserPayments />} />
      <Route path="/app/user/quote"           element={<AppUserQuote />} />
      <Route path="/app/user/schedule"        element={<AppUserSchedule />} />
      <Route path="/app/user/settings"        element={<AppUserSettings />} />
      <Route path="/app/user/contractor/:id"              element={<AppUserContractor />} />
      <Route path="/app/user/contractor-reviews/:id"   element={<AppUserContractorReviews />} />
      <Route path="/app/user/request-quote"            element={<AppUserRequestQuote />} />
      <Route path="/app/user/quotes"                   element={<AppUserQuotes />} />
      <Route path="/app/user/book"                     element={<AppUserBook />} />
      <Route path="/app/user/review"                   element={<AppUserReview />} />
      <Route path="/app/user/edit-profile"             element={<AppUserEditProfile />} />
      <Route path="/app/user/my-reviews"               element={<AppUserMyReviews />} />
      <Route path="/app/user/support"                  element={<AppUserSupport />} />
      <Route path="/app/user/book-appointment"         element={<AppUserBookAppointment />} />
      <Route path="/app/user/add-card"                 element={<AppUserAddCard />} />
      <Route path="/app/user/project-photos"           element={<AppUserProjectPhotos />} />
      <Route path="/app/user/project-activity"         element={<AppUserProjectActivity />} />
      <Route path="/app/user/invoice"                  element={<AppUserInvoice />} />
      <Route path="/app/user/rewards"                 element={<AppUserRewards />} />
      </Route>

      {/* ── Mobile App — Provider (auth: provider) ── */}
      <Route element={<RequireRole roles={['provider']} />}>
      <Route path="/app/provider/home"          element={<AppProviderHome />} />
      <Route path="/app/provider/jobs"          element={<AppProviderJobs />} />
      <Route path="/app/provider/messages"      element={<AppProviderMessages />} />
      <Route path="/app/provider/notifications" element={<AppProviderNotifications />} />
      <Route path="/app/provider/profile"       element={<AppProviderProfile />} />
      <Route path="/app/provider/earnings"      element={<AppProviderEarnings />} />
      <Route path="/app/provider/schedule"      element={<AppProviderSchedule />} />
      <Route path="/app/provider/quotes"        element={<AppProviderQuotes />} />
      <Route path="/app/provider/settings"      element={<AppProviderSettings />} />
      <Route path="/app/provider/job/:id"          element={<AppProviderJobDetail />} />
      <Route path="/app/provider/edit-profile"     element={<AppProviderEditProfile />} />
      <Route path="/app/provider/support"          element={<AppProviderSupport />} />
      <Route path="/app/provider/bank-account"     element={<AppProviderBankAccount />} />
      <Route path="/app/provider/payout-detail"    element={<AppProviderPayoutDetail />} />
      <Route path="/app/provider/add-block-time"   element={<AppProviderAddBlockTime />} />
      <Route path="/app/provider/license"          element={<AppProviderLicense />} />
      <Route path="/app/provider/my-reviews"       element={<AppProviderMyReviews />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
