"use client"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle className={props.variant === "destructive" ? "text-destructive-foreground text-white" : ""}>{title}</ToastTitle>}
              {description && (
                <ToastDescription className={props.variant === "destructive" ? "text-destructive-foreground text-white" : ""}>
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose className={props.variant === "destructive" ? "text-destructive-foreground text-white" : ""} />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
} 