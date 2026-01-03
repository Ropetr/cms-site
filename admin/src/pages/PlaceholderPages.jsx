// Placeholder pages - to be implemented
import { Card, CardBody } from '../components/ui'
import { Construction } from 'lucide-react'

function PlaceholderPage({ title, description }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        <p className="text-gray-500">{description}</p>
      </div>
      <Card>
        <CardBody className="py-12 text-center">
          <Construction className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Em Construção
          </h3>
          <p className="text-gray-500">
            Esta página está sendo desenvolvida.
          </p>
        </CardBody>
      </Card>
    </div>
  )
}

export function MenusPage() {
  return <PlaceholderPage title="Menus" description="Gerencie os menus do site" />
}

export function MediaPage() {
  return <PlaceholderPage title="Mídia" description="Biblioteca de arquivos e imagens" />
}

export function ContactsPage() {
  return <PlaceholderPage title="Contatos" description="Leads e mensagens recebidas" />
}

export function ThemesPage() {
  return <PlaceholderPage title="Temas" description="Personalize a aparência do site" />
}

export function SettingsPage() {
  return <PlaceholderPage title="Configurações" description="Configurações gerais do site" />
}

export function UsersPage() {
  return <PlaceholderPage title="Usuários" description="Gerencie os usuários do sistema" />
}
