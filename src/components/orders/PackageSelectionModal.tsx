import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addOrderDetail } from '../../api/orders'
import PackageSelectionForm from './PackageSelectionForm'
import type { PackageDto, SelectionRequest } from '../../types'

interface Props {
  pkg: PackageDto
  orderId: number
  onClose: () => void
  onSuccess: () => void
}

export default function PackageSelectionModal({ pkg, orderId, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { menuItemId: number; isToGo: boolean; notes?: string; selections: SelectionRequest[] }) =>
      addOrderDetail(orderId, {
        menuItemId: data.menuItemId,
        quantity: 1,
        isToGo: data.isToGo,
        notes: data.notes,
        selections: data.selections,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      onSuccess()
    },
  })

  return (
    <PackageSelectionForm
      pkg={pkg}
      onConfirm={data => mutation.mutate(data)}
      onCancel={onClose}
      confirmLabel="Agregar al pedido"
      isSubmitting={mutation.isPending}
      error={mutation.isError ? ((mutation.error as Error)?.message ?? 'Error al agregar el paquete. Intenta de nuevo.') : null}
    />
  )
}
