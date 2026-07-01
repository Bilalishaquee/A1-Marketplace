import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Award, Clock, MapPin, Search, ShieldCheck, SlidersHorizontal, Star, X } from 'lucide-react'
import { motion } from 'framer-motion'
import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'
import { Avatar, Badge, Button, Card, Container, EmptyState, SearchField, Select } from '../components/ui/marketplace'

const pros = [
  { id: 'mike-rodriguez', name: 'Mike Rodriguez', company: 'Rodriguez Kitchen & Bath', title: 'Kitchen & Bath Specialist', rating: 4.9, reviews: 214, jobs: 312, resp: '< 1 hr', price: '$$', verified: true, top: true, location: 'Los Angeles, CA', services: ['Kitchen remodeling', 'Bathroom remodeling', 'Tile work'], bio: 'Focused on full kitchen and bathroom renovations with detailed estimates and clean project management.', image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&auto=format&fit=crop&q=80' },
  { id: 'sara-chen', name: 'Sara Chen', company: 'Chen Interior Remodeling', title: 'Interior Remodeling Expert', rating: 4.8, reviews: 187, jobs: 260, resp: '< 2 hr', price: '$$$', verified: true, top: true, location: 'Beverly Hills, CA', services: ['Kitchen remodeling', 'Flooring', 'Painting'], bio: 'Modern interior updates, open-concept transformations, and finish selections for higher-end projects.', image: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&auto=format&fit=crop&q=80' },
  { id: 'carlos-morales', name: 'Carlos Morales', company: 'Morales Flooring Co.', title: 'Flooring & Tile Pro', rating: 4.9, reviews: 156, jobs: 198, resp: '< 3 hr', price: '$', verified: true, top: false, location: 'Los Angeles, CA', services: ['Flooring', 'Tile work', 'Bathroom remodeling'], bio: 'Hardwood, LVP, tile, leveling, and subfloor repair for residential projects.', image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=600&auto=format&fit=crop&q=80' },
  { id: 'amara-williams', name: 'Amara Williams', company: 'Williams Renovation Group', title: 'General Contractor', rating: 5.0, reviews: 98, jobs: 140, resp: '< 1 hr', price: '$$', verified: true, top: true, location: 'Pasadena, CA', services: ['General repair', 'Kitchen remodeling', 'Roofing'], bio: 'Full-service renovation contractor for multi-trade projects and larger remodels.', image: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=600&auto=format&fit=crop&q=80' },
]

const services = ['All services', 'Kitchen remodeling', 'Bathroom remodeling', 'Flooring', 'Painting', 'Roofing', 'Plumbing', 'Electrical', 'General repair']
const sortOptions = ['Best match', 'Highest rated', 'Most reviews', 'Fastest response']
const priceOptions = ['Any price', '$', '$$', '$$$']

export default function BrowsePros() {
  const [params] = useSearchParams()
  const [service, setService] = useState(params.get('service') || 'All services')
  const [zip, setZip] = useState(params.get('zip') || '')
  const [sort, setSort] = useState('Best match')
  const [price, setPrice] = useState('Any price')
  const [topOnly, setTopOnly] = useState(false)
  const [mobileFilters, setMobileFilters] = useState(false)

  const filtered = useMemo(() => {
    const serviceTerm = service === 'All services' ? '' : service.toLowerCase()
    return pros.filter((pro) => {
      const serviceMatch = !serviceTerm || pro.services.some((s) => s.toLowerCase().includes(serviceTerm))
      const priceMatch = price === 'Any price' || pro.price === price
      const topMatch = !topOnly || pro.top
      return serviceMatch && priceMatch && topMatch
    }).sort((a, b) => {
      if (sort === 'Highest rated') return b.rating - a.rating
      if (sort === 'Most reviews') return b.reviews - a.reviews
      if (sort === 'Fastest response') return a.resp.localeCompare(b.resp)
      return Number(b.top) - Number(a.top)
    })
  }, [service, price, topOnly, sort])

  const Filters = () => (
    <div className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-950">Service</label>
        <Select value={service} onChange={(e) => setService(e.target.value)}>
          {services.map((item) => <option key={item}>{item}</option>)}
        </Select>
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-950">Location</label>
        <SearchField placeholder="ZIP code" value={zip} onChange={(e) => setZip(e.target.value)} />
      </div>
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-950">Price</label>
        <div className="flex flex-wrap gap-2">
          {priceOptions.map((item) => (
            <button key={item} onClick={() => setPrice(item)} className={price === item ? 'filter-pill-active' : 'filter-pill'}>{item}</button>
          ))}
        </div>
      </div>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={topOnly} onChange={(e) => setTopOnly(e.target.checked)} className="accent-emerald-700" />
        Top providers only
      </label>
      {(price !== 'Any price' || topOnly || service !== 'All services') && (
        <Button variant="ghost" className="w-full" onClick={() => { setPrice('Any price'); setTopOnly(false); setService('All services') }}>
          <X size={15} /> Clear filters
        </Button>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <div className="border-b border-slate-200 bg-white">
        <Container className="py-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-950">{service === 'All services' ? 'Find local home service pros' : `${service} pros`}</h1>
              <p className="mt-1 text-sm text-slate-600">Compare providers, reviews, service fit, and response times before requesting a quote.</p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sort} onChange={(e) => setSort(e.target.value)} className="w-44">
                {sortOptions.map((item) => <option key={item}>{item}</option>)}
              </Select>
              <Button variant="secondary" className="lg:hidden" onClick={() => setMobileFilters(true)}><SlidersHorizontal size={16} /> Filters</Button>
            </div>
          </div>
        </Container>
      </div>

      <Container className="grid gap-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <Card className="sticky top-24 p-5">
            <Filters />
          </Card>
        </aside>

        <main>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-slate-600"><span className="font-semibold text-slate-950">{filtered.length}</span> providers found {zip ? `near ${zip}` : ''}</p>
            <Button as={Link} to="/quote" size="sm">Start with AI estimate</Button>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No providers match your filters" description="Try clearing filters or choosing a broader service category." icon={Search} />
          ) : (
            <div className="space-y-4">
              {filtered.map((pro, index) => (
                <motion.div key={pro.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: index * 0.04 }}>
                  <Card className="overflow-hidden p-0">
                    <div className="grid gap-0 md:grid-cols-[190px_1fr]">
                      <img src={pro.image} alt={`${pro.company} project`} className="h-48 w-full object-cover md:h-full" />
                      <div className="p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="min-w-0">
                            <div className="flex items-start gap-3">
                              <Avatar name={pro.name} />
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <h2 className="text-lg font-semibold text-slate-950">{pro.company}</h2>
                                  {pro.top && <Badge tone="amber"><Award size={12} /> Top provider</Badge>}
                                  {pro.verified && <Badge tone="green"><ShieldCheck size={12} /> Verified</Badge>}
                                </div>
                                <p className="text-sm text-slate-600">{pro.name} · {pro.title}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                              <span className="flex items-center gap-1"><Star size={15} className="fill-amber-400 text-amber-400" /> <strong className="text-slate-950">{pro.rating}</strong> ({pro.reviews} reviews)</span>
                              <span>{pro.jobs} jobs</span>
                              <span className="flex items-center gap-1"><Clock size={14} /> Responds {pro.resp}</span>
                              <span className="flex items-center gap-1"><MapPin size={14} /> {pro.location}</span>
                            </div>
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">{pro.bio}</p>
                            <div className="mt-4 flex flex-wrap gap-2">{pro.services.map((item) => <Badge key={item}>{item}</Badge>)}</div>
                          </div>
                          <div className="flex shrink-0 flex-col gap-2 lg:w-40">
                            <p className="text-sm font-semibold text-slate-950 lg:text-right">{pro.price} price range</p>
                            <Button as={Link} to={`/pro/${pro.id}`} variant="secondary">View profile</Button>
                            <Button as={Link} to="/quote">Request quote</Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </main>
      </Container>

      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/40" onClick={() => setMobileFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="font-semibold text-slate-950">Filters</p>
              <button onClick={() => setMobileFilters(false)} className="rounded-md p-2 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <Filters />
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
