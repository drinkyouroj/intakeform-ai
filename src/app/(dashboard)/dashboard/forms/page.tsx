import Link from 'next/link'
import { getProviderForms } from '@/lib/actions/forms'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Plus, FileText, Pencil } from 'lucide-react'

export default async function FormsListPage() {
  const providerForms = await getProviderForms()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forms</h1>
          <p className="text-muted-foreground mt-1">
            Manage your intake forms
          </p>
        </div>
        <Button render={<Link href="/onboarding/profession" />}>
          <Plus data-icon="inline-start" />
          Create Form
        </Button>
      </div>

      {providerForms.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="size-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No forms yet</h2>
          <p className="text-muted-foreground mb-4">
            Create your first intake form to get started.
          </p>
          <Button render={<Link href="/onboarding/profession" />}>
            <Plus data-icon="inline-start" />
            Create Form
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {providerForms.map((form) => (
            <Card key={form.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{form.title}</h3>
                  {form.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {form.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    {form.templateSlug && (
                      <Badge variant="secondary" className="text-xs">
                        {form.templateSlug}
                      </Badge>
                    )}
                    <Badge variant={form.isActive ? 'default' : 'outline'} className="text-xs">
                      {form.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      0 intakes
                    </span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                render={<Link href={`/dashboard/forms/${form.id}/edit`} />}
              >
                <Pencil data-icon="inline-start" />
                Edit
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
