import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone, Wrench } from 'lucide-react'
import { Container } from '../ui/marketplace'

const services = ['Kitchen remodeling', 'Bathroom remodeling', 'Flooring', 'Painting', 'Roofing', 'Plumbing', 'Electrical', 'Landscaping']
const company = ['How it works', 'Cost guides', 'For pros', 'Safety', 'Support']

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <Container className="py-10">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-950 text-white"><Wrench size={17} /></div>
              <div>
                <p className="text-sm font-semibold text-slate-950">A-1 Renovations</p>
                <p className="text-xs text-slate-500">AI-assisted home services marketplace</p>
              </div>
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-slate-600">
              Describe your project, compare bids from local providers, message directly, and track the work from estimate to completion.
            </p>
            <div className="mt-5 space-y-2 text-sm text-slate-600">
              <a href="tel:+15551234567" className="flex items-center gap-2 hover:text-slate-950"><Phone size={15} /> (555) 123-4567</a>
              <a href="mailto:hello@a1renovations.com" className="flex items-center gap-2 hover:text-slate-950"><Mail size={15} /> hello@a1renovations.com</a>
              <span className="flex items-center gap-2"><MapPin size={15} /> Los Angeles, CA</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Services</h3>
            <ul className="mt-3 space-y-2">
              {services.map((service) => (
                <li key={service}><Link to={`/browse?service=${encodeURIComponent(service)}`} className="text-sm text-slate-600 hover:text-slate-950">{service}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-950">Company</h3>
            <ul className="mt-3 space-y-2">
              {company.map((item) => (
                <li key={item}><a href="#" className="text-sm text-slate-600 hover:text-slate-950">{item}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 A-1 Renovations LLC. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-slate-950">Privacy</a>
            <a href="#" className="hover:text-slate-950">Terms</a>
            <a href="#" className="hover:text-slate-950">Accessibility</a>
          </div>
        </div>
      </Container>
    </footer>
  )
}
