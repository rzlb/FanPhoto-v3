import { useState } from "react";
import AdminLayout from "@/components/shared/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import DisplaySettingsForm from "@/components/display-settings/DisplaySettingsForm";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import { Link } from "wouter";

export default function DisplaySettingsPage() {
  return (
    <AdminLayout>
      <div className="py-6">
        <div className="content-container">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Display Settings</h1>
              <p className="text-sm text-muted-foreground mt-1">Configure how images are displayed on the public screen</p>
            </div>
            <Link href="/display" target="_blank">
              <Button className="flex items-center gap-2">
                Open Display <ExternalLink className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <DisplaySettingsForm />
        </div>
      </div>
    </AdminLayout>
  );
}
