'use client'

import { useState, useTransition } from 'react'
import { UserButton } from '@clerk/nextjs'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  User,
  CreditCard,
  Bell,
  Code,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react'
import { updateProvider } from '@/lib/actions/providers'
import { createPortalSession } from '@/lib/actions/billing'

type ProviderData = {
  id: string
  name: string
  email: string
  profession: string | null
  subscriptionStatus: string | null
}

type FormData = {
  id: string
  title: string
  isActive: boolean | null
}

function SubscriptionBadge({ status }: { status: string | null }) {
  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    trialing: { label: 'Trial', variant: 'secondary' },
    active: { label: 'Active', variant: 'default' },
    past_due: { label: 'Past Due', variant: 'destructive' },
    canceled: { label: 'Canceled', variant: 'outline' },
  }
  const info = statusMap[status ?? ''] ?? { label: 'Free', variant: 'outline' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export function SettingsTabs({
  provider,
  forms,
  defaultTab,
}: {
  provider: ProviderData
  forms: FormData[]
  defaultTab?: string
}) {
  return (
    <Tabs defaultValue={defaultTab || 'account'}>
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="account">
          <User className="size-4 mr-1.5 hidden sm:inline-block" />
          Account
        </TabsTrigger>
        <TabsTrigger value="billing">
          <CreditCard className="size-4 mr-1.5 hidden sm:inline-block" />
          Billing
        </TabsTrigger>
        <TabsTrigger value="notifications">
          <Bell className="size-4 mr-1.5 hidden sm:inline-block" />
          Notifications
        </TabsTrigger>
        <TabsTrigger value="embed">
          <Code className="size-4 mr-1.5 hidden sm:inline-block" />
          Embed
        </TabsTrigger>
      </TabsList>

      <TabsContent value="account">
        <AccountTab provider={provider} />
      </TabsContent>

      <TabsContent value="billing">
        <BillingTab provider={provider} />
      </TabsContent>

      <TabsContent value="notifications">
        <NotificationsTab />
      </TabsContent>

      <TabsContent value="embed">
        <EmbedTab forms={forms} />
      </TabsContent>
    </Tabs>
  )
}

// --- Account Tab ---

function AccountTab({ provider }: { provider: ProviderData }) {
  const [name, setName] = useState(provider.name)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  function handleSave() {
    startTransition(async () => {
      await updateProvider({ name })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={provider.email} disabled />
            <p className="text-xs text-muted-foreground">
              Email is managed through your Clerk account
            </p>
          </div>
          <div className="space-y-2">
            <Label>Profession</Label>
            <Input value={provider.profession ?? 'Not set'} disabled />
            <p className="text-xs text-muted-foreground">
              Set during onboarding
            </p>
          </div>
        </CardContent>
        <CardFooter className="justify-between">
          <div className="flex items-center gap-2">
            {saved && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <Check className="size-4" /> Saved
              </span>
            )}
          </div>
          <Button onClick={handleSave} disabled={isPending || name === provider.name}>
            {isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Security</CardTitle>
          <CardDescription>
            Manage your password and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: { avatarBox: 'size-10' },
              }}
            />
            <div>
              <p className="text-sm font-medium">Manage your account</p>
              <p className="text-xs text-muted-foreground">
                Click your avatar to change password, add 2FA, or manage sessions
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// --- Billing Tab ---

function BillingTab({ provider }: { provider: ProviderData }) {
  const [isPending, startTransition] = useTransition()

  function handleManageBilling() {
    startTransition(async () => {
      await createPortalSession()
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscription</CardTitle>
        <CardDescription>Manage your billing and subscription</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Current Plan</p>
            <div className="flex items-center gap-2">
              <SubscriptionBadge status={provider.subscriptionStatus} />
            </div>
          </div>
        </div>

        {provider.subscriptionStatus === 'past_due' && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-sm text-destructive font-medium">
              Your payment is past due. Please update your payment method to continue using all features.
            </p>
          </div>
        )}

        {provider.subscriptionStatus === 'canceled' && (
          <div className="rounded-lg border border-muted p-4">
            <p className="text-sm text-muted-foreground">
              Your subscription has been canceled. You can resubscribe at any time.
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          onClick={handleManageBilling}
          disabled={isPending}
          variant="outline"
        >
          <ExternalLink data-icon="inline-start" />
          {isPending ? 'Redirecting...' : 'Manage Subscription'}
        </Button>
      </CardFooter>
    </Card>
  )
}

// --- Notifications Tab ---

function NotificationsTab() {
  const [briefEmails, setBriefEmails] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('intakeform_notify_briefs') !== 'false'
    }
    return true
  })

  function handleToggle(checked: boolean) {
    setBriefEmails(checked)
    if (typeof window !== 'undefined') {
      localStorage.setItem('intakeform_notify_briefs', String(checked))
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Notifications</CardTitle>
        <CardDescription>
          Choose which email notifications you receive
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-1">
            <p className="text-sm font-medium">Brief Completion</p>
            <p className="text-xs text-muted-foreground">
              Receive an email when a new intake brief is generated
            </p>
          </div>
          <Switch
            checked={briefEmails}
            onCheckedChange={handleToggle}
          />
        </div>
      </CardContent>
    </Card>
  )
}

// --- Embed Tab ---

function EmbedTab({ forms }: { forms: FormData[] }) {
  const [selectedFormId, setSelectedFormId] = useState(forms[0]?.id ?? '')
  const [copied, setCopied] = useState(false)

  const appUrl = typeof window !== 'undefined' ? window.location.origin : ''
  const embedSnippet = selectedFormId
    ? `<script src="${appUrl}/api/embed.js" data-intakeform-id="${selectedFormId}"></script>`
    : ''

  function handleCopy() {
    if (!embedSnippet) return
    navigator.clipboard.writeText(embedSnippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Embed Your Form</CardTitle>
          <CardDescription>
            Add your intake form to any website by copying the embed code below
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {forms.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <p className="text-sm text-muted-foreground">
                You don&apos;t have any forms yet. Create a form first to get an embed code.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Select a Form</Label>
                <Select
                  value={selectedFormId}
                  onValueChange={(val: string | null) => {
                    if (val) setSelectedFormId(val)
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a form" />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.map((form) => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.title}
                        {!form.isActive && ' (Inactive)'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFormId && (
                <div className="space-y-2">
                  <Label>Embed Code</Label>
                  <div className="relative">
                    <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
                      <code>{embedSnippet}</code>
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleCopy}
                    >
                      {copied ? (
                        <>
                          <Check className="size-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="size-3.5" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Paste this snippet into your website&apos;s HTML where you want the form to appear.
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
