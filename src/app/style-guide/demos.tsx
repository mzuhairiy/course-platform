"use client";

import { toast as sonnerToast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";

export function StyleGuideDemos() {
  const { toast } = useToast();

  return (
    <div className="flex flex-wrap gap-3" data-testid="interactive-demos">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" data-testid="demo-dialog-trigger">
            Open dialog
          </Button>
        </DialogTrigger>
        <DialogContent data-testid="demo-dialog-content">
          <DialogHeader>
            <DialogTitle>Dialog title</DialogTitle>
            <DialogDescription>
              This is a shadcn Dialog rendered in the style guide.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" data-testid="demo-dropdown-trigger">
            Open menu
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>My account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button
        variant="secondary"
        data-testid="demo-toast"
        onClick={() =>
          toast({
            title: "Saved",
            description: "Triggered via the shadcn toast component.",
          })
        }
      >
        Show toast
      </Button>

      <Button
        variant="secondary"
        data-testid="demo-sonner"
        onClick={() => sonnerToast.success("Triggered via Sonner.")}
      >
        Show sonner
      </Button>

      <Toaster />
      <SonnerToaster />
    </div>
  );
}
