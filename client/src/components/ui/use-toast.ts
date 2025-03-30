// Adapted from shadcn-ui (https://ui.shadcn.com/docs/components/toast)
import { toast, useToast as useToastHook, type Toast } from "@/hooks/use-toast"
import { type ToastActionElement as ToastActionElementType } from "@/components/ui/toast"

export type ToastProps = Toast
export type ToastActionElement = ToastActionElementType

export const useToast = useToastHook

export { toast }

export default useToastHook 