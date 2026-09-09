import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, Check, CreditCard, ShoppingBag, Sparkles, Trash2 } from 'lucide-react'
import { Badge } from '../components/ui/Badge.jsx'
import { Button } from '../components/ui/Button.jsx'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/Card.jsx'
import { Input } from '../components/ui/Input.jsx'
import { Label } from '../components/ui/Label.jsx'
import { Modal } from '../components/ui/Modal.jsx'
import { Select } from '../components/ui/Select.jsx'
import { Skeleton } from '../components/ui/Skeleton.jsx'
import { Spinner } from '../components/ui/Spinner.jsx'
import { Textarea } from '../components/ui/Textarea.jsx'
import { useToast } from '../components/ui/toast.jsx'
import { Reveal } from '../components/motion/Reveal.jsx'
import { ShimmerButton } from '../components/magic/ShimmerButton.jsx'

/* ------------------------------------------------------------------ */
/* Token palettes (single source of truth = index.css)                 */
/* ------------------------------------------------------------------ */

const brandSwatches = [
  { name: 'brand-50', value: '#f5f3ff', className: 'bg-brand-50' },
  { name: 'brand-100', value: '#ede9fe', className: 'bg-brand-100' },
  { name: 'brand-200', value: '#ddd6fe', className: 'bg-brand-200' },
  { name: 'brand-300', value: '#c4b5fd', className: 'bg-brand-300' },
  { name: 'brand-400', value: '#a78bfa', className: 'bg-brand-400' },
  { name: 'brand-500', value: '#8b5cf6', className: 'bg-brand-500' },
  { name: 'brand-600', value: '#7c3aed', className: 'bg-brand-600' },
  { name: 'brand-700', value: '#6d28d9', className: 'bg-brand-700' },
  { name: 'brand-800', value: '#5b21b6', className: 'bg-brand-800' },
  { name: 'brand-900', value: '#4c1d95', className: 'bg-brand-900' },
]

const semanticSwatches = [
  { name: 'primary', className: 'bg-primary', text: 'text-white', note: 'actions, links' },
  { name: 'success', className: 'bg-success', text: 'text-white', note: 'positive states' },
  { name: 'warning', className: 'bg-warning', text: 'text-white', note: 'attention' },
  { name: 'destructive', className: 'bg-destructive', text: 'text-white', note: 'errors, remove' },
  { name: 'accent', className: 'bg-accent', text: 'text-accent-foreground', note: 'hover fills' },
  { name: 'muted', className: 'bg-muted', text: 'text-muted-foreground', note: 'disabled, hints' },
]

const typeScale = [
  { name: 'Display', className: 'text-4xl font-extrabold tracking-tight', sample: 'ShopSphere' },
  { name: 'Heading', className: 'text-2xl font-bold tracking-tight', sample: 'Marketplace reimagined' },
  { name: 'Title', className: 'text-lg font-semibold', sample: 'Multi-vendor commerce' },
  { name: 'Body', className: 'text-base', sample: 'Independent sellers, one marketplace — built for a student capstone.' },
  { name: 'Caption', className: 'text-sm text-muted-foreground', sample: 'Used for helper text and metadata.' },
  { name: 'Overline', className: 'text-xs font-semibold uppercase tracking-wider text-muted-foreground', sample: 'Overline label' },
]

function SectionHeading({ id, kicker, title, description }) {
  return (
    <Reveal className="mb-10">
      <div className="flex flex-col gap-2">
        <Badge variant="default" className="self-start capitalize">
          {kicker}
        </Badge>
        <h2 id={id} className="scroll-mt-24 text-3xl font-bold tracking-tight">
          {title}
        </h2>
        {description && <p className="max-w-2xl text-muted-foreground">{description}</p>}
      </div>
    </Reveal>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

function Home() {
  const { toast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  return (
    <div>
      {/* ---------------- Hero ---------------- */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 55% 55% at 50% -10%, color-mix(in srgb, var(--primary) 18%, transparent), transparent)',
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 text-center sm:px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Badge className="gap-1.5 border-transparent bg-primary/10 text-primary">
              <Sparkles className="size-3" /> ShopSphere design system · v1
            </Badge>
          </motion.div>

          <motion.h1
            className="mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Modern, clean, professional.{' '}
            <span className="bg-gradient-to-r from-primary to-brand-400 bg-clip-text text-transparent">
              Built on tokens.
            </span>
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            A three-layer token system (primitive → semantic → component) mapped into Tailwind v4,
            powering every page of ShopSphere.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <ShimmerButton
              onClick={() => document.querySelector('#tokens')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View design tokens
            </ShimmerButton>
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.querySelector('#components')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore components
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ---------------- Colors ---------------- */}
      <section id="tokens" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
        <SectionHeading
          kicker="Colors"
          title="Primitive + semantic palettes"
          description="Raw violet primitives drive the brand; semantic tokens (primary, success, warning…) carry meaning so pages never hardcode a hex value."
        />
        <Reveal className="mb-6" delay={0.05}>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Brand primitive scale</p>
          <div className="grid grid-cols-5 gap-3 sm:grid-cols-10">
            {brandSwatches.map((swatch) => (
              <div key={swatch.name} className="space-y-1.5">
                <div className={`h-14 rounded-lg ${swatch.className} shadow-inner`} />
                <p className="text-center text-[10px] font-medium text-muted-foreground">{swatch.name}</p>
              </div>
            ))}
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mb-3 text-sm font-semibold text-muted-foreground">Semantic tokens</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {semanticSwatches.map((swatch) => (
              <div key={swatch.name} className="overflow-hidden rounded-xl border border-border">
                <div className={`flex h-16 items-end p-2 ${swatch.className} ${swatch.text || ''}`}>
                  <span className="text-xs font-bold">{swatch.name}</span>
                </div>
                <p className="px-2 py-1.5 text-xs text-muted-foreground">{swatch.note}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Typography & spacing ---------------- */}
      <section className="border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading
            kicker="Typography"
            title="A quiet type scale"
            description="System font stack, tight tracking on display sizes, muted captions. Spacing follows a 4px rhythm via Tailwind's default scale."
          />
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Type scale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {typeScale.map((type) => (
                  <div key={type.name} className="flex flex-col gap-1">
                    <p className={`${type.className} text-foreground`}>{type.sample}</p>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{type.name}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Spacing & radius rhythm</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { token: 'space-2 · 8px', className: 'w-8' },
                  { token: 'space-4 · 16px', className: 'w-16' },
                  { token: 'space-6 · 24px', className: 'w-24' },
                  { token: 'space-8 · 32px', className: 'w-32' },
                  { token: 'space-12 · 48px', className: 'w-48' },
                ].map((item) => (
                  <div key={item.token} className="flex items-center gap-3">
                    <div className={`h-2 rounded-full bg-primary ${item.className}`} />
                    <span className="text-xs font-medium text-muted-foreground">{item.token}</span>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                  <div className="rounded-md border border-border bg-background p-2 text-xs">radius-md</div>
                  <div className="rounded-lg border border-border bg-background p-2 text-xs">radius-lg</div>
                  <div className="rounded-xl border border-border bg-background p-2 text-xs">radius-xl</div>
                  <div className="rounded-full border border-border bg-background px-3 py-2 text-xs">radius-full</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ---------------- Components ---------------- */}
      <section id="components" className="mx-auto max-w-6xl scroll-mt-24 px-4 py-14 sm:px-6">
        <SectionHeading
          kicker="Components"
          title="Buttons, badges & forms"
          description="Every primitive lives in components/ui and reads from semantic tokens. Focus rings, disabled states, and press feedback are built in."
        />

        {/* Buttons */}
        <Reveal className="mb-10">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Buttons</h3>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive"><Trash2 /> Destructive</Button>
            <Button variant="success"><Check /> Success</Button>
            <Button loading>Loading</Button>
            <Button variant="outline" disabled>Disabled</Button>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button variant="outline" size="icon" aria-label="Notifications"><Bell /></Button>
          </div>
        </Reveal>

        {/* Badges */}
        <Reveal className="mb-10" delay={0.05}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Badges</h3>
          <div className="flex flex-wrap items-center gap-2">
            <Badge>Primary</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success">Approved</Badge>
            <Badge variant="warning">In review</Badge>
            <Badge variant="danger">Rejected</Badge>
            <Badge variant="neutral">Draft</Badge>
          </div>
        </Reveal>

        {/* Forms */}
        <Reveal delay={0.1}>
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Form controls</h3>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Checkout form (sample)</CardTitle>
                <CardDescription>Label + Input + Select + Textarea sharing one token language.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="first-name">First name</Label>
                    <Input id="first-name" placeholder="Ada" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last-name">Last name</Label>
                    <Input id="last-name" placeholder="Lovelace" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Select id="country" defaultValue="">
                      <option value="" disabled>Select a country</option>
                      <option>India</option>
                      <option>United States</option>
                      <option>United Kingdom</option>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="card">Card number</Label>
                    <Input id="card" placeholder="4242 4242 4242 4242" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Order note</Label>
                  <Textarea id="note" placeholder="Anything the seller should know…" />
                </div>
              </CardContent>
              <CardFooter className="justify-between">
                <p className="text-xs text-muted-foreground">Design-only preview</p>
                <Button><CreditCard /> Place order</Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading states</CardTitle>
                <CardDescription>Spinner, button loading, and skeletons while data streams in.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="flex items-center gap-3">
                  <Spinner className="text-primary" />
                  <span className="text-sm text-muted-foreground">Loading…</span>
                  <Button size="sm" loading className="ml-auto">Saving</Button>
                </div>

                <div className="flex items-center gap-3">
                  <Button size="sm" variant="outline" onClick={() => setLoading((value) => !value)}>
                    {loading ? 'Showing skeleton' : 'Show skeleton'}
                  </Button>
                </div>

                {loading ? (
                  <div className="flex items-center gap-4 rounded-lg border border-border p-4">
                    <Skeleton className="size-14 shrink-0 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 rounded-lg border border-border bg-background p-4">
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ShoppingBag className="size-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">Wireless Headphones</p>
                      <p className="text-sm text-muted-foreground">SoundWave · ₹2,999</p>
                      <Badge variant="success" className="mt-1">In stock</Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </Reveal>
      </section>

      {/* ---------------- Overlays ---------------- */}
      <section id="overlays" className="scroll-mt-24 border-y border-border bg-card/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <SectionHeading
            kicker="Overlays"
            title="Modals & toasts"
            description="Framer Motion powers the modal and the toast queue — enter/exit animations, escape-key close, and auto-dismiss are all included."
          />

          <Reveal>
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Modal dialog</CardTitle>
                  <CardDescription>Animated panel over a blurred backdrop. Press Esc or click outside to close.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setModalOpen(true)}>Open modal</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toast notifications</CardTitle>
                  <CardDescription>Four variants, stacked top-right, auto-dismiss after 4s.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="success" onClick={() => toast({ title: 'Order placed', description: 'Your order #1042 is confirmed.', variant: 'success' })}>Success</Button>
                  <Button variant="destructive" onClick={() => toast({ title: 'Upload failed', description: 'Image must be JPG or PNG under 2 MB.', variant: 'error' })}>Error</Button>
                  <Button variant="secondary" onClick={() => toast({ title: 'Low stock', description: '"Running Shoes" has 3 units left.', variant: 'warning' })}>Warning</Button>
                  <Button variant="outline" onClick={() => toast({ title: 'Heads up', description: 'A new coupon code is live: SHOP20.', variant: 'info' })}>Info</Button>
                </CardContent>
              </Card>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Modal instance ---------------- */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Open a seller store"
        description="Start selling on ShopSphere in two steps."
        footer={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              setModalOpen(false)
              toast({ title: 'Application sent 🎉', description: 'Our team will review your store soon.', variant: 'success' })
            }}>
              Apply now
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-name">Store name</Label>
            <Input id="store-name" placeholder="e.g. Northwind Goods" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store-desc">What do you sell?</Label>
            <Textarea id="store-desc" placeholder="A short description of your products…" />
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Home
